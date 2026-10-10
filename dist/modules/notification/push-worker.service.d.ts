import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { NotificationEntity } from '../../entities/notification.entity';
import { DeviceTokenEntity } from '../../entities/device-token.entity';
import { FirebaseService } from './firebase.service';
export declare class PushWorkerService implements OnModuleInit, OnModuleDestroy {
    private config;
    private firebase;
    private notifRepo;
    private tokenRepo;
    private readonly logger;
    private client;
    private running;
    constructor(config: ConfigService, firebase: FirebaseService, notifRepo: Repository<NotificationEntity>, tokenRepo: Repository<DeviceTokenEntity>);
    onModuleInit(): void;
    onModuleDestroy(): void;
    private loop;
    private process;
    private resolveRecipients;
}
