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
exports.NutricionistaRepositoryImplementation = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
const typeorm_2 = require("@nestjs/typeorm");
const persona_entity_1 = require("../entities/persona.entity");
const nutricionista_entity_1 = require("../../../../domain/entities/Persona/Nutricionista/nutricionista.entity");
const tenant_context_service_1 = require("../../../auth/tenant-context.service");
function obtenerGimnasioIdActual(tenantContext) {
    if (!tenantContext?.isInitialized) {
        throw new Error('Tenant context not initialized — cannot perform tenant-scoped operation');
    }
    return tenantContext.gimnasioId;
}
let NutricionistaRepositoryImplementation = class NutricionistaRepositoryImplementation {
    nutricionistaRepository;
    tenantContext;
    constructor(nutricionistaRepository, tenantContext) {
        this.nutricionistaRepository = nutricionistaRepository;
        this.tenantContext = tenantContext;
    }
    get gimnasioIdActual() {
        return obtenerGimnasioIdActual(this.tenantContext);
    }
    async save(entity) {
        const gimnasioId = entity.gimnasioId ?? this.gimnasioIdActual;
        const nutricionistaCreado = await this.nutricionistaRepository.save(this.toOrmEntity(entity, gimnasioId));
        return this.toDomainEntity(nutricionistaCreado);
    }
    async update(id, entity) {
        const gimnasioId = this.gimnasioIdActual;
        const existing = await this.nutricionistaRepository.findOne({
            where: { idPersona: id, gimnasioId },
        });
        if (!existing) {
            throw new Error(`Nutricionista with id ${id} not found in this gym`);
        }
        existing.nombre = entity.nombre;
        existing.apellido = entity.apellido;
        existing.fechaNacimiento = entity.fechaNacimiento;
        existing.genero = entity.genero;
        existing.ciudad = entity.ciudad;
        existing.provincia = entity.provincia;
        existing.telefono = entity.telefono;
        existing.direccion = entity.direccion;
        existing.dni = entity.dni;
        existing.fotoPerfilKey = entity.fotoPerfilKey;
        existing.matricula = entity.matricula;
        existing.tarifaSesion = entity.tarifaSesion;
        existing.añosExperiencia = entity.añosExperiencia;
        existing.fechaBaja = entity.fechaBaja;
        const updated = await this.nutricionistaRepository.save(existing);
        return this.toDomainEntity(updated);
    }
    async delete(id) {
        const gimnasioId = this.gimnasioIdActual;
        const resultado = await this.nutricionistaRepository.delete({
            idPersona: id,
            gimnasioId,
        });
        if (resultado.affected === 0) {
            throw new Error(`Nutricionista with id ${id} not found in this gym`);
        }
    }
    async findAll() {
        const gimnasioId = this.gimnasioIdActual;
        const nutricionistas = await this.nutricionistaRepository.find({
            where: { gimnasioId },
            relations: {
                usuario: true,
                agenda: true,
                formacionAcademica: true,
                turnos: true,
            },
        });
        return nutricionistas.map((nut) => this.toDomainEntity(nut));
    }
    async findById(id) {
        const gimnasioId = this.gimnasioIdActual;
        const nutricionista = await this.nutricionistaRepository.findOne({
            where: { idPersona: id, gimnasioId },
            relations: {
                usuario: true,
                agenda: true,
                formacionAcademica: true,
                turnos: true,
            },
        });
        if (!nutricionista)
            return null;
        return this.toDomainEntity(nutricionista);
    }
    async findByEmail(email) {
        return null;
    }
    async findByDni(dni) {
        const gimnasioId = this.gimnasioIdActual;
        const nutricionista = await this.nutricionistaRepository.findOne({
            where: { dni, gimnasioId },
            relations: {
                usuario: true,
                agenda: true,
                formacionAcademica: true,
                turnos: true,
            },
        });
        if (!nutricionista)
            return null;
        return this.toDomainEntity(nutricionista);
    }
    async findByMatricula(matricula) {
        const gimnasioId = this.gimnasioIdActual;
        const nutricionista = await this.nutricionistaRepository.findOne({
            where: { matricula, gimnasioId },
            relations: {
                usuario: true,
                agenda: true,
                formacionAcademica: true,
                turnos: true,
            },
        });
        if (!nutricionista)
            return null;
        return this.toDomainEntity(nutricionista);
    }
    toOrmEntity(nutricionista, gimnasioId) {
        return {
            idPersona: nutricionista.idPersona ?? null,
            nombre: nutricionista.nombre,
            apellido: nutricionista.apellido,
            fechaNacimiento: nutricionista.fechaNacimiento,
            genero: nutricionista.genero,
            ciudad: nutricionista.ciudad,
            provincia: nutricionista.provincia,
            telefono: nutricionista.telefono,
            direccion: nutricionista.direccion,
            dni: nutricionista.dni,
            fotoPerfilKey: nutricionista.fotoPerfilKey,
            matricula: nutricionista.matricula,
            tarifaSesion: nutricionista.tarifaSesion,
            añosExperiencia: nutricionista.añosExperiencia,
            formacionAcademica: nutricionista.formacionAcademica || [],
            turnos: nutricionista.turnos || [],
            fechaBaja: nutricionista.fechaBaja,
            gimnasioId,
        };
    }
    toDomainEntity(orm) {
        const entity = new nutricionista_entity_1.NutricionistaEntity(orm.idPersona, orm.nombre, orm.apellido, orm.fechaNacimiento, orm.telefono, orm.genero, orm.direccion, orm.ciudad, orm.provincia, orm.dni ?? '', orm.añosExperiencia, orm.tarifaSesion, orm.agenda || [], [], [], orm.fechaBaja, orm.usuario?.email ?? '');
        entity.gimnasioId = orm.gimnasioId;
        if (orm.fotoPerfilKey) {
            entity.fotoPerfilKey = orm.fotoPerfilKey;
        }
        return entity;
    }
};
exports.NutricionistaRepositoryImplementation = NutricionistaRepositoryImplementation;
exports.NutricionistaRepositoryImplementation = NutricionistaRepositoryImplementation = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_2.InjectRepository)(persona_entity_1.NutricionistaOrmEntity)),
    __param(1, (0, common_1.Inject)(tenant_context_service_1.TenantContextService)),
    __param(1, (0, common_1.Optional)()),
    __metadata("design:paramtypes", [typeorm_1.Repository,
        tenant_context_service_1.TenantContextService])
], NutricionistaRepositoryImplementation);
//# sourceMappingURL=nutricionista.repository.js.map