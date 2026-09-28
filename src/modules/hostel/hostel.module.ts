import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HostelController } from './hostel.controller';
import { HostelService } from './hostel.service';
import { HostelBlockEntity } from '../../entities/hostel-block.entity';
import { HostelRoomEntity } from '../../entities/hostel-room.entity';
import { HostelAllocationEntity } from '../../entities/hostel-allocation.entity';
import { StudentEntity } from '../../entities/student.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      HostelBlockEntity,
      HostelRoomEntity,
      HostelAllocationEntity,
      StudentEntity,
    ]),
  ],
  controllers: [HostelController],
  providers: [HostelService],
  exports: [HostelService],
})
export class HostelModule {}
