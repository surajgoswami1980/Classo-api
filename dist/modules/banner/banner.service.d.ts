import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { StudentEntity } from '../../entities/student.entity';
export type BannerPlacement = 'slider' | 'popup';
export declare class BannerService {
    private studentRepo;
    private config;
    constructor(studentRepo: Repository<StudentEntity>, config: ConfigService);
    private assetUrl;
    private resolveAudience;
    getBanners(schoolId: number, userId: number, role: string, placement?: BannerPlacement): Promise<any>;
    getPopup(schoolId: number, userId: number, role: string): Promise<any>;
}
