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
exports.ObservacionClinicaOrmEntity = void 0;
const typeorm_1 = require("typeorm");
const turno_entity_1 = require("./turno.entity");
const turno_entity_2 = require("../../../../domain/entities/Turno/turno.entity");
let ObservacionClinicaOrmEntity = class ObservacionClinicaOrmEntity {
    idObservacion;
    comentario;
    peso;
    altura;
    imc;
    sugerencias;
    habitosSocio;
    objetivosSocio;
    esPublica;
    turno;
};
exports.ObservacionClinicaOrmEntity = ObservacionClinicaOrmEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ name: 'id_observacion' }),
    __metadata("design:type", Number)
], ObservacionClinicaOrmEntity.prototype, "idObservacion", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'comentario', type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], ObservacionClinicaOrmEntity.prototype, "comentario", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'peso', type: 'decimal', precision: 5, scale: 2 }),
    __metadata("design:type", Number)
], ObservacionClinicaOrmEntity.prototype, "peso", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'altura', type: 'int' }),
    __metadata("design:type", Number)
], ObservacionClinicaOrmEntity.prototype, "altura", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'imc', type: 'decimal', precision: 5, scale: 2 }),
    __metadata("design:type", Number)
], ObservacionClinicaOrmEntity.prototype, "imc", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'sugerencias', type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", Object)
], ObservacionClinicaOrmEntity.prototype, "sugerencias", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'habitos_socio',
        type: 'varchar',
        length: 255,
        nullable: true,
    }),
    __metadata("design:type", Object)
], ObservacionClinicaOrmEntity.prototype, "habitosSocio", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'objetivos_socio',
        type: 'varchar',
        length: 255,
        nullable: true,
    }),
    __metadata("design:type", Object)
], ObservacionClinicaOrmEntity.prototype, "objetivosSocio", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'es_publica',
        type: 'boolean',
        default: false,
    }),
    __metadata("design:type", Boolean)
], ObservacionClinicaOrmEntity.prototype, "esPublica", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => turno_entity_1.TurnoOrmEntity, (turno) => turno.observacionClinica, {
        nullable: false,
    }),
    __metadata("design:type", turno_entity_2.TurnoEntity)
], ObservacionClinicaOrmEntity.prototype, "turno", void 0);
exports.ObservacionClinicaOrmEntity = ObservacionClinicaOrmEntity = __decorate([
    (0, typeorm_1.Entity)('observacion_clinica')
], ObservacionClinicaOrmEntity);
//# sourceMappingURL=observacion-clinica.entity.js.map