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
Object.defineProperty(exports, "__esModule", { value: true });
exports.FormacionAcademicaOrmEntity = void 0;
const typeorm_1 = require("typeorm");
const persona_entity_1 = require("./persona.entity");
const nutricionista_entity_1 = require("../../../../domain/entities/Persona/Nutricionista/nutricionista.entity");
let FormacionAcademicaOrmEntity = class FormacionAcademicaOrmEntity {
    idFormacionAcademica;
    titulo;
    institucion;
    añoInicio;
    añoFin;
    nivel;
    nutricionista;
};
exports.FormacionAcademicaOrmEntity = FormacionAcademicaOrmEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ name: 'id_formacion_academica' }),
    __metadata("design:type", Number)
], FormacionAcademicaOrmEntity.prototype, "idFormacionAcademica", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'titulo', type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], FormacionAcademicaOrmEntity.prototype, "titulo", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'institucion', type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], FormacionAcademicaOrmEntity.prototype, "institucion", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'anio_inicio', type: 'int' }),
    __metadata("design:type", Number)
], FormacionAcademicaOrmEntity.prototype, "a\u00F1oInicio", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'anio_fin', type: 'int' }),
    __metadata("design:type", Number)
], FormacionAcademicaOrmEntity.prototype, "a\u00F1oFin", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'nivel', type: 'varchar', length: 50 }),
    __metadata("design:type", String)
], FormacionAcademicaOrmEntity.prototype, "nivel", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => persona_entity_1.NutricionistaOrmEntity, (nutricionista) => nutricionista.formacionAcademica, { nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'id_nutricionista' }),
    __metadata("design:type", nutricionista_entity_1.NutricionistaEntity)
], FormacionAcademicaOrmEntity.prototype, "nutricionista", void 0);
exports.FormacionAcademicaOrmEntity = FormacionAcademicaOrmEntity = __decorate([
    (0, typeorm_1.Entity)('formacion_academica')
], FormacionAcademicaOrmEntity);
//# sourceMappingURL=formacion-academica.entity.js.map