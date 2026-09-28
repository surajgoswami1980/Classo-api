import { PayrollService } from './payroll.service';
import { SalaryStructureDto, GeneratePayslipDto, MarkPaidDto } from './dto/payroll.dto';
export declare class PayrollController {
    private readonly payrollService;
    constructor(payrollService: PayrollService);
    myPayslips(schoolId: number, userId: number): Promise<{
        success: boolean;
        data: import("../../entities/payslip.entity").PayslipEntity[];
    }>;
    listStaff(schoolId: number): Promise<{
        success: boolean;
        data: any;
    }>;
    listStructures(schoolId: number): Promise<{
        success: boolean;
        data: any;
    }>;
    upsertStructure(schoolId: number, dto: SalaryStructureDto): Promise<{
        success: boolean;
        data: import("../../entities/salary-structure.entity").SalaryStructureEntity;
    }>;
    listPayslips(schoolId: number, month?: number, year?: number): Promise<{
        success: boolean;
        data: any;
    }>;
    generatePayslip(schoolId: number, dto: GeneratePayslipDto): Promise<{
        success: boolean;
        data: import("../../entities/payslip.entity").PayslipEntity;
    }>;
    markPaid(schoolId: number, dto: MarkPaidDto): Promise<{
        success: boolean;
        data: {
            message: string;
        };
    }>;
    summary(schoolId: number, month: number, year: number): Promise<{
        success: boolean;
        data: {
            payslips: number;
            total_net: number;
            paid_net: number;
            pending_net: number;
        };
    }>;
}
