import { TransportService } from './transport.service';
import { CreateRouteDto, CreateStopDto, CreateVehicleDto, AssignStudentTransportDto } from './dto/transport.dto';
export declare class TransportController {
    private readonly transportService;
    constructor(transportService: TransportService);
    getMyTransport(schoolId: number, userId: number): Promise<{
        success: boolean;
        data: any;
    }>;
    listRoutes(schoolId: number): Promise<{
        success: boolean;
        data: any;
    }>;
    createRoute(dto: CreateRouteDto, schoolId: number): Promise<{
        success: boolean;
        data: import("../../entities/transport-route.entity").TransportRouteEntity;
    }>;
    addStop(dto: CreateStopDto, schoolId: number): Promise<{
        success: boolean;
        data: import("../../entities/transport-stop.entity").TransportStopEntity;
    }>;
    listStops(routeId: number, schoolId: number): Promise<{
        success: boolean;
        data: import("../../entities/transport-stop.entity").TransportStopEntity[];
    }>;
    listVehicles(schoolId: number): Promise<{
        success: boolean;
        data: import("../../entities/vehicle.entity").VehicleEntity[];
    }>;
    createVehicle(dto: CreateVehicleDto, schoolId: number): Promise<{
        success: boolean;
        data: import("../../entities/vehicle.entity").VehicleEntity;
    }>;
    getExpiringDocuments(days: number, schoolId: number): Promise<{
        success: boolean;
        data: any;
    }>;
    assignStudent(dto: AssignStudentTransportDto, schoolId: number): Promise<{
        success: boolean;
        data: import("../../entities/student-transport.entity").StudentTransportEntity;
    }>;
}
