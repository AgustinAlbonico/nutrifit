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
exports.ReprogramarTurnoSocioUseCase = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const dtos_1 = require("../dtos");
const dia_semana_1 = require("../../../domain/entities/Agenda/dia-semana");
const EstadoTurno_1 = require("../../../domain/entities/Turno/EstadoTurno");
const custom_exceptions_1 = require("../../../domain/exceptions/custom-exceptions");
const logger_service_1 = require("../../../domain/services/logger.service");
const argentina_datetime_util_1 = require("../../../common/utils/argentina-datetime.util");
const entities_1 = require("../../../infrastructure/persistence/typeorm/entities");
const typeorm_2 = require("typeorm");
let ReprogramarTurnoSocioUseCase = class ReprogramarTurnoSocioUseCase {
    usuarioRepository;
    socioRepository;
    turnoRepository;
    agendaRepository;
    logger;
    constructor(usuarioRepository, socioRepository, turnoRepository, agendaRepository, logger) {
        this.usuarioRepository = usuarioRepository;
        this.socioRepository = socioRepository;
        this.turnoRepository = turnoRepository;
        this.agendaRepository = agendaRepository;
        this.logger = logger;
    }
    async execute(userId, turnoId, payload) {
        const socio = await this.resolveSocioByUserId(userId);
        const turno = await this.turnoRepository.findOne({
            where: { idTurno: turnoId },
            relations: {
                socio: true,
                nutricionista: true,
            },
        });
        if (!turno) {
            throw new custom_exceptions_1.NotFoundError('Turno', String(turnoId));
        }
        if (turno.socio.idPersona !== socio.idPersona) {
            throw new custom_exceptions_1.ForbiddenError('No tiene permisos para reprogramar este turno.');
        }
        if (turno.estadoTurno !== EstadoTurno_1.EstadoTurno.PENDIENTE) {
            throw new custom_exceptions_1.BadRequestError('Solo se pueden reprogramar turnos en estado PENDIENTE.');
        }
        this.validate24hRule(turno.fechaTurno, turno.horaTurno);
        const nuevaFecha = (0, argentina_datetime_util_1.parseArgentinaDateInput)(payload.fechaTurno);
        const nuevaHora = (0, argentina_datetime_util_1.normalizeTimeToHHmm)(payload.horaTurno);
        this.validateDateTimeNotInPast(nuevaFecha, nuevaHora);
        await this.validateAgendaAvailability(turno.nutricionista.idPersona ?? 0, nuevaFecha, nuevaHora);
        const conflictingTurno = await this.turnoRepository.findOne({
            where: {
                idTurno: (0, typeorm_2.Not)(turno.idTurno),
                nutricionista: { idPersona: turno.nutricionista.idPersona ?? 0 },
                fechaTurno: nuevaFecha,
                horaTurno: nuevaHora,
                estadoTurno: (0, typeorm_2.Not)(EstadoTurno_1.EstadoTurno.CANCELADO),
            },
        });
        if (conflictingTurno) {
            throw new custom_exceptions_1.ConflictError('No hay disponibilidad en el nuevo horario seleccionado.');
        }
        turno.fechaTurno = nuevaFecha;
        turno.horaTurno = nuevaHora;
        turno.estadoTurno = EstadoTurno_1.EstadoTurno.REPROGRAMADO;
        const updatedTurno = await this.turnoRepository.save(turno);
        this.logger.log(`Turno ${turnoId} reprogramado por socio ${socio.idPersona}.`);
        this.logger.log(`Notificacion interna pendiente de integracion para profesional ${turno.nutricionista.idPersona}.`);
        return this.toResponseDto(updatedTurno);
    }
    async resolveSocioByUserId(userId) {
        const user = await this.usuarioRepository.findOne({
            where: { idUsuario: userId },
            relations: {
                persona: true,
            },
        });
        const personaId = user?.persona?.idPersona;
        if (!personaId) {
            throw new custom_exceptions_1.ForbiddenError('El usuario autenticado no tiene un socio asociado.');
        }
        const socio = await this.socioRepository.findOne({
            where: { idPersona: personaId },
        });
        if (!socio) {
            throw new custom_exceptions_1.NotFoundError('Socio', String(personaId));
        }
        return socio;
    }
    validate24hRule(fechaTurno, horaTurno) {
        const scheduledDate = (0, argentina_datetime_util_1.combineArgentinaDateAndTime)(fechaTurno, horaTurno);
        const now = new Date();
        const hoursDiff = (scheduledDate.getTime() - now.getTime()) / (1000 * 60 * 60);
        if (hoursDiff < 24) {
            throw new custom_exceptions_1.BadRequestError('Solo se puede reprogramar con al menos 24 horas de anticipacion.');
        }
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
            throw new custom_exceptions_1.BadRequestError('El profesional no tiene disponibilidad para la nueva fecha seleccionada.');
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
            throw new custom_exceptions_1.BadRequestError('El nuevo horario no coincide con la agenda disponible del profesional.');
        }
    }
    validateDateTimeNotInPast(fechaTurno, horaTurno) {
        const today = (0, argentina_datetime_util_1.getArgentinaStartOfToday)();
        const now = (0, argentina_datetime_util_1.getArgentinaNow)();
        if (fechaTurno.getTime() < today.getTime()) {
            throw new custom_exceptions_1.BadRequestError('No se puede reprogramar a una fecha pasada.');
        }
        if (fechaTurno.getTime() === today.getTime()) {
            const [hours, minutes] = horaTurno.split(':').map((v) => Number(v));
            const turnoDateTime = new Date(now);
            turnoDateTime.setHours(hours, minutes, 0, 0);
            const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
            if (turnoDateTime < oneHourFromNow) {
                throw new custom_exceptions_1.BadRequestError('Los turnos deben reprogramarse con al menos 1 hora de anticipación.');
            }
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
        const response = new dtos_1.TurnoOperacionResponseDto();
        response.idTurno = turno.idTurno;
        response.fechaTurno = (0, argentina_datetime_util_1.formatArgentinaDate)(turno.fechaTurno);
        response.horaTurno = (0, argentina_datetime_util_1.normalizeTimeToHHmm)(turno.horaTurno);
        response.estadoTurno = turno.estadoTurno;
        response.socioId = turno.socio.idPersona ?? 0;
        response.nutricionistaId = turno.nutricionista.idPersona ?? 0;
        return response;
    }
};
exports.ReprogramarTurnoSocioUseCase = ReprogramarTurnoSocioUseCase;
exports.ReprogramarTurnoSocioUseCase = ReprogramarTurnoSocioUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.UsuarioOrmEntity)),
    __param(1, (0, typeorm_1.InjectRepository)(entities_1.SocioOrmEntity)),
    __param(2, (0, typeorm_1.InjectRepository)(entities_1.TurnoOrmEntity)),
    __param(3, (0, typeorm_1.InjectRepository)(entities_1.AgendaOrmEntity)),
    __param(4, (0, common_1.Inject)(logger_service_1.APP_LOGGER_SERVICE)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository, Object])
], ReprogramarTurnoSocioUseCase);
//# sourceMappingURL=reprogramar-turno-socio.use-case.js.map