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
exports.GrupoPermisoOrmEntity = void 0;
const typeorm_1 = require("typeorm");
const accion_entity_1 = require("./accion.entity");
const usuario_entity_1 = require("./usuario.entity");
let GrupoPermisoOrmEntity = class GrupoPermisoOrmEntity {
    id;
    clave;
    nombre;
    descripcion;
    acciones;
    usuarios;
    hijos;
};
exports.GrupoPermisoOrmEntity = GrupoPermisoOrmEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ name: 'id_grupo_permiso' }),
    __metadata("design:type", Number)
], GrupoPermisoOrmEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'clave', type: 'varchar', length: 100, unique: true }),
    __metadata("design:type", String)
], GrupoPermisoOrmEntity.prototype, "clave", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'nombre', type: 'varchar', length: 120 }),
    __metadata("design:type", String)
], GrupoPermisoOrmEntity.prototype, "nombre", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'descripcion', type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", Object)
], GrupoPermisoOrmEntity.prototype, "descripcion", void 0);
__decorate([
    (0, typeorm_1.ManyToMany)(() => accion_entity_1.AccionOrmEntity, (accion) => accion.grupos, {
        eager: false,
    }),
    (0, typeorm_1.JoinTable)({
        name: 'grupo_permiso_accion',
        joinColumn: { name: 'id_grupo_permiso', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'id_accion', referencedColumnName: 'id' },
    }),
    __metadata("design:type", Array)
], GrupoPermisoOrmEntity.prototype, "acciones", void 0);
__decorate([
    (0, typeorm_1.ManyToMany)(() => usuario_entity_1.UsuarioOrmEntity, (usuario) => usuario.grupos),
    __metadata("design:type", Array)
], GrupoPermisoOrmEntity.prototype, "usuarios", void 0);
__decorate([
    (0, typeorm_1.ManyToMany)(() => GrupoPermisoOrmEntity, {
        eager: false,
    }),
    (0, typeorm_1.JoinTable)({
        name: 'grupo_permiso_hijo',
        joinColumn: { name: 'id_grupo_padre', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'id_grupo_hijo', referencedColumnName: 'id' },
    }),
    __metadata("design:type", Array)
], GrupoPermisoOrmEntity.prototype, "hijos", void 0);
exports.GrupoPermisoOrmEntity = GrupoPermisoOrmEntity = __decorate([
    (0, typeorm_1.Entity)('grupo_permiso')
], GrupoPermisoOrmEntity);
//# sourceMappingURL=grupo-permiso.entity.js.map