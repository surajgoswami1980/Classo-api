import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { UserEntity } from '../../entities/user.entity';
import { SchoolEntity } from '../../entities/school.entity';
import { PasswordResetRequestEntity } from '../../entities/password-reset-request.entity';
import { EmailService } from '../../common/providers/email.service';
import { SmsService } from '../../common/providers/sms.service';
import { OtpService } from '../../common/providers/otp.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity, SchoolEntity, PasswordResetRequestEntity]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_SECRET'),
        signOptions: { expiresIn: config.get('JWT_EXPIRES_IN') || '7d' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, EmailService, SmsService, OtpService],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
