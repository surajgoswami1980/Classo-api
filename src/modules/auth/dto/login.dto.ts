import { IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SchoolLookupDto {
  @ApiProperty({ description: 'School code (unique identifier displayed to users)' })
  @IsNotEmpty()
  @IsString()
  school_code: string;
}

export class LoginDto {
  @ApiProperty({ description: 'School code to identify the tenant' })
  @IsNotEmpty()
  @IsString()
  school_code: string;

  @ApiProperty({ description: 'Employee ID, Registration ID, Email, or Phone' })
  @IsNotEmpty()
  @IsString()
  identifier: string; // emp_id, registration_id, email, or phone

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  password: string;

  @ApiProperty({ description: 'Platform: web, android, ios', required: false })
  @IsOptional()
  @IsString()
  platform?: string;
}

export class SuperAdminLoginDto {
  @ApiProperty({ description: 'Email or phone' })
  @IsNotEmpty()
  @IsString()
  identifier: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  password: string;
}

export class ForgotPasswordDto {
  @ApiProperty({ description: 'School code to identify the tenant' })
  @IsNotEmpty()
  @IsString()
  school_code: string;

  @ApiProperty({ description: 'Employee ID, Registration ID, Email, or Phone' })
  @IsNotEmpty()
  @IsString()
  identifier: string;
}

export class ResetPasswordDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  token: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  new_password: string;
}

export class RefreshTokenDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  refresh_token: string;
}

export class RequestOtpDto {
  @ApiProperty({ description: 'School code to identify the tenant' })
  @IsNotEmpty()
  @IsString()
  school_code: string;

  @ApiProperty({ description: 'Email or mobile number registered on the account' })
  @IsNotEmpty()
  @IsString()
  identifier: string;

  @ApiProperty({ description: 'Delivery channel: email or mobile', required: false })
  @IsOptional()
  @IsString()
  channel?: 'email' | 'mobile';
}

export class VerifyOtpDto {
  @ApiProperty({ description: 'School code to identify the tenant' })
  @IsNotEmpty()
  @IsString()
  school_code: string;

  @ApiProperty({ description: 'The same email or mobile the OTP was sent to' })
  @IsNotEmpty()
  @IsString()
  identifier: string;

  @ApiProperty({ description: '6-digit OTP' })
  @IsNotEmpty()
  @IsString()
  otp: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  platform?: string;
}

export class SuperAdminRequestOtpDto {
  @ApiProperty({ description: 'Email or mobile of the super-admin account' })
  @IsNotEmpty()
  @IsString()
  identifier: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  channel?: 'email' | 'mobile';
}

export class SuperAdminVerifyOtpDto {
  @ApiProperty({ description: 'Email or mobile the OTP was sent to' })
  @IsNotEmpty()
  @IsString()
  identifier: string;

  @ApiProperty({ description: '6-digit OTP' })
  @IsNotEmpty()
  @IsString()
  otp: string;
}
