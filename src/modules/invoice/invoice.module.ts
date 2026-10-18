import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { InvoiceController } from './invoice.controller';
import { InvoiceAggregatorService } from './invoice-aggregator.service';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_SECRET') || 'fallback-secret',
      }),
    }),
  ],
  controllers: [InvoiceController],
  providers: [InvoiceAggregatorService],
})
export class InvoiceModule {}
