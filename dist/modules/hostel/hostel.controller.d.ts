import { HostelService } from './hostel.service';
import { CreateBlockDto, CreateRoomDto, AllocateRoomDto } from './dto/hostel.dto';
export declare class HostelController {
    private readonly hostelService;
    constructor(hostelService: HostelService);
    getMyHostel(schoolId: number, userId: number): Promise<{
        success: boolean;
        data: any;
    }>;
    listBlocks(schoolId: number): Promise<{
        success: boolean;
        data: any;
    }>;
    createBlock(schoolId: number, dto: CreateBlockDto): Promise<{
        success: boolean;
        data: import("../../entities/hostel-block.entity").HostelBlockEntity;
    }>;
    listRooms(schoolId: number, blockId?: number): Promise<{
        success: boolean;
        data: any;
    }>;
    createRoom(schoolId: number, dto: CreateRoomDto): Promise<{
        success: boolean;
        data: import("../../entities/hostel-room.entity").HostelRoomEntity;
    }>;
    listAllocations(schoolId: number, roomId?: number): Promise<{
        success: boolean;
        data: any;
    }>;
    allocate(schoolId: number, dto: AllocateRoomDto): Promise<{
        success: boolean;
        data: import("../../entities/hostel-allocation.entity").HostelAllocationEntity;
    }>;
    vacate(schoolId: number, id: number): Promise<{
        success: boolean;
        data: {
            message: string;
        };
    }>;
}
