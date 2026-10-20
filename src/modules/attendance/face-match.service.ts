import { Injectable, Logger } from '@nestjs/common';
import { RekognitionClient, CompareFacesCommand, DetectFacesCommand } from '@aws-sdk/client-rekognition';
import { PlatformSettingsService } from '../../common/providers/platform-settings.service';

export interface FaceCheck {
  ok: boolean;
  score: number | null;
  reason?: string;
}

/**
 * Server-side face verification with AWS Rekognition (paid per image, roughly
 * $1 per 1,000 images — CompareFaces counts as one image).
 *
 * The phone runs a blink/turn liveness challenge and uploads two frames
 * (looking straight + head turned). The server then:
 *   1. checks both frames contain exactly one face,
 *   2. checks the head pose actually changed between frames (yaw), so a
 *      static photo held to the camera fails,
 *   3. compares the straight frame with the approved reference photo.
 * Credentials: the same AWS keys used for SES (Admin → Integrations → Email).
 */
@Injectable()
export class FaceMatchService {
  private readonly logger = new Logger(FaceMatchService.name);
  private client: { rk: RekognitionClient; sig: string } | null = null;

  constructor(private readonly settings: PlatformSettingsService) {}

  private async rekognition(): Promise<RekognitionClient | null> {
    const s = await this.settings.group('email', ['ses_access_key', 'ses_secret_key', 'ses_region'] as const);
    if (!s.ses_access_key || !s.ses_secret_key) return null;
    const sig = `${s.ses_access_key}|${s.ses_secret_key}|${s.ses_region}`;
    if (!this.client || this.client.sig !== sig) {
      this.client = {
        rk: new RekognitionClient({
          region: s.ses_region || 'ap-south-1',
          credentials: { accessKeyId: s.ses_access_key, secretAccessKey: s.ses_secret_key },
        }),
        sig,
      };
    }
    return this.client.rk;
  }

  async isConfigured(): Promise<boolean> {
    return !!(await this.rekognition());
  }

  static decode(b64: string): Buffer | null {
    if (!b64 || typeof b64 !== 'string') return null;
    const clean = b64.replace(/^data:image\/\w+;base64,/, '');
    const buf = Buffer.from(clean, 'base64');
    // JPEG magic number, 5 KB – 4 MB
    if (buf.length < 5_000 || buf.length > 4_000_000 || buf[0] !== 0xff || buf[1] !== 0xd8) return null;
    return buf;
  }

  /** Exactly one face, reasonably sharp. Returns yaw for liveness. */
  async singleFace(image: Buffer): Promise<{ ok: boolean; yaw?: number; reason?: string }> {
    const rk = await this.rekognition();
    if (!rk) return { ok: false, reason: 'Face verification is not configured.' };
    const out = await rk.send(new DetectFacesCommand({ Image: { Bytes: image }, Attributes: ['DEFAULT'] }));
    const faces = (out.FaceDetails || []).filter((f) => (f.Confidence ?? 0) >= 90);
    if (faces.length === 0) return { ok: false, reason: 'No face detected. Hold the phone at eye level in good light.' };
    if (faces.length > 1) return { ok: false, reason: 'More than one face in the frame.' };
    const sharp = faces[0].Quality?.Sharpness ?? 100;
    if (sharp < 20) return { ok: false, reason: 'Photo is blurry. Hold the phone still.' };
    return { ok: true, yaw: faces[0].Pose?.Yaw ?? 0 };
  }

  /**
   * Liveness (head-turn) + identity match.
   * @param straight frame looking at the camera
   * @param turned   frame with the head turned left or right
   */
  async verify(reference: Buffer, straight: Buffer, turned: Buffer | null, threshold: number): Promise<FaceCheck> {
    const rk = await this.rekognition();
    if (!rk) return { ok: false, score: null, reason: 'Face verification is not configured. Ask the admin.' };
    try {
      const a = await this.singleFace(straight);
      if (!a.ok) return { ok: false, score: null, reason: a.reason };
      if (turned) {
        const b = await this.singleFace(turned);
        if (!b.ok) return { ok: false, score: null, reason: b.reason };
        if (Math.abs((b.yaw ?? 0) - (a.yaw ?? 0)) < 12) {
          return { ok: false, score: null, reason: 'Liveness check failed. Turn your head when asked.' };
        }
      }
      const res = await rk.send(
        new CompareFacesCommand({ SourceImage: { Bytes: reference }, TargetImage: { Bytes: straight }, SimilarityThreshold: 70 }),
      );
      const best = Math.max(0, ...(res.FaceMatches || []).map((m) => m.Similarity ?? 0));
      const score = Math.round(best * 100) / 100;
      if (score < threshold) return { ok: false, score, reason: 'Face does not match the registered photo.' };
      return { ok: true, score };
    } catch (e: any) {
      this.logger.error(`Rekognition error: ${e?.name || ''} ${e?.message}`);
      if (e?.name === 'InvalidParameterException') return { ok: false, score: null, reason: 'No clear face found in the photo.' };
      return { ok: false, score: null, reason: 'Face verification is temporarily unavailable. Try again.' };
    }
  }
}
