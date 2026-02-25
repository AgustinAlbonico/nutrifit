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
exports.ObjetivoOrmEntity = void 0;
const typeorm_1 = require("typeorm");
const persona_entity_1 = require("./persona.entity");
let ObjetivoOrmEntity = class ObjetivoOrmEntity {
    idObjetivo;
    socioId;
    tipoMetrica;
    valorInicial;
    valorObjetivo;
    valorActual;
    estado;
    fechaInicio;
    fechaObjetivo;
    createdAt;
    updatedAt;
    socio;
};
exports.ObjetivoOrmEntity = ObjetivoOrmEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ name: 'id_objetivo' }),
    __metadata("design:type", Number)
], ObjetivoOrmEntity.prototype, "idObjetivo", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'id_socio', type: 'int' }),
    __metadata("design:type", Number)
], ObjetivoOrmEntity.prototype, "socioId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'tipo_metrica',
        type: 'enum',
        enum: ['PESO', 'CINTURA', 'CADERA', 'BRAZO', 'MUSLO', 'PECHO'],
    }),
    __metadata("design:type", String)
], ObjetivoOrmEntity.prototype, "tipoMetrica", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'valor_inicial', type: 'decimal', precision: 10, scale: 2 }),
    __metadata("design:type", Number)
], ObjetivoOrmEntity.prototype, "valorInicial", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'valor_objetivo', type: 'decimal', precision: 10, scale: 2 }),
    __metadata("design:type", Number)
], ObjetivoOrmEntity.prototype, "valorObjetivo", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'valor_actual', type: 'decimal', precision: 10, scale: 2 }),
    __metadata("design:type", Number)
], ObjetivoOrmEntity.prototype, "valorActual", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'estado',
        type: 'enum',
        enum: ['ACTIVO', 'COMPLETADO', 'ABANDONADO'],
    }),
    __metadata("design:type", String)
], ObjetivoOrmEntity.prototype, "estado", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'fecha_inicio', type: 'datetime' }),
    __metadata("design:type", Date)
], ObjetivoOrmEntity.prototype, "fechaInicio", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'fecha_objetivo', type: 'datetime', nullable: true }),
    __metadata("design:type", Object)
], ObjetivoOrmEntity.prototype, "fechaObjetivo", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], ObjetivoOrmEntity.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], ObjetivoOrmEntity.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => persona_entity_1.SocioOrmEntity, { nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'id_socio' }),
    __metadata("design:type", persona_entity_1.SocioOrmEntity)
], ObjetivoOrmEntity.prototype, "socio", void 0);
exports.ObjetivoOrmEntity = ObjetivoOrmEntity = __decorate([
    (0, typeorm_1.Entity)('objetivo')
], ObjetivoOrmEntity);
//# sourceMappingURL=objetivo.entity.js.map