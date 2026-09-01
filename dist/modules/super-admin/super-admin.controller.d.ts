import { SuperAdminService } from './super-admin.service';
import { CreateSchoolDto, ToggleSchoolStatusDto, ListSchoolsQueryDto } from './dto/super-admin.dto';
export declare class SuperAdminController {
    private readonly superAdminService;
    constructor(superAdminService: SuperAdminService);
    listSchools(query: ListSchoolsQueryDto): Promise<{
        data: import("../../entities/school.entity").SchoolEntity[];
        total: number;
        page: number;
        limit: number;
        total_pages: number;
        success: boolean;
    }>;
    createSchool(dto: CreateSchoolDto): Promise<{
        success: boolean;
        data: {
            school: import("../../entities/school.entity").SchoolEntity;
            admin: {
                id: number;
                name: string;
                email: string;
                temp_password: string;
            };
        };
    }>;
    toggleSchoolStatus(dto: ToggleSchoolStatusDto): Promise<{
        success: boolean;
        data: import("../../entities/school.entity").SchoolEntity;
    }>;
    getDashboard(): Promise<{
        success: boolean;
        data: {
            total_schools: number;
            active_schools: number;
            inactive_schools: number;
            subscription_breakdown: any[];
            last_30_days: {
                fee_collected: number;
                platform_revenue_share: number;
                transaction_count: number;
            };
        };
    }>;
}
