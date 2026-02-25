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
exports.TurnosController = void 0;
const common_1 = require("@nestjs/common");
const dtos_1 = require("../../../application/turnos/dtos");
const use_cases_1 = require("../../../application/turnos/use-cases");
const Rol_1 = require("../../../domain/entities/Usuario/Rol");
const logger_service_1 = require("../../../domain/services/logger.service");
const role_decorator_1 = require("../../../infrastructure/auth/decorators/role.decorator");
const actions_decorator_1 = require("../../../infrastructure/auth/decorators/actions.decorator");
const actions_guard_1 = require("../../../infrastructure/auth/guards/actions.guard");
const auth_guard_1 = require("../../../infrastructure/auth/guards/auth.guard");
const nutricionista_ownership_guard_1 = require("../../../infrastructure/auth/guards/nutricionista-ownership.guard");
const roles_guard_1 = require("../../../infrastructure/auth/guards/roles.guard");
let TurnosController = class TurnosController {
    getTurnosDelDiaUseCase;
    getAgendaDiariaUseCase;
    getTurnosRecepcionDiaUseCase;
    asignarTurnoManualUseCase;
    bloquearTurnoUseCase;
    desbloquearTurnoUseCase;
    cancelarTurnoSocioUseCase;
    checkInTurnoUseCase;
    confirmarTurnoSocioUseCase;
    finalizarConsultaUseCase;
    getFichaSaludPacienteUseCase;
    getFichaSaludSocioUseCase;
    getHistorialConsultasPacienteUseCase;
    getHistorialMedicionesUseCase;
    getResumenProgresoUseCase;
    getTurnoByIdUseCase;
    guardarMedicionesUseCase;
    guardarObservacionesUseCase;
    iniciarConsultaUseCase;
    listMisTurnosUseCase;
    listPacientesProfesionalUseCase;
    reprogramarTurnoSocioUseCase;
    registrarAsistenciaTurnoUseCase;
    reservarTurnoSocioUseCase;
    upsertFichaSaludSocioUseCase;
    logger;
    constructor(getTurnosDelDiaUseCase, getAgendaDiariaUseCase, getTurnosRecepcionDiaUseCase, asignarTurnoManualUseCase, bloquearTurnoUseCase, desbloquearTurnoUseCase, cancelarTurnoSocioUseCase, checkInTurnoUseCase, confirmarTurnoSocioUseCase, finalizarConsultaUseCase, getFichaSaludPacienteUseCase, getFichaSaludSocioUseCase, getHistorialConsultasPacienteUseCase, getHistorialMedicionesUseCase, getResumenProgresoUseCase, getTurnoByIdUseCase, guardarMedicionesUseCase, guardarObservacionesUseCase, iniciarConsultaUseCase, listMisTurnosUseCase, listPacientesProfesionalUseCase, reprogramarTurnoSocioUseCase, registrarAsistenciaTurnoUseCase, reservarTurnoSocioUseCase, upsertFichaSaludSocioUseCase, logger) {
        this.getTurnosDelDiaUseCase = getTurnosDelDiaUseCase;
        this.getAgendaDiariaUseCase = getAgendaDiariaUseCase;
        this.getTurnosRecepcionDiaUseCase = getTurnosRecepcionDiaUseCase;
        this.asignarTurnoManualUseCase = asignarTurnoManualUseCase;
        this.bloquearTurnoUseCase = bloquearTurnoUseCase;
        this.desbloquearTurnoUseCase = desbloquearTurnoUseCase;
        this.cancelarTurnoSocioUseCase = cancelarTurnoSocioUseCase;
        this.checkInTurnoUseCase = checkInTurnoUseCase;
        this.confirmarTurnoSocioUseCase = confirmarTurnoSocioUseCase;
        this.finalizarConsultaUseCase = finalizarConsultaUseCase;
        this.getFichaSaludPacienteUseCase = getFichaSaludPacienteUseCase;
        this.getFichaSaludSocioUseCase = getFichaSaludSocioUseCase;
        this.getHistorialConsultasPacienteUseCase = getHistorialConsultasPacienteUseCase;
        this.getHistorialMedicionesUseCase = getHistorialMedicionesUseCase;
        this.getResumenProgresoUseCase = getResumenProgresoUseCase;
        this.getTurnoByIdUseCase = getTurnoByIdUseCase;
        this.guardarMedicionesUseCase = guardarMedicionesUseCase;
        this.guardarObservacionesUseCase = guardarObservacionesUseCase;
        this.iniciarConsultaUseCase = iniciarConsultaUseCase;
        this.listMisTurnosUseCase = listMisTurnosUseCase;
        this.listPacientesProfesionalUseCase = listPacientesProfesionalUseCase;
        this.reprogramarTurnoSocioUseCase = reprogramarTurnoSocioUseCase;
        this.registrarAsistenciaTurnoUseCase = registrarAsistenciaTurnoUseCase;
        this.reservarTurnoSocioUseCase = reservarTurnoSocioUseCase;
        this.upsertFichaSaludSocioUseCase = upsertFichaSaludSocioUseCase;
        this.logger = logger;
    }
    async getTurnosDelDia(nutricionistaId, query) {
        this.logger.log(`Consultando turnos del dia para profesional ${nutricionistaId}.`);
        return this.getTurnosDelDiaUseCase.execute(nutricionistaId, query);
    }
    async getTurnoById(turnoId, req) {
        const nutricionistaId = req.user?.id;
        this.logger.log(`Consultando turno completo ${turnoId} para nutricionista ${nutricionistaId}.`);
        return this.getTurnoByIdUseCase.execute(turnoId, nutricionistaId);
    }
    async getAgendaDiaria(nutricionistaId, query) {
        this.logger.log(`Consultando agenda diaria para profesional ${nutricionistaId} en fecha ${query.fecha}.`);
        return this.getAgendaDiariaUseCase.execute(nutricionistaId, query);
    }
    async asignarTurnoManual(nutricionistaId, payload) {
        this.logger.log(`Asignando turno manual para profesional ${nutricionistaId} y socio ${payload.socioId}.`);
        return this.asignarTurnoManualUseCase.execute(nutricionistaId, payload);
    }
    async bloquearTurno(nutricionistaId, payload) {
        this.logger.log(`Bloqueando turno para profesional ${nutricionistaId}. Fecha=${payload.fecha}, hora=${payload.horaTurno}.`);
        return this.bloquearTurnoUseCase.execute(nutricionistaId, payload);
    }
    async desbloquearTurno(nutricionistaId, turnoId) {
        this.logger.log(`Desbloqueando turno ${turnoId} para profesional ${nutricionistaId}.`);
        return this.desbloquearTurnoUseCase.execute(nutricionistaId, turnoId);
    }
    async registrarAsistencia(nutricionistaId, turnoId, payload) {
        this.logger.log(`Registrando asistencia para turno ${turnoId} del profesional ${nutricionistaId}.`);
        return this.registrarAsistenciaTurnoUseCase.execute(nutricionistaId, turnoId, payload);
    }
    async getFichaSaludPaciente(nutricionistaId, socioId) {
        this.logger.log(`Consultando ficha de salud. Profesional=${nutricionistaId}, socio=${socioId}.`);
        return this.getFichaSaludPacienteUseCase.execute(nutricionistaId, socioId);
    }
    async getHistorialConsultasPaciente(nutricionistaId, socioId) {
        this.logger.log(`Consultando historial de consultas. Profesional=${nutricionistaId}, socio=${socioId}.`);
        return this.getHistorialConsultasPacienteUseCase.execute(nutricionistaId, socioId);
    }
    async listPacientesProfesional(nutricionistaId, query) {
        this.logger.log(`Listando pacientes de profesional ${nutricionistaId}.`);
        return this.listPacientesProfesionalUseCase.execute(nutricionistaId, query);
    }
    async upsertFichaSaludSocio(req, payload) {
        const userId = req.user?.id;
        this.logger.log(`Actualizando ficha de salud para socio usuario=${userId}.`);
        return this.upsertFichaSaludSocioUseCase.execute(userId, payload);
    }
    async getFichaSaludSocio(req) {
        const userId = req.user?.id;
        this.logger.log(`Consultando ficha de salud para socio usuario=${userId}.`);
        return this.getFichaSaludSocioUseCase.execute(userId);
    }
    async getDisponibilidadProfesionalParaSocio(nutricionistaId, query) {
        this.logger.log(`Socio consulta disponibilidad del profesional ${nutricionistaId} para fecha ${query.fecha}.`);
        const agendaDiaria = await this.getAgendaDiariaUseCase.execute(nutricionistaId, query);
        return agendaDiaria.map((slot) => {
            if (slot.estado === 'LIBRE') {
                return slot;
            }
            return {
                horaInicio: slot.horaInicio,
                horaFin: slot.horaFin,
                estado: 'OCUPADO',
            };
        });
    }
    async getDisponibilidadProfesionalParaAdmin(nutricionistaId, query) {
        this.logger.log(`Admin consulta disponibilidad del profesional ${nutricionistaId} para fecha ${query.fecha}.`);
        return this.getAgendaDiariaUseCase.execute(nutricionistaId, query);
    }
    async reservarTurnoSocio(req, payload) {
        const userId = req.user?.id;
        this.logger.log(`Reservando turno para socio usuario=${userId}.`);
        return this.reservarTurnoSocioUseCase.execute(userId, payload);
    }
    async listMisTurnos(req, query) {
        const userId = req.user?.id;
        this.logger.log(`Consultando mis turnos para socio usuario=${userId}.`);
        return this.listMisTurnosUseCase.execute(userId, query);
    }
    async reprogramarTurnoSocio(req, turnoId, payload) {
        const userId = req.user?.id;
        this.logger.log(`Reprogramando turno ${turnoId} para socio usuario=${userId}.`);
        return this.reprogramarTurnoSocioUseCase.execute(userId, turnoId, payload);
    }
    async cancelarTurnoSocio(req, turnoId) {
        const userId = req.user?.id;
        this.logger.log(`Cancelando turno ${turnoId} para socio usuario=${userId}.`);
        return this.cancelarTurnoSocioUseCase.execute(userId, turnoId);
    }
    async confirmarTurnoSocio(req, turnoId) {
        const userId = req.user?.id;
        this.logger.log(`Confirmando turno ${turnoId} para socio usuario=${userId}.`);
        return this.confirmarTurnoSocioUseCase.execute(userId, turnoId);
    }
    async checkInTurno(turnoId) {
        this.logger.log(`Check-in para turno ${turnoId}.`);
        return this.checkInTurnoUseCase.execute(turnoId);
    }
    async getTurnosRecepcionDia(fecha) {
        this.logger.log(`Consultando turnos de recepcion para fecha ${fecha || 'hoy'}.`);
        return this.getTurnosRecepcionDiaUseCase.execute(fecha);
    }
    async iniciarConsulta(turnoId) {
        this.logger.log(`Iniciando consulta para turno ${turnoId}.`);
        return this.iniciarConsultaUseCase.execute(turnoId);
    }
    async finalizarConsulta(turnoId) {
        this.logger.log(`Finalizando consulta para turno ${turnoId}.`);
        return this.finalizarConsultaUseCase.execute(turnoId);
    }
    async guardarMediciones(turnoId, payload) {
        this.logger.log(`Guardando mediciones para turno ${turnoId}.`);
        return this.guardarMedicionesUseCase.execute(turnoId, payload);
    }
    async guardarObservaciones(turnoId, payload) {
        this.logger.log(`Guardando observaciones para turno ${turnoId}.`);
        return this.guardarObservacionesUseCase.execute(turnoId, payload);
    }
    async getHistorialMedicionesPaciente(nutricionistaId, socioId) {
        this.logger.log(`Consultando historial de mediciones. Profesional=${nutricionistaId}, socio=${socioId}.`);
        return this.getHistorialMedicionesUseCase.execute(socioId);
    }
    async getResumenProgresoPaciente(nutricionistaId, socioId) {
        this.logger.log(`Consultando resumen de progreso. Profesional=${nutricionistaId}, socio=${socioId}.`);
        return this.getResumenProgresoUseCase.execute(socioId);
    }
    async getMiProgreso(req) {
        const userId = req.user?.id;
        this.logger.log(`Consultando mi progreso para socio usuario=${userId}.`);
        return this.getResumenProgresoUseCase.execute(userId);
    }
    async getMiHistorialMediciones(req) {
        const userId = req.user?.id;
        this.logger.log(`Consultando mi historial de mediciones para socio usuario=${userId}.`);
        return this.getHistorialMedicionesUseCase.execute(userId);
    }
};
exports.TurnosController = TurnosController;
__decorate([
    (0, common_1.Get)('profesional/:nutricionistaId/hoy'),
    (0, role_decorator_1.Rol)(Rol_1.Rol.NUTRICIONISTA),
    (0, common_1.UseGuards)(nutricionista_ownership_guard_1.NutricionistaOwnershipGuard),
    __param(0, (0, common_1.Param)('nutricionistaId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, dtos_1.GetTurnosDelDiaQueryDto]),
    __metadata("design:returntype", Promise)
], TurnosController.prototype, "getTurnosDelDia", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, role_decorator_1.Rol)(Rol_1.Rol.NUTRICIONISTA),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], TurnosController.prototype, "getTurnoById", null);
__decorate([
    (0, common_1.Get)('profesional/:nutricionistaId/disponibilidad'),
    (0, role_decorator_1.Rol)(Rol_1.Rol.NUTRICIONISTA),
    (0, common_1.UseGuards)(nutricionista_ownership_guard_1.NutricionistaOwnershipGuard),
    __param(0, (0, common_1.Param)('nutricionistaId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, dtos_1.GetAgendaDiariaQueryDto]),
    __metadata("design:returntype", Promise)
], TurnosController.prototype, "getAgendaDiaria", null);
__decorate([
    (0, common_1.Post)('profesional/:nutricionistaId/asignar-manual'),
    (0, role_decorator_1.Rol)(Rol_1.Rol.NUTRICIONISTA),
    (0, common_1.UseGuards)(nutricionista_ownership_guard_1.NutricionistaOwnershipGuard),
    __param(0, (0, common_1.Param)('nutricionistaId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, dtos_1.AsignarTurnoManualDto]),
    __metadata("design:returntype", Promise)
], TurnosController.prototype, "asignarTurnoManual", null);
__decorate([
    (0, common_1.Post)('profesional/:nutricionistaId/bloquear'),
    (0, role_decorator_1.Rol)(Rol_1.Rol.NUTRICIONISTA),
    (0, common_1.UseGuards)(nutricionista_ownership_guard_1.NutricionistaOwnershipGuard),
    __param(0, (0, common_1.Param)('nutricionistaId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, dtos_1.BloquearTurnoDto]),
    __metadata("design:returntype", Promise)
], TurnosController.prototype, "bloquearTurno", null);
__decorate([
    (0, common_1.Patch)('profesional/:nutricionistaId/:turnoId/desbloquear'),
    (0, role_decorator_1.Rol)(Rol_1.Rol.NUTRICIONISTA),
    (0, common_1.UseGuards)(nutricionista_ownership_guard_1.NutricionistaOwnershipGuard),
    __param(0, (0, common_1.Param)('nutricionistaId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Param)('turnoId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], TurnosController.prototype, "desbloquearTurno", null);
__decorate([
    (0, common_1.Patch)('profesional/:nutricionistaId/:turnoId/asistencia'),
    (0, role_decorator_1.Rol)(Rol_1.Rol.NUTRICIONISTA),
    (0, common_1.UseGuards)(nutricionista_ownership_guard_1.NutricionistaOwnershipGuard),
    __param(0, (0, common_1.Param)('nutricionistaId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Param)('turnoId', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, dtos_1.RegistrarAsistenciaTurnoDto]),
    __metadata("design:returntype", Promise)
], TurnosController.prototype, "registrarAsistencia", null);
__decorate([
    (0, common_1.Get)('profesional/:nutricionistaId/pacientes/:socioId/ficha-salud'),
    (0, role_decorator_1.Rol)(Rol_1.Rol.NUTRICIONISTA),
    (0, common_1.UseGuards)(nutricionista_ownership_guard_1.NutricionistaOwnershipGuard),
    __param(0, (0, common_1.Param)('nutricionistaId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Param)('socioId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], TurnosController.prototype, "getFichaSaludPaciente", null);
__decorate([
    (0, common_1.Get)('profesional/:nutricionistaId/pacientes/:socioId/historial-consultas'),
    (0, role_decorator_1.Rol)(Rol_1.Rol.NUTRICIONISTA),
    (0, common_1.UseGuards)(nutricionista_ownership_guard_1.NutricionistaOwnershipGuard),
    __param(0, (0, common_1.Param)('nutricionistaId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Param)('socioId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], TurnosController.prototype, "getHistorialConsultasPaciente", null);
__decorate([
    (0, common_1.Get)('profesional/:nutricionistaId/pacientes'),
    (0, role_decorator_1.Rol)(Rol_1.Rol.NUTRICIONISTA),
    (0, common_1.UseGuards)(nutricionista_ownership_guard_1.NutricionistaOwnershipGuard),
    __param(0, (0, common_1.Param)('nutricionistaId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, dtos_1.ListPacientesProfesionalQueryDto]),
    __metadata("design:returntype", Promise)
], TurnosController.prototype, "listPacientesProfesional", null);
__decorate([
    (0, common_1.Put)('socio/ficha-salud'),
    (0, role_decorator_1.Rol)(Rol_1.Rol.SOCIO),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dtos_1.UpsertFichaSaludSocioDto]),
    __metadata("design:returntype", Promise)
], TurnosController.prototype, "upsertFichaSaludSocio", null);
__decorate([
    (0, common_1.Get)('socio/ficha-salud'),
    (0, role_decorator_1.Rol)(Rol_1.Rol.SOCIO),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TurnosController.prototype, "getFichaSaludSocio", null);
__decorate([
    (0, common_1.Get)('socio/profesional/:nutricionistaId/disponibilidad'),
    (0, role_decorator_1.Rol)(Rol_1.Rol.SOCIO),
    __param(0, (0, common_1.Param)('nutricionistaId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, dtos_1.GetAgendaDiariaQueryDto]),
    __metadata("design:returntype", Promise)
], TurnosController.prototype, "getDisponibilidadProfesionalParaSocio", null);
__decorate([
    (0, common_1.Get)('admin/profesional/:nutricionistaId/disponibilidad'),
    (0, role_decorator_1.Rol)(Rol_1.Rol.ADMIN),
    (0, actions_decorator_1.Actions)('turnos.ver'),
    __param(0, (0, common_1.Param)('nutricionistaId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, dtos_1.GetAgendaDiariaQueryDto]),
    __metadata("design:returntype", Promise)
], TurnosController.prototype, "getDisponibilidadProfesionalParaAdmin", null);
__decorate([
    (0, common_1.Post)('socio/reservar'),
    (0, role_decorator_1.Rol)(Rol_1.Rol.SOCIO),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dtos_1.ReservarTurnoSocioDto]),
    __metadata("design:returntype", Promise)
], TurnosController.prototype, "reservarTurnoSocio", null);
__decorate([
    (0, common_1.Get)('socio/mis-turnos'),
    (0, role_decorator_1.Rol)(Rol_1.Rol.SOCIO),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dtos_1.ListMisTurnosQueryDto]),
    __metadata("design:returntype", Promise)
], TurnosController.prototype, "listMisTurnos", null);
__decorate([
    (0, common_1.Patch)('socio/:turnoId/reprogramar'),
    (0, role_decorator_1.Rol)(Rol_1.Rol.SOCIO),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('turnoId', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, dtos_1.ReprogramarTurnoSocioDto]),
    __metadata("design:returntype", Promise)
], TurnosController.prototype, "reprogramarTurnoSocio", null);
__decorate([
    (0, common_1.Patch)('socio/:turnoId/cancelar'),
    (0, role_decorator_1.Rol)(Rol_1.Rol.SOCIO),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('turnoId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", Promise)
], TurnosController.prototype, "cancelarTurnoSocio", null);
__decorate([
    (0, common_1.Patch)('socio/:turnoId/confirmar'),
    (0, role_decorator_1.Rol)(Rol_1.Rol.SOCIO),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('turnoId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", Promise)
], TurnosController.prototype, "confirmarTurnoSocio", null);
__decorate([
    (0, common_1.Post)(':id/check-in'),
    (0, role_decorator_1.Rol)(Rol_1.Rol.RECEPCIONISTA),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], TurnosController.prototype, "checkInTurno", null);
__decorate([
    (0, common_1.Get)('recepcion/dia'),
    (0, role_decorator_1.Rol)(Rol_1.Rol.RECEPCIONISTA),
    __param(0, (0, common_1.Query)('fecha')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TurnosController.prototype, "getTurnosRecepcionDia", null);
__decorate([
    (0, common_1.Post)(':id/iniciar-consulta'),
    (0, role_decorator_1.Rol)(Rol_1.Rol.NUTRICIONISTA),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], TurnosController.prototype, "iniciarConsulta", null);
__decorate([
    (0, common_1.Post)(':id/finalizar-consulta'),
    (0, role_decorator_1.Rol)(Rol_1.Rol.NUTRICIONISTA),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], TurnosController.prototype, "finalizarConsulta", null);
__decorate([
    (0, common_1.Post)(':id/mediciones'),
    (0, role_decorator_1.Rol)(Rol_1.Rol.NUTRICIONISTA),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, dtos_1.GuardarMedicionesDto]),
    __metadata("design:returntype", Promise)
], TurnosController.prototype, "guardarMediciones", null);
__decorate([
    (0, common_1.Post)(':id/observaciones'),
    (0, role_decorator_1.Rol)(Rol_1.Rol.NUTRICIONISTA),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, dtos_1.GuardarObservacionesDto]),
    __metadata("design:returntype", Promise)
], TurnosController.prototype, "guardarObservaciones", null);
__decorate([
    (0, common_1.Get)('profesional/:nutricionistaId/pacientes/:socioId/historial-mediciones'),
    (0, role_decorator_1.Rol)(Rol_1.Rol.NUTRICIONISTA),
    (0, common_1.UseGuards)(nutricionista_ownership_guard_1.NutricionistaOwnershipGuard),
    __param(0, (0, common_1.Param)('nutricionistaId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Param)('socioId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], TurnosController.prototype, "getHistorialMedicionesPaciente", null);
__decorate([
    (0, common_1.Get)('profesional/:nutricionistaId/pacientes/:socioId/progreso'),
    (0, role_decorator_1.Rol)(Rol_1.Rol.NUTRICIONISTA),
    (0, common_1.UseGuards)(nutricionista_ownership_guard_1.NutricionistaOwnershipGuard),
    __param(0, (0, common_1.Param)('nutricionistaId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Param)('socioId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], TurnosController.prototype, "getResumenProgresoPaciente", null);
__decorate([
    (0, common_1.Get)('socio/mi-progreso'),
    (0, role_decorator_1.Rol)(Rol_1.Rol.SOCIO),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TurnosController.prototype, "getMiProgreso", null);
__decorate([
    (0, common_1.Get)('socio/mi-historial-mediciones'),
    (0, role_decorator_1.Rol)(Rol_1.Rol.SOCIO),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TurnosController.prototype, "getMiHistorialMediciones", null);
exports.TurnosController = TurnosController = __decorate([
    (0, common_1.Controller)('turnos'),
    (0, common_1.UseGuards)(auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, actions_guard_1.ActionsGuard),
    __param(25, (0, common_1.Inject)(logger_service_1.APP_LOGGER_SERVICE)),
    __metadata("design:paramtypes", [use_cases_1.GetTurnosDelDiaUseCase,
        use_cases_1.GetAgendaDiariaUseCase,
        use_cases_1.GetTurnosRecepcionDiaUseCase,
        use_cases_1.AsignarTurnoManualUseCase,
        use_cases_1.BloquearTurnoUseCase,
        use_cases_1.DesbloquearTurnoUseCase,
        use_cases_1.CancelarTurnoSocioUseCase,
        use_cases_1.CheckInTurnoUseCase,
        use_cases_1.ConfirmarTurnoSocioUseCase,
        use_cases_1.FinalizarConsultaUseCase,
        use_cases_1.GetFichaSaludPacienteUseCase,
        use_cases_1.GetFichaSaludSocioUseCase,
        use_cases_1.GetHistorialConsultasPacienteUseCase,
        use_cases_1.GetHistorialMedicionesUseCase,
        use_cases_1.GetResumenProgresoUseCase,
        use_cases_1.GetTurnoByIdUseCase,
        use_cases_1.GuardarMedicionesUseCase,
        use_cases_1.GuardarObservacionesUseCase,
        use_cases_1.IniciarConsultaUseCase,
        use_cases_1.ListMisTurnosUseCase,
        use_cases_1.ListPacientesProfesionalUseCase,
        use_cases_1.ReprogramarTurnoSocioUseCase,
        use_cases_1.RegistrarAsistenciaTurnoUseCase,
        use_cases_1.ReservarTurnoSocioUseCase,
        use_cases_1.UpsertFichaSaludSocioUseCase, Object])
], TurnosController);
//# sourceMappingURL=turnos.controller.js.map