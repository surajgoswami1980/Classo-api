import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FeeCategoryEntity } from '../../entities/fee-category.entity';
import { ClassFeePlanEntity } from '../../entities/class-fee-plan.entity';
import { StudentFeeOverrideEntity } from '../../entities/student-fee-override.entity';
import { FeeInvoiceEntity } from '../../entities/fee-invoice.entity';
import { StudentEntity } from '../../entities/student.entity';

/**
 * Category-based fees: Tuition / Transport / Exam / Admission etc. Each
 * category has a per-class amount (class_fee_plans) and optional per-student
 * overrides. Monthly categories generate a recurring invoice each month;
 * one_time once; exam categories link to a specific exam. Generated dues land
 * in fee_invoices and reuse the existing payment flow.
 */
@Injectable()
export class FeeCategoryService {
  constructor(
    @InjectRepository(FeeCategoryEntity) private catRepo: Repository<FeeCategoryEntity>,
    @InjectRepository(ClassFeePlanEntity) private planRepo: Repository<ClassFeePlanEntity>,
    @InjectRepository(StudentFeeOverrideEntity) private overrideRepo: Repository<StudentFeeOverrideEntity>,
    @InjectRepository(FeeInvoiceEntity) private invoiceRepo: Repository<FeeInvoiceEntity>,
    @InjectRepository(StudentEntity) private studentRepo: Repository<StudentEntity>,
  ) {}

  // ─── Categories ──────────────────────────────────────────────

  async listCategories(schoolId: number) {
    return this.catRepo.find({
      where: { school_id: schoolId },
      order: { sort_order: 'ASC', id: 'DESC' },
    });
  }

  async createCategory(schoolId: number, dto: CreateCategoryDto) {
    const cat = this.catRepo.create({
      school_id: schoolId,
      name: dto.name,
      type: dto.type || 'monthly',
      description: dto.description || null,
      sort_order: dto.sort_order || 0,
    });
    return this.catRepo.save(cat);
  }

  async updateCategory(schoolId: number, id: number, dto: Partial<CreateCategoryDto> & { is_active?: boolean }) {
    const cat = await this.catRepo.findOne({ where: { id, school_id: schoolId } });
    if (!cat) throw new NotFoundException('Category not found');
    Object.assign(cat, {
      name: dto.name ?? cat.name,
      type: dto.type ?? cat.type,
      description: dto.description ?? cat.description,
      sort_order: dto.sort_order ?? cat.sort_order,
      is_active: dto.is_active ?? cat.is_active,
    });
    return this.catRepo.save(cat);
  }

  async deleteCategory(schoolId: number, id: number) {
    const cat = await this.catRepo.findOne({ where: { id, school_id: schoolId } });
    if (!cat) throw new NotFoundException('Category not found');
    await this.catRepo.remove(cat);
    return { message: 'Category deleted' };
  }

  // ─── Class fee plans (category amount per class) ─────────────

  async listClassPlans(schoolId: number, classId?: number) {
    const qb = this.planRepo
      .createQueryBuilder('p')
      .leftJoin('fee_categories', 'c', 'c.id = p.fee_category_id')
      .leftJoin('classes', 'cl', 'cl.id = p.class_id')
      .select([
        'p.id AS id',
        'p.fee_category_id AS fee_category_id',
        'p.class_id AS class_id',
        'p.amount AS amount',
        'p.due_day AS due_day',
        'p.is_active AS is_active',
        'c.name AS category_name',
        'c.type AS category_type',
        'cl.name AS class_name',
      ])
      .where('p.school_id = :schoolId', { schoolId });
    if (classId) qb.andWhere('p.class_id = :classId', { classId });
    return qb.orderBy('cl.name', 'ASC').getRawMany();
  }

  async upsertClassPlan(schoolId: number, dto: UpsertClassPlanDto) {
    const cat = await this.catRepo.findOne({ where: { id: dto.fee_category_id, school_id: schoolId } });
    if (!cat) throw new NotFoundException('Fee category not found');

    let plan = await this.planRepo.findOne({
      where: { school_id: schoolId, fee_category_id: dto.fee_category_id, class_id: dto.class_id },
    });
    if (!plan) {
      plan = this.planRepo.create({
        school_id: schoolId,
        fee_category_id: dto.fee_category_id,
        class_id: dto.class_id,
      });
    }
    plan.amount = dto.amount;
    plan.due_day = dto.due_day || 10;
    plan.is_active = dto.is_active ?? true;
    return this.planRepo.save(plan);
  }

  async deleteClassPlan(schoolId: number, id: number) {
    const plan = await this.planRepo.findOne({ where: { id, school_id: schoolId } });
    if (!plan) throw new NotFoundException('Plan not found');
    await this.planRepo.remove(plan);
    return { message: 'Plan removed' };
  }

  // ─── Per-student overrides (increase/decrease) ───────────────

