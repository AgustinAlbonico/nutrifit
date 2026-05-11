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
exports.AsignarTurnoManualUseCase = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const turno_operacion_response_dto_1 = require("../dtos/turno-operacion-response.dto");
const dia_semana_1 = require("../../../domain/entities/Agenda/dia-semana");
const EstadoTurno_1 = require("../../../domain/entities/Turno/EstadoTurno");
const nutricionista_repository_1 = require("../../../domain/entities/Persona/Nutricionista/nutricionista.repository");
const custom_exceptions_1 = require("../../../domain/exceptions/custom-exceptions");
const logger_service_1 = require("../../../domain/services/logger.service");
const argentina_datetime_util_1 = require("../../../common/utils/argentina-datetime.util");
const entities_1 = require("../../../infrastructure/persistence/typeorm/entities");
const typeorm_2 = require("typeorm");
let AsignarTurnoManualUseCase = class AsignarTurnoManualUseCase {
    turnoRepository;
    socioRepository;
    nutricionistaOrmRepository;
    agendaRepository;
    nutricionistaRepository;
    logger;
    constructor(turnoRepository, socioRepository, nutricionistaOrmRepository, agendaRepository, nutricionistaRepository, logger) {
        this.turnoRepository = turnoRepository;
        this.socioRepository = socioRepository;
        this.nutricionistaOrmRepository = nutricionistaOrmRepository;
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
            throw new custom_exceptions_1.BadRequestError('No se puede asignar turnos a un profesional suspendido.');
        }
        const socio = await this.socioRepository.findOne({
            where: { idPersona: payload.socioId },
            relations: { fichaSalud: true },
        });
        if (!socio) {
            throw new custom_exceptions_1.NotFoundError('Socio', String(payload.socioId));
        }
        if (!socio.fichaSalud) {
            throw new custom_exceptions_1.BadRequestError('El paciente debe completar su ficha de salud antes de reservar un turno.');
        }
        const fechaTurno = (0, argentina_datetime_util_1.parseArgentinaDateInput)(payload.fechaTurno);
        const horaTurno = (0, argentina_datetime_util_1.normalizeTimeToHHmm)(payload.horaTurno);
        this.validateDateNotInPast(fechaTurno);
        await this.validateAgendaAvailability(nutricionistaId, fechaTurno, horaTurno);
        const conflictingTurno = await this.turnoRepository.findOne({
            where: {
                nutricionista: { idPersona: nutricionistaId },
                fechaTurno,
                horaTurno,
                estadoTurno: (0, typeorm_2.Not)(EstadoTurno_1.EstadoTurno.CANCELADO),
            },
        });
        if (conflictingTurno) {
            throw new custom_exceptions_1.ConflictError('El horario seleccionado ya se encuentra ocupado para este profesional.');
        }
        const nutricionistaOrm = await this.nutricionistaOrmRepository.findOne({
            where: { idPersona: nutricionistaId },
        });
        if (!nutricionistaOrm) {
            throw new custom_exceptions_1.NotFoundError('Profesional', String(nutricionistaId));
        }
        const turno = new entities_1.TurnoOrmEntity();
        turno.fechaTurno = fechaTurno;
        turno.horaTurno = horaTurno;
        turno.estadoTurno = EstadoTurno_1.EstadoTurno.PROGRAMADO;
        turno.socio = socio;
        turno.nutricionista = nutricionistaOrm;
        const turnoCreado = await this.turnoRepository.save(turno);
        this.logger.log(`Turno manual asignado. Turno=${turnoCreado.idTurno}, profesional=${nutricionistaId}, socio=${payload.socioId}.`);
        this.logger.log(`Notificacion interna pendiente de integracion para socio ${payload.socioId} por turno ${turnoCreado.idTurno}.`);
        return this.toResponseDto(turnoCreado);
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
            throw new custom_exceptions_1.BadRequestError('El profesional no tiene disponibilidad configurada para el dia seleccionado.');
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
            throw new custom_exceptions_1.BadRequestError('El horario seleccionado no coincide con la disponibilidad del profesional.');
        }
    }
    validateDateNotInPast(fechaTurno) {
        const todayStart = (0, argentina_datetime_util_1.getArgentinaStartOfToday)();
        if (fechaTurno.getTime() < todayStart.getTime()) {
            throw new custom_exceptions_1.BadRequestError('No se puede asignar un turno en fechas pasadas.');
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
        response.socioId = turno.socio.idPersona ?? 0;
        response.nutricionistaId = turno.nutricionista.idPersona ?? 0;
        return response;
    }
};
exports.AsignarTurnoManualUseCase = AsignarTurnoManualUseCase;
exports.AsignarTurnoManualUseCase = AsignarTurnoManualUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.TurnoOrmEntity)),
    __param(1, (0, typeorm_1.InjectRepository)(entities_1.SocioOrmEntity)),
    __param(2, (0, typeorm_1.InjectRepository)(entities_1.NutricionistaOrmEntity)),
    __param(3, (0, typeorm_1.InjectRepository)(entities_1.AgendaOrmEntity)),
    __param(4, (0, common_1.Inject)(nutricionista_repository_1.NUTRICIONISTA_REPOSITORY)),
    __param(5, (0, common_1.Inject)(logger_service_1.APP_LOGGER_SERVICE)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        nutricionista_repository_1.NutricionistaRepository, Object])
], AsignarTurnoManualUseCase);
//# sourceMappingURL=asignar-turno-manual.use-case.js.map