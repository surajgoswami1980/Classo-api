import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SuperAdminController } from './super-admin.controller';
import { SuperAdminService } from './super-admin.service';
import { SchoolEntity } from '../../entities/school.entity';
import { UserEntity } from '../../entities/user.entity';
import { SpatieRoleService } from '../../common/providers/spatie-role.service';

@Module({
  imports: [TypeOrmModule.forFeature([SchoolEntity, UserEntity])],
  controllers: [SuperAdminController],
  providers: [SuperAdminService, SpatieRoleService],
  exports: [SuperAdminService],
})
export class SuperAdminModule {}
