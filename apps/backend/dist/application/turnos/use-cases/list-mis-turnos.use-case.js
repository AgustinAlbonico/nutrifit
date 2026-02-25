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
exports.ListMisTurnosUseCase = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const dtos_1 = require("../dtos");
const EstadoTurno_1 = require("../../../domain/entities/Turno/EstadoTurno");
const custom_exceptions_1 = require("../../../domain/exceptions/custom-exceptions");
const logger_service_1 = require("../../../domain/services/logger.service");
const argentina_datetime_util_1 = require("../../../common/utils/argentina-datetime.util");
const entities_1 = require("../../../infrastructure/persistence/typeorm/entities");
const typeorm_2 = require("typeorm");
let ListMisTurnosUseCase = class ListMisTurnosUseCase {
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
    async execute(userId, query) {
        const socio = await this.resolveSocioByUserId(userId);
        if (query.especialidad?.trim()) {
            const normalized = query.especialidad.trim().toLowerCase();
            if (!'nutricionista'.includes(normalized)) {
                return [];
            }
        }
        const queryBuilder = this.turnoRepository
            .createQueryBuilder('turno')
            .innerJoinAndSelect('turno.nutricionista', 'nutricionista')
            .where('turno.id_socio = :socioId', {
            socioId: socio.idPersona,
        })
            .orderBy('turno.fechaTurno', 'DESC')
            .addOrderBy('turno.horaTurno', 'DESC');
        if (query.estado?.trim()) {
            const normalizedEstado = query.estado.trim().toUpperCase();
            if (Object.values(EstadoTurno_1.EstadoTurno).includes(normalizedEstado)) {
                queryBuilder.andWhere('turno.estadoTurno = :estado', {
                    estado: normalizedEstado,
                });
            }
        }
        if (query.desde?.trim()) {
            queryBuilder.andWhere('turno.fechaTurno >= :desde', {
                desde: query.desde,
            });
        }
        if (query.hasta?.trim()) {
            queryBuilder.andWhere('turno.fechaTurno <= :hasta', {
                hasta: query.hasta,
            });
        }
        if (query.profesional?.trim()) {
            const term = `%${query.profesional.trim().toLowerCase()}%`;
            queryBuilder.andWhere('(LOWER(nutricionista.nombre) LIKE :term OR LOWER(nutricionista.apellido) LIKE :term)', { term });
        }
        const turnos = await queryBuilder.getMany();
        this.logger.log(`Mis turnos recuperados para socio ${socio.idPersona}: ${turnos.length}.`);
        return turnos.map((turno) => {
            const response = new dtos_1.MiTurnoResponseDto();
            response.idTurno = turno.idTurno;
            response.fechaTurno = (0, argentina_datetime_util_1.formatArgentinaDate)(turno.fechaTurno);
            response.horaTurno = (0, argentina_datetime_util_1.normalizeTimeToHHmm)(turno.horaTurno);
            response.estadoTurno = turno.estadoTurno;
            response.profesionalId = turno.nutricionista.idPersona ?? 0;
            response.profesionalNombreCompleto =
                `${turno.nutricionista.nombre} ${turno.nutricionista.apellido}`.trim();
            response.especialidad = 'Nutricionista';
            return response;
        });
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
};
exports.ListMisTurnosUseCase = ListMisTurnosUseCase;
exports.ListMisTurnosUseCase = ListMisTurnosUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.UsuarioOrmEntity)),
    __param(1, (0, typeorm_1.InjectRepository)(entities_1.SocioOrmEntity)),
    __param(2, (0, typeorm_1.InjectRepository)(entities_1.TurnoOrmEntity)),
    __param(3, (0, common_1.Inject)(logger_service_1.APP_LOGGER_SERVICE)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository, Object])
], ListMisTurnosUseCase);
//# sourceMappingURL=list-mis-turnos.use-case.js.map