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
exports.SettingsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const school_entity_1 = require("../../entities/school.entity");
const academic_session_entity_1 = require("../../entities/academic-session.entity");
const DEFAULT_SETTINGS = {
    grading_scale: 'percentage',
    attendance_threshold_percent: 75,
    fee_late_penalty_per_day: 0,
    library_fine_per_day: 2,
    working_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
};
let SettingsService = class SettingsService {
    constructor(schoolRepo, sessionRepo) {
        this.schoolRepo = schoolRepo;
        this.sessionRepo = sessionRepo;
    }
    async getSettings(schoolId) {
        const school = await this.schoolRepo.findOne({ where: { id: schoolId } });
        if (!school)
            throw new common_1.NotFoundException('School not found');
        return { ...DEFAULT_SETTINGS, ...(school.settings || {}) };
    }
    async updateSettings(schoolId, dto) {
        const school = await this.schoolRepo.findOne({ where: { id: schoolId } });
        if (!school)
            throw new common_1.NotFoundException('School not found');
        school.settings = { ...DEFAULT_SETTINGS, ...(school.settings || {}), ...dto };
        await this.schoolRepo.save(school);
        return school.settings;
    }
    async getAcademicYear(schoolId) {
        const current = await this.sessionRepo.findOne({ where: { school_id: schoolId, is_current: 1 } });
        const all = await this.sessionRepo.find({ where: { school_id: schoolId }, order: { start_date: 'DESC' } });
        return { current, all };
    }
    async updateAcademicYear(schoolId, dto) {
        let session = await this.sessionRepo.findOne({ where: { school_id: schoolId, name: dto.name } });
        if (session) {
            session.start_date = dto.start_date;
            session.end_date = dto.end_date;
        }
        else {
            session = this.sessionRepo.create({
                school_id: schoolId,
                name: dto.name,
                start_date: dto.start_date,
                end_date: dto.end_date,
                is_current: 0,
            });
        }
        if (dto.make_current) {
            await this.sessionRepo.update({ school_id: schoolId }, { is_current: 0 });
            session.is_current = 1;
        }
        return this.sessionRepo.save(session);
    }
};
exports.SettingsService = SettingsService;
exports.SettingsService = SettingsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(school_entity_1.SchoolEntity)),
    __param(1, (0, typeorm_1.InjectRepository)(academic_session_entity_1.AcademicSessionEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], SettingsService);
//# sourceMappingURL=settings.service.js.map