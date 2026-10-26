import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import * as crypto from 'crypto';
import { PlatformSettingsService } from '../../common/providers/platform-settings.service';

/**
 * Uploads a real file to Amazon S3 using the credentials saved by the super
 * admin (Admin → Integrations → Storage). Returns the public S3 URL, which
 * callers store in the DB (e.g. assignment attachment_url).
 *
 * Paths are school-wise:
 *   {school-code}/{folder}/...   e.g. "dav/assignments/ab12.pdf"
 * and "superadmin/{folder}/..." when there is no school in context.
 */
@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);

  // Folders the apps are allowed to upload into.
  private static readonly FOLDERS = new Set([
    'assignments',
    'submissions',
    'events',
    'banners',
    'store',
    'images',
    'documents',
  ]);

  // Allowed content by extension → stored "type" hint.
  private static readonly ALLOWED: Record<string, 'image' | 'pdf' | 'doc'> = {
    jpg: 'image', jpeg: 'image', png: 'image', webp: 'image', gif: 'image',
    pdf: 'pdf',
    doc: 'doc', docx: 'doc', ppt: 'doc', pptx: 'doc', xls: 'doc', xlsx: 'doc', txt: 'doc',
  };

  private static readonly MAX_BYTES = 10 * 1024 * 1024; // 10 MB

  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly settings: PlatformSettingsService,
  ) {}

  async isEnabled(): Promise<boolean> {
    const [enabled, key, secret, bucket, region] = await Promise.all([
      this.settings.bool('storage', 'enabled'),
      this.settings.get('storage', 'key'),
      this.settings.get('storage', 'secret'),
      this.settings.get('storage', 'bucket'),
      this.settings.get('storage', 'region'),
    ]);
    return !!(enabled && key && secret && bucket && region);
  }

  /** Resolve the school's code (lowercased slug) for the path prefix. */
  async prefix(schoolId?: number): Promise<string> {
    if (!schoolId) return 'superadmin';
    try {
      const rows: any[] = await this.dataSource.query(
        'SELECT code FROM schools WHERE id = ? LIMIT 1',
        [schoolId],
      );
      const code = rows?.[0]?.code as string | undefined;
      const slug = code ? this.slug(code) : null;
      return slug || `school-${schoolId}`;
    } catch {
      return `school-${schoolId}`;
    }
  }

  private slug(s: string): string {
    return String(s)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Upload a file and return { url, type }.
   */
  async upload(
    file: Express.Multer.File,
    folder: string,
    schoolId?: number,
  ): Promise<{ url: string; type: 'image' | 'pdf' | 'doc'; name: string; size: number }> {
    if (!file) throw new BadRequestException('No file provided (field name: "file").');
    if (!(await this.isEnabled())) {
      throw new BadRequestException('File storage is not configured. Ask the platform admin to enable S3 in Integrations → Storage.');
    }

    const safeFolder = UploadService.FOLDERS.has(folder) ? folder : 'documents';
    if (file.size > UploadService.MAX_BYTES) {
      throw new BadRequestException('File too large. Maximum size is 10 MB.');
    }

    const ext = (file.originalname.split('.').pop() || '').toLowerCase();
    const type = UploadService.ALLOWED[ext];
    if (!type) {
      throw new BadRequestException('Unsupported file type. Allowed: images, PDF, Office documents.');
    }

    const prefix = await this.prefix(schoolId);
    const name = `${crypto.randomBytes(20).toString('hex')}.${ext}`;
    const key = `${prefix}/${safeFolder}/${name}`;

    const [access, secret, region, bucket, endpoint, baseUrl, pathStyle] = await Promise.all([
      this.settings.get('storage', 'key'),
      this.settings.get('storage', 'secret'),
      this.settings.get('storage', 'region'),
      this.settings.get('storage', 'bucket'),
      this.settings.get('storage', 'endpoint'),
      this.settings.get('storage', 'url'),
      this.settings.bool('storage', 'path_style'),
    ]);

    const client = new S3Client({
      region,
      credentials: { accessKeyId: access as string, secretAccessKey: secret as string },
      ...(endpoint ? { endpoint, forcePathStyle: pathStyle } : {}),
    });

    try {
      await client.send(
        new PutObjectCommand({
          Bucket: bucket as string,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype,
        }),
      );
    } catch (e: any) {
      this.logger.error(`S3 upload failed: ${e?.message}`);
      throw new BadRequestException('Upload failed. Check the S3 credentials and bucket permissions.');
    }

    const url = this.publicUrl({ baseUrl, endpoint, bucket: bucket as string, region: region as string, pathStyle, key });
    return { url, type, name: file.originalname, size: file.size };
  }

  private publicUrl(opts: {
    baseUrl?: string;
    endpoint?: string;
    bucket: string;
    region: string;
    pathStyle: boolean;
    key: string;
  }): string {
    const { baseUrl, endpoint, bucket, region, pathStyle, key } = opts;
    if (baseUrl) return `${baseUrl.replace(/\/$/, '')}/${key}`;
    if (endpoint) {
      const base = endpoint.replace(/\/$/, '');
      return pathStyle ? `${base}/${bucket}/${key}` : `${base.replace('://', `://${bucket}.`)}/${key}`;
    }
    return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
  }
}
