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
exports.CancelarTurnoSocioUseCase = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const politica_operativa_repository_1 = require("../../politicas/politica-operativa.repository");
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
const auditoria_service_1 = require("../../../infrastructure/services/auditoria/auditoria.service");
const auditoria_entity_1 = require("../../../infrastructure/persistence/typeorm/entities/auditoria.entity");
let CancelarTurnoSocioUseCase = class CancelarTurnoSocioUseCase {
    usuarioRepository;
    socioRepository;
    turnoRepository;
    tokenRepository;
    notificacionesService;
    logger;
    politicaRepository;
    auditoriaService;
    constructor(usuarioRepository, socioRepository, turnoRepository, tokenRepository, notificacionesService, logger, politicaRepository, auditoriaService) {
        this.usuarioRepository = usuarioRepository;
        this.socioRepository = socioRepository;
        this.turnoRepository = turnoRepository;
        this.tokenRepository = tokenRepository;
        this.notificacionesService = notificacionesService;
        this.logger = logger;
        this.politicaRepository = politicaRepository;
        this.auditoriaService = auditoriaService;
    }
    async execute(userId, turnoId, tokenConfirmacion, dto) {
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
            throw new custom_exceptions_1.ForbiddenError('No tiene permisos para cancelar este turno.');
        }
        if (tokenConfirmacion) {
            await this.validarTokenConfirmacion(turnoId, tokenConfirmacion);
        }
        if (turno.estadoTurno !== EstadoTurno_1.EstadoTurno.PROGRAMADO) {
            throw new custom_exceptions_1.BadRequestError('Solo se pueden cancelar turnos en estado PROGRAMADO.');
        }
        if (!tokenConfirmacion) {
            await this.validatePolicyRule(turno);
        }
        turno.estadoTurno = EstadoTurno_1.EstadoTurno.CANCELADO;
        turno.motivoCancelacion = dto?.motivo ?? 'Cancelado por socio';
        const updatedTurno = await this.turnoRepository.save(turno);
        const usuarioId = userId ?? null;
        await this.auditoriaService.registrar({
            usuarioId,
            accion: auditoria_entity_1.AccionAuditoria.TURNO_ESTADO_CAMBIO,
            entidad: 'Turno',
            entidadId: turnoId,
            metadata: {
                estadoAnterior: EstadoTurno_1.EstadoTurno.PROGRAMADO,
                estadoNuevo: EstadoTurno_1.EstadoTurno.CANCELADO,
                motivo: turno.motivoCancelacion,
            },
        });
        if (turno.socio.idPersona) {
            await this.notificacionesService.crear({
                destinatarioId: turno.socio.idPersona,
                tipo: tipo_notificacion_enum_1.TipoNotificacion.TURNO_CANCELADO,
                titulo: 'Turno cancelado',
                mensaje: `Tu turno del ${(0, argentina_datetime_util_1.formatArgentinaDate)(turno.fechaTurno)} a las ${(0, argentina_datetime_util_1.normalizeTimeToHHmm)(turno.horaTurno)} fue cancelado.`,
                metadata: { turnoId: turno.idTurno },
            });
        }
        if (turno.nutricionista.idPersona) {
            await this.notificacionesService.crear({
                destinatarioId: turno.nutricionista.idPersona,
                tipo: tipo_notificacion_enum_1.TipoNotificacion.TURNO_CANCELADO,
                titulo: 'Turno cancelado por socio',
                mensaje: `El socio canceló el turno #${turno.idTurno}${turno.motivoCancelacion ? `. Motivo: ${turno.motivoCancelacion}` : ''}.`,
                metadata: { turnoId: turno.idTurno },
            });
        }
        this.logger.log(`Turno ${turnoId} cancelado por socio ${socio?.idPersona ?? 'token'}.`);
        this.logger.log(`Notificacion interna pendiente de integracion para profesional ${turno.nutricionista.idPersona}.`);
        return this.toResponseDto(updatedTurno);
    }
    async validarTokenConfirmacion(turnoId, tokenPlano) {
        const tokenHash = (0, crypto_1.createHash)('sha256').update(tokenPlano).digest('hex');
        const registro = await this.tokenRepository.findOne({
            where: { turnoId, tokenHash },
        });
        if (!registro)
            throw new custom_exceptions_1.BadRequestError('Token de confirmación inválido.');
        if (registro.usadoEn)
            throw new custom_exceptions_1.BadRequestError('El token ya fue utilizado.');
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
    validate24hRule(fechaTurno, horaTurno) {
        const scheduledDate = (0, argentina_datetime_util_1.combineArgentinaDateAndTime)(fechaTurno, horaTurno);
        const now = new Date();
        const hoursDiff = (scheduledDate.getTime() - now.getTime()) / (1000 * 60 * 60);
        if (hoursDiff < 24) {
            throw new custom_exceptions_1.BadRequestError('Solo se puede cancelar con al menos 24 horas de anticipacion.');
        }
    }
    async validatePolicyRule(turno) {
        const gimnasioId = turno.gimnasio?.idGimnasio ?? 1;
        const plazoHoras = await this.politicaRepository.getPlazoCancelacion(gimnasioId);
        const scheduledDate = (0, argentina_datetime_util_1.combineArgentinaDateAndTime)(turno.fechaTurno, turno.horaTurno);
        const now = new Date();
        const hoursDiff = (scheduledDate.getTime() - now.getTime()) / (1000 * 60 * 60);
        if (hoursDiff < plazoHoras) {
            throw new custom_exceptions_1.BadRequestError(`Solo se puede cancelar con al menos ${plazoHoras} horas de anticipacion.`);
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
        response.gimnasioId = turno.gimnasio?.idGimnasio;
        response.motivoCancelacion = turno.motivoCancelacion ?? undefined;
        return response;
    }
};
exports.CancelarTurnoSocioUseCase = CancelarTurnoSocioUseCase;
exports.CancelarTurnoSocioUseCase = CancelarTurnoSocioUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.UsuarioOrmEntity)),
    __param(1, (0, typeorm_1.InjectRepository)(entities_1.SocioOrmEntity)),
    __param(2, (0, typeorm_1.InjectRepository)(entities_1.TurnoOrmEntity)),
    __param(3, (0, typeorm_1.InjectRepository)(entities_1.TurnoConfirmacionTokenOrmEntity)),
    __param(5, (0, common_1.Inject)(logger_service_1.APP_LOGGER_SERVICE)),
    __param(6, (0, common_1.Inject)(politica_operativa_repository_1.POLITICA_OPERATIVA_REPOSITORY)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        notificaciones_service_1.NotificacionesService, Object, Object, auditoria_service_1.AuditoriaService])
], CancelarTurnoSocioUseCase);
//# sourceMappingURL=cancelar-turno-socio.use-case.js.map