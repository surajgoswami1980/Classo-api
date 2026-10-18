import { Module, Global } from '@nestjs/common';
import { PaymentGatewayService } from './payment-gateway.service';

@Global()
@Module({
  providers: [PaymentGatewayService],
  exports: [PaymentGatewayService],
})
export class PaymentGatewayModule {}
