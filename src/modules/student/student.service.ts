import { Injectable, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { StudentEntity } from '../../entities/student.entity';
import { UserEntity } from '../../entities/user.entity';
import { ClassEntity } from '../../entities/class.entity';
import { SectionEntity } from '../../entities/section.entity';
import { SpatieRoleService } from '../../common/providers/spatie-role.service';
import {
  CreateStudentDto,
  UpdateStudentDto,
  ListStudentsQueryDto,
  PromoteStudentsDto,
} from './dto/student.dto';

@Injectable()
export class StudentService {
  constructor(
    @InjectRepository(StudentEntity) private studentRepo: Repository<StudentEntity>,
    @InjectRepository(UserEntity) private userRepo: Repository<UserEntity>,
    @InjectRepository(ClassEntity) private classRepo: Repository<ClassEntity>,
    @InjectRepository(SectionEntity) private sectionRepo: Repository<SectionEntity>,
    private spatieRole: SpatieRoleService,
  ) {}

  /**
   * List students with filters, pagination, and search — joined with
   * their user record and class/section names.
   */
  async listStudents(schoolId: number, query: ListStudentsQueryDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;

    const qb = this.studentRepo
      .createQueryBuilder('s')
      .innerJoin(UserEntity, 'u', 'u.id = s.user_id')
      .leftJoin(ClassEntity, 'c', 'c.id = s.class_id')
      .leftJoin(SectionEntity, 'sec', 'sec.id = s.section_id')
      .select([
        's.id AS id', 's.admission_number AS admission_number', 's.roll_number AS roll_number',
        's.class_id AS class_id', 's.section_id AS section_id', 's.status AS status',
        's.date_of_birth AS date_of_birth', 's.gender AS gender',
        'u.name AS name', 'u.email AS email', 'u.phone AS phone', 'u.avatar AS avatar',
        'c.name AS class_name', 'sec.name AS section_name',
      ])
      .where('s.school_id = :schoolId', { schoolId });

    if (query.class_id) qb.andWhere('s.class_id = :classId', { classId: query.class_id });
    if (query.section_id) qb.andWhere('s.section_id = :sectionId', { sectionId: query.section_id });
    if (query.status) qb.andWhere('s.status = :status', { status: query.status });
    if (query.search) {
      qb.andWhere('(u.name LIKE :search OR s.admission_number LIKE :search OR s.roll_number LIKE :search OR u.phone LIKE :search)', {
        search: `%${query.search}%`,
      });
    }

    const total = await qb.getCount();
    const data = await qb
      .orderBy('s.created_at', 'DESC')
      .offset((page - 1) * limit)
      .limit(limit)
      .getRawMany();

    return { data, total, page, limit, total_pages: Math.ceil(total / limit) };
  }

  /**
   * Create a student — creates the login (users) row and the student
   * profile row together, and assigns the 'student' role so login works.
   */
  async createStudent(schoolId: number, dto: CreateStudentDto) {
    await this.assertClassAndSection(schoolId, dto.class_id, dto.section_id);

    if (dto.email) {
      const existing = await this.userRepo.findOne({ where: { email: dto.email } });
      if (existing) throw new ConflictException('A user with this email already exists');
    }

    const plainPassword = dto.password || dto.phone || 'Student@123';
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    const user = await this.userRepo.save(
      this.userRepo.create({
        name: dto.name,
        email: dto.email || undefined,
        phone: dto.phone || undefined,
        password: hashedPassword,
        school_id: schoolId,
        is_active: true,
      }),
    );

    const student = await this.studentRepo.save(
      this.studentRepo.create({
        school_id: schoolId,
        user_id: user.id,
        class_id: dto.class_id,
        section_id: dto.section_id,
        admission_number: dto.admission_number,
        roll_number: dto.roll_number,
        date_of_birth: dto.date_of_birth as any,
        gender: dto.gender,
        blood_group: dto.blood_group,
        address: dto.address,
        city: dto.city,
        state: dto.state,
        pincode: dto.pincode,
        admission_date: (dto.admission_date || new Date().toISOString().slice(0, 10)) as any,
        father_name: dto.father_name,
        father_phone: dto.father_phone,
        mother_name: dto.mother_name,
        mother_phone: dto.mother_phone,
        guardian_name: dto.guardian_name,
        guardian_phone: dto.guardian_phone,
        status: 'active',
      }),
    );

    await this.spatieRole.assignRole(user.id, 'student');

    return { ...student, name: user.name, email: user.email, phone: user.phone, temp_password: dto.password ? undefined : plainPassword };
  }

  /**
   * Bulk import students from an uploaded CSV file.
   * Expected header row: name,email,phone,class_id,section_id,admission_number,roll_number,date_of_birth,gender,father_name,father_phone,mother_name,mother_phone,address
   */
  async bulkImportStudents(schoolId: number, fileBuffer: Buffer) {
    const rows = this.parseCsv(fileBuffer.toString('utf-8'));
    if (rows.length === 0) {
      throw new BadRequestException('CSV file is empty or has no data rows');
    }

    const results = { total: rows.length, created: 0, failed: 0, errors: [] as { row: number; error: string }[] };

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        if (!row.name || !row.class_id || !row.section_id) {
          throw new Error('name, class_id, and section_id are required');
        }
        await this.createStudent(schoolId, {
          name: row.name,
          email: row.email || undefined,
          phone: row.phone || undefined,
          class_id: Number(row.class_id),
          section_id: Number(row.section_id),
          admission_number: row.admission_number || undefined,
          roll_number: row.roll_number || undefined,
          date_of_birth: row.date_of_birth || undefined,
          gender: row.gender || undefined,
          father_name: row.father_name || undefined,
          father_phone: row.father_phone || undefined,
          mother_name: row.mother_name || undefined,
          mother_phone: row.mother_phone || undefined,
          address: row.address || undefined,
        } as CreateStudentDto);
        results.created++;
      } catch (e: any) {
        results.failed++;
        results.errors.push({ row: i + 2, error: e.message || 'Unknown error' }); // +2: header row + 1-indexed
      }
    }

    return results;
  }

  /**
   * Full student detail — user + class + section joined.
   */
  async getStudentDetail(schoolId: number, id: number) {
    const row = await this.studentRepo
      .createQueryBuilder('s')
      .innerJoin(UserEntity, 'u', 'u.id = s.user_id')
      .leftJoin(ClassEntity, 'c', 'c.id = s.class_id')
      .leftJoin(SectionEntity, 'sec', 'sec.id = s.section_id')
      .select(['s.*', 'u.name AS name', 'u.email AS email', 'u.phone AS phone', 'u.avatar AS avatar', 'c.name AS class_name', 'sec.name AS section_name'])
      .where('s.id = :id AND s.school_id = :schoolId', { id, schoolId })
      .getRawOne();

    if (!row) throw new NotFoundException('Student not found');
    return row;
  }

  async updateStudent(schoolId: number, id: number, dto: UpdateStudentDto) {
    const student = await this.studentRepo.findOne({ where: { id, school_id: schoolId } });
    if (!student) throw new NotFoundException('Student not found');

    if (dto.class_id || dto.section_id) {
      await this.assertClassAndSection(schoolId, dto.class_id ?? student.class_id, dto.section_id ?? student.section_id);
    }

    if (dto.name || dto.email !== undefined || dto.phone !== undefined) {
      await this.userRepo.update(
        { id: student.user_id },
        {
          ...(dto.name && { name: dto.name }),
          ...(dto.email !== undefined && { email: dto.email }),
          ...(dto.phone !== undefined && { phone: dto.phone }),
        },
      );
    }

    Object.assign(student, {
      ...(dto.class_id !== undefined && { class_id: dto.class_id }),
      ...(dto.section_id !== undefined && { section_id: dto.section_id }),
      ...(dto.admission_number !== undefined && { admission_number: dto.admission_number }),
      ...(dto.roll_number !== undefined && { roll_number: dto.roll_number }),
      ...(dto.date_of_birth !== undefined && { date_of_birth: dto.date_of_birth }),
      ...(dto.gender !== undefined && { gender: dto.gender }),
      ...(dto.blood_group !== undefined && { blood_group: dto.blood_group }),
      ...(dto.address !== undefined && { address: dto.address }),
      ...(dto.city !== undefined && { city: dto.city }),
      ...(dto.state !== undefined && { state: dto.state }),
      ...(dto.pincode !== undefined && { pincode: dto.pincode }),
      ...(dto.father_name !== undefined && { father_name: dto.father_name }),
      ...(dto.father_phone !== undefined && { father_phone: dto.father_phone }),
      ...(dto.mother_name !== undefined && { mother_name: dto.mother_name }),
      ...(dto.mother_phone !== undefined && { mother_phone: dto.mother_phone }),
      ...(dto.status !== undefined && { status: dto.status }),
    });

    await this.studentRepo.save(student);
    return this.getStudentDetail(schoolId, id);
  }

  /**
   * Promote a batch of students to a new class/section for the next
   * academic session (e.g. end-of-year promotion).
   */
  async promoteStudents(schoolId: number, dto: PromoteStudentsDto) {
    await this.assertClassAndSection(schoolId, dto.to_class_id, dto.to_section_id);

    const students = await this.studentRepo.find({
      where: { school_id: schoolId, id: In(dto.student_ids) },
    });
    const foundIds = new Set(students.map((s) => s.id));
    const missing = dto.student_ids.filter((id) => !foundIds.has(id));

    if (students.length > 0) {
      await this.studentRepo
        .createQueryBuilder()
        .update(StudentEntity)
        .set({ class_id: dto.to_class_id, section_id: dto.to_section_id })
        .where('id IN (:...ids) AND school_id = :schoolId', { ids: students.map((s) => s.id), schoolId })
        .execute();
    }

    return {
      message: `Promoted ${students.length} student(s)`,
      promoted: students.length,
      skipped: missing.length,
      skipped_ids: missing,
    };
  }

  /**
   * A student's own home-screen dashboard: today's timetable, this
   * month's attendance summary, and upcoming assignments.
   */
  async getStudentDashboard(schoolId: number, userId: number) {
    const student = await this.studentRepo.findOne({ where: { school_id: schoolId, user_id: userId } });
    if (!student) throw new NotFoundException('Student profile not found for this account');

    const today = new Date();
    const dayOfWeek = today.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
    const todayStr = today.toISOString().slice(0, 10);

    const [todayTimetable, attendanceRows, upcomingAssignments] = await Promise.all([
      this.studentRepo.query(
        `SELECT tp.period_number, tp.start_time, tp.end_time,
                sub.name as subject_name, u.name as teacher_name
         FROM timetable_periods tp
         LEFT JOIN subjects sub ON sub.id = tp.subject_id
         LEFT JOIN teachers t ON t.id = tp.teacher_id
         LEFT JOIN users u ON u.id = t.user_id
         WHERE tp.school_id = ? AND tp.class_id = ? AND tp.section_id = ? AND tp.day_of_week = ?
         ORDER BY tp.period_number`,
        [schoolId, student.class_id, student.section_id, dayOfWeek],
      ),
      this.studentRepo.query(
        `SELECT status, COUNT(*) as count FROM student_attendance
         WHERE school_id = ? AND student_id = ? AND date >= ?
         GROUP BY status`,
        [schoolId, student.id, monthStart],
      ),
      this.studentRepo.query(
        `SELECT a.id, a.title, a.due_date, sub.name as subject_name
         FROM assignments a
         LEFT JOIN subjects sub ON sub.id = a.subject_id
         WHERE a.school_id = ? AND a.class_id = ? AND a.section_id = ?
           AND a.status = 'published' AND a.due_date >= ?
         ORDER BY a.due_date ASC LIMIT 5`,
        [schoolId, student.class_id, student.section_id, todayStr],
      ),
    ]);

    const totalMarked = attendanceRows.reduce((sum: number, r: any) => sum + Number(r.count), 0);
    const countFor = (status: string) => Number(attendanceRows.find((r: any) => r.status === status)?.count) || 0;
    const pct = (count: number) => (totalMarked > 0 ? Math.round((count / totalMarked) * 100) : 0);

    return {
      today_timetable: todayTimetable,
      attendance_summary: {
        present: pct(countFor('present')),
        absent: pct(countFor('absent')),
        late: pct(countFor('late')),
        total_marked_days: totalMarked,
      },
      upcoming_assignments: upcomingAssignments,
    };
  }

  // ─── Helpers ─────────────────────────────────────────────────

  private async assertClassAndSection(schoolId: number, classId: number, sectionId: number) {
    const [cls, section] = await Promise.all([
      this.classRepo.findOne({ where: { id: classId, school_id: schoolId } }),
      this.sectionRepo.findOne({ where: { id: sectionId, school_id: schoolId, class_id: classId } }),
    ]);
    if (!cls) throw new BadRequestException('Invalid class for this school');
    if (!section) throw new BadRequestException('Invalid section for the selected class');
  }

  /**
   * Minimal quoted-field-aware CSV parser (no external dependency).
   * Returns an array of row objects keyed by the header row.
   */
  private parseCsv(content: string): Record<string, string>[] {
    const lines = content.split(/\r?\n/).filter((line) => line.trim().length > 0);
    if (lines.length < 2) return [];

    const parseLine = (line: string): string[] => {
      const values: string[] = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          if (inQuotes && line[i + 1] === '"') {
            current += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim());
      return values;
    };

    const headers = parseLine(lines[0]).map((h) => h.toLowerCase().replace(/\s+/g, '_'));
    return lines.slice(1).map((line) => {
      const values = parseLine(line);
      const row: Record<string, string> = {};
      headers.forEach((h, idx) => (row[h] = values[idx] ?? ''));
      return row;
    });
  }
}
