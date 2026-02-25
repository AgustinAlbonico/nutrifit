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
exports.DiaPlanOrmEntity = void 0;
const typeorm_1 = require("typeorm");
const DiaSemana_1 = require("../../../../domain/entities/DiaPlan/DiaSemana");
const plan_alimentacion_entity_1 = require("./plan-alimentacion.entity");
const opcion_comida_entity_1 = require("./opcion-comida.entity");
let DiaPlanOrmEntity = class DiaPlanOrmEntity {
    idDiaPlan;
    dia;
    orden;
    planAlimentacion;
    opcionesComida;
};
exports.DiaPlanOrmEntity = DiaPlanOrmEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ name: 'id_dia_plan' }),
    __metadata("design:type", Number)
], DiaPlanOrmEntity.prototype, "idDiaPlan", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'dia', type: 'enum', enum: DiaSemana_1.DiaSemana }),
    __metadata("design:type", String)
], DiaPlanOrmEntity.prototype, "dia", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'orden', type: 'int' }),
    __metadata("design:type", Number)
], DiaPlanOrmEntity.prototype, "orden", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => plan_alimentacion_entity_1.PlanAlimentacionOrmEntity, (plan) => plan.dias, {
        nullable: false,
    }),
    (0, typeorm_1.JoinColumn)({ name: 'id_plan_alimentacion' }),
    __metadata("design:type", plan_alimentacion_entity_1.PlanAlimentacionOrmEntity)
], DiaPlanOrmEntity.prototype, "planAlimentacion", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => opcion_comida_entity_1.OpcionComidaOrmEntity, (opcion) => opcion.diaPlan, {
        eager: true,
        nullable: true,
    }),
    __metadata("design:type", Array)
], DiaPlanOrmEntity.prototype, "opcionesComida", void 0);
exports.DiaPlanOrmEntity = DiaPlanOrmEntity = __decorate([
    (0, typeorm_1.Entity)('dia_plan')
], DiaPlanOrmEntity);
//# sourceMappingURL=dia-plan.entity.js.map