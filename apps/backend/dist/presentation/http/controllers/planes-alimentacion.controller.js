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
exports.PlanAlimentacionController = void 0;
const common_1 = require("@nestjs/common");
const dtos_1 = require("../../../application/planes-alimentacion/dtos");
const use_cases_1 = require("../../../application/planes-alimentacion/use-cases");
const Rol_1 = require("../../../domain/entities/Usuario/Rol");
const logger_service_1 = require("../../../domain/services/logger.service");
const role_decorator_1 = require("../../../infrastructure/auth/decorators/role.decorator");
const actions_guard_1 = require("../../../infrastructure/auth/guards/actions.guard");
const auth_guard_1 = require("../../../infrastructure/auth/guards/auth.guard");
const nutricionista_ownership_guard_1 = require("../../../infrastructure/auth/guards/nutricionista-ownership.guard");
const roles_guard_1 = require("../../../infrastructure/auth/guards/roles.guard");
const socio_resource_access_guard_1 = require("../../../infrastructure/auth/guards/socio-resource-access.guard");
let PlanAlimentacionController = class PlanAlimentacionController {
    crearPlanAlimentacionUseCase;
    editarPlanAlimentacionUseCase;
    eliminarPlanAlimentacionUseCase;
    obtenerPlanActivoSocioUseCase;
    obtenerPlanPorIdUseCase;
    listarPlanesSocioUseCase;
    listarPlanesNutricionistaUseCase;
    vaciarContenidoPlanUseCase;
    logger;
    constructor(crearPlanAlimentacionUseCase, editarPlanAlimentacionUseCase, eliminarPlanAlimentacionUseCase, obtenerPlanActivoSocioUseCase, obtenerPlanPorIdUseCase, listarPlanesSocioUseCase, listarPlanesNutricionistaUseCase, vaciarContenidoPlanUseCase, logger) {
        this.crearPlanAlimentacionUseCase = crearPlanAlimentacionUseCase;
        this.editarPlanAlimentacionUseCase = editarPlanAlimentacionUseCase;
        this.eliminarPlanAlimentacionUseCase = eliminarPlanAlimentacionUseCase;
        this.obtenerPlanActivoSocioUseCase = obtenerPlanActivoSocioUseCase;
        this.obtenerPlanPorIdUseCase = obtenerPlanPorIdUseCase;
        this.listarPlanesSocioUseCase = listarPlanesSocioUseCase;
        this.listarPlanesNutricionistaUseCase = listarPlanesNutricionistaUseCase;
        this.vaciarContenidoPlanUseCase = vaciarContenidoPlanUseCase;
        this.logger = logger;
    }
    async crearPlan(req, payload) {
        const nutricionistaUserId = req.user?.id;
        this.logger.log(`Creando plan de alimentación para socio ${payload.socioId} por nutricionista ${nutricionistaUserId}.`);
        return this.crearPlanAlimentacionUseCase.execute(nutricionistaUserId, payload);
    }
    async listarPlanesNutricionista(nutricionistaId) {
        this.logger.log(`Listando planes de alimentación del nutricionista ${nutricionistaId}.`);
        return this.listarPlanesNutricionistaUseCase.execute(nutricionistaId);
    }
    async obtenerPlanActivoSocio(socioId) {
        this.logger.log(`Consultando plan activo del socio ${socioId}.`);
        return this.obtenerPlanActivoSocioUseCase.execute(socioId);
    }
    async listarPlanesSocio(socioId) {
        this.logger.log(`Listando planes de alimentación del socio ${socioId}.`);
        return this.listarPlanesSocioUseCase.execute(socioId);
    }
    async obtenerPlanPorId(id) {
        this.logger.log(`Consultando plan de alimentación ${id}.`);
        return this.obtenerPlanPorIdUseCase.execute(id);
    }
    async editarPlan(req, id, payload) {
        const nutricionistaUserId = req.user?.id;
        this.logger.log(`Editando plan de alimentación ${id} por nutricionista ${nutricionistaUserId}.`);
        return this.editarPlanAlimentacionUseCase.execute(nutricionistaUserId, {
            ...payload,
            planId: id,
        });
    }
    async eliminarPlan(req, id, payload) {
        const nutricionistaUserId = req.user?.id;
        this.logger.log(`Eliminando plan de alimentación ${id} por nutricionista ${nutricionistaUserId}.`);
        return this.eliminarPlanAlimentacionUseCase.execute(nutricionistaUserId, {
            ...payload,
            planId: id,
        });
    }
    async vaciarContenidoPlan(req, id) {
        const nutricionistaUserId = req.user?.id;
        this.logger.log(`Vaciando contenido del plan ${id} por nutricionista ${nutricionistaUserId}.`);
        return this.vaciarContenidoPlanUseCase.execute(nutricionistaUserId, {
            planId: id,
        });
    }
};
exports.PlanAlimentacionController = PlanAlimentacionController;
__decorate([
    (0, common_1.Post)(),
    (0, role_decorator_1.Rol)(Rol_1.Rol.NUTRICIONISTA, Rol_1.Rol.ADMIN),
    (0, common_1.UseGuards)(socio_resource_access_guard_1.SocioResourceAccessGuard),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dtos_1.CrearPlanAlimentacionDto]),
    __metadata("design:returntype", Promise)
], PlanAlimentacionController.prototype, "crearPlan", null);
__decorate([
    (0, common_1.Get)('nutricionista/:nutricionistaId'),
    (0, role_decorator_1.Rol)(Rol_1.Rol.NUTRICIONISTA, Rol_1.Rol.ADMIN),
    (0, common_1.UseGuards)(nutricionista_ownership_guard_1.NutricionistaOwnershipGuard),
    __param(0, (0, common_1.Param)('nutricionistaId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], PlanAlimentacionController.prototype, "listarPlanesNutricionista", null);
__decorate([
    (0, common_1.Get)('socio/:socioId/activo'),
    (0, role_decorator_1.Rol)(Rol_1.Rol.NUTRICIONISTA, Rol_1.Rol.ADMIN, Rol_1.Rol.SOCIO),
    (0, common_1.UseGuards)(socio_resource_access_guard_1.SocioResourceAccessGuard),
    __param(0, (0, common_1.Param)('socioId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], PlanAlimentacionController.prototype, "obtenerPlanActivoSocio", null);
__decorate([
    (0, common_1.Get)('socio/:socioId'),
    (0, role_decorator_1.Rol)(Rol_1.Rol.NUTRICIONISTA, Rol_1.Rol.ADMIN, Rol_1.Rol.SOCIO),
    (0, common_1.UseGuards)(socio_resource_access_guard_1.SocioResourceAccessGuard),
    __param(0, (0, common_1.Param)('socioId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], PlanAlimentacionController.prototype, "listarPlanesSocio", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, role_decorator_1.Rol)(Rol_1.Rol.NUTRICIONISTA, Rol_1.Rol.ADMIN, Rol_1.Rol.SOCIO),
    (0, common_1.UseGuards)(socio_resource_access_guard_1.SocioResourceAccessGuard),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], PlanAlimentacionController.prototype, "obtenerPlanPorId", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, role_decorator_1.Rol)(Rol_1.Rol.NUTRICIONISTA, Rol_1.Rol.ADMIN),
    (0, common_1.UseGuards)(socio_resource_access_guard_1.SocioResourceAccessGuard),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, dtos_1.EditarPlanAlimentacionDto]),
    __metadata("design:returntype", Promise)
], PlanAlimentacionController.prototype, "editarPlan", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, role_decorator_1.Rol)(Rol_1.Rol.NUTRICIONISTA, Rol_1.Rol.ADMIN),
    (0, common_1.UseGuards)(socio_resource_access_guard_1.SocioResourceAccessGuard),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, dtos_1.EliminarPlanAlimentacionDto]),
    __metadata("design:returntype", Promise)
], PlanAlimentacionController.prototype, "eliminarPlan", null);
__decorate([
    (0, common_1.Delete)(':id/contenido'),
    (0, role_decorator_1.Rol)(Rol_1.Rol.NUTRICIONISTA, Rol_1.Rol.ADMIN),
    (0, common_1.UseGuards)(socio_resource_access_guard_1.SocioResourceAccessGuard),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", Promise)
], PlanAlimentacionController.prototype, "vaciarContenidoPlan", null);
exports.PlanAlimentacionController = PlanAlimentacionController = __decorate([
    (0, common_1.Controller)('planes-alimentacion'),
    (0, common_1.UseGuards)(auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, actions_guard_1.ActionsGuard),
    __param(8, (0, common_1.Inject)(logger_service_1.APP_LOGGER_SERVICE)),
    __metadata("design:paramtypes", [use_cases_1.CrearPlanAlimentacionUseCase,
        use_cases_1.EditarPlanAlimentacionUseCase,
        use_cases_1.EliminarPlanAlimentacionUseCase,
        use_cases_1.ObtenerPlanActivoSocioUseCase,
        use_cases_1.ObtenerPlanPorIdUseCase,
        use_cases_1.ListarPlanesSocioUseCase,
        use_cases_1.ListarPlanesNutricionistaUseCase,
        use_cases_1.VaciarContenidoPlanUseCase, Object])
], PlanAlimentacionController);
//# sourceMappingURL=planes-alimentacion.controller.js.map