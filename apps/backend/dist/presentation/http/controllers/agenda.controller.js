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
exports.AgendaController = void 0;
const common_1 = require("@nestjs/common");
const dtos_1 = require("../../../application/agenda/dtos");
const use_cases_1 = require("../../../application/agenda/use-cases");
const Rol_1 = require("../../../domain/entities/Usuario/Rol");
const logger_service_1 = require("../../../domain/services/logger.service");
const role_decorator_1 = require("../../../infrastructure/auth/decorators/role.decorator");
const actions_guard_1 = require("../../../infrastructure/auth/guards/actions.guard");
const auth_guard_1 = require("../../../infrastructure/auth/guards/auth.guard");
const nutricionista_ownership_guard_1 = require("../../../infrastructure/auth/guards/nutricionista-ownership.guard");
const roles_guard_1 = require("../../../infrastructure/auth/guards/roles.guard");
let AgendaController = class AgendaController {
    configureAgendaUseCase;
    getAgendaUseCase;
    logger;
    constructor(configureAgendaUseCase, getAgendaUseCase, logger) {
        this.configureAgendaUseCase = configureAgendaUseCase;
        this.getAgendaUseCase = getAgendaUseCase;
        this.logger = logger;
    }
    async configureAgenda(nutricionistaId, configureAgendaDto) {
        this.logger.log(`Configurando agenda para profesional ${nutricionistaId} con ${configureAgendaDto.agendas.length} bloques.`);
        const configuredAgenda = await this.configureAgendaUseCase.execute(nutricionistaId, configureAgendaDto);
        return configuredAgenda.map((agenda) => this.toResponseDto(agenda));
    }
    async getAgendaByNutricionista(nutricionistaId) {
        this.logger.log(`Consultando agenda del profesional ${nutricionistaId}.`);
        const agenda = await this.getAgendaUseCase.execute(nutricionistaId);
        return agenda.map((item) => this.toResponseDto(item));
    }
    toResponseDto(agenda) {
        const response = new dtos_1.AgendaResponseDto();
        response.idAgenda = agenda.idAgenda ?? 0;
        response.dia = agenda.dia;
        response.horaInicio = agenda.horaInicio;
        response.horaFin = agenda.horaFin;
        response.duracionTurno = agenda.duracionTurno;
        return response;
    }
};
exports.AgendaController = AgendaController;
__decorate([
    (0, common_1.Put)(':nutricionistaId/configuracion'),
    (0, role_decorator_1.Rol)(Rol_1.Rol.NUTRICIONISTA),
    (0, common_1.UseGuards)(nutricionista_ownership_guard_1.NutricionistaOwnershipGuard),
    __param(0, (0, common_1.Param)('nutricionistaId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, dtos_1.ConfigureAgendaDto]),
    __metadata("design:returntype", Promise)
], AgendaController.prototype, "configureAgenda", null);
__decorate([
    (0, common_1.Get)(':nutricionistaId'),
    (0, role_decorator_1.Rol)(Rol_1.Rol.NUTRICIONISTA),
    (0, common_1.UseGuards)(nutricionista_ownership_guard_1.NutricionistaOwnershipGuard),
    __param(0, (0, common_1.Param)('nutricionistaId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], AgendaController.prototype, "getAgendaByNutricionista", null);
exports.AgendaController = AgendaController = __decorate([
    (0, common_1.Controller)('agenda'),
    (0, common_1.UseGuards)(auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, actions_guard_1.ActionsGuard),
    __param(2, (0, common_1.Inject)(logger_service_1.APP_LOGGER_SERVICE)),
    __metadata("design:paramtypes", [use_cases_1.ConfigureAgendaUseCase,
        use_cases_1.GetAgendaUseCase, Object])
], AgendaController);
//# sourceMappingURL=agenda.controller.js.map