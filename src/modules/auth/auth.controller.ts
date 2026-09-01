import { Controller, Post, Body, UseGuards, Get, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto, SchoolLookupDto, RefreshTokenDto, SuperAdminLoginDto, ForgotPasswordDto, ResetPasswordDto } from './dto/login.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('lookup-school')
  @ApiOperation({ summary: 'Step 1: Find school by code (before login screen)' })
  async lookupSchool(@Body() dto: SchoolLookupDto) {
    const result = await this.authService.lookupSchool(dto);
    return { success: true, data: result };
  }

  @Post('login')
  @ApiOperation({ summary: 'Step 2: Login with school + credentials' })
  async login(@Body() dto: LoginDto) {
    const result = await this.authService.login(dto);
    return { success: true, data: result };
  }

  @Post('super-admin-login')
  @ApiOperation({ summary: 'Login for platform super admins (no school context)' })
  async superAdminLogin(@Body() dto: SuperAdminLoginDto) {
    const result = await this.authService.superAdminLogin(dto.identifier, dto.password);
    return { success: true, data: result };
  }

  @Post('forgot-password')
  @ApiOperation({ summary: 'Request a password reset email' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.authService.forgotPassword(dto.school_code, dto.identifier);
    return { success: true, message: 'If an account matches, a reset link has been sent to its email address.' };
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Complete a password reset using the emailed token' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.authService.resetPassword(dto.token, dto.new_password);
    return { success: true, message: 'Password reset successfully. You can now log in.' };
  }

  @Post('refresh-token')
  @ApiOperation({ summary: 'Refresh access token' })
  async refreshToken(@Body() dto: RefreshTokenDto) {
    const result = await this.authService.refreshToken(dto.refresh_token);
    return { success: true, data: result };
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change password for authenticated user' })
  async changePassword(
    @CurrentUser('user_id') userId: number,
    @Body() body: { old_password: string; new_password: string },
  ) {
    const result = await this.authService.changePassword(userId, body.old_password, body.new_password);
    return { success: true, data: result };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  async getProfile(@CurrentUser('user_id') userId: number) {
    const result = await this.authService.getProfile(userId);
    return { success: true, data: result };
  }

  @Post('update-profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user profile (name, phone, avatar)' })
  async updateProfile(
    @CurrentUser('user_id') userId: number,
    @Body() body: { name?: string; phone?: string; avatar?: string },
  ) {
    const result = await this.authService.updateProfile(userId, body);
    return { success: true, data: result };
  }
}
