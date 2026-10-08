import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserEntity } from '../../entities/user.entity';
import { SchoolEntity } from '../../entities/school.entity';
import { PasswordResetRequestEntity } from '../../entities/password-reset-request.entity';
import { LoginDto, SchoolLookupDto } from './dto/login.dto';
import { RedisService } from '../../common/providers/redis.service';
import { EmailService } from '../../common/providers/email.service';
import { OtpService, OtpChannel } from '../../common/providers/otp.service';
export declare class AuthService {
    private userRepo;
    private schoolRepo;
    private resetRepo;
    private jwtService;
    private configService;
    private redis;
    private emailService;
    private otpService;
    constructor(userRepo: Repository<UserEntity>, schoolRepo: Repository<SchoolEntity>, resetRepo: Repository<PasswordResetRequestEntity>, jwtService: JwtService, configService: ConfigService, redis: RedisService, emailService: EmailService, otpService: OtpService);
    lookupSchool(dto: SchoolLookupDto): Promise<{
        school_id: number;
        name: string;
        code: string;
        logo_url: string;
        primary_color: string;
        board_affiliation: string;
    }>;
    login(dto: LoginDto): Promise<{
        access_token: string;
        refresh_token: string;
        user: {
            teacher_id: any;
            designation: any;
            department: any;
            student_id: any;
            roll_number: any;
            admission_number: any;
            class_name: any;
            section_name: any;
            class_id: any;
            section_id: any;
            id: number;
            name: string;
            email: string;
            phone: string;
            role: string;
            profile_image: string;
            permissions: any[];
        };
        school: {
            id: number;
            name: string;
            code: string;
            logo_url: string;
            primary_color: string;
        };
    }>;
    private buildSession;
    private resolveOtpConfig;
    private findSchoolByCode;
    private isEmail;
    private findSchoolUserByIdentifier;
    getOtpAvailability(schoolCode: string): Promise<{
        otp_login_enabled: boolean;
        channels: OtpChannel[];
    }>;
    requestOtp(schoolCode: string, identifier: string, channel?: OtpChannel): Promise<{
        sent: boolean;
        channel: OtpChannel;
        masked: string;
    } | {
        dev_otp?: string;
        sent: boolean;
        channel: OtpChannel;
        masked: string;
        cooldown: number;
    }>;
    verifyOtp(schoolCode: string, identifier: string, otp: string): Promise<{
        access_token: string;
        refresh_token: string;
        user: {
            teacher_id: any;
            designation: any;
            department: any;
            student_id: any;
            roll_number: any;
            admission_number: any;
            class_name: any;
            section_name: any;
            class_id: any;
            section_id: any;
            id: number;
            name: string;
            email: string;
            phone: string;
            role: string;
            profile_image: string;
            permissions: any[];
        };
        school: {
            id: number;
            name: string;
            code: string;
            logo_url: string;
            primary_color: string;
        };
    }>;
    private findSuperAdminByIdentifier;
    requestSuperAdminOtp(identifier: string, channel?: OtpChannel): Promise<{
        sent: boolean;
        channel: OtpChannel;
        masked: string;
    } | {
        dev_otp?: string;
        sent: boolean;
        channel: OtpChannel;
        masked: string;
        cooldown: number;
    }>;
    verifySuperAdminOtp(identifier: string, otp: string): Promise<{
        access_token: string;
        refresh_token: string;
        user: {
            id: number;
            name: string;
            email: string;
            phone: string;
            role: string;
        };
    }>;
    private mask;
    superAdminLogin(identifier: string, password: string): Promise<{
        access_token: string;
        refresh_token: string;
        user: {
            id: number;
            name: string;
            email: string;
            phone: string;
            role: string;
        };
    }>;
    forgotPassword(schoolCode: string, identifier: string): Promise<void>;
    resetPassword(rawToken: string, newPassword: string): Promise<void>;
    refreshToken(refreshToken: string): Promise<{
        access_token: string;
    }>;
    changePassword(userId: number, oldPassword: string, newPassword: string): Promise<{
        message: string;
    }>;
    getProfile(userId: number): Promise<{
        teacher_id: any;
        student_id: any;
        roll_number: any;
        admission_number: any;
        class_name: any;
        section_name: any;
        class_id: any;
        section_id: any;
        parent_name: any;
        parent_phone: any;
        id: number;
        name: string;
        email: string;
        phone: string;
        avatar: string;
        role: string;
        school_id: number;
        employee_id: string;
        designation: string;
        department: string;
    }>;
    private getTeacherDetails;
    private getStudentDetails;
    updateProfile(userId: number, data: {
        name?: string;
        phone?: string;
        avatar?: string;
    }): Promise<{
        id: number;
        name: string;
        email: string;
        phone: string;
        avatar: string;
        message: string;
    }>;
    private normalizeRole;
}
