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
exports.BloquearTurnoUseCase = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const turno_operacion_response_dto_1 = require("../dtos/turno-operacion-response.dto");
const dia_semana_1 = require("../../../domain/entities/Agenda/dia-semana");
const EstadoTurno_1 = require("../../../domain/entities/Turno/EstadoTurno");
const custom_exceptions_1 = require("../../../domain/exceptions/custom-exceptions");
const logger_service_1 = require("../../../domain/services/logger.service");
const argentina_datetime_util_1 = require("../../../common/utils/argentina-datetime.util");
const entities_1 = require("../../../infrastructure/persistence/typeorm/entities");
const typeorm_2 = require("typeorm");
let BloquearTurnoUseCase = class BloquearTurnoUseCase {
    nutricionistaOrmRepository;
    agendaRepository;
    turnoRepository;
    logger;
    constructor(nutricionistaOrmRepository, agendaRepository, turnoRepository, logger) {
        this.nutricionistaOrmRepository = nutricionistaOrmRepository;
        this.agendaRepository = agendaRepository;
        this.turnoRepository = turnoRepository;
        this.logger = logger;
    }
    async execute(nutricionistaId, payload) {
        const nutricionista = await this.nutricionistaOrmRepository.findOne({
            where: { idPersona: nutricionistaId },
        });
        if (!nutricionista) {
            throw new custom_exceptions_1.NotFoundError('Profesional', String(nutricionistaId));
        }
        const fechaTurno = (0, argentina_datetime_util_1.parseArgentinaDateInput)(payload.fecha);
        const horaTurno = (0, argentina_datetime_util_1.normalizeTimeToHHmm)(payload.horaTurno);
        this.validateDateNotInPast(fechaTurno);
        await this.validateAgendaAvailability(nutricionistaId, fechaTurno, horaTurno);
        const existingTurno = await this.turnoRepository.findOne({
            where: {
                nutricionista: { idPersona: nutricionistaId },
                fechaTurno,
                horaTurno,
                estadoTurno: (0, typeorm_2.Not)(EstadoTurno_1.EstadoTurno.CANCELADO),
            },
            relations: ['socio'],
        });
        if (existingTurno) {
            if (existingTurno.estadoTurno === EstadoTurno_1.EstadoTurno.BLOQUEADO) {
                throw new custom_exceptions_1.ConflictError('El turno ya se encuentra bloqueado.');
            }
            throw new custom_exceptions_1.ConflictError('El horario seleccionado ya tiene un turno reservado. Cancelelo primero para bloquear.');
        }
        const turno = new entities_1.TurnoOrmEntity();
        turno.fechaTurno = fechaTurno;
        turno.horaTurno = horaTurno;
        turno.estadoTurno = EstadoTurno_1.EstadoTurno.BLOQUEADO;
        turno.nutricionista = nutricionista;
        const turnoBloqueado = await this.turnoRepository.save(turno);
        this.logger.log(`Turno bloqueado por profesional ${nutricionistaId}. Turno=${turnoBloqueado.idTurno}, fecha=${payload.fecha}, hora=${horaTurno}.`);
        return this.toResponseDto(turnoBloqueado);
    }
    async validateAgendaAvailability(nutricionistaId, fechaTurno, horaTurno) {
        const diaSemana = this.mapDateToDiaSemana(fechaTurno);
        const agendaDelDia = await this.agendaRepository.find({
            where: {
                nutricionista: { idPersona: nutricionistaId },
                dia: diaSemana,
            },
            order: { horaInicio: 'ASC' },
        });
        if (!agendaDelDia.length) {
            throw new custom_exceptions_1.BadRequestError('No tiene agenda configurada para el dia seleccionado.');
        }
        const turnoInicio = this.timeToMinutes(horaTurno);
        const hasAvailableSlot = agendaDelDia.some((agenda) => {
            const inicio = this.timeToMinutes(agenda.horaInicio);
            const fin = this.timeToMinutes(agenda.horaFin);
            const turnoFin = turnoInicio + agenda.duracionTurno;
            return (turnoInicio >= inicio &&
                turnoFin <= fin &&
                (turnoInicio - inicio) % agenda.duracionTurno === 0);
        });
        if (!hasAvailableSlot) {
            throw new custom_exceptions_1.BadRequestError('El horario seleccionado no corresponde a un turno valido de su agenda.');
        }
    }
    validateDateNotInPast(fechaTurno) {
        const today = (0, argentina_datetime_util_1.getArgentinaStartOfToday)();
        if (fechaTurno.getTime() < today.getTime()) {
            throw new custom_exceptions_1.BadRequestError('No se pueden bloquear turnos en fechas pasadas.');
        }
    }
    mapDateToDiaSemana(date) {
        const day = (0, argentina_datetime_util_1.getArgentinaWeekdayIndex)(date);
        switch (day) {
            case 0:
                return dia_semana_1.DiaSemana.DOMINGO;
            case 1:
                return dia_semana_1.DiaSemana.LUNES;
            case 2:
                return dia_semana_1.DiaSemana.MARTES;
            case 3:
                return dia_semana_1.DiaSemana.MIERCOLES;
            case 4:
                return dia_semana_1.DiaSemana.JUEVES;
            case 5:
                return dia_semana_1.DiaSemana.VIERNES;
            case 6:
                return dia_semana_1.DiaSemana.SABADO;
            default:
                throw new custom_exceptions_1.BadRequestError('Dia de semana invalido.');
        }
    }
    timeToMinutes(time) {
        const [hours, minutes] = time.split(':').map((value) => Number(value));
        return hours * 60 + minutes;
    }
    toResponseDto(turno) {
        const response = new turno_operacion_response_dto_1.TurnoOperacionResponseDto();
        response.idTurno = turno.idTurno;
        response.fechaTurno = (0, argentina_datetime_util_1.formatArgentinaDate)(turno.fechaTurno);
        response.horaTurno = (0, argentina_datetime_util_1.normalizeTimeToHHmm)(turno.horaTurno);
        response.estadoTurno = turno.estadoTurno;
        response.socioId = turno.socio?.idPersona ?? 0;
        response.nutricionistaId = turno.nutricionista?.idPersona ?? 0;
        return response;
    }
};
exports.BloquearTurnoUseCase = BloquearTurnoUseCase;
exports.BloquearTurnoUseCase = BloquearTurnoUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.NutricionistaOrmEntity)),
    __param(1, (0, typeorm_1.InjectRepository)(entities_1.AgendaOrmEntity)),
    __param(2, (0, typeorm_1.InjectRepository)(entities_1.TurnoOrmEntity)),
    __param(3, (0, common_1.Inject)(logger_service_1.APP_LOGGER_SERVICE)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository, Object])
], BloquearTurnoUseCase);
//# sourceMappingURL=bloquear-turno.use-case.js.map