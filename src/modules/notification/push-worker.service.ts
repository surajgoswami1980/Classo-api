import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Redis from 'ioredis';
import { NotificationEntity } from '../../entities/notification.entity';
import { DeviceTokenEntity } from '../../entities/device-token.entity';
import { FirebaseService } from './firebase.service';
import { PUSH_QUEUE_KEY, PushJob } from './push-queue.service';

/**
 * Background worker: BLPOPs push jobs off the shared Redis list, resolves the
 * notification's target audience into user ids, records a per-user dispatch
 * row (so each user has an in-app record), then sends FCM push to those users'
 * active device tokens. Invalid tokens reported by FCM are deactivated.
 *
 * Runs inside the API process on boot. Disable with PUSH_WORKER_ENABLED=false
 * (e.g. if you run a dedicated worker process instead).
 */
@Injectable()
export class PushWorkerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PushWorkerService.name);
  private client: Redis | null = null;
  private running = false;

  constructor(
    private config: ConfigService,
    private firebase: FirebaseService,
    @InjectRepository(NotificationEntity) private notifRepo: Repository<NotificationEntity>,
    @InjectRepository(DeviceTokenEntity) private tokenRepo: Repository<DeviceTokenEntity>,
  ) {}

  onModuleInit() {
    if (String(this.config.get('PUSH_WORKER_ENABLED') ?? 'true') === 'false') {
      this.logger.warn('Push worker disabled (PUSH_WORKER_ENABLED=false).');
      return;
    }
    this.client = new Redis({
      host: this.config.get('redis.host') || this.config.get('REDIS_HOST') || '127.0.0.1',
      port: parseInt(this.config.get('redis.port') || this.config.get('REDIS_PORT') || '6379', 10),
      password: this.config.get('redis.password') || this.config.get('REDIS_PASSWORD') || undefined,
      maxRetriesPerRequest: null,
      retryStrategy: (times) => Math.min(times * 200, 5000),
    });
    this.client.on('error', (e) => this.logger.error(`Worker Redis error: ${e.message}`));
    this.running = true;
    this.loop();
    this.logger.log('Push notification worker started.');
  }

  onModuleDestroy() {
    this.running = false;
    this.client?.disconnect();
  }

  private async loop() {
    while (this.running && this.client) {
      try {
        // Blocking pop with 5s timeout so we can exit cleanly.
        const res = await this.client.blpop(PUSH_QUEUE_KEY, 5);
        if (!res) continue;
        const job: PushJob = JSON.parse(res[1]);
        await this.process(job).catch((e) => this.logger.error(`Job failed: ${e.message}`));
      } catch (e: any) {
        if (this.running) {
          this.logger.error(`Worker loop error: ${e.message}`);
          await new Promise((r) => setTimeout(r, 1000));
        }
      }
    }
  }

  private async process(job: PushJob) {
    const notif = await this.notifRepo.findOne({ where: { id: job.notification_id } });
    if (!notif) return;

    const userIds = await this.resolveRecipients(notif);
    if (userIds.length === 0) {
      await this.notifRepo.update(notif.id, { status: 'sent', sent_at: new Date() });
      return;
    }

    // Per-user in-app dispatch rows (idempotent-ish; ignore dup errors).
    const now = new Date();
    const values = userIds.map((uid) => [notif.school_id, notif.id, uid, 'pending', null, now]);
    try {
      await this.notifRepo.query(
        `INSERT INTO notification_dispatches (school_id, notification_id, user_id, push_status, failure_reason, created_at) VALUES ${values
          .map(() => '(?,?,?,?,?,?)')
          .join(',')}`,
        values.flat(),
      );
    } catch (e: any) {
      this.logger.warn(`dispatch insert warning: ${e.message}`);
    }

    // Only push when channel includes push.
    if (notif.channel === 'push' || notif.channel === 'all') {
      const tokenRows = await this.tokenRepo.find({
        where: userIds.map((uid) => ({ user_id: uid, is_active: true })),
      });
      const tokens = tokenRows.map((t) => t.token);

      if (tokens.length > 0) {
        const result = await this.firebase.sendToTokens(tokens, notif.title, notif.body, {
          notification_id: String(notif.id),
          type: 'notification',
        });

        if (result.invalidTokens.length) {
          await this.tokenRepo.update(
            { token: result.invalidTokens as any },
            { is_active: false },
          ).catch(() => {});
          // bulk update by IN
          await this.notifRepo.query(
            `UPDATE device_tokens SET is_active = 0 WHERE token IN (${result.invalidTokens.map(() => '?').join(',')})`,
            result.invalidTokens,
          ).catch(() => {});
        }

        await this.notifRepo.query(
          `UPDATE notification_dispatches SET push_status = 'sent' WHERE notification_id = ? AND user_id IN (${userIds.map(() => '?').join(',')})`,
          [notif.id, ...userIds],
        ).catch(() => {});

        this.logger.log(
          `Notification ${notif.id}: ${userIds.length} recipients, ${tokens.length} tokens, push ok=${result.successCount} fail=${result.failureCount}`,
        );
      } else {
        await this.notifRepo.query(
          `UPDATE notification_dispatches SET push_status = 'skipped', failure_reason = 'no active token' WHERE notification_id = ?`,
          [notif.id],
        ).catch(() => {});
      }
    }

    await this.notifRepo.update(notif.id, { status: 'sent', sent_at: new Date() });
  }

  /**
   * Resolve a notification's audience into concrete user ids.
   *   all                → every active user in the school
   *   role               → users with that role (student/teacher/parent/staff)
   *   class              → users (students) in that class
   *   section            → users (students) in that section
   *   individual         → explicit target_user_ids
   */
  private async resolveRecipients(n: NotificationEntity): Promise<number[]> {
    const schoolId = n.school_id;

    if (n.target_type === 'individual' && Array.isArray(n.target_user_ids) && n.target_user_ids.length) {
      return n.target_user_ids.map((x) => Number(x));
    }

    if (n.target_type === 'section' && n.target_section_id) {
      const rows = await this.notifRepo.query(
        `SELECT u.id FROM users u JOIN students s ON s.user_id = u.id
         WHERE u.school_id = ? AND s.section_id = ? AND u.is_active = 1 AND u.deleted_at IS NULL`,
        [schoolId, n.target_section_id],
      );
      return rows.map((r: any) => r.id);
    }

    if (n.target_type === 'class' && n.target_class_id) {
      const rows = await this.notifRepo.query(
        `SELECT u.id FROM users u JOIN students s ON s.user_id = u.id
         WHERE u.school_id = ? AND s.class_id = ? AND u.is_active = 1 AND u.deleted_at IS NULL`,
        [schoolId, n.target_class_id],
      );
      return rows.map((r: any) => r.id);
    }

    if (n.target_type === 'role' && n.target_role) {
      const rows = await this.notifRepo.query(
        `SELECT DISTINCT u.id FROM users u
         JOIN model_has_roles mhr ON mhr.model_id = u.id AND mhr.model_type = 'App\\\\Models\\\\User'
         JOIN roles r ON r.id = mhr.role_id
         WHERE u.school_id = ? AND u.is_active = 1 AND u.deleted_at IS NULL AND r.name = ?`,
        [schoolId, n.target_role],
      );
      return rows.map((r: any) => r.id);
    }

    // all
    const rows = await this.notifRepo.query(
      `SELECT id FROM users WHERE school_id = ? AND is_active = 1 AND deleted_at IS NULL`,
      [schoolId],
    );
    return rows.map((r: any) => r.id);
  }
}
