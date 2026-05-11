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
exports.GetTurnosRecepcionDiaUseCase = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const recepcion_turno_response_dto_1 = require("../dtos/recepcion-turno-response.dto");
const nutricionista_repository_1 = require("../../../domain/entities/Persona/Nutricionista/nutricionista.repository");
const logger_service_1 = require("../../../domain/services/logger.service");
const argentina_datetime_util_1 = require("../../../common/utils/argentina-datetime.util");
const turno_entity_1 = require("../../../infrastructure/persistence/typeorm/entities/turno.entity");
const typeorm_2 = require("typeorm");
let GetTurnosRecepcionDiaUseCase = class GetTurnosRecepcionDiaUseCase {
    turnoRepository;
    nutricionistaRepository;
    logger;
    constructor(turnoRepository, nutricionistaRepository, logger) {
        this.turnoRepository = turnoRepository;
        this.nutricionistaRepository = nutricionistaRepository;
        this.logger = logger;
    }
    async execute(fecha) {
        const targetDate = fecha || (0, argentina_datetime_util_1.getArgentinaTodayDate)();
        const queryBuilder = this.turnoRepository
            .createQueryBuilder('turno')
            .leftJoinAndSelect('turno.socio', 'socio')
            .innerJoinAndSelect('turno.nutricionista', 'nutricionista')
            .where('DATE(turno.fechaTurno) = :targetDate', { targetDate })
            .andWhere('turno.estadoTurno IN (:...estados)', {
            estados: ['PROGRAMADO', 'PRESENTE', 'EN_CURSO'],
        })
            .orderBy('turno.horaTurno', 'ASC');
        const turnos = await queryBuilder.getMany();
        this.logger.log(`Turnos de recepcion consultados para fecha ${targetDate}: ${turnos.length} resultados.`);
        return turnos.map((turno) => {
            const response = new recepcion_turno_response_dto_1.RecepcionTurnoResponseDto();
            response.idTurno = turno.idTurno;
            response.fechaTurno = (0, argentina_datetime_util_1.formatArgentinaDate)(turno.fechaTurno);
            response.horaTurno = turno.horaTurno;
            response.estadoTurno = turno.estadoTurno;
            response.nombreSocio = turno.socio
                ? `${turno.socio.nombre} ${turno.socio.apellido}`.trim()
                : 'Sin socio asignado';
            response.nombreNutricionista =
                `${turno.nutricionista.nombre} ${turno.nutricionista.apellido}`.trim();
            response.dniSocio = turno.socio?.dni ?? '';
            return response;
        });
    }
};
exports.GetTurnosRecepcionDiaUseCase = GetTurnosRecepcionDiaUseCase;
exports.GetTurnosRecepcionDiaUseCase = GetTurnosRecepcionDiaUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(turno_entity_1.TurnoOrmEntity)),
    __param(1, (0, common_1.Inject)(nutricionista_repository_1.NUTRICIONISTA_REPOSITORY)),
    __param(2, (0, common_1.Inject)(logger_service_1.APP_LOGGER_SERVICE)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        nutricionista_repository_1.NutricionistaRepository, Object])
], GetTurnosRecepcionDiaUseCase);
//# sourceMappingURL=get-turnos-recepcion-dia.use-case.js.map