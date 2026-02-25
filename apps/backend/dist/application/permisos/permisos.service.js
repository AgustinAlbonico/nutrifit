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
exports.PermisosService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const typeorm_3 = require("typeorm");
const typeorm_4 = require("typeorm");
const accion_entity_1 = require("../../infrastructure/persistence/typeorm/entities/accion.entity");
const grupo_permiso_entity_1 = require("../../infrastructure/persistence/typeorm/entities/grupo-permiso.entity");
const usuario_entity_1 = require("../../infrastructure/persistence/typeorm/entities/usuario.entity");
let PermisosService = class PermisosService {
    accionRepository;
    grupoRepository;
    usuarioRepository;
    constructor(accionRepository, grupoRepository, usuarioRepository) {
        this.accionRepository = accionRepository;
        this.grupoRepository = grupoRepository;
        this.usuarioRepository = usuarioRepository;
    }
    async listarAcciones() {
        return this.accionRepository.find({ order: { clave: 'ASC' } });
    }
    async crearAccion(_dto) {
        throw new common_1.BadRequestException('Las acciones se administran por seed. No se permite crear acciones manualmente.');
    }
    async actualizarAccion(actionId, dto) {
        const accion = await this.accionRepository.findOne({
            where: { id: actionId },
        });
        if (!accion) {
            throw new common_1.NotFoundException('Accion no encontrada');
        }
        const existe = await this.accionRepository.findOne({
            where: {
                clave: dto.clave,
                id: (0, typeorm_4.Not)(actionId),
            },
        });
        if (existe) {
            throw new common_1.BadRequestException('La accion ya existe');
        }
        accion.clave = dto.clave;
        accion.nombre = dto.nombre;
        accion.descripcion = dto.descripcion ?? null;
        return this.accionRepository.save(accion);
    }
    async listarUsuarios(query) {
        const usuarios = await this.usuarioRepository.find({
            relations: {
                grupos: true,
                acciones: true,
            },
        });
        if (!query)
            return usuarios;
        const lowerQuery = query.toLowerCase();
        return usuarios.filter((u) => u.email.toLowerCase().includes(lowerQuery) ||
            u.idUsuario?.toString() === lowerQuery);
    }
    async listarUsuariosPaginado(params) {
        const { page, limit, search, isActive } = params;
        const skip = (page - 1) * limit;
        const queryBuilder = this.usuarioRepository
            .createQueryBuilder('usuario')
            .leftJoinAndSelect('usuario.persona', 'persona')
            .leftJoinAndSelect('usuario.grupos', 'grupos')
            .leftJoinAndSelect('usuario.acciones', 'acciones');
        if (search) {
            queryBuilder.andWhere('(usuario.email LIKE :search OR persona.nombre LIKE :search OR persona.apellido LIKE :search)', { search: `%${search}%` });
        }
        const total = await queryBuilder.getCount();
        queryBuilder.skip(skip).take(limit);
        const [usuarios] = await queryBuilder.getManyAndCount();
        const totalPages = Math.ceil(total / limit);
        return {
            data: usuarios,
            pagination: {
                page,
                limit,
                total,
                totalPages,
                hasNextPage: page < totalPages,
                hasPreviousPage: page > 1,
            },
        };
    }
    async listarGrupos() {
        return this.grupoRepository.find({
            relations: { acciones: true, hijos: true },
            order: { clave: 'ASC' },
        });
    }
    async crearGrupo(dto) {
        const existe = await this.grupoRepository.findOne({
            where: { clave: dto.clave },
        });
        if (existe) {
            throw new common_1.BadRequestException('El grupo ya existe');
        }
        const grupo = this.grupoRepository.create({
            clave: dto.clave,
            nombre: dto.nombre,
            descripcion: dto.descripcion ?? null,
            acciones: [],
            hijos: [],
        });
        return this.grupoRepository.save(grupo);
    }
    async actualizarGrupo(groupId, dto) {
        const grupo = await this.grupoRepository.findOne({
            where: { id: groupId },
            relations: { acciones: true, hijos: true },
        });
        if (!grupo) {
            throw new common_1.NotFoundException('Grupo no encontrado');
        }
        const existe = await this.grupoRepository.findOne({
            where: {
                clave: dto.clave,
                id: (0, typeorm_4.Not)(groupId),
            },
        });
        if (existe) {
            throw new common_1.BadRequestException('El grupo ya existe');
        }
        grupo.clave = dto.clave;
        grupo.nombre = dto.nombre;
        grupo.descripcion = dto.descripcion ?? null;
        return this.grupoRepository.save(grupo);
    }
    async asignarAccionesAGrupo(groupId, actionIds) {
        const grupo = await this.grupoRepository.findOne({
            where: { id: groupId },
            relations: { acciones: true },
        });
        if (!grupo) {
            throw new common_1.NotFoundException('Grupo no encontrado');
        }
        const acciones = await this.accionRepository.find({
            where: { id: (0, typeorm_3.In)(actionIds) },
        });
        if (acciones.length !== actionIds.length) {
            throw new common_1.BadRequestException('Una o mas acciones no existen');
        }
        grupo.acciones = acciones;
        return this.grupoRepository.save(grupo);
    }
    async asignarGruposAUsuario(userId, groupIds) {
        const usuario = await this.usuarioRepository.findOne({
            where: { idUsuario: userId },
            relations: { grupos: true },
        });
        if (!usuario) {
            throw new common_1.NotFoundException('Usuario no encontrado');
        }
        const grupos = await this.grupoRepository.find({
            where: { id: (0, typeorm_3.In)(groupIds) },
        });
        if (grupos.length !== groupIds.length) {
            throw new common_1.BadRequestException('Uno o mas grupos no existen');
        }
        usuario.grupos = grupos;
        return this.usuarioRepository.save(usuario);
    }
    async asignarAccionesAUsuario(userId, actionIds) {
        const usuario = await this.usuarioRepository.findOne({
            where: { idUsuario: userId },
            relations: { acciones: true },
        });
        if (!usuario) {
            throw new common_1.NotFoundException('Usuario no encontrado');
        }
        const acciones = await this.accionRepository.find({
            where: { id: (0, typeorm_3.In)(actionIds) },
        });
        if (acciones.length !== actionIds.length) {
            throw new common_1.BadRequestException('Una o mas acciones no existen');
        }
        usuario.acciones = acciones;
        return this.usuarioRepository.save(usuario);
    }
    async getAccionesEfectivasUsuario(userId) {
        const usuario = await this.usuarioRepository.findOne({
            where: { idUsuario: userId },
            relations: { acciones: true, grupos: true },
        });
        if (!usuario) {
            throw new common_1.NotFoundException('Usuario no encontrado');
        }
        const claves = new Set();
        for (const accion of usuario.acciones ?? []) {
            claves.add(accion.clave);
        }
        const visitados = new Set();
        for (const grupo of usuario.grupos ?? []) {
            const accionesDeGrupo = await this.obtenerAccionesDeGrupoRecursivo(grupo.id, visitados);
            for (const accion of accionesDeGrupo) {
                claves.add(accion.clave);
            }
        }
        return Array.from(claves).sort();
    }
    async hasAllActions(userId, requiredActions) {
        if (!requiredActions.length) {
            return true;
        }
        const claves = await this.getAccionesEfectivasUsuario(userId);
        const set = new Set(claves);
        return requiredActions.every((action) => set.has(action));
    }
    async obtenerAccionesDeGrupoRecursivo(groupId, visitados) {
        if (visitados.has(groupId)) {
            return [];
        }
        visitados.add(groupId);
        const grupo = await this.grupoRepository.findOne({
            where: { id: groupId },
            relations: { acciones: true, hijos: true },
        });
        if (!grupo) {
            return [];
        }
        const map = new Map();
        for (const accion of grupo.acciones ?? []) {
            map.set(accion.id, accion);
        }
        for (const hijo of grupo.hijos ?? []) {
            const accionesHijo = await this.obtenerAccionesDeGrupoRecursivo(hijo.id, visitados);
            for (const accion of accionesHijo) {
                map.set(accion.id, accion);
            }
        }
        return Array.from(map.values());
    }
};
exports.PermisosService = PermisosService;
exports.PermisosService = PermisosService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(accion_entity_1.AccionOrmEntity)),
    __param(1, (0, typeorm_1.InjectRepository)(grupo_permiso_entity_1.GrupoPermisoOrmEntity)),
    __param(2, (0, typeorm_1.InjectRepository)(usuario_entity_1.UsuarioOrmEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], PermisosService);
//# sourceMappingURL=permisos.service.js.map