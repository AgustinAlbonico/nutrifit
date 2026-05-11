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
exports.ConfirmarTurnoSocioUseCase = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const dtos_1 = require("../dtos");
const EstadoTurno_1 = require("../../../domain/entities/Turno/EstadoTurno");
const custom_exceptions_1 = require("../../../domain/exceptions/custom-exceptions");
const logger_service_1 = require("../../../domain/services/logger.service");
const argentina_datetime_util_1 = require("../../../common/utils/argentina-datetime.util");
const entities_1 = require("../../../infrastructure/persistence/typeorm/entities");
const typeorm_2 = require("typeorm");
const crypto_1 = require("crypto");
const notificaciones_service_1 = require("../../notificaciones/notificaciones.service");
const tipo_notificacion_enum_1 = require("../../../domain/entities/Notificacion/tipo-notificacion.enum");
let ConfirmarTurnoSocioUseCase = class ConfirmarTurnoSocioUseCase {
    usuarioRepository;
    socioRepository;
    turnoRepository;
    tokenRepository;
    notificacionesService;
    logger;
    constructor(usuarioRepository, socioRepository, turnoRepository, tokenRepository, notificacionesService, logger) {
        this.usuarioRepository = usuarioRepository;
        this.socioRepository = socioRepository;
        this.turnoRepository = turnoRepository;
        this.tokenRepository = tokenRepository;
        this.notificacionesService = notificacionesService;
        this.logger = logger;
    }
    async execute(userId, turnoId, tokenConfirmacion) {
        const socio = userId ? await this.resolveSocioByUserId(userId) : null;
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
        if (socio && turno.socio.idPersona !== socio.idPersona) {
            throw new custom_exceptions_1.ForbiddenError('No tiene permisos para confirmar este turno.');
        }
        if (tokenConfirmacion) {
            await this.validarTokenConfirmacion(turnoId, tokenConfirmacion);
        }
        if (turno.estadoTurno !== EstadoTurno_1.EstadoTurno.PROGRAMADO) {
            throw new custom_exceptions_1.BadRequestError('Solo se pueden confirmar turnos en estado PROGRAMADO.');
        }
        this.validateConfirmationWindow(turno.fechaTurno, turno.horaTurno);
        turno.estadoTurno = EstadoTurno_1.EstadoTurno.PRESENTE;
        turno.confirmedAt = new Date();
        const updatedTurno = await this.turnoRepository.save(turno);
        if (turno.socio.idPersona) {
            await this.notificacionesService.crear({
                destinatarioId: turno.socio.idPersona,
                tipo: tipo_notificacion_enum_1.TipoNotificacion.TURNO_RESERVADO,
                titulo: 'Turno confirmado',
                mensaje: `Tu turno del ${(0, argentina_datetime_util_1.formatArgentinaDate)(turno.fechaTurno)} a las ${(0, argentina_datetime_util_1.normalizeTimeToHHmm)(turno.horaTurno)} fue confirmado.`,
                metadata: { turnoId: turno.idTurno },
            });
        }
        if (turno.nutricionista.idPersona) {
            await this.notificacionesService.crear({
                destinatarioId: turno.nutricionista.idPersona,
                tipo: tipo_notificacion_enum_1.TipoNotificacion.TURNO_RESERVADO,
                titulo: 'Turno confirmado por socio',
                mensaje: `El socio confirmó el turno #${turno.idTurno} del ${(0, argentina_datetime_util_1.formatArgentinaDate)(turno.fechaTurno)} a las ${(0, argentina_datetime_util_1.normalizeTimeToHHmm)(turno.horaTurno)}.`,
                metadata: { turnoId: turno.idTurno },
            });
        }
        this.logger.log(`Turno ${turnoId} confirmado por socio ${socio?.idPersona ?? 'token'}.`);
        return this.toResponseDto(updatedTurno);
    }
    async validarTokenConfirmacion(turnoId, tokenPlano) {
        const tokenHash = (0, crypto_1.createHash)('sha256').update(tokenPlano).digest('hex');
        const registro = await this.tokenRepository.findOne({
            where: { turnoId, tokenHash },
        });
        if (!registro) {
            throw new custom_exceptions_1.BadRequestError('Token de confirmación inválido.');
        }
        if (registro.usadoEn) {
            throw new custom_exceptions_1.BadRequestError('El token ya fue utilizado.');
        }
        if (registro.expiraEn.getTime() < Date.now()) {
            throw new custom_exceptions_1.BadRequestError('El token de confirmación expiró.');
        }
        registro.usadoEn = new Date();
        await this.tokenRepository.save(registro);
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
    validateConfirmationWindow(fechaTurno, horaTurno) {
        const now = new Date();
        const scheduledDate = (0, argentina_datetime_util_1.combineArgentinaDateAndTime)(fechaTurno, horaTurno);
        if ((0, argentina_datetime_util_1.getArgentinaTodayDate)(now) !== (0, argentina_datetime_util_1.formatArgentinaDate)(scheduledDate)) {
            throw new custom_exceptions_1.BadRequestError('Solo se puede confirmar asistencia el dia del turno.');
        }
        if (now.getTime() >= scheduledDate.getTime()) {
            throw new custom_exceptions_1.BadRequestError('La confirmacion debe realizarse antes del horario del turno.');
        }
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
exports.ConfirmarTurnoSocioUseCase = ConfirmarTurnoSocioUseCase;
exports.ConfirmarTurnoSocioUseCase = ConfirmarTurnoSocioUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.UsuarioOrmEntity)),
    __param(1, (0, typeorm_1.InjectRepository)(entities_1.SocioOrmEntity)),
    __param(2, (0, typeorm_1.InjectRepository)(entities_1.TurnoOrmEntity)),
    __param(3, (0, typeorm_1.InjectRepository)(entities_1.TurnoConfirmacionTokenOrmEntity)),
    __param(5, (0, common_1.Inject)(logger_service_1.APP_LOGGER_SERVICE)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        notificaciones_service_1.NotificacionesService, Object])
], ConfirmarTurnoSocioUseCase);
//# sourceMappingURL=confirmar-turno-socio.use-case.js.map