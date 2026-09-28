import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SalaryStructureEntity } from '../../entities/salary-structure.entity';
import { PayslipEntity } from '../../entities/payslip.entity';
import { UserEntity } from '../../entities/user.entity';
import { SalaryStructureDto, GeneratePayslipDto, MarkPaidDto } from './dto/payroll.dto';

@Injectable()
export class PayrollService {
  constructor(
    @InjectRepository(SalaryStructureEntity) private structureRepo: Repository<SalaryStructureEntity>,
    @InjectRepository(PayslipEntity) private payslipRepo: Repository<PayslipEntity>,
    @InjectRepository(UserEntity) private userRepo: Repository<UserEntity>,
  ) {}

  // ─── Salary structure ────────────────────────────────────────

  /**
   * Create or update the salary structure for a staff user. Gross/net are
   * derived: gross = basic + hra + allowances; net = gross - deductions.
   */
  async upsertStructure(schoolId: number, dto: SalaryStructureDto) {
    const user = await this.userRepo.findOne({ where: { id: dto.user_id, school_id: schoolId } });
    if (!user) throw new BadRequestException('Invalid staff user for this school');

    const basic = Number(dto.basic) || 0;
    const hra = Number(dto.hra) || 0;
    const allowances = Number(dto.allowances) || 0;
    const deductions = Number(dto.deductions) || 0;
    const gross = basic + hra + allowances;
    const net = gross - deductions;

    let structure = await this.structureRepo.findOne({ where: { school_id: schoolId, user_id: dto.user_id } });
    if (!structure) {
      structure = this.structureRepo.create({ school_id: schoolId, user_id: dto.user_id });
    }
    Object.assign(structure, { basic, hra, allowances, deductions, gross, net, is_active: 1 });
    return this.structureRepo.save(structure);
  }

  async listStructures(schoolId: number) {
    return this.structureRepo.query(
      `SELECT ss.*, u.name AS staff_name, u.email, u.designation
       FROM salary_structures ss
       JOIN users u ON u.id = ss.user_id
       WHERE ss.school_id = ?
       ORDER BY u.name`,
      [schoolId],
    );
  }

  /**
   * Staff users eligible for payroll (teachers/staff/sub-admins/incharges of
   * the school), annotated with whether a structure already exists.
   */
  async listStaff(schoolId: number) {
    return this.userRepo.query(
      `SELECT u.id AS user_id, u.name, u.email, u.designation,
              ss.id AS structure_id, ss.net
       FROM users u
       LEFT JOIN salary_structures ss ON ss.user_id = u.id AND ss.school_id = u.school_id
       WHERE u.school_id = ? AND u.is_active = 1
       ORDER BY u.name`,
      [schoolId],
    );
  }

  // ─── Payslips ────────────────────────────────────────────────

  /**
   * Generate a payslip for a staff user for a given month/year from their
   * salary structure. LOP days reduce the basic pro-rata (per-30-day month).
   */
  async generatePayslip(schoolId: number, dto: GeneratePayslipDto) {
    const structure = await this.structureRepo.findOne({ where: { school_id: schoolId, user_id: dto.user_id } });
    if (!structure) throw new BadRequestException('No salary structure configured for this staff member');

    const existing = await this.payslipRepo.findOne({
      where: { school_id: schoolId, user_id: dto.user_id, month: dto.month, year: dto.year },
    });
    if (existing) throw new BadRequestException('Payslip already generated for this period');

    const lopDays = Number(dto.lop_days) || 0;
    const basic = Number(structure.basic);
    const perDay = basic / 30;
    const lopDeduction = Math.round(perDay * lopDays * 100) / 100;
    const extraDeductions = Number(dto.extra_deductions) || 0;

    const gross = Number(structure.gross);
    const deductions = Number(structure.deductions) + lopDeduction + extraDeductions;
    const net = Math.max(0, gross - deductions);

    return this.payslipRepo.save(
      this.payslipRepo.create({
        school_id: schoolId,
        user_id: dto.user_id,
        month: dto.month,
        year: dto.year,
        basic,
        hra: Number(structure.hra),
        allowances: Number(structure.allowances),
        deductions,
        lop_days: lopDays,
        gross,
        net,
        status: 'generated',
        remarks: dto.remarks,
      }),
    );
  }

  async listPayslips(schoolId: number, month?: number, year?: number) {
    const params: any[] = [schoolId];
    let where = 'p.school_id = ?';
    if (month) { where += ' AND p.month = ?'; params.push(month); }
    if (year) { where += ' AND p.year = ?'; params.push(year); }

    return this.payslipRepo.query(
      `SELECT p.*, u.name AS staff_name, u.designation
       FROM payslips p
       JOIN users u ON u.id = p.user_id
       WHERE ${where}
       ORDER BY p.year DESC, p.month DESC, u.name`,
      params,
    );
  }

  async markPaid(schoolId: number, dto: MarkPaidDto) {
    const payslip = await this.payslipRepo.findOne({ where: { id: dto.payslip_id, school_id: schoolId } });
    if (!payslip) throw new NotFoundException('Payslip not found');

    payslip.status = 'paid';
    payslip.paid_on = (dto.paid_on || new Date().toISOString().slice(0, 10)) as any;
    await this.payslipRepo.save(payslip);
    return { message: 'Payslip marked as paid' };
  }

  /**
   * A staff member's own payslips (for the staff/teacher self-service view).
   */
  async myPayslips(schoolId: number, userId: number) {
    return this.payslipRepo.find({
      where: { school_id: schoolId, user_id: userId },
      order: { year: 'DESC', month: 'DESC' },
    });
  }

  async getSummary(schoolId: number, month: number, year: number) {
    const [row] = await this.payslipRepo.query(
      `SELECT COUNT(*) AS payslips,
              SUM(net) AS total_net,
              SUM(CASE WHEN status = 'paid' THEN net ELSE 0 END) AS paid_net,
              SUM(CASE WHEN status = 'generated' THEN net ELSE 0 END) AS pending_net
       FROM payslips WHERE school_id = ? AND month = ? AND year = ?`,
      [schoolId, month, year],
    );
    return {
      payslips: Number(row?.payslips) || 0,
      total_net: Number(row?.total_net) || 0,
      paid_net: Number(row?.paid_net) || 0,
      pending_net: Number(row?.pending_net) || 0,
    };
  }
}
