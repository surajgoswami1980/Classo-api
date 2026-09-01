"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeeModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const fee_controller_1 = require("./fee.controller");
const fee_service_1 = require("./fee.service");
const fee_structure_entity_1 = require("../../entities/fee-structure.entity");
const fee_invoice_entity_1 = require("../../entities/fee-invoice.entity");
const payment_transaction_entity_1 = require("../../entities/payment-transaction.entity");
const student_entity_1 = require("../../entities/student.entity");
let FeeModule = class FeeModule {
};
exports.FeeModule = FeeModule;
exports.FeeModule = FeeModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                fee_structure_entity_1.FeeStructureEntity,
                fee_invoice_entity_1.FeeInvoiceEntity,
                payment_transaction_entity_1.PaymentTransactionEntity,
                student_entity_1.StudentEntity,
            ]),
        ],
        controllers: [fee_controller_1.FeeController],
        providers: [fee_service_1.FeeService],
        exports: [fee_service_1.FeeService],
    })
], FeeModule);
//# sourceMappingURL=fee.module.js.map