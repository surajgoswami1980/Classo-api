import { Repository } from 'typeorm';
import { HostelBlockEntity } from '../../entities/hostel-block.entity';
import { HostelRoomEntity } from '../../entities/hostel-room.entity';
import { HostelAllocationEntity } from '../../entities/hostel-allocation.entity';
import { StudentEntity } from '../../entities/student.entity';
import { CreateBlockDto, CreateRoomDto, AllocateRoomDto } from './dto/hostel.dto';
export declare class HostelService {
    private blockRepo;
    private roomRepo;
    private allocRepo;
    private studentRepo;
    constructor(blockRepo: Repository<HostelBlockEntity>, roomRepo: Repository<HostelRoomEntity>, allocRepo: Repository<HostelAllocationEntity>, studentRepo: Repository<StudentEntity>);
    listBlocks(schoolId: number): Promise<any>;
    createBlock(schoolId: number, dto: CreateBlockDto): Promise<HostelBlockEntity>;
    listRooms(schoolId: number, blockId?: number): Promise<any>;
    createRoom(schoolId: number, dto: CreateRoomDto): Promise<HostelRoomEntity>;
    allocate(schoolId: number, dto: AllocateRoomDto): Promise<HostelAllocationEntity>;
    vacate(schoolId: number, allocationId: number): Promise<{
        message: string;
    }>;
    listAllocations(schoolId: number, roomId?: number): Promise<any>;
    getMyHostel(schoolId: number, userId: number): Promise<any>;
}
