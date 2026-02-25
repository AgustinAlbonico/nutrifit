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
exports.UsuarioOrmEntity = void 0;
const typeorm_1 = require("typeorm");
const persona_entity_1 = require("./persona.entity");
const Rol_1 = require("../../../../domain/entities/Usuario/Rol");
const grupo_permiso_entity_1 = require("./grupo-permiso.entity");
const accion_entity_1 = require("./accion.entity");
let UsuarioOrmEntity = class UsuarioOrmEntity {
    idUsuario;
    email;
    contraseña;
    fechaHoraAlta;
    persona;
    rol;
    grupos;
    acciones;
};
exports.UsuarioOrmEntity = UsuarioOrmEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ name: 'id_usuario' }),
    __metadata("design:type", Object)
], UsuarioOrmEntity.prototype, "idUsuario", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'email', type: 'varchar', length: 255, unique: true }),
    __metadata("design:type", String)
], UsuarioOrmEntity.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'contrasenia', type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], UsuarioOrmEntity.prototype, "contrase\u00F1a", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'fecha_hora_alta',
        type: 'datetime',
        default: () => 'CURRENT_TIMESTAMP',
    }),
    __metadata("design:type", Date)
], UsuarioOrmEntity.prototype, "fechaHoraAlta", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => persona_entity_1.PersonaOrmEntity, (persona) => persona.usuario, {
        eager: false,
        nullable: true,
    }),
    (0, typeorm_1.JoinColumn)({ name: 'id_persona' }),
    __metadata("design:type", Object)
], UsuarioOrmEntity.prototype, "persona", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'rol', type: 'enum', enum: Rol_1.Rol }),
    __metadata("design:type", String)
], UsuarioOrmEntity.prototype, "rol", void 0);
__decorate([
    (0, typeorm_1.ManyToMany)(() => grupo_permiso_entity_1.GrupoPermisoOrmEntity, (grupo) => grupo.usuarios, {
        eager: false,
    }),
    (0, typeorm_1.JoinTable)({
        name: 'usuario_grupo_permiso',
        joinColumn: { name: 'id_usuario', referencedColumnName: 'idUsuario' },
        inverseJoinColumn: { name: 'id_grupo_permiso', referencedColumnName: 'id' },
    }),
    __metadata("design:type", Array)
], UsuarioOrmEntity.prototype, "grupos", void 0);
__decorate([
    (0, typeorm_1.ManyToMany)(() => accion_entity_1.AccionOrmEntity, (accion) => accion.usuarios, {
        eager: false,
    }),
    (0, typeorm_1.JoinTable)({
        name: 'usuario_accion',
        joinColumn: { name: 'id_usuario', referencedColumnName: 'idUsuario' },
        inverseJoinColumn: { name: 'id_accion', referencedColumnName: 'id' },
    }),
    __metadata("design:type", Array)
], UsuarioOrmEntity.prototype, "acciones", void 0);
exports.UsuarioOrmEntity = UsuarioOrmEntity = __decorate([
    (0, typeorm_1.Entity)('usuario')
], UsuarioOrmEntity);
//# sourceMappingURL=usuario.entity.js.map