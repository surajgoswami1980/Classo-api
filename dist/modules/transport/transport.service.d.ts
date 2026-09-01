import { Repository } from 'typeorm';
import { TransportRouteEntity } from '../../entities/transport-route.entity';
import { TransportStopEntity } from '../../entities/transport-stop.entity';
import { VehicleEntity } from '../../entities/vehicle.entity';
import { StudentTransportEntity } from '../../entities/student-transport.entity';
import { StudentEntity } from '../../entities/student.entity';
import { CreateRouteDto, CreateStopDto, CreateVehicleDto, AssignStudentTransportDto } from './dto/transport.dto';
export declare class TransportService {
    private routeRepo;
    private stopRepo;
    private vehicleRepo;
    private studentTransportRepo;
    private studentRepo;
    constructor(routeRepo: Repository<TransportRouteEntity>, stopRepo: Repository<TransportStopEntity>, vehicleRepo: Repository<VehicleEntity>, studentTransportRepo: Repository<StudentTransportEntity>, studentRepo: Repository<StudentEntity>);
    getMyTransport(schoolId: number, userId: number): Promise<any>;
    listRoutes(schoolId: number): Promise<any>;
    createRoute(schoolId: number, dto: CreateRouteDto): Promise<TransportRouteEntity>;
    addStop(schoolId: number, dto: CreateStopDto): Promise<TransportStopEntity>;
    listStops(schoolId: number, routeId: number): Promise<TransportStopEntity[]>;
    listVehicles(schoolId: number): Promise<VehicleEntity[]>;
    createVehicle(schoolId: number, dto: CreateVehicleDto): Promise<VehicleEntity>;
    getExpiringDocuments(schoolId: number, days?: number): Promise<any>;
    assignStudent(schoolId: number, dto: AssignStudentTransportDto): Promise<StudentTransportEntity>;
}
