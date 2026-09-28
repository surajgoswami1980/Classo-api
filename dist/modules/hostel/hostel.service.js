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
exports.HostelService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const hostel_block_entity_1 = require("../../entities/hostel-block.entity");
const hostel_room_entity_1 = require("../../entities/hostel-room.entity");
const hostel_allocation_entity_1 = require("../../entities/hostel-allocation.entity");
const student_entity_1 = require("../../entities/student.entity");
let HostelService = class HostelService {
    constructor(blockRepo, roomRepo, allocRepo, studentRepo) {
        this.blockRepo = blockRepo;
        this.roomRepo = roomRepo;
        this.allocRepo = allocRepo;
        this.studentRepo = studentRepo;
    }
    async listBlocks(schoolId) {
        return this.blockRepo.query(`SELECT b.*,
              (SELECT COUNT(*) FROM hostel_rooms r WHERE r.block_id = b.id) AS room_count,
              (SELECT COUNT(*) FROM hostel_allocations a
                 JOIN hostel_rooms r2 ON r2.id = a.room_id
                 WHERE r2.block_id = b.id AND a.status = 'active') AS occupied
       FROM hostel_blocks b
       WHERE b.school_id = ?
       ORDER BY b.name`, [schoolId]);
    }
    async createBlock(schoolId, dto) {
        return this.blockRepo.save(this.blockRepo.create({
            school_id: schoolId,
            name: dto.name,
            type: dto.type || 'boys',
            warden_name: dto.warden_name,
            warden_phone: dto.warden_phone,
            address: dto.address,
            is_active: 1,
        }));
    }
    async listRooms(schoolId, blockId) {
        const params = [schoolId];
        let where = 'r.school_id = ?';
        if (blockId) {
            where += ' AND r.block_id = ?';
            params.push(blockId);
        }
        return this.roomRepo.query(`SELECT r.*, b.name AS block_name,
              (SELECT COUNT(*) FROM hostel_allocations a WHERE a.room_id = r.id AND a.status = 'active') AS occupied
       FROM hostel_rooms r
       JOIN hostel_blocks b ON b.id = r.block_id
       WHERE ${where}
       ORDER BY b.name, r.room_number`, params);
    }
    async createRoom(schoolId, dto) {
        const block = await this.blockRepo.findOne({ where: { id: dto.block_id, school_id: schoolId } });
        if (!block)
            throw new common_1.BadRequestException('Invalid block for this school');
        return this.roomRepo.save(this.roomRepo.create({
            school_id: schoolId,
            block_id: dto.block_id,
            room_number: dto.room_number,
            room_type: dto.room_type || 'double',
            capacity: dto.capacity ?? 2,
            fee_per_month: dto.fee_per_month ?? 0,
            is_active: 1,
        }));
    }
    async allocate(schoolId, dto) {
        const room = await this.roomRepo.findOne({ where: { id: dto.room_id, school_id: schoolId } });
        if (!room)
            throw new common_1.NotFoundException('Room not found');
        const student = await this.studentRepo.findOne({ where: { id: dto.student_id, school_id: schoolId } });
        if (!student)
            throw new common_1.BadRequestException('Invalid student for this school');
        const occupied = await this.allocRepo.count({ where: { room_id: dto.room_id, status: 'active' } });
        if (occupied >= room.capacity)
            throw new common_1.BadRequestException('Room is at full capacity');
        const existing = await this.allocRepo.findOne({ where: { student_id: dto.student_id, status: 'active' } });
        if (existing)
            throw new common_1.BadRequestException('Student already has an active hostel allocation');
        return this.allocRepo.save(this.allocRepo.create({
            school_id: schoolId,
            room_id: dto.room_id,
            student_id: dto.student_id,
            allocated_from: (dto.allocated_from || new Date().toISOString().slice(0, 10)),
            status: 'active',
        }));
    }
    async vacate(schoolId, allocationId) {
        const alloc = await this.allocRepo.findOne({ where: { id: allocationId, school_id: schoolId } });
        if (!alloc)
            throw new common_1.NotFoundException('Allocation not found');
        alloc.status = 'vacated';
        alloc.vacated_on = new Date().toISOString().slice(0, 10);
        await this.allocRepo.save(alloc);
        return { message: 'Room vacated' };
    }
    async listAllocations(schoolId, roomId) {
        const params = [schoolId];
        let where = 'a.school_id = ? AND a.status = \'active\'';
        if (roomId) {
            where += ' AND a.room_id = ?';
            params.push(roomId);
        }
        return this.allocRepo.query(`SELECT a.*, u.name AS student_name, s.roll_number, s.admission_number,
              r.room_number, b.name AS block_name
       FROM hostel_allocations a
       JOIN students s ON s.id = a.student_id
       JOIN users u ON u.id = s.user_id
       JOIN hostel_rooms r ON r.id = a.room_id
       JOIN hostel_blocks b ON b.id = r.block_id
       WHERE ${where}
       ORDER BY b.name, r.room_number`, params);
    }
    async getMyHostel(schoolId, userId) {
        const student = await this.studentRepo.findOne({ where: { school_id: schoolId, user_id: userId } });
        if (!student)
            return null;
        const rows = await this.allocRepo.query(`SELECT a.*, r.room_number, r.room_type, r.fee_per_month,
              b.name AS block_name, b.warden_name, b.warden_phone
       FROM hostel_allocations a
       JOIN hostel_rooms r ON r.id = a.room_id
       JOIN hostel_blocks b ON b.id = r.block_id
       WHERE a.school_id = ? AND a.student_id = ? AND a.status = 'active'
       ORDER BY a.id DESC LIMIT 1`, [schoolId, student.id]);
        return rows[0] || null;
    }
};
exports.HostelService = HostelService;
exports.HostelService = HostelService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(hostel_block_entity_1.HostelBlockEntity)),
    __param(1, (0, typeorm_1.InjectRepository)(hostel_room_entity_1.HostelRoomEntity)),
    __param(2, (0, typeorm_1.InjectRepository)(hostel_allocation_entity_1.HostelAllocationEntity)),
    __param(3, (0, typeorm_1.InjectRepository)(student_entity_1.StudentEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], HostelService);
//# sourceMappingURL=hostel.service.js.map