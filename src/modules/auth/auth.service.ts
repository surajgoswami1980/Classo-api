import { Injectable, UnauthorizedException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { UserEntity } from '../../entities/user.entity';
import { SchoolEntity } from '../../entities/school.entity';
import { PasswordResetRequestEntity } from '../../entities/password-reset-request.entity';
import { LoginDto, SchoolLookupDto } from './dto/login.dto';
import { RedisService } from '../../common/providers/redis.service';
import { EmailService } from '../../common/providers/email.service';

const RESET_TOKEN_TTL_MINUTES = 30;

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity) private userRepo: Repository<UserEntity>,
    @InjectRepository(SchoolEntity) private schoolRepo: Repository<SchoolEntity>,
    @InjectRepository(PasswordResetRequestEntity) private resetRepo: Repository<PasswordResetRequestEntity>,
    private jwtService: JwtService,
    private configService: ConfigService,
    private redis: RedisService,
    private emailService: EmailService,
  ) {}

  /**
   * Step 1: Lookup school by code — returns school info for the login screen
   */
  async lookupSchool(dto: SchoolLookupDto) {
    const school = await this.schoolRepo.findOne({
      where: { code: dto.school_code, is_active: true },
      select: ['id', 'name', 'code', 'logo', 'board_affiliation'],
    });

    if (!school) {
      throw new BadRequestException('School not found. Please check the school code.');
    }

    return {
      school_id: school.id,
      name: school.name,
      code: school.code,
      logo_url: school.logo,
      primary_color: '#2563EB',
      board_affiliation: school.board_affiliation,
    };
  }

  /**
   * Step 2: Login with school_code + identifier + password
   * Identifier can be: employee_id, registration_id, email, or phone
   */
  async login(dto: LoginDto) {
    // Find school
    const school = await this.schoolRepo.findOne({
      where: { code: dto.school_code, is_active: true as any },
    });

    if (!school) {
      throw new UnauthorizedException('Invalid school code');
    }

    // Check subscription
    if (!school.is_active) {
      throw new ForbiddenException('School account is inactive. Contact administrator.');
    }

    // Find user by various identifiers within the school
    const user = await this.userRepo
      .createQueryBuilder('u')
      .where('u.school_id = :schoolId', { schoolId: school.id })
      .andWhere('u.is_active = :active', { active: true })
      .andWhere('u.deleted_at IS NULL')
      .andWhere(
        '(u.employee_id = :identifier OR u.email = :identifier OR u.phone = :identifier)',
        { identifier: dto.identifier },
      )
      .getOne();

    if (!user) {
      // Debug: try without is_active and deleted_at filters to see if user exists at all
      const debugUser = await this.userRepo
        .createQueryBuilder('u')
        .where('u.school_id = :schoolId', { schoolId: school.id })
        .andWhere(
          '(u.employee_id = :identifier OR u.email = :identifier OR u.phone = :identifier)',
          { identifier: dto.identifier },
        )
        .getOne();
      
      if (debugUser) {
        console.log('[LOGIN] User found but filtered out. is_active:', debugUser.is_active, 'deleted_at:', debugUser.deleted_at, 'id:', debugUser.id);
      } else {
        console.log('[LOGIN] No user exists at all for identifier:', dto.identifier, 'in school:', school.id);
        // Also check if phone is stored with/without country code
        const allUsers = await this.userRepo.query(
          'SELECT id, name, email, phone, employee_id, is_active, deleted_at FROM users WHERE school_id = ? LIMIT 10',
          [school.id],
        );
        console.log('[LOGIN] Users in this school:', JSON.stringify(allUsers));
      }
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if account is locked
    // Verify password
    // Laravel uses $2y$ prefix, bcryptjs uses $2a$ — they're compatible if we replace the prefix
    let storedPassword = user.password;
    if (storedPassword.startsWith('$2y$')) {
      storedPassword = '$2a$' + storedPassword.slice(4);
    }
    const isPasswordValid = await bcrypt.compare(dto.password, storedPassword);
    if (!isPasswordValid) {
      console.log('[LOGIN] Password mismatch for user:', user.id, user.name, '| phone:', user.phone, '| password hash starts:', storedPassword.substring(0, 15));
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update last login (non-blocking)
    try {
      user.last_login_at = new Date();
      await this.userRepo.save(user);
    } catch (e) {
      // Column mismatch or DB issue — don't block login
    }

    // Get user's role from Spatie model_has_roles table
    let userRole = 'student';
    try {
      const roleRow = await this.userRepo.query(
        `SELECT r.name FROM roles r JOIN model_has_roles mhr ON r.id = mhr.role_id WHERE mhr.model_id = ? AND mhr.model_type = 'App\\\\Models\\\\User' LIMIT 1`,
        [user.id]
      );
      if (roleRow && roleRow.length > 0) {
        userRole = this.normalizeRole(roleRow[0].name);
      }
    } catch (e) {
      // Fallback to student if role lookup fails
    }

    // Generate tokens
    const payload = {
      user_id: user.id,
      school_id: school.id,
      role: userRole,
      permissions: [],
    };

    const access_token = this.jwtService.sign(payload);
    const refresh_token = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN') || '30d',
    });

    // Cache user session (non-blocking — login must not fail if Redis is down)
    try {
      await this.redis.setJson(`session:${user.id}`, payload, 86400 * 7);
    } catch (e) {
      // Redis down — skip caching, login still works
    }

    const studentDetails = await this.getStudentDetails(user.id, school.id, userRole);
    const teacherDetails = await this.getTeacherDetails(user.id, school.id, userRole);

    return {
      access_token,
      refresh_token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: userRole,
        profile_image: user.avatar,
        permissions: [],
        ...(studentDetails && {
          student_id: studentDetails.student_id,
          roll_number: studentDetails.roll_number,
          admission_number: studentDetails.admission_number,
          class_name: studentDetails.class_name,
          section_name: studentDetails.section_name,
          class_id: studentDetails.class_id,
          section_id: studentDetails.section_id,
        }),
        ...(teacherDetails && {
          teacher_id: teacherDetails.teacher_id,
          designation: teacherDetails.designation,
          department: teacherDetails.department,
        }),
      },
      school: {
        id: school.id,
        name: school.name,
        code: school.code,
        logo_url: school.logo,
        primary_color: '#2563EB',
      },
    };
  }

  /**
   * Super admin login — no school context. Only succeeds for a user
   * explicitly assigned the 'super-admin' role (school_id IS NULL).
   */
  async superAdminLogin(identifier: string, password: string) {
    const user = await this.userRepo
      .createQueryBuilder('u')
      .where('u.school_id IS NULL')
      .andWhere('u.is_active = :active', { active: true })
      .andWhere('u.deleted_at IS NULL')
      .andWhere('(u.email = :identifier OR u.phone = :identifier)', { identifier })
      .getOne();

    if (!user) throw new UnauthorizedException('Invalid credentials');

    let storedPassword = user.password;
    if (storedPassword.startsWith('$2y$')) {
      storedPassword = '$2a$' + storedPassword.slice(4);
    }
    const isPasswordValid = await bcrypt.compare(password, storedPassword);
    if (!isPasswordValid) throw new UnauthorizedException('Invalid credentials');

    const roleRow = await this.userRepo.query(
      `SELECT r.name FROM roles r JOIN model_has_roles mhr ON r.id = mhr.role_id WHERE mhr.model_id = ? AND mhr.model_type = 'App\\\\Models\\\\User' LIMIT 1`,
      [user.id],
    );
    const role = roleRow?.[0]?.name ? this.normalizeRole(roleRow[0].name) : null;
    if (role !== 'super_admin') {
      throw new ForbiddenException('This account does not have super admin access');
    }

    user.last_login_at = new Date();
    await this.userRepo.save(user);

    const payload = { user_id: user.id, school_id: null, role, permissions: [] };
    const access_token = this.jwtService.sign(payload);
    const refresh_token = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN') || '30d',
    });

    return {
      access_token,
      refresh_token,
      user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role },
    };
  }

  /**
   * Request a password reset link. Always returns a generic success
   * message regardless of whether the account exists, so this endpoint
   * can't be used to enumerate valid identifiers. If the user has no
   * email on file (common for students, who often log in by phone),
   * there's currently no SMS channel wired up — the reset link is only
   * emailed.
   */
  async forgotPassword(schoolCode: string, identifier: string): Promise<void> {
    const school = await this.schoolRepo.findOne({ where: { code: schoolCode, is_active: true as any } });
    if (!school) return;

    const user = await this.userRepo
      .createQueryBuilder('u')
      .where('u.school_id = :schoolId', { schoolId: school.id })
      .andWhere('u.is_active = :active', { active: true })
      .andWhere('u.deleted_at IS NULL')
      .andWhere('(u.employee_id = :identifier OR u.email = :identifier OR u.phone = :identifier)', { identifier })
      .getOne();

    if (!user || !user.email) return;

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    await this.resetRepo.save(
      this.resetRepo.create({
        user_id: user.id,
        token_hash: tokenHash,
        expires_at: new Date(Date.now() + RESET_TOKEN_TTL_MINUTES * 60 * 1000),
      }),
    );

    const webUrl = this.configService.get('WEB_APP_URL') || 'http://localhost:3000';
    const resetLink = `${webUrl}/reset-password?token=${rawToken}`;

    await this.emailService.send(
      user.email,
      'Reset your School ERP password',
      `<p>Hi ${user.name},</p><p>Click the link below to reset your password. This link expires in ${RESET_TOKEN_TTL_MINUTES} minutes.</p><p><a href="${resetLink}">${resetLink}</a></p><p>If you didn't request this, you can safely ignore this email.</p>`,
    );
  }

  /**
   * Complete a password reset using the token issued by forgotPassword().
   */
  async resetPassword(rawToken: string, newPassword: string): Promise<void> {
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    const resetRequest = await this.resetRepo.findOne({
      where: { token_hash: tokenHash, expires_at: MoreThan(new Date()) },
    });

    if (!resetRequest || resetRequest.used_at) {
      throw new BadRequestException('This reset link is invalid or has expired');
    }

    const user = await this.userRepo.findOne({ where: { id: resetRequest.user_id } });
    if (!user) throw new BadRequestException('This reset link is invalid or has expired');

    user.password = await bcrypt.hash(newPassword, 10);
    await this.userRepo.save(user);

    resetRequest.used_at = new Date();
    await this.resetRepo.save(resetRequest);
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      });

      const user = await this.userRepo.findOne({
        where: { id: payload.user_id, is_active: true },
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      const newPayload = {
        user_id: user.id,
        school_id: user.school_id,
        role: payload.role || 'student',
        permissions: payload.permissions || [],
      };

      const access_token = this.jwtService.sign(newPayload);

      return { access_token };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  /**
   * Change password
   */
  async changePassword(userId: number, oldPassword: string, newPassword: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new BadRequestException('User not found');

    const isOldValid = await bcrypt.compare(oldPassword, user.password);
    if (!isOldValid) throw new BadRequestException('Current password is incorrect');

    user.password = await bcrypt.hash(newPassword, 10);
    await this.userRepo.save(user);

    return { message: 'Password changed successfully' };
  }

  /**
   * Get full user profile
   */
  async getProfile(userId: number) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new BadRequestException('User not found');

    // Get role
    let role = 'student';
    try {
      const roleRow = await this.userRepo.query(
        `SELECT r.name FROM roles r JOIN model_has_roles mhr ON r.id = mhr.role_id WHERE mhr.model_id = ? AND mhr.model_type = 'App\\\\Models\\\\User' LIMIT 1`,
        [user.id],
      );
      if (roleRow && roleRow.length > 0) {
        role = this.normalizeRole(roleRow[0].name);
      }
    } catch (e) {}

    const studentDetails = await this.getStudentDetails(user.id, user.school_id, role);
    const teacherDetails = await this.getTeacherDetails(user.id, user.school_id, role);

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      avatar: user.avatar,
      role,
      school_id: user.school_id,
      employee_id: user.employee_id,
      designation: user.designation,
      department: user.department,
      ...(studentDetails && {
        student_id: studentDetails.student_id,
        roll_number: studentDetails.roll_number,
        admission_number: studentDetails.admission_number,
        class_name: studentDetails.class_name,
        section_name: studentDetails.section_name,
        class_id: studentDetails.class_id,
        section_id: studentDetails.section_id,
        parent_name: studentDetails.parent_name,
        parent_phone: studentDetails.parent_phone,
      }),
      ...(teacherDetails && {
        teacher_id: teacherDetails.teacher_id,
      }),
    };
  }

  /**
   * Shared by login() and getProfile() — a teacher's `user` object is
   * meaningless to endpoints keyed off `teachers.id` (workload, timetable
   * assignment) without this.
   */
  private async getTeacherDetails(userId: number, schoolId: number, role: string) {
    if (role !== 'teacher' && role !== 'incharge') return null;

    try {
      const rows = await this.userRepo.query(
        `SELECT id as teacher_id, designation, department FROM teachers WHERE user_id = ? AND school_id = ? LIMIT 1`,
        [userId, schoolId],
      );
      return rows && rows.length > 0 ? rows[0] : null;
    } catch (e) {
      return null;
    }
  }

  /**
   * Shared by login() and getProfile() — a student/parent's `user` object
   * is meaningless to the fee/attendance/exam endpoints (which key off
   * `students.id`, not `users.id`) without this. Returns null for other
   * roles or if no student row is linked yet.
   */
  private async getStudentDetails(userId: number, schoolId: number, role: string) {
    if (role !== 'student' && role !== 'parent') return null;

    try {
      const rows = await this.userRepo.query(
        `SELECT s.id as student_id, s.roll_number, s.admission_number, s.class_id, s.section_id,
                c.name as class_name, sec.name as section_name,
                COALESCE(s.father_name, s.guardian_name) as parent_name,
                COALESCE(s.father_phone, s.guardian_phone) as parent_phone
         FROM students s
         LEFT JOIN classes c ON c.id = s.class_id
         LEFT JOIN sections sec ON sec.id = s.section_id
         WHERE s.user_id = ? AND s.school_id = ? LIMIT 1`,
        [userId, schoolId],
      );
      return rows && rows.length > 0 ? rows[0] : null;
    } catch (e) {
      return null;
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: number, data: { name?: string; phone?: string; avatar?: string }) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new BadRequestException('User not found');

    if (data.name) user.name = data.name;
    if (data.phone) user.phone = data.phone;
    if (data.avatar !== undefined) user.avatar = data.avatar;

    await this.userRepo.save(user);

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      avatar: user.avatar,
      message: 'Profile updated successfully',
    };
  }

  /**
   * spatie/laravel-permission (school-erp-admin) stores role names
   * hyphenated ('super-admin', 'school-admin', 'sub-admin'), but this
   * API's UserRole enum and RolesGuard use underscores ('super_admin',
   * 'school_admin', 'sub_admin'). Without this normalization, every
   * @Roles()-gated endpoint silently rejects real admin logins because
   * the JWT's role claim never matches the guard's expected value.
   */
  private normalizeRole(dbRoleName: string): string {
    return dbRoleName.replace(/-/g, '_');
  }
}
