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
exports.MedicionOrmEntity = void 0;
const typeorm_1 = require("typeorm");
const turno_entity_1 = require("./turno.entity");
let MedicionOrmEntity = class MedicionOrmEntity {
    idMedicion;
    peso;
    altura;
    imc;
    perimetroCintura;
    perimetroCadera;
    perimetroBrazo;
    perimetroMuslo;
    perimetroPecho;
    pliegueTriceps;
    pliegueAbdominal;
    pliegueMuslo;
    porcentajeGrasa;
    masaMagra;
    frecuenciaCardiaca;
    tensionSistolica;
    tensionDiastolica;
    notasMedicion;
    createdAt;
    turno;
};
exports.MedicionOrmEntity = MedicionOrmEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ name: 'id_medicion' }),
    __metadata("design:type", Number)
], MedicionOrmEntity.prototype, "idMedicion", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'peso', type: 'decimal', precision: 5, scale: 2 }),
    __metadata("design:type", Number)
], MedicionOrmEntity.prototype, "peso", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'altura', type: 'int' }),
    __metadata("design:type", Number)
], MedicionOrmEntity.prototype, "altura", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'imc', type: 'decimal', precision: 5, scale: 2 }),
    __metadata("design:type", Number)
], MedicionOrmEntity.prototype, "imc", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'perimetro_cintura',
        type: 'decimal',
        precision: 5,
        scale: 2,
        nullable: true,
    }),
    __metadata("design:type", Object)
], MedicionOrmEntity.prototype, "perimetroCintura", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'perimetro_cadera',
        type: 'decimal',
        precision: 5,
        scale: 2,
        nullable: true,
    }),
    __metadata("design:type", Object)
], MedicionOrmEntity.prototype, "perimetroCadera", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'perimetro_brazo',
        type: 'decimal',
        precision: 5,
        scale: 2,
        nullable: true,
    }),
    __metadata("design:type", Object)
], MedicionOrmEntity.prototype, "perimetroBrazo", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'perimetro_muslo',
        type: 'decimal',
        precision: 5,
        scale: 2,
        nullable: true,
    }),
    __metadata("design:type", Object)
], MedicionOrmEntity.prototype, "perimetroMuslo", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'perimetro_pecho',
        type: 'decimal',
        precision: 5,
        scale: 2,
        nullable: true,
    }),
    __metadata("design:type", Object)
], MedicionOrmEntity.prototype, "perimetroPecho", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'pliegue_triceps',
        type: 'decimal',
        precision: 5,
        scale: 2,
        nullable: true,
    }),
    __metadata("design:type", Object)
], MedicionOrmEntity.prototype, "pliegueTriceps", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'pliegue_abdominal',
        type: 'decimal',
        precision: 5,
        scale: 2,
        nullable: true,
    }),
    __metadata("design:type", Object)
], MedicionOrmEntity.prototype, "pliegueAbdominal", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'pliegue_muslo',
        type: 'decimal',
        precision: 5,
        scale: 2,
        nullable: true,
    }),
    __metadata("design:type", Object)
], MedicionOrmEntity.prototype, "pliegueMuslo", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'porcentaje_grasa',
        type: 'decimal',
        precision: 5,
        scale: 2,
        nullable: true,
    }),
    __metadata("design:type", Object)
], MedicionOrmEntity.prototype, "porcentajeGrasa", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'masa_magra',
        type: 'decimal',
        precision: 5,
        scale: 2,
        nullable: true,
    }),
    __metadata("design:type", Object)
], MedicionOrmEntity.prototype, "masaMagra", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'frecuencia_cardiaca',
        type: 'int',
        nullable: true,
    }),
    __metadata("design:type", Object)
], MedicionOrmEntity.prototype, "frecuenciaCardiaca", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'tension_sistolica',
        type: 'int',
        nullable: true,
    }),
    __metadata("design:type", Object)
], MedicionOrmEntity.prototype, "tensionSistolica", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'tension_diastolica',
        type: 'int',
        nullable: true,
    }),
    __metadata("design:type", Object)
], MedicionOrmEntity.prototype, "tensionDiastolica", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'notas_medicion',
        type: 'text',
        nullable: true,
    }),
    __metadata("design:type", Object)
], MedicionOrmEntity.prototype, "notasMedicion", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], MedicionOrmEntity.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => turno_entity_1.TurnoOrmEntity, (turno) => turno.mediciones, {
        nullable: false,
    }),
    (0, typeorm_1.JoinColumn)({ name: 'id_turno' }),
    __metadata("design:type", turno_entity_1.TurnoOrmEntity)
], MedicionOrmEntity.prototype, "turno", void 0);
exports.MedicionOrmEntity = MedicionOrmEntity = __decorate([
    (0, typeorm_1.Entity)('medicion')
], MedicionOrmEntity);
//# sourceMappingURL=medicion.entity.js.map