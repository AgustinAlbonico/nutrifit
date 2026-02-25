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
exports.AlimentoOrmEntity = void 0;
const typeorm_1 = require("typeorm");
const UnidadMedida_1 = require("../../../../domain/entities/Alimento/UnidadMedida");
const grupo_alimenticio_entity_1 = require("./grupo-alimenticio.entity");
const grupo_alimenticio_entity_2 = require("../../../../domain/entities/Alimento/grupo-alimenticio.entity");
let AlimentoOrmEntity = class AlimentoOrmEntity {
    idAlimento;
    nombre;
    cantidad;
    calorias;
    proteinas;
    carbohidratos;
    grasas;
    hidratosDeCarbono;
    unidadMedida;
    grupoAlimenticio;
};
exports.AlimentoOrmEntity = AlimentoOrmEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ name: 'id_alimento' }),
    __metadata("design:type", Number)
], AlimentoOrmEntity.prototype, "idAlimento", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'nombre', type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], AlimentoOrmEntity.prototype, "nombre", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'cantidad', type: 'int' }),
    __metadata("design:type", Number)
], AlimentoOrmEntity.prototype, "cantidad", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'calorias', type: 'int', nullable: true }),
    __metadata("design:type", Object)
], AlimentoOrmEntity.prototype, "calorias", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'proteinas', type: 'int', nullable: true }),
    __metadata("design:type", Object)
], AlimentoOrmEntity.prototype, "proteinas", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'carbohidratos', type: 'int', nullable: true }),
    __metadata("design:type", Object)
], AlimentoOrmEntity.prototype, "carbohidratos", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'grasas', type: 'int', nullable: true }),
    __metadata("design:type", Object)
], AlimentoOrmEntity.prototype, "grasas", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'hidratos_de_carbono', type: 'int', nullable: true }),
    __metadata("design:type", Object)
], AlimentoOrmEntity.prototype, "hidratosDeCarbono", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'unidad_medida', type: 'enum', enum: UnidadMedida_1.UnidadMedida }),
    __metadata("design:type", String)
], AlimentoOrmEntity.prototype, "unidadMedida", void 0);
__decorate([
    (0, typeorm_1.ManyToMany)(() => grupo_alimenticio_entity_1.GrupoAlimenticioOrmEntity, { eager: true }),
    (0, typeorm_1.JoinTable)({
        name: 'alimento_grupo_alimenticio',
        joinColumn: {
            name: 'id_alimento',
            referencedColumnName: 'idAlimento',
        },
        inverseJoinColumn: {
            name: 'id_grupo_alimenticio',
            referencedColumnName: 'idGrupoAlimenticio',
        },
    }),
    __metadata("design:type", grupo_alimenticio_entity_2.GrupoAlimenticio)
], AlimentoOrmEntity.prototype, "grupoAlimenticio", void 0);
exports.AlimentoOrmEntity = AlimentoOrmEntity = __decorate([
    (0, typeorm_1.Entity)('alimento')
], AlimentoOrmEntity);
//# sourceMappingURL=alimento.entity.js.map