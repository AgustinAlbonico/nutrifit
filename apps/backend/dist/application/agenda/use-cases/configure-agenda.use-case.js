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
exports.ConfigureAgendaUseCase = void 0;
const common_1 = require("@nestjs/common");
const agenda_entity_1 = require("../../../domain/entities/Agenda/agenda.entity");
const agenda_repository_1 = require("../../../domain/entities/Agenda/agenda.repository");
const nutricionista_repository_1 = require("../../../domain/entities/Persona/Nutricionista/nutricionista.repository");
const custom_exceptions_1 = require("../../../domain/exceptions/custom-exceptions");
const logger_service_1 = require("../../../domain/services/logger.service");
let ConfigureAgendaUseCase = class ConfigureAgendaUseCase {
    agendaRepository;
    nutricionistaRepository;
    logger;
    constructor(agendaRepository, nutricionistaRepository, logger) {
        this.agendaRepository = agendaRepository;
        this.nutricionistaRepository = nutricionistaRepository;
        this.logger = logger;
    }
    async execute(nutricionistaId, payload) {
        const nutricionista = await this.nutricionistaRepository.findById(nutricionistaId);
        if (!nutricionista) {
            throw new custom_exceptions_1.NotFoundError('Profesional', String(nutricionistaId));
        }
        if (nutricionista.fechaBaja) {
            throw new custom_exceptions_1.BadRequestError('No se puede configurar la agenda de un profesional suspendido.');
        }
        this.validateAgenda(payload);
        const agendas = payload.agendas.map((agenda) => new agenda_entity_1.AgendaEntity(null, agenda.dia, agenda.horaInicio, agenda.horaFin, agenda.duracionTurno));
        const configuredAgenda = await this.agendaRepository.replaceByNutricionistaId(nutricionistaId, agendas);
        this.logger.log(`Agenda configurada para profesional ${nutricionistaId} con ${configuredAgenda.length} bloques.`);
        return configuredAgenda;
    }
    validateAgenda(payload) {
        if (!payload.agendas?.length) {
            throw new custom_exceptions_1.BadRequestError('Debe configurar al menos un dia y rango horario valido.');
        }
        const intervalsByDay = new Map();
        for (const agenda of payload.agendas) {
            const start = this.timeToMinutes(agenda.horaInicio);
            const end = this.timeToMinutes(agenda.horaFin);
            if (start >= end) {
                throw new custom_exceptions_1.BadRequestError(`El horario configurado para ${agenda.dia} es invalido.`);
            }
            if (end - start < agenda.duracionTurno) {
                throw new custom_exceptions_1.BadRequestError(`La duracion del turno en ${agenda.dia} supera el rango horario disponible.`);
            }
            const current = intervalsByDay.get(agenda.dia) ?? [];
            current.push({ start, end });
            intervalsByDay.set(agenda.dia, current);
        }
        for (const [day, intervals] of intervalsByDay.entries()) {
            const sortedIntervals = intervals.sort((a, b) => a.start - b.start);
            for (let index = 1; index < sortedIntervals.length; index++) {
                const previousInterval = sortedIntervals[index - 1];
                const currentInterval = sortedIntervals[index];
                if (currentInterval.start < previousInterval.end) {
                    throw new custom_exceptions_1.BadRequestError(`Existen bloques horarios superpuestos para ${day}.`);
                }
            }
        }
    }
    timeToMinutes(time) {
        const [hours, minutes] = time.split(':').map((value) => Number(value));
        return hours * 60 + minutes;
    }
};
exports.ConfigureAgendaUseCase = ConfigureAgendaUseCase;
exports.ConfigureAgendaUseCase = ConfigureAgendaUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(agenda_repository_1.AGENDA_REPOSITORY)),
    __param(1, (0, common_1.Inject)(nutricionista_repository_1.NUTRICIONISTA_REPOSITORY)),
    __param(2, (0, common_1.Inject)(logger_service_1.APP_LOGGER_SERVICE)),
    __metadata("design:paramtypes", [agenda_repository_1.IAgendaRepository,
        nutricionista_repository_1.NutricionistaRepository, Object])
], ConfigureAgendaUseCase);
//# sourceMappingURL=configure-agenda.use-case.js.map