  async setStudentOverride(schoolId: number, dto: StudentOverrideDto, userId?: number) {
    const student = await this.studentRepo.findOne({ where: { id: dto.student_id, school_id: schoolId } });
    if (!student) throw new NotFoundException('Student not found');

    let ov = await this.overrideRepo.findOne({
      where: { school_id: schoolId, student_id: dto.student_id, fee_category_id: dto.fee_category_id },
    });
    if (!ov) {
      ov = this.overrideRepo.create({
        school_id: schoolId,
        student_id: dto.student_id,
        fee_category_id: dto.fee_category_id,
      });
    }
    ov.amount = dto.amount;
    ov.reason = dto.reason || null;
    ov.updated_by = userId || null;
    return this.overrideRepo.save(ov);
  }

  async removeStudentOverride(schoolId: number, id: number) {
    const ov = await this.overrideRepo.findOne({ where: { id, school_id: schoolId } });
    if (!ov) throw new NotFoundException('Override not found');
    await this.overrideRepo.remove(ov);
    return { message: 'Override removed' };
  }

  /** All category amounts that apply to a student (plan amount + any override). */
  async getStudentFeeProfile(schoolId: number, studentId: number) {
    const student = await this.studentRepo.findOne({ where: { id: studentId, school_id: schoolId } });
    if (!student) throw new NotFoundException('Student not found');

    const rows = await this.planRepo.query(
      `SELECT c.id AS fee_category_id, c.name AS category_name, c.type AS category_type,
              p.amount AS class_amount, p.due_day AS due_day,
              o.amount AS override_amount, o.reason AS override_reason
       FROM fee_categories c
       JOIN class_fee_plans p ON p.fee_category_id = c.id AND p.class_id = ? AND p.is_active = 1
       LEFT JOIN student_fee_overrides o ON o.fee_category_id = c.id AND o.student_id = ? AND o.school_id = ?
       WHERE c.school_id = ? AND c.is_active = 1
       ORDER BY c.sort_order ASC, c.id ASC`,
      [student.class_id, studentId, schoolId, schoolId],
    );
    return rows.map((r: any) => ({
      fee_category_id: r.fee_category_id,
      category_name: r.category_name,
      category_type: r.category_type,
      due_day: r.due_day,
      class_amount: Number(r.class_amount),
      effective_amount: r.override_amount != null ? Number(r.override_amount) : Number(r.class_amount),
      is_overridden: r.override_amount != null,
      override_reason: r.override_reason || null,
    }));
  }

  // ─── Invoice generation ──────────────────────────────────────

  /**
   * Generate monthly invoices for a category for every active student in the
   * category's class plans, for a given month/year. Idempotent: skips students
   * who already have an invoice for that category+period.
   */
  async generateMonthly(schoolId: number, dto: GenerateMonthlyDto) {
    const cat = await this.catRepo.findOne({ where: { id: dto.fee_category_id, school_id: schoolId } });
    if (!cat) throw new NotFoundException('Fee category not found');
    if (cat.type === 'exam') throw new BadRequestException('Use exam fee generation for exam categories');

    const month = dto.month; // 1-12
    const year = dto.year;
    if (!month || month < 1 || month > 12 || !year) throw new BadRequestException('Valid month and year are required');

    const plans = await this.planRepo.find({
      where: { school_id: schoolId, fee_category_id: dto.fee_category_id, is_active: true },
    });
    if (!plans.length) throw new BadRequestException('No class plans configured for this category');

    let created = 0;
    let skipped = 0;

    for (const plan of plans) {
      const students = await this.studentRepo.find({
        where: { school_id: schoolId, class_id: plan.class_id, status: 'active' as any },
      });
      for (const student of students) {
        const existing = await this.invoiceRepo.findOne({
          where: {
            school_id: schoolId,
            student_id: student.id,
            fee_category_id: cat.id,
            period_year: year,
            period_month: month,
          } as any,
        });
        if (existing) { skipped++; continue; }

        const override = await this.overrideRepo.findOne({
          where: { school_id: schoolId, student_id: student.id, fee_category_id: cat.id },
        });
        const amount = override ? Number(override.amount) : Number(plan.amount);
        const dueDay = Math.min(Math.max(plan.due_day || 10, 1), 28);
        const dueDate = new Date(Date.UTC(year, month - 1, dueDay));

        await this.invoiceRepo.save(
          this.invoiceRepo.create({
            school_id: schoolId,
            student_id: student.id,
            fee_structure_id: null as any,
            fee_installment_id: null as any,
            fee_category_id: cat.id as any,
            period_year: year as any,
            period_month: month as any,
            invoice_number: this.invNo(schoolId, cat.id, student.id, `${year}${String(month).padStart(2, '0')}`),
            title: `${cat.name} — ${this.monthName(month)} ${year}` as any,
            amount,
            late_fee: 0,
            total_amount: amount,
            status: 'pending',
            due_date: dueDate,
          }),
        );
        created++;
      }
    }

    return { message: `Generated ${created} invoices`, created, skipped };
  }

