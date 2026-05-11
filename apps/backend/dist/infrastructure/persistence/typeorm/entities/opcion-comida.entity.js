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
exports.OpcionComidaOrmEntity = void 0;
const typeorm_1 = require("typeorm");
const TipoComida_1 = require("../../../../domain/entities/OpcionComida/TipoComida");
const dia_plan_entity_1 = require("./dia-plan.entity");
const item_comida_entity_1 = require("./item-comida.entity");
let OpcionComidaOrmEntity = class OpcionComidaOrmEntity {
    idOpcionComida;
    comentarios;
    tipoComida;
    diaPlan;
    items;
    get alimentos() {
        if (!this.items || this.items.length === 0) {
            return [];
        }
        return this.items
            .filter((item) => item.alimento != null)
            .map((item) => item.alimento);
    }
    set alimentos(alimentos) {
        if (!alimentos || alimentos.length === 0) {
            this.items = [];
            return;
        }
        this.items = alimentos.map((alimento) => {
            const item = new item_comida_entity_1.ItemComidaOrmEntity();
            item.alimentoId = alimento.idAlimento;
            item.alimentoNombre = alimento.nombre;
            item.alimento = alimento;
            item.cantidad = alimento.cantidad;
            item.unidad = alimento.unidadMedida;
            item.opcionComida = this;
            return item;
        });
    }
    get tieneItemsReales() {
        return (this.items !== undefined && this.items !== null && this.items.length > 0);
    }
};
exports.OpcionComidaOrmEntity = OpcionComidaOrmEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ name: 'id_opcion_comida' }),
    __metadata("design:type", Number)
], OpcionComidaOrmEntity.prototype, "idOpcionComida", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'comentarios', type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", Object)
], OpcionComidaOrmEntity.prototype, "comentarios", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'tipo_comida', type: 'enum', enum: TipoComida_1.TipoComida }),
    __metadata("design:type", String)
], OpcionComidaOrmEntity.prototype, "tipoComida", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => dia_plan_entity_1.DiaPlanOrmEntity, (diaPlan) => diaPlan.opcionesComida, {
        nullable: true,
    }),
    (0, typeorm_1.JoinColumn)({ name: 'id_dia_plan' }),
    __metadata("design:type", dia_plan_entity_1.DiaPlanOrmEntity)
], OpcionComidaOrmEntity.prototype, "diaPlan", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => item_comida_entity_1.ItemComidaOrmEntity, (item) => item.opcionComida, {
        cascade: ['insert', 'update'],
    }),
    __metadata("design:type", Array)
], OpcionComidaOrmEntity.prototype, "items", void 0);
exports.OpcionComidaOrmEntity = OpcionComidaOrmEntity = __decorate([
    (0, typeorm_1.Entity)('opcion_comida')
], OpcionComidaOrmEntity);
//# sourceMappingURL=opcion-comida.entity.js.map