import { Injectable, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TransportRouteEntity } from '../../entities/transport-route.entity';
import { TransportStopEntity } from '../../entities/transport-stop.entity';
import { VehicleEntity } from '../../entities/vehicle.entity';
import { StudentTransportEntity } from '../../entities/student-transport.entity';
import { StudentEntity } from '../../entities/student.entity';
import { CreateRouteDto, CreateStopDto, CreateVehicleDto, AssignStudentTransportDto } from './dto/transport.dto';

@Injectable()
export class TransportService {
  constructor(
    @InjectRepository(TransportRouteEntity) private routeRepo: Repository<TransportRouteEntity>,
    @InjectRepository(TransportStopEntity) private stopRepo: Repository<TransportStopEntity>,
    @InjectRepository(VehicleEntity) private vehicleRepo: Repository<VehicleEntity>,
    @InjectRepository(StudentTransportEntity) private studentTransportRepo: Repository<StudentTransportEntity>,
    @InjectRepository(StudentEntity) private studentRepo: Repository<StudentEntity>,
  ) {}

  /**
   * A student's own transport assignment — route, stop, driver, vehicle.
   */
  async getMyTransport(schoolId: number, userId: number) {
    const student = await this.studentRepo.findOne({ where: { school_id: schoolId, user_id: userId } });
    if (!student) return null;

    const rows = await this.routeRepo.query(
      `SELECT st.id as assignment_id, r.id as route_id, r.name as route_name,
              -- prefer the crew configured on the vehicle, fall back to the route
              COALESCE(v.driver_name, r.driver_name) as driver_name,
              COALESCE(v.driver_phone, r.driver_phone) as driver_phone,
              v.conductor_name, v.conductor_phone,
              v.vehicle_number, v.vehicle_type, v.capacity,
              ts.name as stop_name, ts.pickup_time, ts.drop_time
       FROM student_transport st
       JOIN transport_routes r ON r.id = st.route_id
       JOIN transport_stops ts ON ts.id = st.stop_id
       LEFT JOIN vehicles v ON v.id = r.vehicle_id
       WHERE st.school_id = ? AND st.student_id = ?
       ORDER BY st.id DESC LIMIT 1`,
      [schoolId, student.id],
    );

    return rows[0] || null;
  }

  /**
   * Routes with their vehicle info, stop count, and current student count
   * (to help admins spot overcrowded routes against vehicle capacity).
   */
  async listRoutes(schoolId: number) {
    return this.routeRepo.query(
      `SELECT r.*, v.vehicle_number, v.capacity,
              (SELECT COUNT(*) FROM student_transport st WHERE st.route_id = r.id) as student_count,
              (SELECT COUNT(*) FROM transport_stops ts WHERE ts.route_id = r.id) as stop_count
       FROM transport_routes r
       LEFT JOIN vehicles v ON v.id = r.vehicle_id
       WHERE r.school_id = ?
       ORDER BY r.name`,
      [schoolId],
    );
  }

  async createRoute(schoolId: number, dto: CreateRouteDto) {
    if (dto.vehicle_id) {
      const vehicle = await this.vehicleRepo.findOne({ where: { id: dto.vehicle_id, school_id: schoolId } });
      if (!vehicle) throw new BadRequestException('Invalid vehicle for this school');
    }
    return this.routeRepo.save(
      this.routeRepo.create({
        school_id: schoolId,
        name: dto.name,
        vehicle_id: dto.vehicle_id,
        driver_name: dto.driver_name,
        driver_phone: dto.driver_phone,
        is_active: 1,
      }),
    );
  }

  async addStop(schoolId: number, dto: CreateStopDto) {
    const route = await this.routeRepo.findOne({ where: { id: dto.route_id, school_id: schoolId } });
    if (!route) throw new NotFoundException('Route not found');

    return this.stopRepo.save(
      this.stopRepo.create({
        school_id: schoolId,
        route_id: dto.route_id,
        name: dto.name,
        sequence_order: dto.sequence_order,
        pickup_time: dto.pickup_time,
        drop_time: dto.drop_time,
      }),
    );
  }

  async listStops(schoolId: number, routeId: number) {
    return this.stopRepo.find({ where: { school_id: schoolId, route_id: routeId }, order: { sequence_order: 'ASC' } });
  }

  async listVehicles(schoolId: number) {
    return this.vehicleRepo.find({ where: { school_id: schoolId }, order: { vehicle_number: 'ASC' } });
  }

  async createVehicle(schoolId: number, dto: CreateVehicleDto) {
    const existing = await this.vehicleRepo.findOne({ where: { school_id: schoolId, vehicle_number: dto.vehicle_number } });
    if (existing) throw new ConflictException('A vehicle with this number already exists');

    return this.vehicleRepo.save(
      this.vehicleRepo.create({
        school_id: schoolId,
        vehicle_number: dto.vehicle_number,
        capacity: dto.capacity,
        vehicle_type: dto.vehicle_type || 'bus',
        driver_name: dto.driver_name,
        driver_phone: dto.driver_phone,
        conductor_name: dto.conductor_name,
        conductor_phone: dto.conductor_phone,
        insurance_expiry: dto.insurance_expiry as any,
        fitness_expiry: dto.fitness_expiry as any,
        is_active: 1,
      }),
    );
  }

  /**
   * Vehicles whose insurance or fitness certificate expires within the
   * given window (default 30 days) — for the admin alert requirement.
   */
  async getExpiringDocuments(schoolId: number, days = 30) {
    return this.vehicleRepo.query(
      `SELECT id, vehicle_number, insurance_expiry, fitness_expiry
       FROM vehicles
       WHERE school_id = ? AND is_active = 1
         AND (
           (insurance_expiry IS NOT NULL AND insurance_expiry BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL ? DAY))
           OR (fitness_expiry IS NOT NULL AND fitness_expiry BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL ? DAY))
         )`,
      [schoolId, days, days],
    );
  }

  /**
   * Assign a student to a route/stop for an academic session. Rejects if
   * the route's vehicle is already at capacity.
   */
  async assignStudent(schoolId: number, dto: AssignStudentTransportDto) {
    const route = await this.routeRepo.findOne({ where: { id: dto.route_id, school_id: schoolId } });
    if (!route) throw new NotFoundException('Route not found');

    const stop = await this.stopRepo.findOne({ where: { id: dto.stop_id, school_id: schoolId, route_id: dto.route_id } });
    if (!stop) throw new BadRequestException('Invalid stop for this route');

    if (route.vehicle_id) {
      const vehicle = await this.vehicleRepo.findOne({ where: { id: route.vehicle_id } });
      const currentCount = await this.studentTransportRepo.count({ where: { route_id: dto.route_id, academic_session_id: dto.academic_session_id } });
      if (vehicle && currentCount >= vehicle.capacity) {
        throw new BadRequestException('This route\'s vehicle is at full capacity');
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

    return this.studentTransportRepo.save(
      this.studentTransportRepo.create({
        school_id: schoolId,
        student_id: dto.student_id,
        route_id: dto.route_id,
        stop_id: dto.stop_id,
        academic_session_id: dto.academic_session_id,
      }),
    );
  }
}
