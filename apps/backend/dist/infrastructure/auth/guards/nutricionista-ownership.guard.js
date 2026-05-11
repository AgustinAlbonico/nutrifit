"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NutricionistaOwnershipGuard = void 0;
const common_1 = require("@nestjs/common");
const Rol_1 = require("../../../domain/entities/Usuario/Rol");
const usuario_repository_1 = require("../../../domain/entities/Usuario/usuario.repository");
let NutricionistaOwnershipGuard = class NutricionistaOwnershipGuard {
    usuarioRepository;
    constructor(usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
    }
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        if (user?.rol === Rol_1.Rol.ADMIN) {
            return true;
        }
        const nutricionistaIdParam = request.params?.nutricionistaId;
        if (!nutricionistaIdParam) {
            return true;
        }
        const nutricionistaId = Number(nutricionistaIdParam);
        const userId = user?.id;
        if (!Number.isFinite(nutricionistaId) || !userId) {
            throw new common_1.ForbiddenException('No autorizado');
        }
        const personaId = await this.usuarioRepository.findPersonaIdByUserId(userId);
        if (!personaId || personaId !== nutricionistaId) {
            throw new common_1.ForbiddenException('No tenes permisos para operar sobre otro profesional.');
        }
        return true;
    }
};
exports.NutricionistaOwnershipGuard = NutricionistaOwnershipGuard;
exports.NutricionistaOwnershipGuard = NutricionistaOwnershipGuard = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(usuario_repository_1.USUARIO_REPOSITORY)),
    __metadata("design:paramtypes", [usuario_repository_1.UsuarioRepository])
], NutricionistaOwnershipGuard);
//# sourceMappingURL=nutricionista-ownership.guard.js.map