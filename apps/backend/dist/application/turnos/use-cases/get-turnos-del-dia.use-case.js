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
exports.GetTurnosDelDiaUseCase = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const turno_del_dia_response_dto_1 = require("../dtos/turno-del-dia-response.dto");
const nutricionista_repository_1 = require("../../../domain/entities/Persona/Nutricionista/nutricionista.repository");
const custom_exceptions_1 = require("../../../domain/exceptions/custom-exceptions");
const logger_service_1 = require("../../../domain/services/logger.service");
const argentina_datetime_util_1 = require("../../../common/utils/argentina-datetime.util");
const turno_entity_1 = require("../../../infrastructure/persistence/typeorm/entities/turno.entity");
const typeorm_2 = require("typeorm");
let GetTurnosDelDiaUseCase = class GetTurnosDelDiaUseCase {
    turnoRepository;
    nutricionistaRepository;
    logger;
    constructor(turnoRepository, nutricionistaRepository, logger) {
        this.turnoRepository = turnoRepository;
        this.nutricionistaRepository = nutricionistaRepository;
        this.logger = logger;
    }
    async execute(nutricionistaId, query) {
        const nutricionista = await this.nutricionistaRepository.findById(nutricionistaId);
        if (!nutricionista) {
            throw new custom_exceptions_1.NotFoundError('Profesional', String(nutricionistaId));
        }
        this.validateTimeRange(query.horaDesde, query.horaHasta);
        const today = (0, argentina_datetime_util_1.getArgentinaTodayDate)();
        const queryBuilder = this.turnoRepository
            .createQueryBuilder('turno')
            .innerJoin('turno.nutricionista', 'nutricionista')
            .innerJoinAndSelect('turno.socio', 'socio')
            .leftJoinAndSelect('socio.fichaSalud', 'fichaSalud')
            .where('nutricionista.idPersona = :nutricionistaId', { nutricionistaId })
            .andWhere('turno.fechaTurno = :today', { today })
            .orderBy('turno.horaTurno', 'ASC');
        this.applyFilters(queryBuilder, query);
        const turnos = await queryBuilder.getMany();
        this.logger.log(`Turnos del dia consultados para profesional ${nutricionistaId}: ${turnos.length} resultados.`);
        return turnos.map((turno) => {
            const socio = new turno_del_dia_response_dto_1.SocioTurnoDelDiaResponseDto();
            socio.idPersona = turno.socio.idPersona ?? 0;
            socio.nombreCompleto =
                `${turno.socio.nombre} ${turno.socio.apellido}`.trim();
            socio.dni = turno.socio.dni ?? '';
            socio.objetivo = turno.socio.fichaSalud?.objetivoPersonal ?? null;
            const response = new turno_del_dia_response_dto_1.TurnoDelDiaResponseDto();
            response.idTurno = turno.idTurno;
            response.fechaTurno = (0, argentina_datetime_util_1.formatArgentinaDate)(turno.fechaTurno);
            response.horaTurno = (0, argentina_datetime_util_1.normalizeTimeToHHmm)(turno.horaTurno);
            response.estadoTurno = turno.estadoTurno;
            response.tipoConsulta = 'Consulta nutricional';
            response.socio = socio;
            return response;
        });
    }
    applyFilters(queryBuilder, query) {
        if (query.socio?.trim()) {
            const searchTerm = query.socio.trim();
            queryBuilder.andWhere('(LOWER(socio.nombre) LIKE :socioTerm OR LOWER(socio.apellido) LIKE :socioTerm OR socio.dni LIKE :dniTerm)', {
                socioTerm: `%${searchTerm.toLowerCase()}%`,
                dniTerm: `%${searchTerm}%`,
            });
        }
        if (query.objetivo?.trim()) {
            queryBuilder.andWhere('LOWER(fichaSalud.objetivoPersonal) LIKE :objetivo', {
                objetivo: `%${query.objetivo.trim().toLowerCase()}%`,
            });
        }
        if (query.horaDesde) {
            queryBuilder.andWhere('turno.horaTurno >= :horaDesde', {
                horaDesde: query.horaDesde,
            });
        }
        if (query.horaHasta) {
            queryBuilder.andWhere('turno.horaTurno <= :horaHasta', {
                horaHasta: query.horaHasta,
            });
        }
    }
    validateTimeRange(horaDesde, horaHasta) {
        if (!horaDesde || !horaHasta) {
            return;
        }
        if (this.timeToMinutes(horaDesde) > this.timeToMinutes(horaHasta)) {
            throw new custom_exceptions_1.BadRequestError('El rango horario es invalido: horaDesde no puede ser mayor a horaHasta.');
        }
    }
    timeToMinutes(time) {
        const [hours, minutes] = time.split(':').map((value) => Number(value));
        return hours * 60 + minutes;
    }
};
exports.GetTurnosDelDiaUseCase = GetTurnosDelDiaUseCase;
exports.GetTurnosDelDiaUseCase = GetTurnosDelDiaUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(turno_entity_1.TurnoOrmEntity)),
    __param(1, (0, common_1.Inject)(nutricionista_repository_1.NUTRICIONISTA_REPOSITORY)),
    __param(2, (0, common_1.Inject)(logger_service_1.APP_LOGGER_SERVICE)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        nutricionista_repository_1.NutricionistaRepository, Object])
], GetTurnosDelDiaUseCase);
//# sourceMappingURL=get-turnos-del-dia.use-case.js.map