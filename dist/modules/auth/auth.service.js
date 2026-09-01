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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const user_entity_1 = require("../../entities/user.entity");
const school_entity_1 = require("../../entities/school.entity");
const password_reset_request_entity_1 = require("../../entities/password-reset-request.entity");
const redis_service_1 = require("../../common/providers/redis.service");
const email_service_1 = require("../../common/providers/email.service");
const RESET_TOKEN_TTL_MINUTES = 30;
let AuthService = class AuthService {
    constructor(userRepo, schoolRepo, resetRepo, jwtService, configService, redis, emailService) {
        this.userRepo = userRepo;
        this.schoolRepo = schoolRepo;
        this.resetRepo = resetRepo;
        this.jwtService = jwtService;
        this.configService = configService;
        this.redis = redis;
        this.emailService = emailService;
    }
    async lookupSchool(dto) {
        const school = await this.schoolRepo.findOne({
            where: { code: dto.school_code, is_active: true },
            select: ['id', 'name', 'code', 'logo', 'board_affiliation'],
        });
        if (!school) {
            throw new common_1.BadRequestException('School not found. Please check the school code.');
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
    async login(dto) {
        const school = await this.schoolRepo.findOne({
            where: { code: dto.school_code, is_active: true },
        });
        if (!school) {
            throw new common_1.UnauthorizedException('Invalid school code');
        }
        if (!school.is_active) {
            throw new common_1.ForbiddenException('School account is inactive. Contact administrator.');
        }
        const user = await this.userRepo
            .createQueryBuilder('u')
            .where('u.school_id = :schoolId', { schoolId: school.id })
            .andWhere('u.is_active = :active', { active: true })
            .andWhere('u.deleted_at IS NULL')
            .andWhere('(u.employee_id = :identifier OR u.email = :identifier OR u.phone = :identifier)', { identifier: dto.identifier })
            .getOne();
        if (!user) {
            const debugUser = await this.userRepo
                .createQueryBuilder('u')
                .where('u.school_id = :schoolId', { schoolId: school.id })
                .andWhere('(u.employee_id = :identifier OR u.email = :identifier OR u.phone = :identifier)', { identifier: dto.identifier })
                .getOne();
            if (debugUser) {
                console.log('[LOGIN] User found but filtered out. is_active:', debugUser.is_active, 'deleted_at:', debugUser.deleted_at, 'id:', debugUser.id);
            }
            else {
                console.log('[LOGIN] No user exists at all for identifier:', dto.identifier, 'in school:', school.id);
                const allUsers = await this.userRepo.query('SELECT id, name, email, phone, employee_id, is_active, deleted_at FROM users WHERE school_id = ? LIMIT 10', [school.id]);
                console.log('[LOGIN] Users in this school:', JSON.stringify(allUsers));
            }
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        let storedPassword = user.password;
        if (storedPassword.startsWith('$2y$')) {
            storedPassword = '$2a$' + storedPassword.slice(4);
        }
        const isPasswordValid = await bcrypt.compare(dto.password, storedPassword);
        if (!isPasswordValid) {
            console.log('[LOGIN] Password mismatch for user:', user.id, user.name, '| phone:', user.phone, '| password hash starts:', storedPassword.substring(0, 15));
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        try {
            user.last_login_at = new Date();
            await this.userRepo.save(user);
        }
        catch (e) {
        }
        let userRole = 'student';
        try {
            const roleRow = await this.userRepo.query(`SELECT r.name FROM roles r JOIN model_has_roles mhr ON r.id = mhr.role_id WHERE mhr.model_id = ? AND mhr.model_type = 'App\\\\Models\\\\User' LIMIT 1`, [user.id]);
            if (roleRow && roleRow.length > 0) {
                userRole = this.normalizeRole(roleRow[0].name);
            }
        }
        catch (e) {
        }
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
        try {
            await this.redis.setJson(`session:${user.id}`, payload, 86400 * 7);
        }
        catch (e) {
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
    async superAdminLogin(identifier, password) {
        const user = await this.userRepo
            .createQueryBuilder('u')
            .where('u.school_id IS NULL')
            .andWhere('u.is_active = :active', { active: true })
            .andWhere('u.deleted_at IS NULL')
            .andWhere('(u.email = :identifier OR u.phone = :identifier)', { identifier })
            .getOne();
        if (!user)
            throw new common_1.UnauthorizedException('Invalid credentials');
        let storedPassword = user.password;
        if (storedPassword.startsWith('$2y$')) {
            storedPassword = '$2a$' + storedPassword.slice(4);
        }
        const isPasswordValid = await bcrypt.compare(password, storedPassword);
        if (!isPasswordValid)
            throw new common_1.UnauthorizedException('Invalid credentials');
        const roleRow = await this.userRepo.query(`SELECT r.name FROM roles r JOIN model_has_roles mhr ON r.id = mhr.role_id WHERE mhr.model_id = ? AND mhr.model_type = 'App\\\\Models\\\\User' LIMIT 1`, [user.id]);
        const role = roleRow?.[0]?.name ? this.normalizeRole(roleRow[0].name) : null;
        if (role !== 'super_admin') {
            throw new common_1.ForbiddenException('This account does not have super admin access');
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
    async forgotPassword(schoolCode, identifier) {
        const school = await this.schoolRepo.findOne({ where: { code: schoolCode, is_active: true } });
        if (!school)
            return;
        const user = await this.userRepo
            .createQueryBuilder('u')
            .where('u.school_id = :schoolId', { schoolId: school.id })
            .andWhere('u.is_active = :active', { active: true })
            .andWhere('u.deleted_at IS NULL')
            .andWhere('(u.employee_id = :identifier OR u.email = :identifier OR u.phone = :identifier)', { identifier })
            .getOne();
        if (!user || !user.email)
            return;
        const rawToken = crypto.randomBytes(32).toString('hex');
        const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
        await this.resetRepo.save(this.resetRepo.create({
            user_id: user.id,
            token_hash: tokenHash,
            expires_at: new Date(Date.now() + RESET_TOKEN_TTL_MINUTES * 60 * 1000),
        }));
        const webUrl = this.configService.get('WEB_APP_URL') || 'http://localhost:3000';
        const resetLink = `${webUrl}/reset-password?token=${rawToken}`;
        await this.emailService.send(user.email, 'Reset your School ERP password', `<p>Hi ${user.name},</p><p>Click the link below to reset your password. This link expires in ${RESET_TOKEN_TTL_MINUTES} minutes.</p><p><a href="${resetLink}">${resetLink}</a></p><p>If you didn't request this, you can safely ignore this email.</p>`);
    }
    async resetPassword(rawToken, newPassword) {
        const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
        const resetRequest = await this.resetRepo.findOne({
            where: { token_hash: tokenHash, expires_at: (0, typeorm_2.MoreThan)(new Date()) },
        });
        if (!resetRequest || resetRequest.used_at) {
            throw new common_1.BadRequestException('This reset link is invalid or has expired');
        }
        const user = await this.userRepo.findOne({ where: { id: resetRequest.user_id } });
        if (!user)
            throw new common_1.BadRequestException('This reset link is invalid or has expired');
        user.password = await bcrypt.hash(newPassword, 10);
        await this.userRepo.save(user);
        resetRequest.used_at = new Date();
        await this.resetRepo.save(resetRequest);
    }
    async refreshToken(refreshToken) {
        try {
            const payload = this.jwtService.verify(refreshToken, {
                secret: this.configService.get('JWT_REFRESH_SECRET'),
            });
            const user = await this.userRepo.findOne({
                where: { id: payload.user_id, is_active: true },
            });
            if (!user) {
                throw new common_1.UnauthorizedException('User not found');
            }
            const newPayload = {
                user_id: user.id,
                school_id: user.school_id,
                role: payload.role || 'student',
                permissions: payload.permissions || [],
            };
            const access_token = this.jwtService.sign(newPayload);
            return { access_token };
        }
        catch (error) {
            throw new common_1.UnauthorizedException('Invalid refresh token');
        }
    }
    async changePassword(userId, oldPassword, newPassword) {
        const user = await this.userRepo.findOne({ where: { id: userId } });
        if (!user)
            throw new common_1.BadRequestException('User not found');
        const isOldValid = await bcrypt.compare(oldPassword, user.password);
        if (!isOldValid)
            throw new common_1.BadRequestException('Current password is incorrect');
        user.password = await bcrypt.hash(newPassword, 10);
        await this.userRepo.save(user);
        return { message: 'Password changed successfully' };
    }
    async getProfile(userId) {
        const user = await this.userRepo.findOne({ where: { id: userId } });
        if (!user)
            throw new common_1.BadRequestException('User not found');
        let role = 'student';
        try {
            const roleRow = await this.userRepo.query(`SELECT r.name FROM roles r JOIN model_has_roles mhr ON r.id = mhr.role_id WHERE mhr.model_id = ? AND mhr.model_type = 'App\\\\Models\\\\User' LIMIT 1`, [user.id]);
            if (roleRow && roleRow.length > 0) {
                role = this.normalizeRole(roleRow[0].name);
            }
        }
        catch (e) { }
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
    async getTeacherDetails(userId, schoolId, role) {
        if (role !== 'teacher' && role !== 'incharge')
            return null;
        try {
            const rows = await this.userRepo.query(`SELECT id as teacher_id, designation, department FROM teachers WHERE user_id = ? AND school_id = ? LIMIT 1`, [userId, schoolId]);
            return rows && rows.length > 0 ? rows[0] : null;
        }
        catch (e) {
            return null;
        }
    }
    async getStudentDetails(userId, schoolId, role) {
        if (role !== 'student' && role !== 'parent')
            return null;
        try {
            const rows = await this.userRepo.query(`SELECT s.id as student_id, s.roll_number, s.admission_number, s.class_id, s.section_id,
                c.name as class_name, sec.name as section_name,
                COALESCE(s.father_name, s.guardian_name) as parent_name,
                COALESCE(s.father_phone, s.guardian_phone) as parent_phone
         FROM students s
         LEFT JOIN classes c ON c.id = s.class_id
         LEFT JOIN sections sec ON sec.id = s.section_id
         WHERE s.user_id = ? AND s.school_id = ? LIMIT 1`, [userId, schoolId]);
            return rows && rows.length > 0 ? rows[0] : null;
        }
        catch (e) {
            return null;
        }
    }
    async updateProfile(userId, data) {
        const user = await this.userRepo.findOne({ where: { id: userId } });
        if (!user)
            throw new common_1.BadRequestException('User not found');
        if (data.name)
            user.name = data.name;
        if (data.phone)
            user.phone = data.phone;
        if (data.avatar !== undefined)
            user.avatar = data.avatar;
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
    normalizeRole(dbRoleName) {
        return dbRoleName.replace(/-/g, '_');
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.UserEntity)),
    __param(1, (0, typeorm_1.InjectRepository)(school_entity_1.SchoolEntity)),
    __param(2, (0, typeorm_1.InjectRepository)(password_reset_request_entity_1.PasswordResetRequestEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        jwt_1.JwtService,
        config_1.ConfigService,
        redis_service_1.RedisService,
        email_service_1.EmailService])
], AuthService);
//# sourceMappingURL=auth.service.js.map