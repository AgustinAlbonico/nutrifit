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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActionsGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const actions_decorator_1 = require("../decorators/actions.decorator");
const permisos_service_1 = require("../../../application/permisos/permisos.service");
const Rol_1 = require("../../../domain/entities/Usuario/Rol");
let ActionsGuard = class ActionsGuard {
    reflector;
    permisosService;
    constructor(reflector, permisosService) {
        this.reflector = reflector;
        this.permisosService = permisosService;
    }
    async canActivate(context) {
        const requiredActions = this.reflector.getAllAndOverride(actions_decorator_1.ACTIONS_KEY, [
            context.getHandler(),
            context.getClass(),
        ]) ?? [];
        if (!requiredActions.length) {
            return true;
        }
        const request = context.switchToHttp().getRequest();
        const userId = request.user?.id;
        if (!userId) {
            throw new common_1.ForbiddenException('No autorizado');
        }
        if (request.user?.rol === Rol_1.Rol.ADMIN) {
            return true;
        }
        const hasPermission = await this.permisosService.hasAllActions(userId, requiredActions);
        if (!hasPermission) {
            throw new common_1.ForbiddenException(`Permisos insuficientes: ${requiredActions.join(', ')}`);
        }
        return true;
    }
};
exports.ActionsGuard = ActionsGuard;
exports.ActionsGuard = ActionsGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector,
        permisos_service_1.PermisosService])
], ActionsGuard);
//# sourceMappingURL=actions.guard.js.map