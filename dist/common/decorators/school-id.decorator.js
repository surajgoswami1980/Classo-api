"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchoolId = void 0;
const common_1 = require("@nestjs/common");
exports.SchoolId = (0, common_1.createParamDecorator)((data, ctx) => {
    const request = ctx.switchToHttp().getRequest();
    return request['school_id'] || request.user?.school_id;
});
//# sourceMappingURL=school-id.decorator.js.map