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
exports.ReservarTurnoSocioUseCase = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const dtos_1 = require("../dtos");
const dia_semana_1 = require("../../../domain/entities/Agenda/dia-semana");
const nutricionista_repository_1 = require("../../../domain/entities/Persona/Nutricionista/nutricionista.repository");
const EstadoTurno_1 = require("../../../domain/entities/Turno/EstadoTurno");
const custom_exceptions_1 = require("../../../domain/exceptions/custom-exceptions");
const logger_service_1 = require("../../../domain/services/logger.service");
const argentina_datetime_util_1 = require("../../../common/utils/argentina-datetime.util");
const entities_1 = require("../../../infrastructure/persistence/typeorm/entities");
const typeorm_2 = require("typeorm");
let ReservarTurnoSocioUseCase = class ReservarTurnoSocioUseCase {
    usuarioRepository;
    socioRepository;
    nutricionistaOrmRepository;
    agendaRepository;
    turnoRepository;
    nutricionistaRepository;
    logger;
    constructor(usuarioRepository, socioRepository, nutricionistaOrmRepository, agendaRepository, turnoRepository, nutricionistaRepository, logger) {
        this.usuarioRepository = usuarioRepository;
        this.socioRepository = socioRepository;
        this.nutricionistaOrmRepository = nutricionistaOrmRepository;
        this.agendaRepository = agendaRepository;
        this.turnoRepository = turnoRepository;
        this.nutricionistaRepository = nutricionistaRepository;
        this.logger = logger;
    }
    async execute(userId, payload) {
        const socio = await this.resolveSocioByUserId(userId);
        if (!socio.fichaSalud) {
            throw new custom_exceptions_1.BadRequestError('Debe completar su ficha de salud antes de reservar un turno.');
        }
        const nutricionista = await this.nutricionistaRepository.findById(payload.nutricionistaId);
        if (!nutricionista || nutricionista.fechaBaja) {
            throw new custom_exceptions_1.NotFoundError('Profesional', String(payload.nutricionistaId));
        }
        const fechaTurno = (0, argentina_datetime_util_1.parseArgentinaDateInput)(payload.fechaTurno);
        const horaTurno = (0, argentina_datetime_util_1.normalizeTimeToHHmm)(payload.horaTurno);
        this.validateDateTimeNotInPast(fechaTurno, horaTurno);
        await this.validateAgendaAvailability(payload.nutricionistaId, fechaTurno, horaTurno);
        const existingSameDay = await this.turnoRepository.findOne({
            where: {
                socio: { idPersona: socio.idPersona ?? 0 },
                nutricionista: { idPersona: payload.nutricionistaId },
                fechaTurno,
                estadoTurno: (0, typeorm_2.Not)(EstadoTurno_1.EstadoTurno.CANCELADO),
            },
        });
        if (existingSameDay) {
            throw new custom_exceptions_1.ConflictError('Ya tiene un turno con este profesional para la fecha seleccionada.');
        }
        const conflictingTurno = await this.turnoRepository.findOne({
            where: {
                nutricionista: { idPersona: payload.nutricionistaId },
                fechaTurno,
                horaTurno,
                estadoTurno: (0, typeorm_2.Not)(EstadoTurno_1.EstadoTurno.CANCELADO),
            },
        });
        if (conflictingTurno) {
            throw new custom_exceptions_1.ConflictError('El horario seleccionado ya fue reservado por otro socio.');
        }
        const nutricionistaOrm = await this.nutricionistaOrmRepository.findOne({
            where: { idPersona: payload.nutricionistaId },
        });
        if (!nutricionistaOrm) {
            throw new custom_exceptions_1.NotFoundError('Profesional', String(payload.nutricionistaId));
        }
        const turno = new entities_1.TurnoOrmEntity();
        turno.fechaTurno = fechaTurno;
        turno.horaTurno = horaTurno;
        turno.estadoTurno = EstadoTurno_1.EstadoTurno.PENDIENTE;
        turno.socio = socio;
        turno.nutricionista = nutricionistaOrm;
        const turnoCreado = await this.turnoRepository.save(turno);
        this.logger.log(`Turno reservado por socio ${socio.idPersona}. Turno=${turnoCreado.idTurno}, profesional=${payload.nutricionistaId}.`);
        this.logger.log(`Notificacion interna pendiente de integracion para turno ${turnoCreado.idTurno}.`);
        return this.toResponseDto(turnoCreado);
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
            relations: {
                fichaSalud: true,
            },
        });
        if (!socio) {
            throw new custom_exceptions_1.NotFoundError('Socio', String(personaId));
        }
        return socio;
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
            throw new custom_exceptions_1.BadRequestError('El profesional no tiene disponibilidad configurada para ese dia.');
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
            throw new custom_exceptions_1.BadRequestError('El horario seleccionado no coincide con la agenda disponible del profesional.');
        }
    }
    validateDateTimeNotInPast(fechaTurno, horaTurno) {
        const today = (0, argentina_datetime_util_1.getArgentinaStartOfToday)();
        const now = (0, argentina_datetime_util_1.getArgentinaNow)();
        if (fechaTurno.getTime() < today.getTime()) {
            throw new custom_exceptions_1.BadRequestError('No se puede reservar un turno en fechas pasadas.');
        }
        if (fechaTurno.getTime() === today.getTime()) {
            const [hours, minutes] = horaTurno.split(':').map((v) => Number(v));
            const turnoDateTime = new Date(now);
            turnoDateTime.setHours(hours, minutes, 0, 0);
            const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
            if (turnoDateTime < oneHourFromNow) {
                throw new custom_exceptions_1.BadRequestError('Los turnos deben reservarse con al menos 1 hora de anticipación.');
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
exports.ReservarTurnoSocioUseCase = ReservarTurnoSocioUseCase;
exports.ReservarTurnoSocioUseCase = ReservarTurnoSocioUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.UsuarioOrmEntity)),
    __param(1, (0, typeorm_1.InjectRepository)(entities_1.SocioOrmEntity)),
    __param(2, (0, typeorm_1.InjectRepository)(entities_1.NutricionistaOrmEntity)),
    __param(3, (0, typeorm_1.InjectRepository)(entities_1.AgendaOrmEntity)),
    __param(4, (0, typeorm_1.InjectRepository)(entities_1.TurnoOrmEntity)),
    __param(5, (0, common_1.Inject)(nutricionista_repository_1.NUTRICIONISTA_REPOSITORY)),
    __param(6, (0, common_1.Inject)(logger_service_1.APP_LOGGER_SERVICE)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        nutricionista_repository_1.NutricionistaRepository, Object])
], ReservarTurnoSocioUseCase);
//# sourceMappingURL=reservar-turno-socio.use-case.js.map