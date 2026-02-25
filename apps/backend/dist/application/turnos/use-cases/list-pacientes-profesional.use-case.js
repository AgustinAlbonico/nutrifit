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
exports.ListPacientesProfesionalUseCase = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const dtos_1 = require("../dtos");
const nutricionista_repository_1 = require("../../../domain/entities/Persona/Nutricionista/nutricionista.repository");
const custom_exceptions_1 = require("../../../domain/exceptions/custom-exceptions");
const logger_service_1 = require("../../../domain/services/logger.service");
const argentina_datetime_util_1 = require("../../../common/utils/argentina-datetime.util");
const entities_1 = require("../../../infrastructure/persistence/typeorm/entities");
const typeorm_2 = require("typeorm");
let ListPacientesProfesionalUseCase = class ListPacientesProfesionalUseCase {
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
        const queryBuilder = this.turnoRepository
            .createQueryBuilder('turno')
            .innerJoin('turno.nutricionista', 'nutricionista')
            .innerJoinAndSelect('turno.socio', 'socio')
            .leftJoinAndSelect('socio.fichaSalud', 'fichaSalud')
            .where('nutricionista.idPersona = :nutricionistaId', { nutricionistaId })
            .orderBy('turno.fechaTurno', 'DESC')
            .addOrderBy('turno.horaTurno', 'DESC');
        if (query.nombre?.trim()) {
            const term = `%${query.nombre.trim().toLowerCase()}%`;
            queryBuilder.andWhere('(LOWER(socio.nombre) LIKE :term OR LOWER(socio.apellido) LIKE :term OR socio.dni LIKE :dniTerm)', {
                term,
                dniTerm: `%${query.nombre.trim()}%`,
            });
        }
        if (query.objetivo?.trim()) {
            queryBuilder.andWhere('LOWER(fichaSalud.objetivoPersonal) LIKE :objetivo', {
                objetivo: `%${query.objetivo.trim().toLowerCase()}%`,
            });
        }
        const turnos = await queryBuilder.getMany();
        const now = new Date();
        const ultimoTurnoMap = new Map();
        const proximoTurnoMap = new Map();
        const pacientesMap = new Map();
        for (const turno of turnos) {
            const socioId = turno.socio.idPersona ?? 0;
            if (!pacientesMap.has(socioId)) {
                const paciente = new dtos_1.PacienteProfesionalResponseDto();
                paciente.socioId = socioId;
                paciente.nombreCompleto =
                    `${turno.socio.nombre} ${turno.socio.apellido}`.trim();
                paciente.dni = turno.socio.dni ?? '';
                paciente.objetivo = turno.socio.fichaSalud?.objetivoPersonal ?? null;
                paciente.ultimoTurno = null;
                paciente.proximoTurno = null;
                paciente.fotoPerfilUrl = turno.socio.fotoPerfilKey
                    ? `/socio/${socioId}/foto?v=${encodeURIComponent(turno.socio.fotoPerfilKey)}`
                    : null;
                pacientesMap.set(socioId, paciente);
            }
            const paciente = pacientesMap.get(socioId);
            const turnoDateTime = (0, argentina_datetime_util_1.combineArgentinaDateAndTime)(turno.fechaTurno, turno.horaTurno);
            if (turnoDateTime.getTime() <= now.getTime()) {
                const ultimoTurno = ultimoTurnoMap.get(socioId);
                if (!ultimoTurno || turnoDateTime > ultimoTurno) {
                    ultimoTurnoMap.set(socioId, turnoDateTime);
                }
            }
            else {
                const proximoTurno = proximoTurnoMap.get(socioId);
                if (!proximoTurno || turnoDateTime < proximoTurno) {
                    proximoTurnoMap.set(socioId, turnoDateTime);
                }
            }
            paciente.ultimoTurno = ultimoTurnoMap.get(socioId)
                ? (0, argentina_datetime_util_1.formatArgentinaDateTime)(ultimoTurnoMap.get(socioId))
                : null;
            paciente.proximoTurno = proximoTurnoMap.get(socioId)
                ? (0, argentina_datetime_util_1.formatArgentinaDateTime)(proximoTurnoMap.get(socioId))
                : null;
        }
        const pacientes = Array.from(pacientesMap.values()).sort((a, b) => a.nombreCompleto.localeCompare(b.nombreCompleto));
        this.logger.log(`Pacientes recuperados para profesional ${nutricionistaId}: ${pacientes.length}.`);
        return pacientes;
    }
};
exports.ListPacientesProfesionalUseCase = ListPacientesProfesionalUseCase;
exports.ListPacientesProfesionalUseCase = ListPacientesProfesionalUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.TurnoOrmEntity)),
    __param(1, (0, common_1.Inject)(nutricionista_repository_1.NUTRICIONISTA_REPOSITORY)),
    __param(2, (0, common_1.Inject)(logger_service_1.APP_LOGGER_SERVICE)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        nutricionista_repository_1.NutricionistaRepository, Object])
], ListPacientesProfesionalUseCase);
//# sourceMappingURL=list-pacientes-profesional.use-case.js.map