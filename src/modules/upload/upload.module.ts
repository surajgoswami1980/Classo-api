import { Module } from '@nestjs/common';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';

/**
 * File uploads to S3. PlatformSettingsService is provided globally by
 * PaymentGatewayModule, so no extra imports are needed.
 */
@Module({
  controllers: [UploadController],
  providers: [UploadService],
  exports: [UploadService],
})
export class UploadModule {}
