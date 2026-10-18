import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { CreateEnquiryDto } from './dto/enquiry.dto';

@Injectable()
export class EnquiryService {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async create(dto: CreateEnquiryDto, ip?: string | null) {
    const name = (dto.name || '').trim();
    const email = (dto.email || '').trim().toLowerCase();

    if (!name || name.length < 2) {
      throw new BadRequestException('Please enter your name.');
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new BadRequestException('Please enter a valid email address.');
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
        dto.subject?.trim() || null,
        dto.message?.trim() || null,
        (dto.source || 'website').trim(),
        ip || null,
      ],
    );

    return { id: result.insertId ?? null };
  }
}
