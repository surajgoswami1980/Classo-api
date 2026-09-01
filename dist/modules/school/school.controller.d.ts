import { SchoolService } from './school.service';
export declare class SchoolController {
    private readonly schoolService;
    constructor(schoolService: SchoolService);
    getClasses(schoolId: number): Promise<{
        success: boolean;
        data: import("../../entities/class.entity").ClassEntity[];
    }>;
    getSections(schoolId: number, classId: number): Promise<{
        success: boolean;
        data: import("../../entities/section.entity").SectionEntity[];
    }>;
}
