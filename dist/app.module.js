"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const event_emitter_1 = require("@nestjs/event-emitter");
const database_config_1 = require("./config/database.config");
const redis_config_1 = require("./config/redis.config");
const tenant_middleware_1 = require("./common/middlewares/tenant.middleware");
const redis_module_1 = require("./common/providers/redis.module");
const auth_module_1 = require("./modules/auth/auth.module");
const school_module_1 = require("./modules/school/school.module");
const student_module_1 = require("./modules/student/student.module");
const teacher_module_1 = require("./modules/teacher/teacher.module");
const attendance_module_1 = require("./modules/attendance/attendance.module");
const fee_module_1 = require("./modules/fee/fee.module");
const exam_module_1 = require("./modules/exam/exam.module");
const timetable_module_1 = require("./modules/timetable/timetable.module");
const assignment_module_1 = require("./modules/assignment/assignment.module");
const notification_module_1 = require("./modules/notification/notification.module");
const transport_module_1 = require("./modules/transport/transport.module");
const library_module_1 = require("./modules/library/library.module");
const event_module_1 = require("./modules/event/event.module");
const hostel_module_1 = require("./modules/hostel/hostel.module");
const inventory_module_1 = require("./modules/inventory/inventory.module");
const payroll_module_1 = require("./modules/payroll/payroll.module");
const settings_module_1 = require("./modules/settings/settings.module");
const report_module_1 = require("./modules/report/report.module");
const super_admin_module_1 = require("./modules/super-admin/super-admin.module");
let AppModule = class AppModule {
    configure(consumer) {
        consumer
            .apply(tenant_middleware_1.TenantMiddleware)
            .exclude('auth/{*path}', 'super-admin/{*path}', 'api/docs/{*path}')
            .forRoutes('*path');
    }
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true, load: [database_config_1.databaseConfig, redis_config_1.redisConfig] }),
            event_emitter_1.EventEmitterModule.forRoot(),
            typeorm_1.TypeOrmModule.forRootAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (config) => ({
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
            redis_module_1.RedisModule,
            auth_module_1.AuthModule,
            school_module_1.SchoolModule,
            student_module_1.StudentModule,
            teacher_module_1.TeacherModule,
            attendance_module_1.AttendanceModule,
            fee_module_1.FeeModule,
            exam_module_1.ExamModule,
            timetable_module_1.TimetableModule,
            assignment_module_1.AssignmentModule,
            notification_module_1.NotificationModule,
            transport_module_1.TransportModule,
            library_module_1.LibraryModule,
            event_module_1.EventModule,
            hostel_module_1.HostelModule,
            inventory_module_1.InventoryModule,
            payroll_module_1.PayrollModule,
            settings_module_1.SettingsModule,
            report_module_1.ReportModule,
            super_admin_module_1.SuperAdminModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map