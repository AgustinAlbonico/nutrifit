"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Rol = exports.ROLE_KEY = void 0;
const common_1 = require("@nestjs/common");
exports.ROLE_KEY = 'rol';
const Rol = (...roles) => (0, common_1.SetMetadata)(exports.ROLE_KEY, roles);
exports.Rol = Rol;
//# sourceMappingURL=role.decorator.js.map