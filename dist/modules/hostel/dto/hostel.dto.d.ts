export declare class CreateBlockDto {
    name: string;
    type?: 'boys' | 'girls' | 'mixed';
    warden_name?: string;
    warden_phone?: string;
    address?: string;
}
export declare class CreateRoomDto {
    block_id: number;
    room_number: string;
    room_type?: 'single' | 'double' | 'triple' | 'dormitory';
    capacity?: number;
    fee_per_month?: number;
}
export declare class AllocateRoomDto {
    room_id: number;
    student_id: number;
    allocated_from?: string;
}
