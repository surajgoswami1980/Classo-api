"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HostelModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const hostel_controller_1 = require("./hostel.controller");
const hostel_service_1 = require("./hostel.service");
const hostel_block_entity_1 = require("../../entities/hostel-block.entity");
const hostel_room_entity_1 = require("../../entities/hostel-room.entity");
const hostel_allocation_entity_1 = require("../../entities/hostel-allocation.entity");
const student_entity_1 = require("../../entities/student.entity");
let HostelModule = class HostelModule {
};
exports.HostelModule = HostelModule;
exports.HostelModule = HostelModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                hostel_block_entity_1.HostelBlockEntity,
                hostel_room_entity_1.HostelRoomEntity,
                hostel_allocation_entity_1.HostelAllocationEntity,
                student_entity_1.StudentEntity,
            ]),
        ],
        controllers: [hostel_controller_1.HostelController],
        providers: [hostel_service_1.HostelService],
        exports: [hostel_service_1.HostelService],
    })
], HostelModule);
//# sourceMappingURL=hostel.module.js.map