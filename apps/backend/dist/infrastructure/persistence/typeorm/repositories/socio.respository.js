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
exports.SocioRepositoryImplementation = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
const typeorm_2 = require("@nestjs/typeorm");
const persona_entity_1 = require("../entities/persona.entity");
const socio_entity_1 = require("../../../../domain/entities/Persona/Socio/socio.entity");
let SocioRepositoryImplementation = class SocioRepositoryImplementation {
    socioRepository;
    constructor(socioRepository) {
        this.socioRepository = socioRepository;
    }
    async save(entity) {
        const socioCreado = await this.socioRepository.save(this.toOrmEntity(entity));
        return this.toEntity(socioCreado);
    }
    async update(id, entity) {
        await this.socioRepository.update(id, {
            nombre: entity.nombre,
            apellido: entity.apellido,
            fechaNacimiento: entity.fechaNacimiento,
            telefono: entity.telefono,
            genero: entity.genero,
            direccion: entity.direccion,
            ciudad: entity.ciudad,
            provincia: entity.provincia,
            dni: entity.dni,
            fotoPerfilKey: entity.fotoPerfilKey,
        });
        const socioActualizado = await this.socioRepository.findOne({
            where: { idPersona: id },
            relations: ['usuario'],
        });
        if (!socioActualizado) {
            throw new Error(`Socio con id ${id} no encontrado`);
        }
        return this.toEntity(socioActualizado);
    }
    async delete(id) {
        await this.socioRepository.update(id, { fechaBaja: new Date() });
    }
    async reactivar(id) {
        await this.socioRepository.update(id, { fechaBaja: null });
    }
    async findAll() {
        const socios = await this.socioRepository.find({
            relations: ['usuario'],
            order: { idPersona: 'ASC' },
        });
        return socios.map((socio) => this.toEntity(socio));
    }
    async findById(id) {
        const socio = await this.socioRepository.findOne({
            where: { idPersona: id },
        });
        return socio ? this.toEntity(socio) : null;
    }
    toOrmEntity(socio) {
        const orm = new persona_entity_1.SocioOrmEntity();
        orm.idPersona = socio.idPersona;
        orm.nombre = socio.nombre;
        orm.apellido = socio.apellido;
        orm.fechaNacimiento = socio.fechaNacimiento;
        orm.genero = socio.genero;
        orm.ciudad = socio.ciudad;
        orm.provincia = socio.provincia;
        orm.telefono = socio.telefono;
        orm.direccion = socio.direccion;
        orm.dni = socio.dni;
        orm.fotoPerfilKey = socio.fotoPerfilKey;
        orm.fechaAlta = new Date();
        orm.fichaSalud = null;
        orm.planesAlimentacion = [];
        orm.turnos = [];
        return orm;
    }
    toEntity(orm) {
        const entity = new socio_entity_1.SocioEntity(orm.idPersona, orm.nombre, orm.apellido, orm.fechaNacimiento, orm.telefono, orm.genero, orm.direccion, orm.ciudad, orm.provincia, orm.dni ?? '', [], null, []);
        if (orm.fechaBaja) {
            entity.fechaBaja = orm.fechaBaja;
        }
        if (orm.usuario?.email) {
            entity.email = orm.usuario.email;
        }
        if (orm.fotoPerfilKey) {
            entity.fotoPerfilKey = orm.fotoPerfilKey;
        }
        return entity;
    }
};
exports.SocioRepositoryImplementation = SocioRepositoryImplementation;
exports.SocioRepositoryImplementation = SocioRepositoryImplementation = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_2.InjectRepository)(persona_entity_1.SocioOrmEntity)),
    __metadata("design:paramtypes", [typeorm_1.Repository])
], SocioRepositoryImplementation);
//# sourceMappingURL=socio.respository.js.map