import { AuthService } from './auth.service';
import { LoginDto, SchoolLookupDto, RefreshTokenDto, SuperAdminLoginDto, ForgotPasswordDto, ResetPasswordDto } from './dto/login.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    lookupSchool(dto: SchoolLookupDto): Promise<{
        success: boolean;
        data: {
            school_id: number;
            name: string;
            code: string;
            logo_url: string;
            primary_color: string;
            board_affiliation: string;
        };
    }>;
    login(dto: LoginDto): Promise<{
        success: boolean;
        data: {
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
        };
    }>;
    superAdminLogin(dto: SuperAdminLoginDto): Promise<{
        success: boolean;
        data: {
            access_token: string;
            refresh_token: string;
            user: {
                id: number;
                name: string;
                email: string;
                phone: string;
                role: string;
            };
        };
    }>;
    forgotPassword(dto: ForgotPasswordDto): Promise<{
        success: boolean;
        message: string;
    }>;
    resetPassword(dto: ResetPasswordDto): Promise<{
        success: boolean;
        message: string;
    }>;
    refreshToken(dto: RefreshTokenDto): Promise<{
        success: boolean;
        data: {
            access_token: string;
        };
    }>;
    changePassword(userId: number, body: {
        old_password: string;
        new_password: string;
    }): Promise<{
        success: boolean;
        data: {
            message: string;
        };
    }>;
    getProfile(userId: number): Promise<{
        success: boolean;
        data: {
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
        };
    }>;
    updateProfile(userId: number, body: {
        name?: string;
        phone?: string;
        avatar?: string;
    }): Promise<{
        success: boolean;
        data: {
            id: number;
            name: string;
            email: string;
            phone: string;
            avatar: string;
            message: string;
        };
    }>;
}
