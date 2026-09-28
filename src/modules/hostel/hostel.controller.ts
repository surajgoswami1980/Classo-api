import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Roles, UserRole } from '../../common/decorators/roles.decorator';
import { RequirePermissions, Permission } from '../../common/decorators/permissions.decorator';
import { SchoolId } from '../../common/decorators/school-id.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { HostelService } from './hostel.service';
import { CreateBlockDto, CreateRoomDto, AllocateRoomDto } from './dto/hostel.dto';

@ApiTags('Hostel')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('hostel')
export class HostelController {
  constructor(private readonly hostelService: HostelService) {}

  // ─── Student ─────────────────────────────────────────────────

  @Get('my')
  @Roles(UserRole.STUDENT, UserRole.PARENT)
  @ApiOperation({ summary: "A student's own hostel allocation" })
  async getMyHostel(@SchoolId() schoolId: number, @CurrentUser('user_id') userId: number) {
    const result = await this.hostelService.getMyHostel(schoolId, userId);
    return { success: true, data: result };
  }

  // ─── Blocks ──────────────────────────────────────────────────

  @Get('block/list')
  @RequirePermissions(Permission.HOSTEL_VIEW)
  @ApiOperation({ summary: 'List hostel blocks with occupancy' })
  async listBlocks(@SchoolId() schoolId: number) {
    const result = await this.hostelService.listBlocks(schoolId);
    return { success: true, data: result };
  }

  @Post('block/create')
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.SUB_ADMIN)
  @RequirePermissions(Permission.HOSTEL_MANAGE)
  @ApiOperation({ summary: 'Create a hostel block' })
  async createBlock(@SchoolId() schoolId: number, @Body() dto: CreateBlockDto) {
    const result = await this.hostelService.createBlock(schoolId, dto);
    return { success: true, data: result };
  }

  // ─── Rooms ───────────────────────────────────────────────────

  @Get('room/list')
  @RequirePermissions(Permission.HOSTEL_VIEW)
  @ApiOperation({ summary: 'List hostel rooms with occupancy' })
  async listRooms(@SchoolId() schoolId: number, @Query('block_id') blockId?: number) {
    const result = await this.hostelService.listRooms(schoolId, blockId ? Number(blockId) : undefined);
    return { success: true, data: result };
  }

  @Post('room/create')
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.SUB_ADMIN)
  @RequirePermissions(Permission.HOSTEL_MANAGE)
  @ApiOperation({ summary: 'Create a hostel room' })
  async createRoom(@SchoolId() schoolId: number, @Body() dto: CreateRoomDto) {
    const result = await this.hostelService.createRoom(schoolId, dto);
    return { success: true, data: result };
  }

  // ─── Allocations ─────────────────────────────────────────────

  @Get('allocation/list')
  @RequirePermissions(Permission.HOSTEL_VIEW)
  @ApiOperation({ summary: 'List active allocations' })
  async listAllocations(@SchoolId() schoolId: number, @Query('room_id') roomId?: number) {
    const result = await this.hostelService.listAllocations(schoolId, roomId ? Number(roomId) : undefined);
    return { success: true, data: result };
  }

  @Post('allocation/create')
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.SUB_ADMIN)
  @RequirePermissions(Permission.HOSTEL_MANAGE)
  @ApiOperation({ summary: 'Allocate a student to a room' })
  async allocate(@SchoolId() schoolId: number, @Body() dto: AllocateRoomDto) {
    const result = await this.hostelService.allocate(schoolId, dto);
    return { success: true, data: result };
  }

  @Delete('allocation/:id')
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.SUB_ADMIN)
  @RequirePermissions(Permission.HOSTEL_MANAGE)
  @ApiOperation({ summary: 'Vacate an allocation' })
  async vacate(@SchoolId() schoolId: number, @Param('id') id: number) {
    const result = await this.hostelService.vacate(schoolId, id);
    return { success: true, data: result };
  }
}
