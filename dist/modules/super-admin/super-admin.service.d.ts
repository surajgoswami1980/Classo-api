import { Repository } from 'typeorm';
import { SchoolEntity } from '../../entities/school.entity';
import { UserEntity } from '../../entities/user.entity';
import { SpatieRoleService } from '../../common/providers/spatie-role.service';
import { CreateSchoolDto, ToggleSchoolStatusDto, ListSchoolsQueryDto } from './dto/super-admin.dto';
export declare class SuperAdminService {
    private schoolRepo;
    private userRepo;
    private spatieRole;
    constructor(schoolRepo: Repository<SchoolEntity>, userRepo: Repository<UserEntity>, spatieRole: SpatieRoleService);
    listSchools(query: ListSchoolsQueryDto): Promise<{
        data: SchoolEntity[];
        total: number;
        page: number;
        limit: number;
        total_pages: number;
    }>;
    createSchool(dto: CreateSchoolDto): Promise<{
        school: SchoolEntity;
        admin: {
            id: number;
            name: string;
            email: string;
            temp_password: string;
        };
    }>;
    toggleSchoolStatus(dto: ToggleSchoolStatusDto): Promise<SchoolEntity>;
    getDashboard(): Promise<{
        total_schools: number;
        active_schools: number;
        inactive_schools: number;
        subscription_breakdown: any[];
        last_30_days: {
            fee_collected: number;
            platform_revenue_share: number;
            transaction_count: number;
        };
    }>;
}
