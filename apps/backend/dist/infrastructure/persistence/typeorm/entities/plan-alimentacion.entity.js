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
exports.PlanAlimentacionOrmEntity = void 0;
const typeorm_1 = require("typeorm");
const persona_entity_1 = require("./persona.entity");
const dia_plan_entity_1 = require("./dia-plan.entity");
const nutricionista_entity_1 = require("../../../../domain/entities/Persona/Nutricionista/nutricionista.entity");
const socio_entity_1 = require("../../../../domain/entities/Persona/Socio/socio.entity");
let PlanAlimentacionOrmEntity = class PlanAlimentacionOrmEntity {
    idPlanAlimentacion;
    fechaCreacion;
    objetivoNutricional;
    socio;
    nutricionista;
    activo;
    eliminadoEn;
    motivoEliminacion;
    motivoEdicion;
    ultimaEdicion;
    dias;
};
exports.PlanAlimentacionOrmEntity = PlanAlimentacionOrmEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ name: 'id_plan_alimentacion' }),
    __metadata("design:type", Number)
], PlanAlimentacionOrmEntity.prototype, "idPlanAlimentacion", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'fechaCreacion', type: 'date' }),
    __metadata("design:type", Date)
], PlanAlimentacionOrmEntity.prototype, "fechaCreacion", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'objetivo_nutricional', type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], PlanAlimentacionOrmEntity.prototype, "objetivoNutricional", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => persona_entity_1.SocioOrmEntity, (socio) => socio.planesAlimentacion, {
        nullable: false,
    }),
    (0, typeorm_1.JoinColumn)({ name: 'id_socio' }),
    __metadata("design:type", socio_entity_1.SocioEntity)
], PlanAlimentacionOrmEntity.prototype, "socio", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => persona_entity_1.NutricionistaOrmEntity, (nutricionista) => nutricionista.planesAlimentacion, {
        nullable: false,
    }),
    (0, typeorm_1.JoinColumn)({ name: 'id_nutricionista' }),
    __metadata("design:type", nutricionista_entity_1.NutricionistaEntity)
], PlanAlimentacionOrmEntity.prototype, "nutricionista", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'activo', type: 'boolean', default: true }),
    __metadata("design:type", Boolean)
], PlanAlimentacionOrmEntity.prototype, "activo", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'eliminado_en', type: 'datetime', nullable: true }),
    __metadata("design:type", Object)
], PlanAlimentacionOrmEntity.prototype, "eliminadoEn", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'motivo_eliminacion',
        type: 'varchar',
        length: 255,
        nullable: true,
    }),
    __metadata("design:type", Object)
], PlanAlimentacionOrmEntity.prototype, "motivoEliminacion", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'motivo_edicion',
        type: 'varchar',
        length: 255,
        nullable: true,
    }),
    __metadata("design:type", Object)
], PlanAlimentacionOrmEntity.prototype, "motivoEdicion", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'ultima_edicion', type: 'datetime', nullable: true }),
    __metadata("design:type", Object)
], PlanAlimentacionOrmEntity.prototype, "ultimaEdicion", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => dia_plan_entity_1.DiaPlanOrmEntity, (diaPlan) => diaPlan.planAlimentacion, {
        eager: true,
        nullable: false,
    }),
    __metadata("design:type", Array)
], PlanAlimentacionOrmEntity.prototype, "dias", void 0);
exports.PlanAlimentacionOrmEntity = PlanAlimentacionOrmEntity = __decorate([
    (0, typeorm_1.Entity)('plan_alimentacion')
], PlanAlimentacionOrmEntity);
//# sourceMappingURL=plan-alimentacion.entity.js.map