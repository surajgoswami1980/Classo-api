export declare class CreateRouteDto {
    name: string;
    vehicle_id?: number;
    driver_name?: string;
    driver_phone?: string;
}
export declare class CreateStopDto {
    route_id: number;
    name: string;
    sequence_order: number;
    pickup_time?: string;
    drop_time?: string;
}
export declare class CreateVehicleDto {
    vehicle_number: string;
    capacity: number;
    vehicle_type?: 'bus' | 'van' | 'auto';
    insurance_expiry?: string;
    fitness_expiry?: string;
}
export declare class AssignStudentTransportDto {
    student_id: number;
    route_id: number;
    stop_id: number;
    academic_session_id: number;
}
