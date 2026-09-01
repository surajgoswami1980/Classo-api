"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SuperAdminService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const bcrypt = require("bcryptjs");
const school_entity_1 = require("../../entities/school.entity");
const user_entity_1 = require("../../entities/user.entity");
const spatie_role_service_1 = require("../../common/providers/spatie-role.service");
let SuperAdminService = class SuperAdminService {
    constructor(schoolRepo, userRepo, spatieRole) {
        this.schoolRepo = schoolRepo;
        this.userRepo = userRepo;
        this.spatieRole = spatieRole;
    }
    async listSchools(query) {
        const page = Number(query.page) || 1;
        const limit = Number(query.limit) || 20;
        const qb = this.schoolRepo.createQueryBuilder('s');
        if (query.subscription_plan)
            qb.andWhere('s.subscription_plan = :plan', { plan: query.subscription_plan });
        if (query.is_active !== undefined)
            qb.andWhere('s.is_active = :active', { active: query.is_active });
        if (query.search) {
            qb.andWhere('(s.name LIKE :search OR s.code LIKE :search OR s.email LIKE :search)', {
                search: `%${query.search}%`,
            });
        }
        const total = await qb.getCount();
        const data = await qb.orderBy('s.created_at', 'DESC').skip((page - 1) * limit).take(limit).getMany();
        return { data, total, page, limit, total_pages: Math.ceil(total / limit) };
    }
    async createSchool(dto) {
        const existingCode = await this.schoolRepo.findOne({ where: { code: dto.code } });
        if (existingCode)
            throw new common_1.ConflictException('A school with this code already exists');
        const existingEmail = await this.schoolRepo.findOne({ where: { email: dto.email } });
        if (existingEmail)
            throw new common_1.ConflictException('A school with this email already exists');
        const school = await this.schoolRepo.save(this.schoolRepo.create({
            name: dto.name,
            code: dto.code,
            email: dto.email,
            phone: dto.phone,
            address: dto.address,
            city: dto.city,
            state: dto.state,
            pincode: dto.pincode,
            board_affiliation: dto.board_affiliation,
            subscription_plan: dto.subscription_plan || 'trial',
            max_students: dto.max_students || 200,
            logo: dto.logo,
            is_active: true,
        }));
        const plainPassword = dto.admin_password || 'Admin@123';
        const adminUser = await this.userRepo.save(this.userRepo.create({
            name: dto.admin_name,
            email: dto.admin_email,
            phone: dto.admin_phone,
            password: await bcrypt.hash(plainPassword, 10),
            school_id: school.id,
            is_active: true,
        }));
        await this.spatieRole.assignRole(adminUser.id, 'school-admin');
        return {
            school,
            admin: { id: adminUser.id, name: adminUser.name, email: adminUser.email, temp_password: dto.admin_password ? undefined : plainPassword },
        };
    }
    async toggleSchoolStatus(dto) {
        const school = await this.schoolRepo.findOne({ where: { id: dto.school_id } });
        if (!school)
            throw new common_1.NotFoundException('School not found');
        school.is_active = dto.is_active;
        return this.schoolRepo.save(school);
    }
    async getDashboard() {
        const [totalSchools, activeSchools, planBreakdown, revenueRows] = await Promise.all([
            this.schoolRepo.count(),
            this.schoolRepo.count({ where: { is_active: true } }),
            this.schoolRepo
                .createQueryBuilder('s')
                .select('s.subscription_plan', 'plan')
                .addSelect('COUNT(*)', 'count')
                .groupBy('s.subscription_plan')
                .getRawMany(),
            this.schoolRepo.query(`SELECT
           COUNT(*) as total_transactions,
           SUM(CASE WHEN status = 'success' THEN amount ELSE 0 END) as total_collected,
           SUM(CASE WHEN status = 'success' THEN platform_commission ELSE 0 END) as revenue_share
         FROM payment_transactions
         WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)`),
        ]);
        return {
            total_schools: totalSchools,
            active_schools: activeSchools,
            inactive_schools: totalSchools - activeSchools,
            subscription_breakdown: planBreakdown,
            last_30_days: {
                fee_collected: Number(revenueRows[0]?.total_collected) || 0,
                platform_revenue_share: Number(revenueRows[0]?.revenue_share) || 0,
                transaction_count: Number(revenueRows[0]?.total_transactions) || 0,
            },
        };
    }
};
exports.SuperAdminService = SuperAdminService;
exports.SuperAdminService = SuperAdminService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(school_entity_1.SchoolEntity)),
    __param(1, (0, typeorm_1.InjectRepository)(user_entity_1.UserEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        spatie_role_service_1.SpatieRoleService])
], SuperAdminService);
//# sourceMappingURL=super-admin.service.js.map