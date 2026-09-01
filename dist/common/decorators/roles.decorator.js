"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Roles = exports.ROLES_KEY = exports.UserRole = void 0;
const common_1 = require("@nestjs/common");
var UserRole;
(function (UserRole) {
    UserRole["SUPER_ADMIN"] = "super_admin";
    UserRole["SCHOOL_ADMIN"] = "school_admin";
    UserRole["SUB_ADMIN"] = "sub_admin";
    UserRole["TEACHER"] = "teacher";
    UserRole["STUDENT"] = "student";
    UserRole["PARENT"] = "parent";
    UserRole["STAFF"] = "staff";
    UserRole["INCHARGE"] = "incharge";
})(UserRole || (exports.UserRole = UserRole = {}));
exports.ROLES_KEY = 'roles';
const Roles = (...roles) => (0, common_1.SetMetadata)(exports.ROLES_KEY, roles);
exports.Roles = Roles;
//# sourceMappingURL=roles.decorator.js.map