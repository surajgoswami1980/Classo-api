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
exports.TransportService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const transport_route_entity_1 = require("../../entities/transport-route.entity");
const transport_stop_entity_1 = require("../../entities/transport-stop.entity");
const vehicle_entity_1 = require("../../entities/vehicle.entity");
const student_transport_entity_1 = require("../../entities/student-transport.entity");
const student_entity_1 = require("../../entities/student.entity");
let TransportService = class TransportService {
    constructor(routeRepo, stopRepo, vehicleRepo, studentTransportRepo, studentRepo) {
        this.routeRepo = routeRepo;
        this.stopRepo = stopRepo;
        this.vehicleRepo = vehicleRepo;
        this.studentTransportRepo = studentTransportRepo;
        this.studentRepo = studentRepo;
    }
    async getMyTransport(schoolId, userId) {
        const student = await this.studentRepo.findOne({ where: { school_id: schoolId, user_id: userId } });
        if (!student)
            return null;
        const rows = await this.routeRepo.query(`SELECT st.id as assignment_id, r.id as route_id, r.name as route_name,
              r.driver_name, r.driver_phone,
              v.vehicle_number, v.vehicle_type, v.capacity,
              ts.name as stop_name, ts.pickup_time, ts.drop_time
       FROM student_transport st
       JOIN transport_routes r ON r.id = st.route_id
       JOIN transport_stops ts ON ts.id = st.stop_id
       LEFT JOIN vehicles v ON v.id = r.vehicle_id
       WHERE st.school_id = ? AND st.student_id = ?
       ORDER BY st.id DESC LIMIT 1`, [schoolId, student.id]);
        return rows[0] || null;
    }
    async listRoutes(schoolId) {
        return this.routeRepo.query(`SELECT r.*, v.vehicle_number, v.capacity,
              (SELECT COUNT(*) FROM student_transport st WHERE st.route_id = r.id) as student_count,
              (SELECT COUNT(*) FROM transport_stops ts WHERE ts.route_id = r.id) as stop_count
       FROM transport_routes r
       LEFT JOIN vehicles v ON v.id = r.vehicle_id
       WHERE r.school_id = ?
       ORDER BY r.name`, [schoolId]);
    }
    async createRoute(schoolId, dto) {
        if (dto.vehicle_id) {
            const vehicle = await this.vehicleRepo.findOne({ where: { id: dto.vehicle_id, school_id: schoolId } });
            if (!vehicle)
                throw new common_1.BadRequestException('Invalid vehicle for this school');
        }
        return this.routeRepo.save(this.routeRepo.create({
            school_id: schoolId,
            name: dto.name,
            vehicle_id: dto.vehicle_id,
            driver_name: dto.driver_name,
            driver_phone: dto.driver_phone,
            is_active: 1,
        }));
    }
    async addStop(schoolId, dto) {
        const route = await this.routeRepo.findOne({ where: { id: dto.route_id, school_id: schoolId } });
        if (!route)
            throw new common_1.NotFoundException('Route not found');
        return this.stopRepo.save(this.stopRepo.create({
            school_id: schoolId,
            route_id: dto.route_id,
            name: dto.name,
            sequence_order: dto.sequence_order,
            pickup_time: dto.pickup_time,
            drop_time: dto.drop_time,
        }));
    }
    async listStops(schoolId, routeId) {
        return this.stopRepo.find({ where: { school_id: schoolId, route_id: routeId }, order: { sequence_order: 'ASC' } });
    }
    async listVehicles(schoolId) {
        return this.vehicleRepo.find({ where: { school_id: schoolId }, order: { vehicle_number: 'ASC' } });
    }
    async createVehicle(schoolId, dto) {
        const existing = await this.vehicleRepo.findOne({ where: { school_id: schoolId, vehicle_number: dto.vehicle_number } });
        if (existing)
            throw new common_1.ConflictException('A vehicle with this number already exists');
        return this.vehicleRepo.save(this.vehicleRepo.create({
            school_id: schoolId,
            vehicle_number: dto.vehicle_number,
            capacity: dto.capacity,
            vehicle_type: dto.vehicle_type || 'bus',
            insurance_expiry: dto.insurance_expiry,
            fitness_expiry: dto.fitness_expiry,
            is_active: 1,
        }));
    }
    async getExpiringDocuments(schoolId, days = 30) {
        return this.vehicleRepo.query(`SELECT id, vehicle_number, insurance_expiry, fitness_expiry
       FROM vehicles
       WHERE school_id = ? AND is_active = 1
         AND (
           (insurance_expiry IS NOT NULL AND insurance_expiry BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL ? DAY))
           OR (fitness_expiry IS NOT NULL AND fitness_expiry BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL ? DAY))
         )`, [schoolId, days, days]);
    }
    async assignStudent(schoolId, dto) {
        const route = await this.routeRepo.findOne({ where: { id: dto.route_id, school_id: schoolId } });
        if (!route)
            throw new common_1.NotFoundException('Route not found');
        const stop = await this.stopRepo.findOne({ where: { id: dto.stop_id, school_id: schoolId, route_id: dto.route_id } });
        if (!stop)
            throw new common_1.BadRequestException('Invalid stop for this route');
        if (route.vehicle_id) {
            const vehicle = await this.vehicleRepo.findOne({ where: { id: route.vehicle_id } });
            const currentCount = await this.studentTransportRepo.count({ where: { route_id: dto.route_id, academic_session_id: dto.academic_session_id } });
            if (vehicle && currentCount >= vehicle.capacity) {
                throw new common_1.BadRequestException('This route\'s vehicle is at full capacity');
            }
        }
        const existing = await this.studentTransportRepo.findOne({
            where: { student_id: dto.student_id, academic_session_id: dto.academic_session_id },
        });
        if (existing) {
            existing.route_id = dto.route_id;
            existing.stop_id = dto.stop_id;
            return this.studentTransportRepo.save(existing);
        }
        return this.studentTransportRepo.save(this.studentTransportRepo.create({
            school_id: schoolId,
            student_id: dto.student_id,
            route_id: dto.route_id,
            stop_id: dto.stop_id,
            academic_session_id: dto.academic_session_id,
        }));
    }
};
exports.TransportService = TransportService;
exports.TransportService = TransportService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(transport_route_entity_1.TransportRouteEntity)),
    __param(1, (0, typeorm_1.InjectRepository)(transport_stop_entity_1.TransportStopEntity)),
    __param(2, (0, typeorm_1.InjectRepository)(vehicle_entity_1.VehicleEntity)),
    __param(3, (0, typeorm_1.InjectRepository)(student_transport_entity_1.StudentTransportEntity)),
    __param(4, (0, typeorm_1.InjectRepository)(student_entity_1.StudentEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], TransportService);
//# sourceMappingURL=transport.service.js.map