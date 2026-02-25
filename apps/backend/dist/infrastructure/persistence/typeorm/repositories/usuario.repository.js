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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsuarioRepositoryImplementation = void 0;
const common_1 = require("@nestjs/common");
const usuario_entity_1 = require("../entities/usuario.entity");
const typeorm_1 = require("typeorm");
const typeorm_2 = require("@nestjs/typeorm");
const usuario_entity_2 = require("../../../../domain/entities/Usuario/usuario.entity");
const grupo_permiso_entity_1 = require("../../../../domain/entities/Usuario/grupo-permiso.entity");
const accion_permiso_entity_1 = require("../../../../domain/entities/Usuario/accion-permiso.entity");
let UsuarioRepositoryImplementation = class UsuarioRepositoryImplementation {
    userRepository;
    constructor(userRepository) {
        this.userRepository = userRepository;
    }
    async findByEmail(email) {
        const user = await this.userRepository.findOne({
            where: { email },
            relations: {
                acciones: true,
                grupos: {
                    acciones: true,
                    hijos: {
                        acciones: true,
                    },
                },
            },
        });
        if (!user)
            return null;
        const { idUsuario, contraseña, rol } = user;
        const mapGrupo = (group) => new grupo_permiso_entity_1.GrupoPermisoEntity(group.id, group.clave, group.nombre, group.descripcion, (group.acciones ?? []).map((action) => new accion_permiso_entity_1.AccionPermisoEntity(action.id, action.clave, action.nombre, action.descripcion)), (group.hijos ?? []).map((child) => new grupo_permiso_entity_1.GrupoPermisoEntity(child.id, child.clave, child.nombre, child.descripcion, (child.acciones ?? []).map((action) => new accion_permiso_entity_1.AccionPermisoEntity(action.id, action.clave, action.nombre, action.descripcion)))));
        const formatedUser = new usuario_entity_2.UsuarioEntity(idUsuario, email, contraseña, null, rol, (user.grupos ?? []).map(mapGrupo), (user.acciones ?? []).map((action) => new accion_permiso_entity_1.AccionPermisoEntity(action.id, action.clave, action.nombre, action.descripcion)));
        return formatedUser;
    }
    async findPersonaIdByUserId(userId) {
        const user = await this.userRepository.findOne({
            where: { idUsuario: userId },
            relations: {
                persona: true,
            },
        });
        return user?.persona?.idPersona ?? null;
    }
    async findPerfilByUserId(userId) {
        const user = await this.userRepository.findOne({
            where: { idUsuario: userId },
            relations: {
                persona: true,
            },
        });
        if (!user) {
            return null;
        }
        return {
            idUsuario: user.idUsuario ?? userId,
            idPersona: user.persona?.idPersona ?? null,
            email: user.email,
            rol: user.rol,
            nombre: user.persona?.nombre ?? null,
            apellido: user.persona?.apellido ?? null,
            fotoPerfilKey: user.persona?.fotoPerfilKey ?? null,
        };
    }
    async save(entity) {
        const usuarioOrmEntity = new usuario_entity_1.UsuarioOrmEntity();
        usuarioOrmEntity.idUsuario = null;
        usuarioOrmEntity.email = entity.email;
        usuarioOrmEntity.contraseña = entity.contraseña;
        usuarioOrmEntity.rol = entity.rol;
        usuarioOrmEntity.fechaHoraAlta = new Date();
        if (entity.persona) {
            usuarioOrmEntity.persona = {
                idPersona: entity.persona.idPersona,
            };
        }
        usuarioOrmEntity.grupos = (entity.grupos ?? []).map((grupo) => ({ id: grupo.id }));
        usuarioOrmEntity.acciones = (entity.acciones ?? []).map((accion) => ({ id: accion.id }));
        const usuarioCreado = await this.userRepository.save(usuarioOrmEntity);
        return new usuario_entity_2.UsuarioEntity(usuarioCreado.idUsuario, usuarioCreado.email, usuarioCreado.contraseña, null, usuarioCreado.rol, [], []);
    }
    async update(id, entity) {
        return entity;
    }
    async delete(id) {
        await this.userRepository.delete(id);
    }
    async findAll() {
        const users = await this.userRepository.find({
            relations: {
                acciones: true,
                grupos: true,
            },
        });
        return users.map((user) => {
            const { idUsuario, email, contraseña, rol } = user;
            return new usuario_entity_2.UsuarioEntity(idUsuario, email, contraseña, null, rol, (user.grupos ?? []).map((g) => new grupo_permiso_entity_1.GrupoPermisoEntity(g.id, g.clave, g.nombre, g.descripcion, [], [])), (user.acciones ?? []).map((a) => new accion_permiso_entity_1.AccionPermisoEntity(a.id, a.clave, a.nombre, a.descripcion)));
        });
    }
    async findByPersonaId(personaId) {
        const user = await this.userRepository.findOne({
            where: {
                persona: { idPersona: personaId },
            },
            relations: {
                persona: true,
                acciones: true,
                grupos: {
                    acciones: true,
                    hijos: {
                        acciones: true,
                    },
                },
            },
        });
        if (!user)
            return null;
        const { idUsuario, email, contraseña, rol } = user;
        const mapGrupo = (group) => new grupo_permiso_entity_1.GrupoPermisoEntity(group.id, group.clave, group.nombre, group.descripcion, (group.acciones ?? []).map((action) => new accion_permiso_entity_1.AccionPermisoEntity(action.id, action.clave, action.nombre, action.descripcion)), (group.hijos ?? []).map((child) => new grupo_permiso_entity_1.GrupoPermisoEntity(child.id, child.clave, child.nombre, child.descripcion, (child.acciones ?? []).map((action) => new accion_permiso_entity_1.AccionPermisoEntity(action.id, action.clave, action.nombre, action.descripcion)))));
        return new usuario_entity_2.UsuarioEntity(idUsuario, email, contraseña, null, rol, (user.grupos ?? []).map(mapGrupo), (user.acciones ?? []).map((action) => new accion_permiso_entity_1.AccionPermisoEntity(action.id, action.clave, action.nombre, action.descripcion)));
    }
};
exports.UsuarioRepositoryImplementation = UsuarioRepositoryImplementation;
exports.UsuarioRepositoryImplementation = UsuarioRepositoryImplementation = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_2.InjectRepository)(usuario_entity_1.UsuarioOrmEntity)),
    __metadata("design:paramtypes", [typeorm_1.Repository])
], UsuarioRepositoryImplementation);
//# sourceMappingURL=usuario.repository.js.map