import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { StudentEntity } from '../../entities/student.entity';

export type BannerPlacement = 'slider' | 'popup';

/**
 * Serves school banners to the student/parent/teacher apps. Banners are
 * authored in the Laravel admin (banners table). We resolve the viewer's
 * class/section (for students) and return only banners whose audience
 * matches: all | their class | their section. Date window + is_active are
 * also enforced.
 */
@Injectable()
export class BannerService {
  constructor(
    @InjectRepository(StudentEntity) private studentRepo: Repository<StudentEntity>,
    private config: ConfigService,
  ) {}

  /** Build an absolute URL for a stored public-disk path. */
  private assetUrl(path?: string | null): string | null {
    if (!path) return null;
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    const base = (this.config.get('ADMIN_PUBLIC_URL') || 'http://localhost:8000').replace(/\/$/, '');
    return `${base}/storage/${path}`;
  }

  /**
   * Resolve the viewer's class/section so class/section-targeted banners can
   * be matched. Non-students (teachers) see only 'all' banners.
   */
  private async resolveAudience(schoolId: number, userId: number, role: string) {
    if (role === 'student' || role === 'parent') {
      const rows = await this.studentRepo.query(
        `SELECT class_id, section_id FROM students WHERE user_id = ? AND school_id = ? LIMIT 1`,
        [userId, schoolId],
      );
      if (rows?.length) return { classId: rows[0].class_id, sectionId: rows[0].section_id };
    }
    return { classId: null, sectionId: null };
  }

  async getBanners(
    schoolId: number,
    userId: number,
    role: string,
    placement?: BannerPlacement,
  ) {
    const { classId, sectionId } = await this.resolveAudience(schoolId, userId, role);

    const params: any[] = [schoolId];
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

    // Audience match: 'all' always; 'class' if same class; 'section' if same section.
    sql += ` AND (
      audience_type = 'all'
      OR (audience_type = 'class' AND class_id = ?)
      OR (audience_type = 'section' AND section_id = ?)
    )`;
    params.push(classId ?? -1, sectionId ?? -1);

    sql += ' ORDER BY sort_order ASC, id DESC';

    const rows = await this.studentRepo.query(sql, params);

    return rows.map((b: any) => ({
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

  /** The single active popup for this viewer (if any). */
  async getPopup(schoolId: number, userId: number, role: string) {
    const popups = await this.getBanners(schoolId, userId, role, 'popup');
    return popups.length ? popups[0] : null;
  }
}
