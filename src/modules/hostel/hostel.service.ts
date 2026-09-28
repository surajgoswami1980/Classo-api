import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HostelBlockEntity } from '../../entities/hostel-block.entity';
import { HostelRoomEntity } from '../../entities/hostel-room.entity';
import { HostelAllocationEntity } from '../../entities/hostel-allocation.entity';
import { StudentEntity } from '../../entities/student.entity';
import { CreateBlockDto, CreateRoomDto, AllocateRoomDto } from './dto/hostel.dto';

@Injectable()
export class HostelService {
  constructor(
    @InjectRepository(HostelBlockEntity) private blockRepo: Repository<HostelBlockEntity>,
    @InjectRepository(HostelRoomEntity) private roomRepo: Repository<HostelRoomEntity>,
    @InjectRepository(HostelAllocationEntity) private allocRepo: Repository<HostelAllocationEntity>,
    @InjectRepository(StudentEntity) private studentRepo: Repository<StudentEntity>,
  ) {}

  // ─── Blocks ──────────────────────────────────────────────────

  async listBlocks(schoolId: number) {
    return this.blockRepo.query(
      `SELECT b.*,
              (SELECT COUNT(*) FROM hostel_rooms r WHERE r.block_id = b.id) AS room_count,
              (SELECT COUNT(*) FROM hostel_allocations a
                 JOIN hostel_rooms r2 ON r2.id = a.room_id
                 WHERE r2.block_id = b.id AND a.status = 'active') AS occupied
       FROM hostel_blocks b
       WHERE b.school_id = ?
       ORDER BY b.name`,
      [schoolId],
    );
  }

  async createBlock(schoolId: number, dto: CreateBlockDto) {
    return this.blockRepo.save(
      this.blockRepo.create({
        school_id: schoolId,
        name: dto.name,
        type: dto.type || 'boys',
        warden_name: dto.warden_name,
        warden_phone: dto.warden_phone,
        address: dto.address,
        is_active: 1,
      }),
    );
  }

  // ─── Rooms ───────────────────────────────────────────────────

  async listRooms(schoolId: number, blockId?: number) {
    const params: any[] = [schoolId];
    let where = 'r.school_id = ?';
    if (blockId) { where += ' AND r.block_id = ?'; params.push(blockId); }

    return this.roomRepo.query(
      `SELECT r.*, b.name AS block_name,
              (SELECT COUNT(*) FROM hostel_allocations a WHERE a.room_id = r.id AND a.status = 'active') AS occupied
       FROM hostel_rooms r
       JOIN hostel_blocks b ON b.id = r.block_id
       WHERE ${where}
       ORDER BY b.name, r.room_number`,
      params,
    );
  }

  async createRoom(schoolId: number, dto: CreateRoomDto) {
    const block = await this.blockRepo.findOne({ where: { id: dto.block_id, school_id: schoolId } });
    if (!block) throw new BadRequestException('Invalid block for this school');

    return this.roomRepo.save(
      this.roomRepo.create({
        school_id: schoolId,
        block_id: dto.block_id,
        room_number: dto.room_number,
        room_type: dto.room_type || 'double',
        capacity: dto.capacity ?? 2,
        fee_per_month: dto.fee_per_month ?? 0,
        is_active: 1,
      }),
    );
  }

  // ─── Allocations ─────────────────────────────────────────────

  async allocate(schoolId: number, dto: AllocateRoomDto) {
    const room = await this.roomRepo.findOne({ where: { id: dto.room_id, school_id: schoolId } });
    if (!room) throw new NotFoundException('Room not found');

    const student = await this.studentRepo.findOne({ where: { id: dto.student_id, school_id: schoolId } });
    if (!student) throw new BadRequestException('Invalid student for this school');

    const occupied = await this.allocRepo.count({ where: { room_id: dto.room_id, status: 'active' } });
    if (occupied >= room.capacity) throw new BadRequestException('Room is at full capacity');

    // A student can only have one active allocation at a time.
    const existing = await this.allocRepo.findOne({ where: { student_id: dto.student_id, status: 'active' } });
    if (existing) throw new BadRequestException('Student already has an active hostel allocation');

    return this.allocRepo.save(
      this.allocRepo.create({
        school_id: schoolId,
        room_id: dto.room_id,
        student_id: dto.student_id,
        allocated_from: (dto.allocated_from || new Date().toISOString().slice(0, 10)) as any,
        status: 'active',
      }),
    );
  }

  async vacate(schoolId: number, allocationId: number) {
    const alloc = await this.allocRepo.findOne({ where: { id: allocationId, school_id: schoolId } });
    if (!alloc) throw new NotFoundException('Allocation not found');

    alloc.status = 'vacated';
    alloc.vacated_on = new Date().toISOString().slice(0, 10) as any;
    await this.allocRepo.save(alloc);
    return { message: 'Room vacated' };
  }

  async listAllocations(schoolId: number, roomId?: number) {
    const params: any[] = [schoolId];
    let where = 'a.school_id = ? AND a.status = \'active\'';
    if (roomId) { where += ' AND a.room_id = ?'; params.push(roomId); }

    return this.allocRepo.query(
      `SELECT a.*, u.name AS student_name, s.roll_number, s.admission_number,
              r.room_number, b.name AS block_name
       FROM hostel_allocations a
       JOIN students s ON s.id = a.student_id
       JOIN users u ON u.id = s.user_id
       JOIN hostel_rooms r ON r.id = a.room_id
       JOIN hostel_blocks b ON b.id = r.block_id
       WHERE ${where}
       ORDER BY b.name, r.room_number`,
      params,
    );
  }

  /**
   * A student's own hostel allocation (for the student web app).
   */
  async getMyHostel(schoolId: number, userId: number) {
    const student = await this.studentRepo.findOne({ where: { school_id: schoolId, user_id: userId } });
    if (!student) return null;

    const rows = await this.allocRepo.query(
      `SELECT a.*, r.room_number, r.room_type, r.fee_per_month,
              b.name AS block_name, b.warden_name, b.warden_phone
       FROM hostel_allocations a
       JOIN hostel_rooms r ON r.id = a.room_id
       JOIN hostel_blocks b ON b.id = r.block_id
       WHERE a.school_id = ? AND a.student_id = ? AND a.status = 'active'
       ORDER BY a.id DESC LIMIT 1`,
      [schoolId, student.id],
    );
    return rows[0] || null;
  }
}
