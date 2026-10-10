import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export const PUSH_QUEUE_KEY = 'queue:push_notifications';

export interface PushJob {
  notification_id: number;
  school_id: number;
}

/**
 * Thin Redis list-backed queue shared between the Laravel admin and this API.
 * Producers RPUSH a JSON job onto PUSH_QUEUE_KEY; the worker (push-worker.service)
 * BLPOPs and dispatches. Using a plain Redis list keeps both PHP and Node able
 * to enqueue without a shared library.
 */
@Injectable()
export class PushQueueService {
  private readonly logger = new Logger(PushQueueService.name);
  private client: Redis | null = null;

  constructor(private config: ConfigService) {}

  private getClient(): Redis {
    if (!this.client) {
      this.client = new Redis({
        host: this.config.get('redis.host') || this.config.get('REDIS_HOST') || '127.0.0.1',
        port: parseInt(this.config.get('redis.port') || this.config.get('REDIS_PORT') || '6379', 10),
        password: this.config.get('redis.password') || this.config.get('REDIS_PASSWORD') || undefined,
        maxRetriesPerRequest: 2,
        retryStrategy: (times) => Math.min(times * 100, 2000),
      });
      this.client.on('error', (e) => this.logger.error(`Push queue Redis error: ${e.message}`));
    }
    return this.client;
  }

  async enqueue(job: PushJob): Promise<void> {
    await this.getClient().rpush(PUSH_QUEUE_KEY, JSON.stringify(job));
  }
}
