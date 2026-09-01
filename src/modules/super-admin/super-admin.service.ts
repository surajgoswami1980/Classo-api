import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { SchoolEntity } from '../../entities/school.entity';
import { UserEntity } from '../../entities/user.entity';
import { SpatieRoleService } from '../../common/providers/spatie-role.service';
import { CreateSchoolDto, ToggleSchoolStatusDto, ListSchoolsQueryDto } from './dto/super-admin.dto';

@Injectable()
export class SuperAdminService {
  constructor(
    @InjectRepository(SchoolEntity) private schoolRepo: Repository<SchoolEntity>,
    @InjectRepository(UserEntity) private userRepo: Repository<UserEntity>,
    private spatieRole: SpatieRoleService,
  ) {}

  async listSchools(query: ListSchoolsQueryDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;

    const qb = this.schoolRepo.createQueryBuilder('s');

    if (query.subscription_plan) qb.andWhere('s.subscription_plan = :plan', { plan: query.subscription_plan });
    if (query.is_active !== undefined) qb.andWhere('s.is_active = :active', { active: query.is_active });
    if (query.search) {
      qb.andWhere('(s.name LIKE :search OR s.code LIKE :search OR s.email LIKE :search)', {
        search: `%${query.search}%`,
      });
    }

    const total = await qb.getCount();
    const data = await qb.orderBy('s.created_at', 'DESC').skip((page - 1) * limit).take(limit).getMany();

    return { data, total, page, limit, total_pages: Math.ceil(total / limit) };
  }

  /**
   * Onboard a new school: creates the tenant row and its initial
   * school-admin login together.
   */
  async createSchool(dto: CreateSchoolDto) {
    const existingCode = await this.schoolRepo.findOne({ where: { code: dto.code } });
    if (existingCode) throw new ConflictException('A school with this code already exists');

    const existingEmail = await this.schoolRepo.findOne({ where: { email: dto.email } });
    if (existingEmail) throw new ConflictException('A school with this email already exists');

    const school = await this.schoolRepo.save(
      this.schoolRepo.create({
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
      }),
    );

    const plainPassword = dto.admin_password || 'Admin@123';
    const adminUser = await this.userRepo.save(
      this.userRepo.create({
        name: dto.admin_name,
        email: dto.admin_email,
        phone: dto.admin_phone,
        password: await bcrypt.hash(plainPassword, 10),
        school_id: school.id,
        is_active: true,
      }),
    );
    await this.spatieRole.assignRole(adminUser.id, 'school-admin');

    return {
      school,
      admin: { id: adminUser.id, name: adminUser.name, email: adminUser.email, temp_password: dto.admin_password ? undefined : plainPassword },
    };
  }

  async toggleSchoolStatus(dto: ToggleSchoolStatusDto) {
    const school = await this.schoolRepo.findOne({ where: { id: dto.school_id } });
    if (!school) throw new NotFoundException('School not found');

    school.is_active = dto.is_active;
    return this.schoolRepo.save(school);
  }

  /**
   * Platform-wide dashboard: tenant counts, subscription mix, and
   * fee-collection revenue share across all schools.
   */
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
      this.schoolRepo.query(
        `SELECT
           COUNT(*) as total_transactions,
           SUM(CASE WHEN status = 'success' THEN amount ELSE 0 END) as total_collected,
           SUM(CASE WHEN status = 'success' THEN platform_commission ELSE 0 END) as revenue_share
         FROM payment_transactions
         WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)`,
      ),
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
}
