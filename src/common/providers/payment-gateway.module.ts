import { Module, Global } from '@nestjs/common';
import { PaymentGatewayService } from './payment-gateway.service';
import { PlatformSettingsService } from './platform-settings.service';

@Global()
@Module({
  providers: [PlatformSettingsService, PaymentGatewayService],
  exports: [PlatformSettingsService, PaymentGatewayService],
})
export class PaymentGatewayModule {}
