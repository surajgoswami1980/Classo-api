import { Repository } from 'typeorm';
import { SalaryStructureEntity } from '../../entities/salary-structure.entity';
import { PayslipEntity } from '../../entities/payslip.entity';
import { UserEntity } from '../../entities/user.entity';
import { SalaryStructureDto, GeneratePayslipDto, MarkPaidDto } from './dto/payroll.dto';
export declare class PayrollService {
    private structureRepo;
    private payslipRepo;
    private userRepo;
    constructor(structureRepo: Repository<SalaryStructureEntity>, payslipRepo: Repository<PayslipEntity>, userRepo: Repository<UserEntity>);
    upsertStructure(schoolId: number, dto: SalaryStructureDto): Promise<SalaryStructureEntity>;
    listStructures(schoolId: number): Promise<any>;
    listStaff(schoolId: number): Promise<any>;
    generatePayslip(schoolId: number, dto: GeneratePayslipDto): Promise<PayslipEntity>;
    listPayslips(schoolId: number, month?: number, year?: number): Promise<any>;
    markPaid(schoolId: number, dto: MarkPaidDto): Promise<{
        message: string;
    }>;
    myPayslips(schoolId: number, userId: number): Promise<PayslipEntity[]>;
    getSummary(schoolId: number, month: number, year: number): Promise<{
        payslips: number;
        total_net: number;
        paid_net: number;
        pending_net: number;
    }>;
}
