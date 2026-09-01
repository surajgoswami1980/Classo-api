import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClassEntity } from '../../entities/class.entity';
import { SectionEntity } from '../../entities/section.entity';

@Injectable()
export class SchoolService {
  constructor(
    @InjectRepository(ClassEntity)
    private classRepo: Repository<ClassEntity>,
    @InjectRepository(SectionEntity)
    private sectionRepo: Repository<SectionEntity>,
  ) {}

  async getClasses(schoolId: number) {
    return this.classRepo.find({
      where: { school_id: schoolId },
      order: { numeric_order: 'ASC', name: 'ASC' },
    });
  }

  async getSections(schoolId: number, classId: number) {
    return this.sectionRepo.find({
      where: { school_id: schoolId, class_id: classId },
      order: { name: 'ASC' },
    });
  }
}
