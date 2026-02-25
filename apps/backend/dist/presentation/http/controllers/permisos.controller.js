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
exports.PermisosController = void 0;
const common_1 = require("@nestjs/common");
const permisos_service_1 = require("../../../application/permisos/permisos.service");
const asignar_acciones_dto_1 = require("../../../application/permisos/dtos/asignar-acciones.dto");
const asignar_grupos_dto_1 = require("../../../application/permisos/dtos/asignar-grupos.dto");
const create_accion_dto_1 = require("../../../application/permisos/dtos/create-accion.dto");
const create_grupo_permiso_dto_1 = require("../../../application/permisos/dtos/create-grupo-permiso.dto");
const update_accion_dto_1 = require("../../../application/permisos/dtos/update-accion.dto");
const update_grupo_permiso_dto_1 = require("../../../application/permisos/dtos/update-grupo-permiso.dto");
const actions_decorator_1 = require("../../../infrastructure/auth/decorators/actions.decorator");
const role_decorator_1 = require("../../../infrastructure/auth/decorators/role.decorator");
const auth_guard_1 = require("../../../infrastructure/auth/guards/auth.guard");
const actions_guard_1 = require("../../../infrastructure/auth/guards/actions.guard");
const roles_guard_1 = require("../../../infrastructure/auth/guards/roles.guard");
const Rol_1 = require("../../../domain/entities/Usuario/Rol");
let PermisosController = class PermisosController {
    permisosService;
    constructor(permisosService) {
        this.permisosService = permisosService;
    }
    async listarAcciones() {
        return this.permisosService.listarAcciones();
    }
    async crearAccion(dto) {
        return this.permisosService.crearAccion(dto);
    }
    async editarAccion(actionId, dto) {
        return this.permisosService.actualizarAccion(actionId, dto);
    }
    async listarGrupos() {
        return this.permisosService.listarGrupos();
    }
    async crearGrupo(dto) {
        return this.permisosService.crearGrupo(dto);
    }
    async editarGrupo(groupId, dto) {
        return this.permisosService.actualizarGrupo(groupId, dto);
    }
    async asignarAccionesAGrupo(groupId, dto) {
        return this.permisosService.asignarAccionesAGrupo(groupId, dto.actionIds);
    }
    async asignarGruposAUsuario(userId, dto) {
        return this.permisosService.asignarGruposAUsuario(userId, dto.groupIds);
    }
    async asignarAccionesAUsuario(userId, dto) {
        return this.permisosService.asignarAccionesAUsuario(userId, dto.actionIds);
    }
    async accionesDeUsuario(userId) {
        return this.permisosService.getAccionesEfectivasUsuario(userId);
    }
    async buscarUsuarios(req) {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 15;
        const search = req.query.search || '';
        const isActive = req.query.isActive !== undefined
            ? req.query.isActive === 'true'
            : undefined;
        return this.permisosService.listarUsuariosPaginado({
            page,
            limit,
            search,
            isActive,
        });
    }
    async misAcciones(req) {
        const userId = req.user?.id;
        if (!userId) {
            return [];
        }
        return this.permisosService.getAccionesEfectivasUsuario(userId);
    }
};
exports.PermisosController = PermisosController;
__decorate([
    (0, common_1.Get)('actions'),
    (0, role_decorator_1.Rol)(Rol_1.Rol.ADMIN),
    (0, actions_decorator_1.Actions)('auth.permissions.read'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PermisosController.prototype, "listarAcciones", null);
__decorate([
    (0, common_1.Post)('actions'),
    (0, role_decorator_1.Rol)(Rol_1.Rol.ADMIN),
    (0, actions_decorator_1.Actions)('auth.permissions.write'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_accion_dto_1.CreateAccionDto]),
    __metadata("design:returntype", Promise)
], PermisosController.prototype, "crearAccion", null);
__decorate([
    (0, common_1.Put)('actions/:id'),
    (0, role_decorator_1.Rol)(Rol_1.Rol.ADMIN),
    (0, actions_decorator_1.Actions)('auth.permissions.write'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, update_accion_dto_1.UpdateAccionDto]),
    __metadata("design:returntype", Promise)
], PermisosController.prototype, "editarAccion", null);
__decorate([
    (0, common_1.Get)('groups'),
    (0, role_decorator_1.Rol)(Rol_1.Rol.ADMIN),
    (0, actions_decorator_1.Actions)('auth.permissions.read'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PermisosController.prototype, "listarGrupos", null);
__decorate([
    (0, common_1.Post)('groups'),
    (0, role_decorator_1.Rol)(Rol_1.Rol.ADMIN),
    (0, actions_decorator_1.Actions)('auth.permissions.write'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_grupo_permiso_dto_1.CreateGrupoPermisoDto]),
    __metadata("design:returntype", Promise)
], PermisosController.prototype, "crearGrupo", null);
__decorate([
    (0, common_1.Put)('groups/:id'),
    (0, role_decorator_1.Rol)(Rol_1.Rol.ADMIN),
    (0, actions_decorator_1.Actions)('auth.permissions.write'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, update_grupo_permiso_dto_1.UpdateGrupoPermisoDto]),
    __metadata("design:returntype", Promise)
], PermisosController.prototype, "editarGrupo", null);
__decorate([
    (0, common_1.Put)('groups/:id/actions'),
    (0, role_decorator_1.Rol)(Rol_1.Rol.ADMIN),
    (0, actions_decorator_1.Actions)('auth.permissions.assign'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, asignar_acciones_dto_1.AsignarAccionesDto]),
    __metadata("design:returntype", Promise)
], PermisosController.prototype, "asignarAccionesAGrupo", null);
__decorate([
    (0, common_1.Put)('users/:id/groups'),
    (0, role_decorator_1.Rol)(Rol_1.Rol.ADMIN),
    (0, actions_decorator_1.Actions)('auth.permissions.assign'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, asignar_grupos_dto_1.AsignarGruposDto]),
    __metadata("design:returntype", Promise)
], PermisosController.prototype, "asignarGruposAUsuario", null);
__decorate([
    (0, common_1.Put)('users/:id/actions'),
    (0, role_decorator_1.Rol)(Rol_1.Rol.ADMIN),
    (0, actions_decorator_1.Actions)('auth.permissions.assign'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, asignar_acciones_dto_1.AsignarAccionesDto]),
    __metadata("design:returntype", Promise)
], PermisosController.prototype, "asignarAccionesAUsuario", null);
__decorate([
    (0, common_1.Get)('users/:id/actions'),
    (0, role_decorator_1.Rol)(Rol_1.Rol.ADMIN),
    (0, actions_decorator_1.Actions)('auth.permissions.read'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], PermisosController.prototype, "accionesDeUsuario", null);
__decorate([
    (0, common_1.Get)('users'),
    (0, role_decorator_1.Rol)(Rol_1.Rol.ADMIN),
    (0, actions_decorator_1.Actions)('auth.permissions.read'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PermisosController.prototype, "buscarUsuarios", null);
__decorate([
    (0, common_1.Get)('me/actions'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PermisosController.prototype, "misAcciones", null);
exports.PermisosController = PermisosController = __decorate([
    (0, common_1.Controller)('permissions'),
    (0, common_1.UseGuards)(auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, actions_guard_1.ActionsGuard),
    __metadata("design:paramtypes", [permisos_service_1.PermisosService])
], PermisosController);
//# sourceMappingURL=permisos.controller.js.map