  /** Generate a one-time or exam-linked invoice for a category/class set. */
  async generateOneTime(schoolId: number, dto: GenerateOneTimeDto) {
    const cat = await this.catRepo.findOne({ where: { id: dto.fee_category_id, school_id: schoolId } });
    if (!cat) throw new NotFoundException('Fee category not found');

    const plans = await this.planRepo.find({
      where: { school_id: schoolId, fee_category_id: dto.fee_category_id, is_active: true },
    });
    if (!plans.length) throw new BadRequestException('No class plans configured for this category');

    const dueDate = dto.due_date ? new Date(dto.due_date) : new Date(Date.now() + 14 * 86400000);
    let created = 0;
    let skipped = 0;

    for (const plan of plans) {
      const students = await this.studentRepo.find({
        where: { school_id: schoolId, class_id: plan.class_id, status: 'active' as any },
      });
      for (const student of students) {
        const where: any = {
          school_id: schoolId,
          student_id: student.id,
          fee_category_id: cat.id,
        };
        if (dto.exam_id) where.exam_id = dto.exam_id;
        const existing = await this.invoiceRepo.findOne({ where });
        if (existing) { skipped++; continue; }

        const override = await this.overrideRepo.findOne({
          where: { school_id: schoolId, student_id: student.id, fee_category_id: cat.id },
        });
        const amount = override ? Number(override.amount) : Number(plan.amount);

        await this.invoiceRepo.save(
          this.invoiceRepo.create({
            school_id: schoolId,
            student_id: student.id,
            fee_structure_id: null as any,
            fee_installment_id: null as any,
            fee_category_id: cat.id as any,
            exam_id: (dto.exam_id || null) as any,
            invoice_number: this.invNo(schoolId, cat.id, student.id, dto.exam_id ? `EXM${dto.exam_id}` : 'OT'),
            title: (dto.title || cat.name) as any,
            amount,
            late_fee: 0,
            total_amount: amount,
            status: 'pending',
            due_date: dueDate,
          }),
        );
        created++;
      }
    }
    return { message: `Generated ${created} invoices`, created, skipped };
  }

  // ─── Admin views ─────────────────────────────────────────────

  /** Class-wise pending summary + per-student pending list. */
  async pendingByClass(schoolId: number, classId?: number) {
    const summary = await this.invoiceRepo.query(
      `SELECT c.id AS class_id, c.name AS class_name,
              COUNT(DISTINCT i.student_id) AS students_with_dues,
              COUNT(*) AS pending_invoices,
              SUM(i.total_amount) AS pending_amount
       FROM fee_invoices i
       JOIN students s ON s.id = i.student_id
       JOIN classes c ON c.id = s.class_id
       WHERE i.school_id = ? AND i.status IN ('pending','overdue','partial')
       ${classId ? 'AND c.id = ?' : ''}
       GROUP BY c.id, c.name
       ORDER BY c.name ASC`,
      classId ? [schoolId, classId] : [schoolId],
    );
    return summary.map((r: any) => ({
      class_id: r.class_id,
      class_name: r.class_name,
      students_with_dues: Number(r.students_with_dues),
      pending_invoices: Number(r.pending_invoices),
      pending_amount: Number(r.pending_amount),
    }));
  }

  /** Detailed pending invoices for a specific class. */
  async pendingStudents(schoolId: number, classId: number) {
    const rows = await this.invoiceRepo.query(
      `SELECT i.id, i.invoice_number, i.title, i.total_amount, i.status, i.due_date,
              i.period_month, i.period_year,
              s.id AS student_id, s.roll_number, u.name AS student_name, u.phone,
              fc.name AS category_name
       FROM fee_invoices i
       JOIN students s ON s.id = i.student_id
       JOIN users u ON u.id = s.user_id
       LEFT JOIN fee_categories fc ON fc.id = i.fee_category_id
       WHERE i.school_id = ? AND s.class_id = ? AND i.status IN ('pending','overdue','partial')
       ORDER BY i.due_date ASC, u.name ASC`,
      [schoolId, classId],
    );
    return rows.map((r: any) => ({ ...r, total_amount: Number(r.total_amount) }));
  }

  // ─── Helpers ─────────────────────────────────────────────────

  private invNo(schoolId: number, catId: number, studentId: number, period: string): string {
    const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
    return `FEE-${schoolId}-${catId}-${studentId}-${period}-${rand}`;
  }

  private monthName(m: number): string {
    return ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][m] || String(m);
  }
}

// ─── DTOs ──────────────────────────────────────────────────────

export class CreateCategoryDto {
  name: string;
  type?: 'monthly' | 'one_time' | 'exam';
  description?: string;
  sort_order?: number;
}

export class UpsertClassPlanDto {
  fee_category_id: number;
  class_id: number;
  amount: number;
  due_day?: number;
  is_active?: boolean;
}

export class StudentOverrideDto {
  student_id: number;
  fee_category_id: number;
  amount: number;
  reason?: string;
}

export class GenerateMonthlyDto {
  fee_category_id: number;
  month: number;
  year: number;
}

export class GenerateOneTimeDto {
  fee_category_id: number;
  title?: string;
  due_date?: string;
  exam_id?: number;
}
