"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnterMarksDto = exports.CreateExamDto = exports.ExamService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const exam_entity_1 = require("../../entities/exam.entity");
const student_marks_entity_1 = require("../../entities/student-marks.entity");
const student_entity_1 = require("../../entities/student.entity");
const subject_entity_1 = require("../../entities/subject.entity");
const redis_service_1 = require("../../common/providers/redis.service");
let ExamService = class ExamService {
    constructor(examRepo, marksRepo, studentRepo, subjectRepo, redis) {
        this.examRepo = examRepo;
        this.marksRepo = marksRepo;
        this.studentRepo = studentRepo;
        this.subjectRepo = subjectRepo;
        this.redis = redis;
    }
    async createExam(schoolId, dto) {
        const exam = this.examRepo.create({
            school_id: schoolId,
            academic_session_id: dto.academic_session_id,
            name: dto.name,
            exam_type: dto.exam_type,
            start_date: dto.start_date,
            end_date: dto.end_date,
        });
        return this.examRepo.save(exam);
    }
    async getExamSubjects(schoolId, examId, classId) {
        return this.subjectRepo.query(`SELECT es.id as id, es.subject_id, sub.name as subject_name,
              es.max_marks, es.passing_marks
       FROM exam_subjects es
       JOIN subjects sub ON sub.id = es.subject_id
       WHERE es.school_id = ? AND es.exam_id = ? AND es.class_id = ?
       ORDER BY sub.name`, [schoolId, examId, classId]);
    }
    async listExams(schoolId, sessionId) {
        const query = this.examRepo.createQueryBuilder('e')
            .where('e.school_id = :schoolId', { schoolId })
            .orderBy('e.created_at', 'DESC');
        if (sessionId) {
            query.andWhere('e.academic_session_id = :sessionId', { sessionId });
        }
        return query.getMany();
    }
    async getMarksEntryData(schoolId, examId, examSubjectId, classId, sectionId) {
        const students = await this.studentRepo.find({
            where: { school_id: schoolId, class_id: classId, section_id: sectionId, status: 'active' },
            relations: ['user'],
            order: { roll_number: 'ASC' },
        });
        const existingMarks = await this.marksRepo.find({
            where: { school_id: schoolId, exam_id: examId, exam_subject_id: examSubjectId },
        });
        const marksMap = new Map(existingMarks.map(m => [m.student_id, m]));
        return {
            students: students.map(s => ({
                student_id: s.id,
                roll_number: s.roll_number,
                name: s.user?.name || '',
                marks_obtained: marksMap.get(s.id)?.marks_obtained ?? null,
                grade: marksMap.get(s.id)?.grade ?? null,
                remarks: marksMap.get(s.id)?.remarks ?? null,
            })),
            total_students: students.length,
            marks_entered: existingMarks.length,
        };
    }
    async enterMarks(schoolId, dto, enteredBy) {
        const { exam_id, exam_subject_id, max_marks, marks } = dto;
        const invalidMarks = marks.filter(m => m.marks_obtained > max_marks);
        if (invalidMarks.length > 0) {
            throw new common_1.BadRequestException(`Marks cannot exceed ${max_marks}. Invalid entries for students: ${invalidMarks.map(m => m.student_id).join(', ')}`);
        }
        const results = [];
        for (const item of marks) {
            const percentage = (item.marks_obtained / max_marks) * 100;
            const grade = this.calculateGrade(percentage);
            const existing = await this.marksRepo.findOne({
                where: { school_id: schoolId, student_id: item.student_id, exam_subject_id },
            });
            if (existing) {
                existing.marks_obtained = item.marks_obtained;
                existing.grade = grade;
                existing.remarks = item.remarks || existing.remarks;
                existing.entered_by = enteredBy;
                results.push(await this.marksRepo.save(existing));
            }
            else {
                const record = this.marksRepo.create({
                    school_id: schoolId,
                    exam_id,
                    exam_subject_id,
                    student_id: item.student_id,
                    marks_obtained: item.marks_obtained,
                    grade,
                    remarks: item.remarks,
                    entered_by: enteredBy,
                });
                results.push(await this.marksRepo.save(record));
            }
        }
        await this.redis.delPattern(`report_card:${schoolId}:${exam_id}:*`);
        return {
            message: `Marks entered for ${results.length} students`,
            exam_id,
            exam_subject_id,
        };
    }
    async getReportCard(schoolId, studentId, examId) {
        const cacheKey = `report_card:${schoolId}:${examId}:${studentId}`;
        const cached = await this.redis.getJson(cacheKey);
        if (cached)
            return cached;
        const student = await this.studentRepo.findOne({
            where: { id: studentId, school_id: schoolId },
            relations: ['user'],
        });
        if (!student)
            throw new common_1.NotFoundException('Student not found');
        const exam = await this.examRepo.findOne({ where: { id: examId, school_id: schoolId } });
        if (!exam)
            throw new common_1.NotFoundException('Exam not found');
        const marks = await this.marksRepo
            .createQueryBuilder('m')
            .where('m.school_id = :schoolId', { schoolId })
            .andWhere('m.exam_id = :examId', { examId })
            .andWhere('m.student_id = :studentId', { studentId })
            .getMany();
        const examSubjects = await this.marksRepo.query(`
      SELECT es.id as exam_subject_id, es.max_marks, es.passing_marks, es.exam_date,
             s.name as subject_name, s.code as subject_code
      FROM exam_subjects es
      JOIN subjects s ON s.id = es.subject_id
      WHERE es.school_id = ? AND es.exam_id = ?
      ORDER BY s.name
    `, [schoolId, examId]);
        const marksMap = new Map(marks.map(m => [Number(m.exam_subject_id), m]));
        let totalObtained = 0;
        let totalMax = 0;
        let totalPassed = true;
        const subjectResults = examSubjects.map((es) => {
            const mark = marksMap.get(Number(es.exam_subject_id));
            const maxMarks = Number(es.max_marks);
            const passingMarks = Number(es.passing_marks);
            const obtained = mark ? Number(mark.marks_obtained) : 0;
            const passed = obtained >= passingMarks;
            totalObtained += obtained;
            totalMax += maxMarks;
            if (!passed && mark)
                totalPassed = false;
            return {
                subject_name: es.subject_name,
                subject_code: es.subject_code,
                max_marks: maxMarks,
                passing_marks: passingMarks,
                marks_obtained: mark ? obtained : null,
                grade: mark?.grade ?? '-',
                passed,
                exam_date: es.exam_date,
            };
        });
        const totalPercentage = totalMax > 0 ? Math.round((totalObtained / totalMax) * 100 * 100) / 100 : 0;
        const classRank = await this.calculateRank(schoolId, examId, student.class_id, student.section_id, studentId);
        const classAvg = await this.getClassAverage(schoolId, examId, student.class_id, student.section_id);
        const reportCard = {
            student: {
                id: student.id,
                name: student.user?.name || '',
                roll_number: student.roll_number,
                admission_number: student.admission_number,
                class_id: student.class_id,
                section_id: student.section_id,
            },
            exam: {
                id: exam.id,
                name: exam.name,
                exam_type: exam.exam_type,
            },
            subjects: subjectResults,
            summary: {
                total_marks_obtained: totalObtained,
                total_max_marks: totalMax,
                percentage: totalPercentage,
                overall_grade: this.calculateGrade(totalPercentage),
                result: totalPassed ? 'PASS' : 'FAIL',
                rank: classRank,
                class_average: classAvg,
            },
        };
        await this.redis.setJson(cacheKey, reportCard, 900);
        return reportCard;
    }
    async calculateRank(schoolId, examId, classId, sectionId, studentId) {
        const results = await this.marksRepo.query(`
      SELECT m.student_id, SUM(m.marks_obtained) as total
      FROM student_marks m
      JOIN students s ON s.id = m.student_id
      WHERE m.school_id = ? AND m.exam_id = ? AND s.class_id = ? AND s.section_id = ?
      GROUP BY m.student_id
      ORDER BY total DESC
    `, [schoolId, examId, classId, sectionId]);
        const rank = results.findIndex((r) => Number(r.student_id) === Number(studentId)) + 1;
        return rank || 0;
    }
    async getClassAverage(schoolId, examId, classId, sectionId) {
        const result = await this.marksRepo.query(`
      SELECT AVG(student_total) as avg_percentage FROM (
        SELECT m.student_id, 
               (SUM(m.marks_obtained) / SUM(es.max_marks)) * 100 as student_total
        FROM student_marks m
        JOIN exam_subjects es ON es.id = m.exam_subject_id
        JOIN students s ON s.id = m.student_id
        WHERE m.school_id = ? AND m.exam_id = ? AND s.class_id = ? AND s.section_id = ?
        GROUP BY m.student_id
      ) totals
    `, [schoolId, examId, classId, sectionId]);
        return Math.round((result[0]?.avg_percentage || 0) * 100) / 100;
    }
    calculateGrade(percentage) {
        if (percentage >= 91)
            return 'A+';
        if (percentage >= 81)
            return 'A';
        if (percentage >= 71)
            return 'B+';
        if (percentage >= 61)
            return 'B';
        if (percentage >= 51)
            return 'C+';
        if (percentage >= 41)
            return 'C';
        if (percentage >= 33)
            return 'D';
        return 'F';
    }
    async publishExam(schoolId, examId) {
        const exam = await this.examRepo.findOne({ where: { id: examId, school_id: schoolId } });
        if (!exam)
            throw new common_1.NotFoundException('Exam not found');
        exam.is_published = 1;
        await this.examRepo.save(exam);
        return { message: 'Exam results published successfully', exam_id: examId };
    }
    async getResultAnalysis(schoolId, examId, classId) {
        const results = await this.marksRepo.query(`
      SELECT 
        s.name as subject_name,
        COUNT(DISTINCT m.student_id) as total_students,
        AVG(m.marks_obtained) as avg_marks,
        MAX(m.marks_obtained) as highest,
        MIN(m.marks_obtained) as lowest,
        es.max_marks,
        es.passing_marks,
        SUM(CASE WHEN m.marks_obtained >= es.passing_marks THEN 1 ELSE 0 END) as passed_count
      FROM student_marks m
      JOIN exam_subjects es ON es.id = m.exam_subject_id
      JOIN subjects s ON s.id = es.subject_id
      WHERE m.school_id = ? AND m.exam_id = ? AND es.class_id = ?
      GROUP BY es.id, s.name, es.max_marks, es.passing_marks
      ORDER BY s.name
    `, [schoolId, examId, classId]);
        return results.map((r) => ({
            ...r,
            pass_percentage: r.total_students > 0 ? Math.round((r.passed_count / r.total_students) * 100) : 0,
            avg_percentage: r.max_marks > 0 ? Math.round((r.avg_marks / r.max_marks) * 100) : 0,
        }));
    }
};
exports.ExamService = ExamService;
exports.ExamService = ExamService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(exam_entity_1.ExamEntity)),
    __param(1, (0, typeorm_1.InjectRepository)(student_marks_entity_1.StudentMarksEntity)),
    __param(2, (0, typeorm_1.InjectRepository)(student_entity_1.StudentEntity)),
    __param(3, (0, typeorm_1.InjectRepository)(subject_entity_1.SubjectEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        redis_service_1.RedisService])
], ExamService);
class CreateExamDto {
}
exports.CreateExamDto = CreateExamDto;
class EnterMarksDto {
}
exports.EnterMarksDto = EnterMarksDto;
//# sourceMappingURL=exam.service.js.map