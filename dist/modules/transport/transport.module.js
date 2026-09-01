"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransportModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const transport_controller_1 = require("./transport.controller");
const transport_service_1 = require("./transport.service");
const transport_route_entity_1 = require("../../entities/transport-route.entity");
const transport_stop_entity_1 = require("../../entities/transport-stop.entity");
const vehicle_entity_1 = require("../../entities/vehicle.entity");
const student_transport_entity_1 = require("../../entities/student-transport.entity");
const student_entity_1 = require("../../entities/student.entity");
let TransportModule = class TransportModule {
};
exports.TransportModule = TransportModule;
exports.TransportModule = TransportModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([transport_route_entity_1.TransportRouteEntity, transport_stop_entity_1.TransportStopEntity, vehicle_entity_1.VehicleEntity, student_transport_entity_1.StudentTransportEntity, student_entity_1.StudentEntity])],
        controllers: [transport_controller_1.TransportController],
        providers: [transport_service_1.TransportService],
        exports: [transport_service_1.TransportService],
    })
], TransportModule);
//# sourceMappingURL=transport.module.js.map