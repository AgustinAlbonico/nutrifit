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
let NutricionistaRepositoryImplementation = class NutricionistaRepositoryImplementation {
    nutricionistaRepository;
    constructor(nutricionistaRepository) {
        this.nutricionistaRepository = nutricionistaRepository;
    }
    async save(entity) {
        const nutricionistaCreado = await this.nutricionistaRepository.save(this.toOrmEntity(entity));
        return this.toDomainEntity(nutricionistaCreado);
    }
    async update(id, entity) {
        const existing = await this.nutricionistaRepository.findOneBy({
            idPersona: id,
        });
        if (!existing) {
            throw new Error(`Nutricionista with id ${id} not found`);
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
        await this.nutricionistaRepository.delete(id);
    }
    async findAll() {
        const nutricionistas = await this.nutricionistaRepository.find({
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
        const nutricionista = await this.nutricionistaRepository.findOne({
            where: { idPersona: id },
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
        const nutricionista = await this.nutricionistaRepository.findOne({
            where: { dni },
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
        const nutricionista = await this.nutricionistaRepository.findOne({
            where: { matricula },
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
    toOrmEntity(nutricionista) {
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
        };
    }
    toDomainEntity(orm) {
        const entity = new nutricionista_entity_1.NutricionistaEntity(orm.idPersona, orm.nombre, orm.apellido, orm.fechaNacimiento, orm.telefono, orm.genero, orm.direccion, orm.ciudad, orm.provincia, orm.dni ?? '', orm.añosExperiencia, orm.tarifaSesion, orm.agenda || [], [], [], orm.fechaBaja, orm.usuario?.email ?? '');
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
    __metadata("design:paramtypes", [typeorm_1.Repository])
], NutricionistaRepositoryImplementation);
//# sourceMappingURL=nutricionista.repository.js.map