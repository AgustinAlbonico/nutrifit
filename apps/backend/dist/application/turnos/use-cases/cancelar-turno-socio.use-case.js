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
const dtos_1 = require("../dtos");
const EstadoTurno_1 = require("../../../domain/entities/Turno/EstadoTurno");
const custom_exceptions_1 = require("../../../domain/exceptions/custom-exceptions");
const logger_service_1 = require("../../../domain/services/logger.service");
const argentina_datetime_util_1 = require("../../../common/utils/argentina-datetime.util");
const entities_1 = require("../../../infrastructure/persistence/typeorm/entities");
const typeorm_2 = require("typeorm");
let CancelarTurnoSocioUseCase = class CancelarTurnoSocioUseCase {
    usuarioRepository;
    socioRepository;
    turnoRepository;
    logger;
    constructor(usuarioRepository, socioRepository, turnoRepository, logger) {
        this.usuarioRepository = usuarioRepository;
        this.socioRepository = socioRepository;
        this.turnoRepository = turnoRepository;
        this.logger = logger;
    }
    async execute(userId, turnoId) {
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
            throw new custom_exceptions_1.ForbiddenError('No tiene permisos para cancelar este turno.');
        }
        if (turno.estadoTurno !== EstadoTurno_1.EstadoTurno.PENDIENTE) {
            throw new custom_exceptions_1.BadRequestError('Solo se pueden cancelar turnos en estado PENDIENTE.');
        }
        this.validate24hRule(turno.fechaTurno, turno.horaTurno);
        turno.estadoTurno = EstadoTurno_1.EstadoTurno.CANCELADO;
        const updatedTurno = await this.turnoRepository.save(turno);
        this.logger.log(`Turno ${turnoId} cancelado por socio ${socio.idPersona}.`);
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
            throw new custom_exceptions_1.BadRequestError('Solo se puede cancelar con al menos 24 horas de anticipacion.');
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
exports.CancelarTurnoSocioUseCase = CancelarTurnoSocioUseCase;
exports.CancelarTurnoSocioUseCase = CancelarTurnoSocioUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.UsuarioOrmEntity)),
    __param(1, (0, typeorm_1.InjectRepository)(entities_1.SocioOrmEntity)),
    __param(2, (0, typeorm_1.InjectRepository)(entities_1.TurnoOrmEntity)),
    __param(3, (0, common_1.Inject)(logger_service_1.APP_LOGGER_SERVICE)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository, Object])
], CancelarTurnoSocioUseCase);
//# sourceMappingURL=cancelar-turno-socio.use-case.js.map