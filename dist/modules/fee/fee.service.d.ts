import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { FeeStructureEntity } from '../../entities/fee-structure.entity';
import { FeeInvoiceEntity } from '../../entities/fee-invoice.entity';
import { PaymentTransactionEntity } from '../../entities/payment-transaction.entity';
import { StudentEntity } from '../../entities/student.entity';
import { RedisService } from '../../common/providers/redis.service';
export declare class FeeService {
    private feeStructureRepo;
    private invoiceRepo;
    private txnRepo;
    private studentRepo;
    private configService;
    private redis;
    private razorpay;
    constructor(feeStructureRepo: Repository<FeeStructureEntity>, invoiceRepo: Repository<FeeInvoiceEntity>, txnRepo: Repository<PaymentTransactionEntity>, studentRepo: Repository<StudentEntity>, configService: ConfigService, redis: RedisService);
    private getRazorpay;
    createFeeStructure(schoolId: number, dto: CreateFeeStructureDto): Promise<FeeStructureEntity>;
    listFeeStructures(schoolId: number, classId?: number): Promise<FeeStructureEntity[]>;
    generateInvoices(schoolId: number, dto: GenerateInvoicesDto): Promise<{
        message: string;
        total_students: number;
        already_generated: number;
        new_invoices: number;
    }>;
    getStudentInvoices(schoolId: number, studentId: number): Promise<FeeInvoiceEntity[]>;
    listInvoices(schoolId: number, filters: InvoiceFiltersDto): Promise<{
        data: FeeInvoiceEntity[];
        total: number;
        page: number;
        limit: number;
    }>;
    initiatePayment(schoolId: number, dto: InitiatePaymentDto, userId: number): Promise<{
        order_id: any;
        amount: number;
        currency: string;
        invoice_number: string;
        razorpay_key: any;
        student_id: number;
        prefill: {
            name: string;
            email: string;
            contact: string;
        };
    }>;
    verifyPayment(schoolId: number, dto: VerifyPaymentDto): Promise<{
        message: string;
        transaction_id: number;
        amount?: undefined;
        invoice_id?: undefined;
    } | {
        message: string;
        transaction_id: number;
        amount: number;
        invoice_id: number;
    }>;
    handleWebhook(payload: any): Promise<{
        received: boolean;
    }>;
    markPaidOffline(schoolId: number, invoiceId: number, dto: OfflinePaymentDto, userId: number): Promise<{
        message: string;
        transaction_id: number;
    }>;
    getCollectionReport(schoolId: number, fromDate: string, toDate: string): Promise<{
        daily: any;
        summary: any;
    }>;
    getDefaulters(schoolId: number): Promise<any>;
    private generateInvoiceNumber;
}
export declare class CreateFeeStructureDto {
    academic_session_id: number;
    name: string;
    class_id: number;
    total_amount: number;
    installment_count?: number;
    late_fee_per_day?: number;
    late_fee_max?: number;
}
export declare class GenerateInvoicesDto {
    fee_structure_id: number;
    installment_number: number;
    due_date: string;
}
export declare class InitiatePaymentDto {
    invoice_id: number;
    payment_method?: string;
    name?: string;
    email?: string;
    phone?: string;
}
export declare class VerifyPaymentDto {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
}
export declare class OfflinePaymentDto {
    payment_method: 'cash' | 'cheque';
    reference_number?: string;
    remarks?: string;
}
export declare class InvoiceFiltersDto {
    status?: string;
    class_id?: number;
    student_id?: number;
    page?: number;
    limit?: number;
}
