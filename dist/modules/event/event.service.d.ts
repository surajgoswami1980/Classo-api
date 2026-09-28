import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { EventEntity } from '../../entities/event.entity';
import { EventRegistrationEntity } from '../../entities/event-registration.entity';
import { PaymentTransactionEntity } from '../../entities/payment-transaction.entity';
import { StudentEntity } from '../../entities/student.entity';
import { NotificationService } from '../notification/notification.service';
import { CreateEventDto, UpdateEventDto, ListEventsQueryDto, RegisterEventDto, VerifyEventPaymentDto } from './dto/event.dto';
export declare class EventService {
    private eventRepo;
    private regRepo;
    private txnRepo;
    private studentRepo;
    private configService;
    private readonly notificationService;
    private razorpay;
    constructor(eventRepo: Repository<EventEntity>, regRepo: Repository<EventRegistrationEntity>, txnRepo: Repository<PaymentTransactionEntity>, studentRepo: Repository<StudentEntity>, configService: ConfigService, notificationService: NotificationService);
    private getRazorpay;
    createEvent(schoolId: number, dto: CreateEventDto, userId: number): Promise<EventEntity>;
    updateEvent(schoolId: number, id: number, dto: UpdateEventDto): Promise<EventEntity>;
    deleteEvent(schoolId: number, id: number): Promise<{
        message: string;
    }>;
    publishEvent(schoolId: number, id: number, userId: number): Promise<{
        message: string;
        event_id: number;
    }>;
    listEventsAdmin(schoolId: number, query: ListEventsQueryDto): Promise<{
        data: {
            registrations: number;
            id: number;
            school_id: number;
            title: string;
            description: string;
            category: string;
            venue: string;
            banner: string;
            start_at: Date;
            end_at: Date;
            registration_deadline: Date;
            is_paid: boolean;
            fee: number;
            capacity: number;
            audience_type: string;
            class_id: number;
            section_id: number;
            status: string;
            created_by: number;
            created_at: Date;
            updated_at: Date;
        }[];
        total: number;
        page: number;
        limit: number;
        total_pages: number;
    }>;
    getEventDetail(schoolId: number, id: number): Promise<EventEntity>;
    listRegistrations(schoolId: number, eventId: number): Promise<any>;
    listEventsForStudent(schoolId: number, userId: number): Promise<any>;
    register(schoolId: number, userId: number, dto: RegisterEventDto): Promise<{
        paid: boolean;
        message: string;
        registration_id: number;
        order_id?: undefined;
        amount?: undefined;
        currency?: undefined;
        razorpay_key?: undefined;
        prefill?: undefined;
    } | {
        paid: boolean;
        order_id: any;
        amount: number;
        currency: string;
        razorpay_key: any;
        registration_id: number;
        prefill: {
            name: string;
            email: string;
            contact: string;
        };
        message?: undefined;
    }>;
    verifyPayment(schoolId: number, userId: number, dto: VerifyEventPaymentDto): Promise<{
        message: string;
        registration_id: number;
    }>;
    myRegistrations(schoolId: number, userId: number): Promise<any>;
    cancelRegistration(schoolId: number, userId: number, registrationId: number): Promise<{
        message: string;
    }>;
    private notifyRegistrationConfirmed;
}
