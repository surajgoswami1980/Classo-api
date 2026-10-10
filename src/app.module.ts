import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';

// Config
import { databaseConfig } from './config/database.config';
import { redisConfig } from './config/redis.config';

// Common
import { TenantMiddleware } from './common/middlewares/tenant.middleware';
import { RedisModule } from './common/providers/redis.module';

// Modules
import { AuthModule } from './modules/auth/auth.module';
import { SchoolModule } from './modules/school/school.module';
import { StudentModule } from './modules/student/student.module';
import { TeacherModule } from './modules/teacher/teacher.module';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { FeeModule } from './modules/fee/fee.module';
import { ExamModule } from './modules/exam/exam.module';
import { TimetableModule } from './modules/timetable/timetable.module';
import { AssignmentModule } from './modules/assignment/assignment.module';
import { NotificationModule } from './modules/notification/notification.module';
import { TransportModule } from './modules/transport/transport.module';
import { LibraryModule } from './modules/library/library.module';
import { EventModule } from './modules/event/event.module';
import { HostelModule } from './modules/hostel/hostel.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { PayrollModule } from './modules/payroll/payroll.module';
import { SettingsModule } from './modules/settings/settings.module';
import { ReportModule } from './modules/report/report.module';
import { SuperAdminModule } from './modules/super-admin/super-admin.module';
import { BannerModule } from './modules/banner/banner.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({ isGlobal: true, load: [databaseConfig, redisConfig] }),
    EventEmitterModule.forRoot(),

    // Database
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mysql',
        host: config.get('database.host'),
        port: config.get('database.port'),
        username: config.get('database.username'),
        password: config.get('database.password'),
        database: config.get('database.name'),
        entities: [__dirname + '/entities/**/*.entity{.ts,.js}'],
        synchronize: false,
        logging: config.get('database.logging') || false,
      }),
    }),

    // Redis
    RedisModule,

    // Feature Modules
    AuthModule,
    SchoolModule,
    StudentModule,
    TeacherModule,
    AttendanceModule,
    FeeModule,
    ExamModule,
    TimetableModule,
    AssignmentModule,
    NotificationModule,
    TransportModule,
    LibraryModule,
    EventModule,
    HostelModule,
    InventoryModule,
    PayrollModule,
    SettingsModule,
    ReportModule,
    SuperAdminModule,
    BannerModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TenantMiddleware)
      .exclude('auth/{*path}', 'super-admin/{*path}', 'api/docs/{*path}')
      .forRoutes('*path');
  }
}
