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
exports.BannerService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const config_1 = require("@nestjs/config");
const student_entity_1 = require("../../entities/student.entity");
let BannerService = class BannerService {
    constructor(studentRepo, config) {
        this.studentRepo = studentRepo;
        this.config = config;
    }
    assetUrl(path) {
        if (!path)
            return null;
        if (path.startsWith('http://') || path.startsWith('https://'))
            return path;
        const base = (this.config.get('ADMIN_PUBLIC_URL') || 'http://localhost:8000').replace(/\/$/, '');
        return `${base}/storage/${path}`;
    }
    async resolveAudience(schoolId, userId, role) {
        if (role === 'student' || role === 'parent') {
            const rows = await this.studentRepo.query(`SELECT class_id, section_id FROM students WHERE user_id = ? AND school_id = ? LIMIT 1`, [userId, schoolId]);
            if (rows?.length)
                return { classId: rows[0].class_id, sectionId: rows[0].section_id };
        }
        return { classId: null, sectionId: null };
    }
    async getBanners(schoolId, userId, role, placement) {
        const { classId, sectionId } = await this.resolveAudience(schoolId, userId, role);
        const params = [schoolId];
        let sql = `
      SELECT id, title, image, thumbnail, placement, link_type, event_id, link_url,
             audience_type, class_id, section_id, sort_order
      FROM banners
      WHERE school_id = ?
        AND is_active = 1
        AND (start_date IS NULL OR start_date <= CURDATE())
        AND (end_date IS NULL OR end_date >= CURDATE())
    `;
        if (placement) {
            sql += ' AND placement = ?';
            params.push(placement);
        }
        sql += ` AND (
      audience_type = 'all'
      OR (audience_type = 'class' AND class_id = ?)
      OR (audience_type = 'section' AND section_id = ?)
    )`;
        params.push(classId ?? -1, sectionId ?? -1);
        sql += ' ORDER BY sort_order ASC, id DESC';
        const rows = await this.studentRepo.query(sql, params);
        return rows.map((b) => ({
            id: b.id,
            title: b.title,
            image_url: this.assetUrl(b.image),
            thumbnail_url: this.assetUrl(b.thumbnail || b.image),
            placement: b.placement,
            link_type: b.link_type,
            event_id: b.event_id,
            link_url: b.link_url,
        }));
    }
    async getPopup(schoolId, userId, role) {
        const popups = await this.getBanners(schoolId, userId, role, 'popup');
        return popups.length ? popups[0] : null;
    }
};
exports.BannerService = BannerService;
exports.BannerService = BannerService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(student_entity_1.StudentEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        config_1.ConfigService])
], BannerService);
//# sourceMappingURL=banner.service.js.map