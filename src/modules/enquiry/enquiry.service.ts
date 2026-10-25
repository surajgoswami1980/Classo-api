import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { CreateEnquiryDto } from './dto/enquiry.dto';

@Injectable()
export class EnquiryService {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  // Sources the public form may set. Anything else is stored as 'website'.
  private static readonly SOURCES = [
    'website', 'contact', 'contact_page', 'landing_contact', 'pricing', 'demo', 'home', 'app',
    'account_deletion', 'privacy_request',
  ];

  async create(dto: CreateEnquiryDto, ip?: string | null) {
    const name = (dto.name || '').trim().slice(0, 150);
    const email = (dto.email || '').trim().toLowerCase().slice(0, 150);

    if (!name || name.length < 2) {
      throw new BadRequestException('Please enter your name.');
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new BadRequestException('Please enter a valid email address.');
    }
    const source = EnquiryService.SOURCES.includes(String(dto.source || '').trim()) ? String(dto.source).trim() : 'website';
    // Privacy / deletion requests must explain who they are (school + role).
    if ((source === 'account_deletion' || source === 'privacy_request') && !dto.organization?.trim()) {
      throw new BadRequestException('Please enter your school name or code so we can find your account.');
    }
    // Basic per-IP throttle for the public endpoint (10 per hour).
    if (ip) {
      const [{ n }] = await this.dataSource.query(
        'SELECT COUNT(*) AS n FROM enquiries WHERE ip_address = ? AND created_at > NOW() - INTERVAL 1 HOUR',
        [ip],
      );
      if (Number(n) >= 10) throw new BadRequestException('Too many requests. Please try again later.');
    }

    const result = await this.dataSource.query(
      `INSERT INTO enquiries
         (name, email, phone, organization, city, student_count, subject, message, source, status, ip_address, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'new', ?, NOW(), NOW())`,
      [
        name,
        email,
        dto.phone?.trim() || null,
        dto.organization?.trim() || null,
        dto.city?.trim() || null,
        dto.student_count ?? null,
        dto.subject?.trim()?.slice(0, 200) || (source === 'account_deletion' ? 'Account deletion request' : null),
        dto.message?.trim()?.slice(0, 5000) || null,
        source,
        ip || null,
      ],
    );

    return { id: result.insertId ?? null };
  }
}
