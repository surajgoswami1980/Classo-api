import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransportController } from './transport.controller';
import { TransportService } from './transport.service';
import { TransportRouteEntity } from '../../entities/transport-route.entity';
import { TransportStopEntity } from '../../entities/transport-stop.entity';
import { VehicleEntity } from '../../entities/vehicle.entity';
import { StudentTransportEntity } from '../../entities/student-transport.entity';
import { StudentEntity } from '../../entities/student.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TransportRouteEntity, TransportStopEntity, VehicleEntity, StudentTransportEntity, StudentEntity])],
  controllers: [TransportController],
  providers: [TransportService],
  exports: [TransportService],
})
export class TransportModule {}
