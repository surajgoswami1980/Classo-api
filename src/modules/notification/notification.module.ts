import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { NotificationEntity } from '../../entities/notification.entity';
import { NotificationReadEntity } from '../../entities/notification-read.entity';
import { DeviceTokenEntity } from '../../entities/device-token.entity';
import { PushQueueService } from './push-queue.service';
import { PushWorkerService } from './push-worker.service';
import { FirebaseService } from './firebase.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([NotificationEntity, NotificationReadEntity, DeviceTokenEntity]),
  ],
  controllers: [NotificationController],
  providers: [NotificationService, PushQueueService, PushWorkerService, FirebaseService],
  exports: [NotificationService],
})
export class NotificationModule {}
