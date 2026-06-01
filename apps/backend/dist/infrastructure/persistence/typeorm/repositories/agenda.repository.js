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
exports.AgendaRepositoryImplementation = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const agenda_entity_1 = require("../../../../domain/entities/Agenda/agenda.entity");
const typeorm_2 = require("typeorm");
const agenda_entity_2 = require("../entities/agenda.entity");
const persona_entity_1 = require("../entities/persona.entity");
const tenant_context_service_1 = require("../../../auth/tenant-context.service");
const custom_exceptions_1 = require("../../../../domain/exceptions/custom-exceptions");
let AgendaRepositoryImplementation = class AgendaRepositoryImplementation {
    agendaRepository;
    nutricionistaRepository;
    tenantContext;
    constructor(agendaRepository, nutricionistaRepository, tenantContext) {
        this.agendaRepository = agendaRepository;
        this.nutricionistaRepository = nutricionistaRepository;
        this.tenantContext = tenantContext;
    }
    async findByNutricionistaId(nutricionistaId) {
        const gimnasioIdActual = this.tenantContext?.isInitialized
            ? this.tenantContext.gimnasioId
            : undefined;
        const relaciones = await this.agendaRepository.find({
            where: {
                nutricionista: {
                    idPersona: nutricionistaId,
                    ...(gimnasioIdActual !== undefined && {
                        gimnasioId: gimnasioIdActual,
                    }),
                },
            },
            order: {
                dia: 'ASC',
                horaInicio: 'ASC',
            },
        });
        return relaciones.map((agenda) => this.toDomainEntity(agenda));
    }
    async replaceByNutricionistaId(nutricionistaId, agendas) {
        const gimnasioIdActual = this.tenantContext?.isInitialized
            ? this.tenantContext.gimnasioId
            : undefined;
        if (gimnasioIdActual !== undefined) {
            const ownerNutri = await this.nutricionistaRepository.findOne({
                where: { idPersona: nutricionistaId },
                select: ['idPersona', 'gimnasioId'],
            });
            if (!ownerNutri) {
                throw new custom_exceptions_1.BadRequestError('Nutricionista no encontrado');
            }
            if (ownerNutri.gimnasioId !== gimnasioIdActual) {
                throw new custom_exceptions_1.BadRequestError('No tienes permiso para modificar la agenda de este nutricionista');
            }
        }
        await this.agendaRepository
            .createQueryBuilder()
            .delete()
            .from(agenda_entity_2.AgendaOrmEntity)
            .where('id_nutricionista = :nutricionistaId', { nutricionistaId })
            .execute();
        const toCreate = agendas.map((agenda) => this.toOrmEntity(nutricionistaId, agenda));
        const saved = await this.agendaRepository.save(toCreate);
        return saved.map((agenda) => this.toDomainEntity(agenda));
    }
    toDomainEntity(ormEntity) {
        return new agenda_entity_1.AgendaEntity(ormEntity.idAgenda, ormEntity.dia, ormEntity.horaInicio, ormEntity.horaFin, ormEntity.duracionTurno);
    }
    toOrmEntity(nutricionistaId, agenda) {
        const nutricionista = new persona_entity_1.NutricionistaOrmEntity();
        nutricionista.idPersona = nutricionistaId;
        const agendaOrmEntity = new agenda_entity_2.AgendaOrmEntity();
        agendaOrmEntity.dia = agenda.dia;
        agendaOrmEntity.horaInicio = agenda.horaInicio;
        agendaOrmEntity.horaFin = agenda.horaFin;
        agendaOrmEntity.duracionTurno = agenda.duracionTurno;
        agendaOrmEntity.nutricionista = nutricionista;
        return agendaOrmEntity;
    }
};
exports.AgendaRepositoryImplementation = AgendaRepositoryImplementation;
exports.AgendaRepositoryImplementation = AgendaRepositoryImplementation = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(agenda_entity_2.AgendaOrmEntity)),
    __param(1, (0, typeorm_1.InjectRepository)(persona_entity_1.NutricionistaOrmEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        tenant_context_service_1.TenantContextService])
], AgendaRepositoryImplementation);
//# sourceMappingURL=agenda.repository.js.map