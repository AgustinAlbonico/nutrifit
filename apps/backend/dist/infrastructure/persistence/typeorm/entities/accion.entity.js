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
exports.AccionOrmEntity = void 0;
const typeorm_1 = require("typeorm");
const grupo_permiso_entity_1 = require("./grupo-permiso.entity");
const usuario_entity_1 = require("./usuario.entity");
let AccionOrmEntity = class AccionOrmEntity {
    id;
    clave;
    nombre;
    descripcion;
    grupos;
    usuarios;
};
exports.AccionOrmEntity = AccionOrmEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ name: 'id_accion' }),
    __metadata("design:type", Number)
], AccionOrmEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'clave', type: 'varchar', length: 120, unique: true }),
    __metadata("design:type", String)
], AccionOrmEntity.prototype, "clave", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'nombre', type: 'varchar', length: 120 }),
    __metadata("design:type", String)
], AccionOrmEntity.prototype, "nombre", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'descripcion', type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", Object)
], AccionOrmEntity.prototype, "descripcion", void 0);
__decorate([
    (0, typeorm_1.ManyToMany)(() => grupo_permiso_entity_1.GrupoPermisoOrmEntity, (grupo) => grupo.acciones),
    __metadata("design:type", Array)
], AccionOrmEntity.prototype, "grupos", void 0);
__decorate([
    (0, typeorm_1.ManyToMany)(() => usuario_entity_1.UsuarioOrmEntity, (usuario) => usuario.acciones),
    __metadata("design:type", Array)
], AccionOrmEntity.prototype, "usuarios", void 0);
exports.AccionOrmEntity = AccionOrmEntity = __decorate([
    (0, typeorm_1.Entity)('accion')
], AccionOrmEntity);
//# sourceMappingURL=accion.entity.js.map