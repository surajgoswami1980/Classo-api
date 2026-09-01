import { Repository } from 'typeorm';
import { ClassEntity } from '../../entities/class.entity';
import { SectionEntity } from '../../entities/section.entity';
export declare class SchoolService {
    private classRepo;
    private sectionRepo;
    constructor(classRepo: Repository<ClassEntity>, sectionRepo: Repository<SectionEntity>);
    getClasses(schoolId: number): Promise<ClassEntity[]>;
    getSections(schoolId: number, classId: number): Promise<SectionEntity[]>;
}
