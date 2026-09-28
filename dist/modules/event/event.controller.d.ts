import { EventService } from './event.service';
import { CreateEventDto, UpdateEventDto, ListEventsQueryDto, RegisterEventDto, VerifyEventPaymentDto } from './dto/event.dto';
export declare class EventController {
    private readonly eventService;
    constructor(eventService: EventService);
    create(schoolId: number, userId: number, dto: CreateEventDto): Promise<{
        success: boolean;
        data: import("../../entities/event.entity").EventEntity;
    }>;
    update(schoolId: number, id: number, dto: UpdateEventDto): Promise<{
        success: boolean;
        data: import("../../entities/event.entity").EventEntity;
    }>;
    remove(schoolId: number, id: number): Promise<{
        success: boolean;
        data: {
            message: string;
        };
    }>;
    publish(schoolId: number, userId: number, id: number): Promise<{
        success: boolean;
        data: {
            message: string;
            event_id: number;
        };
    }>;
    adminList(schoolId: number, query: ListEventsQueryDto): Promise<{
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
        success: boolean;
    }>;
    registrations(schoolId: number, id: number): Promise<{
        success: boolean;
        data: any;
    }>;
    list(schoolId: number, userId: number): Promise<{
        success: boolean;
        data: any;
    }>;
    register(schoolId: number, userId: number, dto: RegisterEventDto): Promise<{
        success: boolean;
        data: {
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
        };
    }>;
    verify(schoolId: number, userId: number, dto: VerifyEventPaymentDto): Promise<{
        success: boolean;
        data: {
            message: string;
            registration_id: number;
        };
    }>;
    myRegistrations(schoolId: number, userId: number): Promise<{
        success: boolean;
        data: any;
    }>;
    cancel(schoolId: number, userId: number, registrationId: number): Promise<{
        success: boolean;
        data: {
            message: string;
        };
    }>;
}
