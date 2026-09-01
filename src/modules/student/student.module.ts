import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudentController } from './student.controller';
import { StudentService } from './student.service';
import { StudentEntity } from '../../entities/student.entity';
import { UserEntity } from '../../entities/user.entity';
import { ClassEntity } from '../../entities/class.entity';
import { SectionEntity } from '../../entities/section.entity';
import { SpatieRoleService } from '../../common/providers/spatie-role.service';

@Module({
  imports: [TypeOrmModule.forFeature([StudentEntity, UserEntity, ClassEntity, SectionEntity])],
  controllers: [StudentController],
  providers: [StudentService, SpatieRoleService],
  exports: [StudentService],
})
export class StudentModule {}
