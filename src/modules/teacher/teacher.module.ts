import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TeacherController } from './teacher.controller';
import { TeacherService } from './teacher.service';
import { TeacherEntity } from '../../entities/teacher.entity';
import { UserEntity } from '../../entities/user.entity';
import { SpatieRoleService } from '../../common/providers/spatie-role.service';

@Module({
  imports: [TypeOrmModule.forFeature([TeacherEntity, UserEntity])],
  controllers: [TeacherController],
  providers: [TeacherService, SpatieRoleService],
  exports: [TeacherService],
})
export class TeacherModule {}
