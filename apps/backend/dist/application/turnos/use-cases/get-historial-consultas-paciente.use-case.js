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
exports.GetHistorialConsultasPacienteUseCase = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const historial_consulta_paciente_response_dto_1 = require("../dtos/historial-consulta-paciente-response.dto");
const nutricionista_repository_1 = require("../../../domain/entities/Persona/Nutricionista/nutricionista.repository");
const EstadoTurno_1 = require("../../../domain/entities/Turno/EstadoTurno");
const custom_exceptions_1 = require("../../../domain/exceptions/custom-exceptions");
const logger_service_1 = require("../../../domain/services/logger.service");
const argentina_datetime_util_1 = require("../../../common/utils/argentina-datetime.util");
const entities_1 = require("../../../infrastructure/persistence/typeorm/entities");
const typeorm_2 = require("typeorm");
let GetHistorialConsultasPacienteUseCase = class GetHistorialConsultasPacienteUseCase {
    turnoRepository;
    socioRepository;
    nutricionistaRepository;
    logger;
    constructor(turnoRepository, socioRepository, nutricionistaRepository, logger) {
        this.turnoRepository = turnoRepository;
        this.socioRepository = socioRepository;
        this.nutricionistaRepository = nutricionistaRepository;
        this.logger = logger;
    }
    async execute(nutricionistaId, socioId) {
        const nutricionista = await this.nutricionistaRepository.findById(nutricionistaId);
        if (!nutricionista) {
            throw new custom_exceptions_1.NotFoundError('Profesional', String(nutricionistaId));
        }
        const socio = await this.socioRepository.findOne({
            where: { idPersona: socioId },
        });
        if (!socio) {
            throw new custom_exceptions_1.NotFoundError('Socio', String(socioId));
        }
        const hasVinculo = await this.hasTurnoVinculo(nutricionistaId, socioId);
        if (!hasVinculo) {
            throw new custom_exceptions_1.ForbiddenError('Solo puede acceder al historial de socios con turnos asignados o historicos.');
        }
        const turnos = await this.turnoRepository.find({
            where: {
                nutricionista: {
                    idPersona: nutricionistaId,
                },
                socio: {
                    idPersona: socioId,
                },
                estadoTurno: (0, typeorm_2.In)([EstadoTurno_1.EstadoTurno.REALIZADO, EstadoTurno_1.EstadoTurno.AUSENTE]),
            },
            relations: {
                observacionClinica: true,
            },
            order: {
                fechaTurno: 'DESC',
                horaTurno: 'DESC',
            },
        });
        this.logger.log(`Historial de consultas consultado. Profesional=${nutricionistaId}, socio=${socioId}, resultados=${turnos.length}.`);
        return turnos.map((turno) => {
            const response = new historial_consulta_paciente_response_dto_1.HistorialConsultaPacienteResponseDto();
            response.idTurno = turno.idTurno;
            response.fechaTurno = (0, argentina_datetime_util_1.formatArgentinaDate)(turno.fechaTurno);
            response.horaTurno = (0, argentina_datetime_util_1.normalizeTimeToHHmm)(turno.horaTurno);
            response.estadoTurno = turno.estadoTurno;
            response.tipoConsulta = 'Consulta nutricional';
            response.notasProfesional = turno.observacionClinica?.comentario ?? null;
            response.sugerencias = turno.observacionClinica?.sugerencias ?? null;
            response.esPublica = turno.observacionClinica?.esPublica ?? false;
            response.archivosAdjuntos = [];
            return response;
        });
    }
    async hasTurnoVinculo(nutricionistaId, socioId) {
        const totalTurnos = await this.turnoRepository.count({
            where: {
                nutricionista: {
                    idPersona: nutricionistaId,
                },
                socio: {
                    idPersona: socioId,
                },
            },
        });
        return totalTurnos > 0;
    }
};
exports.GetHistorialConsultasPacienteUseCase = GetHistorialConsultasPacienteUseCase;
exports.GetHistorialConsultasPacienteUseCase = GetHistorialConsultasPacienteUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.TurnoOrmEntity)),
    __param(1, (0, typeorm_1.InjectRepository)(entities_1.SocioOrmEntity)),
    __param(2, (0, common_1.Inject)(nutricionista_repository_1.NUTRICIONISTA_REPOSITORY)),
    __param(3, (0, common_1.Inject)(logger_service_1.APP_LOGGER_SERVICE)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        nutricionista_repository_1.NutricionistaRepository, Object])
], GetHistorialConsultasPacienteUseCase);
//# sourceMappingURL=get-historial-consultas-paciente.use-case.js.map