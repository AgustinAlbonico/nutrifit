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
exports.RegistrarAsistenciaTurnoUseCase = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const turno_operacion_response_dto_1 = require("../dtos/turno-operacion-response.dto");
const EstadoTurno_1 = require("../../../domain/entities/Turno/EstadoTurno");
const custom_exceptions_1 = require("../../../domain/exceptions/custom-exceptions");
const logger_service_1 = require("../../../domain/services/logger.service");
const argentina_datetime_util_1 = require("../../../common/utils/argentina-datetime.util");
const entities_1 = require("../../../infrastructure/persistence/typeorm/entities");
const typeorm_2 = require("typeorm");
let RegistrarAsistenciaTurnoUseCase = class RegistrarAsistenciaTurnoUseCase {
    turnoRepository;
    logger;
    constructor(turnoRepository, logger) {
        this.turnoRepository = turnoRepository;
        this.logger = logger;
    }
    async execute(nutricionistaId, turnoId, payload) {
        const turno = await this.turnoRepository.findOne({
            where: { idTurno: turnoId },
            relations: {
                nutricionista: true,
                socio: true,
            },
        });
        if (!turno) {
            throw new custom_exceptions_1.NotFoundError('Turno', String(turnoId));
        }
        if (turno.nutricionista.idPersona !== nutricionistaId) {
            throw new custom_exceptions_1.ForbiddenError('No tiene permisos para registrar asistencia en este turno.');
        }
        if (turno.estadoTurno !== EstadoTurno_1.EstadoTurno.PRESENTE) {
            throw new custom_exceptions_1.BadRequestError('Solo se puede registrar asistencia en turnos en estado PRESENTE.');
        }
        if (!this.hasTurnoElapsed(turno)) {
            throw new custom_exceptions_1.BadRequestError('Solo se puede registrar asistencia despues de la hora del turno.');
        }
        turno.estadoTurno = payload.asistio
            ? EstadoTurno_1.EstadoTurno.REALIZADO
            : EstadoTurno_1.EstadoTurno.AUSENTE;
        const turnoActualizado = await this.turnoRepository.save(turno);
        this.logger.log(`Asistencia registrada para turno ${turnoId}. Nuevo estado=${turnoActualizado.estadoTurno}.`);
        return this.toResponseDto(turnoActualizado);
    }
    hasTurnoElapsed(turno) {
        const scheduledDate = (0, argentina_datetime_util_1.combineArgentinaDateAndTime)(turno.fechaTurno, turno.horaTurno);
        return new Date().getTime() >= scheduledDate.getTime();
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
exports.RegistrarAsistenciaTurnoUseCase = RegistrarAsistenciaTurnoUseCase;
exports.RegistrarAsistenciaTurnoUseCase = RegistrarAsistenciaTurnoUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.TurnoOrmEntity)),
    __param(1, (0, common_1.Inject)(logger_service_1.APP_LOGGER_SERVICE)),
    __metadata("design:paramtypes", [typeorm_2.Repository, Object])
], RegistrarAsistenciaTurnoUseCase);
//# sourceMappingURL=registrar-asistencia-turno.use-case.js.map