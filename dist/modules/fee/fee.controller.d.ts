import { Request } from 'express';
import { FeeService, CreateFeeStructureDto, GenerateInvoicesDto, InitiatePaymentDto, VerifyPaymentDto, OfflinePaymentDto, InvoiceFiltersDto } from './fee.service';
export declare class FeeController {
    private readonly feeService;
    constructor(feeService: FeeService);
    createStructure(schoolId: number, dto: CreateFeeStructureDto): Promise<{
        success: boolean;
        data: import("../../entities/fee-structure.entity").FeeStructureEntity;
    }>;
    listStructures(schoolId: number, classId?: number): Promise<{
        success: boolean;
        data: import("../../entities/fee-structure.entity").FeeStructureEntity[];
    }>;
    generateInvoices(schoolId: number, dto: GenerateInvoicesDto): Promise<{
        success: boolean;
        data: {
            message: string;
            total_students: number;
            already_generated: number;
            new_invoices: number;
        };
    }>;
    listInvoices(schoolId: number, filters: InvoiceFiltersDto): Promise<{
        success: boolean;
        data: {
            data: import("../../entities/fee-invoice.entity").FeeInvoiceEntity[];
            total: number;
            page: number;
            limit: number;
        };
    }>;
    getStudentInvoices(schoolId: number, studentId: number): Promise<{
        success: boolean;
        data: import("../../entities/fee-invoice.entity").FeeInvoiceEntity[];
    }>;
    initiatePayment(schoolId: number, userId: number, dto: InitiatePaymentDto): Promise<{
        success: boolean;
        data: {
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
        };
    }>;
    verifyPayment(schoolId: number, dto: VerifyPaymentDto): Promise<{
        success: boolean;
        data: {
            message: string;
            transaction_id: number;
            amount?: undefined;
            invoice_id?: undefined;
        } | {
            message: string;
            transaction_id: number;
            amount: number;
            invoice_id: number;
        };
    }>;
    webhook(req: Request): Promise<{
        received: boolean;
    }>;
    markPaidOffline(schoolId: number, userId: number, invoiceId: number, dto: OfflinePaymentDto): Promise<{
        success: boolean;
        data: {
            message: string;
            transaction_id: number;
        };
    }>;
    collectionReport(schoolId: number, fromDate: string, toDate: string): Promise<{
        success: boolean;
        data: {
            daily: any;
            summary: any;
        };
    }>;
    getDefaulters(schoolId: number): Promise<{
        success: boolean;
        data: any;
    }>;
}
