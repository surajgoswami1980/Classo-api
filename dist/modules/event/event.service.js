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
exports.EventService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const config_1 = require("@nestjs/config");
const event_entity_1 = require("../../entities/event.entity");
const event_registration_entity_1 = require("../../entities/event-registration.entity");
const payment_transaction_entity_1 = require("../../entities/payment-transaction.entity");
const student_entity_1 = require("../../entities/student.entity");
const notification_service_1 = require("../notification/notification.service");
const Razorpay = require('razorpay');
let EventService = class EventService {
    constructor(eventRepo, regRepo, txnRepo, studentRepo, configService, notificationService) {
        this.eventRepo = eventRepo;
        this.regRepo = regRepo;
        this.txnRepo = txnRepo;
        this.studentRepo = studentRepo;
        this.configService = configService;
        this.notificationService = notificationService;
    }
    getRazorpay() {
        if (!this.razorpay) {
            const keyId = this.configService.get('RAZORPAY_KEY_ID');
            const keySecret = this.configService.get('RAZORPAY_KEY_SECRET');
            if (!keyId || !keySecret) {
                throw new common_1.BadRequestException('Razorpay is not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to .env');
            }
            this.razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
        }
        return this.razorpay;
    }
    async createEvent(schoolId, dto, userId) {
        if (dto.is_paid && (!dto.fee || Number(dto.fee) <= 0)) {
            throw new common_1.BadRequestException('A paid event needs a fee greater than 0');
        }
        const event = this.eventRepo.create({
            school_id: schoolId,
            title: dto.title,
            description: dto.description,
            category: dto.category || 'general',
            venue: dto.venue,
            banner: dto.banner,
            start_at: dto.start_at,
            end_at: dto.end_at,
            registration_deadline: dto.registration_deadline,
            is_paid: !!dto.is_paid,
            fee: dto.is_paid ? dto.fee : 0,
            capacity: dto.capacity ?? null,
            audience_type: dto.audience_type || 'all',
            class_id: dto.class_id ?? null,
            section_id: dto.section_id ?? null,
            status: 'draft',
            created_by: userId,
        });
        return this.eventRepo.save(event);
    }
    async updateEvent(schoolId, id, dto) {
        const event = await this.eventRepo.findOne({ where: { id, school_id: schoolId } });
        if (!event)
            throw new common_1.NotFoundException('Event not found');
        Object.assign(event, {
            ...(dto.title !== undefined && { title: dto.title }),
            ...(dto.description !== undefined && { description: dto.description }),
            ...(dto.category !== undefined && { category: dto.category }),
            ...(dto.venue !== undefined && { venue: dto.venue }),
            ...(dto.banner !== undefined && { banner: dto.banner }),
            ...(dto.start_at !== undefined && { start_at: dto.start_at }),
            ...(dto.end_at !== undefined && { end_at: dto.end_at }),
            ...(dto.registration_deadline !== undefined && { registration_deadline: dto.registration_deadline }),
            ...(dto.is_paid !== undefined && { is_paid: !!dto.is_paid }),
            ...(dto.fee !== undefined && { fee: dto.is_paid ? dto.fee : 0 }),
            ...(dto.capacity !== undefined && { capacity: dto.capacity }),
            ...(dto.audience_type !== undefined && { audience_type: dto.audience_type }),
            ...(dto.class_id !== undefined && { class_id: dto.class_id }),
            ...(dto.section_id !== undefined && { section_id: dto.section_id }),
            ...(dto.status !== undefined && { status: dto.status }),
        });
        return this.eventRepo.save(event);
    }
    async deleteEvent(schoolId, id) {
        const event = await this.eventRepo.findOne({ where: { id, school_id: schoolId } });
        if (!event)
            throw new common_1.NotFoundException('Event not found');
        await this.eventRepo.remove(event);
        return { message: 'Event deleted' };
    }
    async publishEvent(schoolId, id, userId) {
        const event = await this.eventRepo.findOne({ where: { id, school_id: schoolId } });
        if (!event)
            throw new common_1.NotFoundException('Event not found');
        event.status = 'published';
        await this.eventRepo.save(event);
        const target = event.audience_type === 'section'
            ? { target_type: 'section', target_section_id: event.section_id }
            : event.audience_type === 'class'
                ? { target_type: 'class', target_class_id: event.class_id }
                : { target_type: 'role', target_role: 'student' };
        await this.notificationService.sendNotification(schoolId, userId, {
            title: `New Event: ${event.title}`,
            body: `${event.title} on ${new Date(event.start_at).toLocaleString()}${event.is_paid ? ` — Fee ₹${event.fee}` : ' — Free'}. Register now!`,
            channel: 'all',
            ...target,
        });
        return { message: 'Event published and audience notified', event_id: id };
    }
    async listEventsAdmin(schoolId, query) {
        const page = Number(query.page) || 1;
        const limit = Number(query.limit) || 20;
        const qb = this.eventRepo
            .createQueryBuilder('e')
            .where('e.school_id = :schoolId', { schoolId });
        if (query.status)
            qb.andWhere('e.status = :status', { status: query.status });
        if (query.category)
            qb.andWhere('e.category = :category', { category: query.category });
        if (query.upcoming === 'true')
            qb.andWhere('e.start_at >= NOW()');
        const total = await qb.getCount();
        const events = await qb.orderBy('e.start_at', 'DESC').skip((page - 1) * limit).take(limit).getMany();
        const data = await Promise.all(events.map(async (e) => {
            const registrations = await this.regRepo.count({ where: { event_id: e.id, status: 'registered' } });
            return { ...e, registrations };
        }));
        return { data, total, page, limit, total_pages: Math.ceil(total / limit) };
    }
    async getEventDetail(schoolId, id) {
        const event = await this.eventRepo.findOne({ where: { id, school_id: schoolId } });
        if (!event)
            throw new common_1.NotFoundException('Event not found');
        return event;
    }
    async listRegistrations(schoolId, eventId) {
        return this.regRepo.query(`SELECT r.*, u.name AS user_name, u.email, u.phone,
              s.roll_number, s.admission_number, c.name AS class_name, sec.name AS section_name
       FROM event_registrations r
       JOIN users u ON u.id = r.user_id
       LEFT JOIN students s ON s.id = r.student_id
       LEFT JOIN classes c ON c.id = s.class_id
       LEFT JOIN sections sec ON sec.id = s.section_id
       WHERE r.school_id = ? AND r.event_id = ?
       ORDER BY r.created_at DESC`, [schoolId, eventId]);
    }
    async listEventsForStudent(schoolId, userId) {
        const student = await this.studentRepo.findOne({ where: { school_id: schoolId, user_id: userId } });
        const rows = await this.eventRepo.query(`SELECT e.*,
              (SELECT COUNT(*) FROM event_registrations r WHERE r.event_id = e.id AND r.status = 'registered') AS registrations,
              (SELECT COUNT(*) FROM event_registrations r2 WHERE r2.event_id = e.id AND r2.user_id = ? AND r2.status != 'cancelled') AS my_registered,
              (SELECT r3.payment_status FROM event_registrations r3 WHERE r3.event_id = e.id AND r3.user_id = ? LIMIT 1) AS my_payment_status
       FROM events e
       WHERE e.school_id = ?
         AND e.status = 'published'
         AND (e.end_at IS NULL OR e.end_at >= NOW() OR e.start_at >= NOW())
         AND (
              e.audience_type = 'all'
              OR (e.audience_type = 'class' AND e.class_id = ?)
              OR (e.audience_type = 'section' AND e.section_id = ?)
         )
       ORDER BY e.start_at ASC`, [userId, userId, schoolId, student?.class_id ?? 0, student?.section_id ?? 0]);
        return rows.map((e) => ({
            ...e,
            is_paid: !!e.is_paid,
            fee: Number(e.fee) || 0,
            registrations: Number(e.registrations) || 0,
            is_registered: Number(e.my_registered) > 0,
            my_payment_status: e.my_payment_status || null,
        }));
    }
    async register(schoolId, userId, dto) {
        const event = await this.eventRepo.findOne({ where: { id: dto.event_id, school_id: schoolId } });
        if (!event)
            throw new common_1.NotFoundException('Event not found');
        if (event.status !== 'published')
            throw new common_1.BadRequestException('This event is not open for registration');
        if (event.registration_deadline && new Date() > new Date(event.registration_deadline)) {
            throw new common_1.BadRequestException('Registration deadline has passed');
        }
        if (event.capacity) {
            const count = await this.regRepo.count({ where: { event_id: event.id, status: 'registered' } });
            if (count >= event.capacity)
                throw new common_1.BadRequestException('This event is full');
        }
        const student = await this.studentRepo.findOne({ where: { school_id: schoolId, user_id: userId } });
        let registration = await this.regRepo.findOne({ where: { event_id: event.id, user_id: userId } });
        if (registration && registration.status === 'registered' && registration.payment_status !== 'pending') {
            throw new common_1.BadRequestException('You are already registered for this event');
        }
        if (!event.is_paid) {
            if (!registration) {
                registration = this.regRepo.create({
                    school_id: schoolId,
                    event_id: event.id,
                    student_id: student?.id ?? null,
                    user_id: userId,
                    payment_status: 'not_required',
                    amount: 0,
                    status: 'registered',
                });
            }
            else {
                registration.status = 'registered';
                registration.payment_status = 'not_required';
            }
            await this.regRepo.save(registration);
            await this.notifyRegistrationConfirmed(schoolId, event, userId);
            return { paid: false, message: 'Registered successfully', registration_id: registration.id };
        }
        if (!registration) {
            registration = this.regRepo.create({
                school_id: schoolId,
                event_id: event.id,
                student_id: student?.id ?? null,
                user_id: userId,
                payment_status: 'pending',
                amount: event.fee,
                status: 'registered',
            });
        }
        else {
            registration.payment_status = 'pending';
            registration.amount = event.fee;
            registration.status = 'registered';
        }
        await this.regRepo.save(registration);
        const order = await this.getRazorpay().orders.create({
            amount: Math.round(Number(event.fee) * 100),
            currency: 'INR',
            receipt: `EVT-${event.id}-${registration.id}`,
            notes: {
                school_id: String(schoolId),
                event_id: String(event.id),
                registration_id: String(registration.id),
            },
        });
        const txn = this.txnRepo.create({
            school_id: schoolId,
            payable_type: 'event',
            event_registration_id: registration.id,
            student_id: student?.id ?? 0,
            parent_user_id: userId,
            amount: event.fee,
            payment_method: 'upi',
            gateway: 'razorpay',
            razorpay_order_id: order.id,
            status: 'initiated',
            platform_commission: Math.round(Number(event.fee) * 0.015 * 100) / 100,
        });
        await this.txnRepo.save(txn);
        registration.payment_transaction_id = txn.id;
        await this.regRepo.save(registration);
        return {
            paid: true,
            order_id: order.id,
            amount: Number(event.fee),
            currency: 'INR',
            razorpay_key: this.configService.get('RAZORPAY_KEY_ID'),
            registration_id: registration.id,
            prefill: { name: dto.name || '', email: dto.email || '', contact: dto.phone || '' },
        };
    }
    async verifyPayment(schoolId, userId, dto) {
        const crypto = require('crypto');
        const body = dto.razorpay_order_id + '|' + dto.razorpay_payment_id;
        const expected = crypto
            .createHmac('sha256', this.configService.get('RAZORPAY_KEY_SECRET'))
            .update(body)
            .digest('hex');
        const txn = await this.txnRepo.findOne({
            where: { razorpay_order_id: dto.razorpay_order_id, school_id: schoolId, payable_type: 'event' },
        });
        if (!txn)
            throw new common_1.NotFoundException('Transaction not found');
        if (expected !== dto.razorpay_signature) {
            txn.status = 'failed';
            txn.failure_reason = 'Signature verification failed';
            await this.txnRepo.save(txn);
            if (txn.event_registration_id) {
                await this.regRepo.update({ id: txn.event_registration_id }, { payment_status: 'failed' });
            }
            throw new common_1.BadRequestException('Payment verification failed');
        }
        txn.razorpay_payment_id = dto.razorpay_payment_id;
        txn.razorpay_signature = dto.razorpay_signature;
        txn.status = 'success';
        await this.txnRepo.save(txn);
        const registration = await this.regRepo.findOne({ where: { id: txn.event_registration_id, school_id: schoolId } });
        if (registration) {
            registration.payment_status = 'paid';
            registration.status = 'registered';
            await this.regRepo.save(registration);
            const event = await this.eventRepo.findOne({ where: { id: registration.event_id } });
            if (event)
                await this.notifyRegistrationConfirmed(schoolId, event, userId);
        }
        return { message: 'Payment successful, registration confirmed', registration_id: txn.event_registration_id };
    }
    async myRegistrations(schoolId, userId) {
        return this.regRepo.query(`SELECT r.*, e.title, e.start_at, e.venue, e.category, e.is_paid, e.fee
       FROM event_registrations r
       JOIN events e ON e.id = r.event_id
       WHERE r.school_id = ? AND r.user_id = ?
       ORDER BY e.start_at DESC`, [schoolId, userId]);
    }
    async cancelRegistration(schoolId, userId, registrationId) {
        const registration = await this.regRepo.findOne({ where: { id: registrationId, school_id: schoolId } });
        if (!registration)
            throw new common_1.NotFoundException('Registration not found');
        if (registration.user_id !== userId)
            throw new common_1.ForbiddenException('Not your registration');
        registration.status = 'cancelled';
        await this.regRepo.save(registration);
        return { message: 'Registration cancelled' };
    }
    async notifyRegistrationConfirmed(schoolId, event, userId) {
        try {
            await this.notificationService.sendNotification(schoolId, userId, {
                title: `Registered: ${event.title}`,
                body: `Your registration for "${event.title}" is confirmed.`,
                channel: 'all',
                target_type: 'individual',
                target_user_ids: [userId],
            });
        }
        catch {
        }
    }
};
exports.EventService = EventService;
exports.EventService = EventService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(event_entity_1.EventEntity)),
    __param(1, (0, typeorm_1.InjectRepository)(event_registration_entity_1.EventRegistrationEntity)),
    __param(2, (0, typeorm_1.InjectRepository)(payment_transaction_entity_1.PaymentTransactionEntity)),
    __param(3, (0, typeorm_1.InjectRepository)(student_entity_1.StudentEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        config_1.ConfigService,
        notification_service_1.NotificationService])
], EventService);
//# sourceMappingURL=event.service.js.map