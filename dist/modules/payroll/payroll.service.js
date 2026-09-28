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
exports.PayrollService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const salary_structure_entity_1 = require("../../entities/salary-structure.entity");
const payslip_entity_1 = require("../../entities/payslip.entity");
const user_entity_1 = require("../../entities/user.entity");
let PayrollService = class PayrollService {
    constructor(structureRepo, payslipRepo, userRepo) {
        this.structureRepo = structureRepo;
        this.payslipRepo = payslipRepo;
        this.userRepo = userRepo;
    }
    async upsertStructure(schoolId, dto) {
        const user = await this.userRepo.findOne({ where: { id: dto.user_id, school_id: schoolId } });
        if (!user)
            throw new common_1.BadRequestException('Invalid staff user for this school');
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
    async listStructures(schoolId) {
        return this.structureRepo.query(`SELECT ss.*, u.name AS staff_name, u.email, u.designation
       FROM salary_structures ss
       JOIN users u ON u.id = ss.user_id
       WHERE ss.school_id = ?
       ORDER BY u.name`, [schoolId]);
    }
    async listStaff(schoolId) {
        return this.userRepo.query(`SELECT u.id AS user_id, u.name, u.email, u.designation,
              ss.id AS structure_id, ss.net
       FROM users u
       LEFT JOIN salary_structures ss ON ss.user_id = u.id AND ss.school_id = u.school_id
       WHERE u.school_id = ? AND u.is_active = 1
       ORDER BY u.name`, [schoolId]);
    }
    async generatePayslip(schoolId, dto) {
        const structure = await this.structureRepo.findOne({ where: { school_id: schoolId, user_id: dto.user_id } });
        if (!structure)
            throw new common_1.BadRequestException('No salary structure configured for this staff member');
        const existing = await this.payslipRepo.findOne({
            where: { school_id: schoolId, user_id: dto.user_id, month: dto.month, year: dto.year },
        });
        if (existing)
            throw new common_1.BadRequestException('Payslip already generated for this period');
        const lopDays = Number(dto.lop_days) || 0;
        const basic = Number(structure.basic);
        const perDay = basic / 30;
        const lopDeduction = Math.round(perDay * lopDays * 100) / 100;
        const extraDeductions = Number(dto.extra_deductions) || 0;
        const gross = Number(structure.gross);
        const deductions = Number(structure.deductions) + lopDeduction + extraDeductions;
        const net = Math.max(0, gross - deductions);
        return this.payslipRepo.save(this.payslipRepo.create({
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
        }));
    }
    async listPayslips(schoolId, month, year) {
        const params = [schoolId];
        let where = 'p.school_id = ?';
        if (month) {
            where += ' AND p.month = ?';
            params.push(month);
        }
        if (year) {
            where += ' AND p.year = ?';
            params.push(year);
        }
        return this.payslipRepo.query(`SELECT p.*, u.name AS staff_name, u.designation
       FROM payslips p
       JOIN users u ON u.id = p.user_id
       WHERE ${where}
       ORDER BY p.year DESC, p.month DESC, u.name`, params);
    }
    async markPaid(schoolId, dto) {
        const payslip = await this.payslipRepo.findOne({ where: { id: dto.payslip_id, school_id: schoolId } });
        if (!payslip)
            throw new common_1.NotFoundException('Payslip not found');
        payslip.status = 'paid';
        payslip.paid_on = (dto.paid_on || new Date().toISOString().slice(0, 10));
        await this.payslipRepo.save(payslip);
        return { message: 'Payslip marked as paid' };
    }
    async myPayslips(schoolId, userId) {
        return this.payslipRepo.find({
            where: { school_id: schoolId, user_id: userId },
            order: { year: 'DESC', month: 'DESC' },
        });
    }
    async getSummary(schoolId, month, year) {
        const [row] = await this.payslipRepo.query(`SELECT COUNT(*) AS payslips,
              SUM(net) AS total_net,
              SUM(CASE WHEN status = 'paid' THEN net ELSE 0 END) AS paid_net,
              SUM(CASE WHEN status = 'generated' THEN net ELSE 0 END) AS pending_net
       FROM payslips WHERE school_id = ? AND month = ? AND year = ?`, [schoolId, month, year]);
        return {
            payslips: Number(row?.payslips) || 0,
            total_net: Number(row?.total_net) || 0,
            paid_net: Number(row?.paid_net) || 0,
            pending_net: Number(row?.pending_net) || 0,
        };
    }
};
exports.PayrollService = PayrollService;
exports.PayrollService = PayrollService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(salary_structure_entity_1.SalaryStructureEntity)),
    __param(1, (0, typeorm_1.InjectRepository)(payslip_entity_1.PayslipEntity)),
    __param(2, (0, typeorm_1.InjectRepository)(user_entity_1.UserEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], PayrollService);
//# sourceMappingURL=payroll.service.js.map