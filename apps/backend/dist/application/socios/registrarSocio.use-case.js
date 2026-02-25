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
exports.RegistrarSocioUseCase = void 0;
const common_1 = require("@nestjs/common");
const socio_entity_1 = require("../../domain/entities/Persona/Socio/socio.entity");
const socio_repository_1 = require("../../domain/entities/Persona/Socio/socio.repository");
const logger_service_1 = require("../../domain/services/logger.service");
const usuario_entity_1 = require("../../domain/entities/Usuario/usuario.entity");
const password_encrypter_service_1 = require("../../domain/services/password-encrypter.service");
const Rol_1 = require("../../domain/entities/Usuario/Rol");
const usuario_repository_1 = require("../../domain/entities/Usuario/usuario.repository");
const custom_exceptions_1 = require("../../domain/exceptions/custom-exceptions");
const typeorm_1 = require("@nestjs/typeorm");
const grupo_permiso_entity_1 = require("../../infrastructure/persistence/typeorm/entities/grupo-permiso.entity");
const typeorm_2 = require("typeorm");
const grupo_permiso_entity_2 = require("../../domain/entities/Usuario/grupo-permiso.entity");
let RegistrarSocioUseCase = class RegistrarSocioUseCase {
    socioRepository;
    usuarioRepository;
    logger;
    passwordEncrypter;
    grupoPermisoRepository;
    constructor(socioRepository, usuarioRepository, logger, passwordEncrypter, grupoPermisoRepository) {
        this.socioRepository = socioRepository;
        this.usuarioRepository = usuarioRepository;
        this.logger = logger;
        this.passwordEncrypter = passwordEncrypter;
        this.grupoPermisoRepository = grupoPermisoRepository;
    }
    async execute(payload, fotoPerfilKey) {
        const foundUser = await this.usuarioRepository.findByEmail(payload.email);
        if (foundUser) {
            this.logger.warn(`El email ${payload.email} ya está registrado.`);
            throw new custom_exceptions_1.ConflictError('El email ya está registrado.');
        }
        const { nombre, apellido, dni, fechaNacimiento, telefono, genero, direccion, ciudad, provincia, } = payload;
        const socioEntity = new socio_entity_1.SocioEntity(null, nombre, apellido, new Date(fechaNacimiento), telefono, genero, direccion, ciudad, provincia, dni ?? '', [], null, []);
        if (fotoPerfilKey) {
            socioEntity.fotoPerfilKey = fotoPerfilKey;
        }
        const socioCreado = await this.socioRepository.save(socioEntity);
        this.logger.log(`Socio ${socioCreado.idPersona} registrado: ${socioCreado.nombre}`);
        this.logger.log(`Creando Usuario para el socio ${socioCreado.idPersona}`);
        const contrasenaEncriptada = await this.passwordEncrypter.encryptPassword(payload.contrasena);
        const grupoSocio = await this.obtenerGrupoSocioPorDefecto();
        const usuario = new usuario_entity_1.UsuarioEntity(null, payload.email, contrasenaEncriptada, socioCreado, Rol_1.Rol.SOCIO, [grupoSocio]);
        const usuarioCreado = await this.usuarioRepository.save(usuario);
        usuarioCreado.persona = socioCreado;
        return usuarioCreado;
    }
    async obtenerGrupoSocioPorDefecto() {
        const grupoSocio = await this.grupoPermisoRepository.findOne({
            where: { clave: 'SOCIO' },
        });
        if (!grupoSocio) {
            throw new common_1.BadRequestException('No existe el grupo SOCIO. Debe estar cargado por seed antes de crear socios.');
        }
        return new grupo_permiso_entity_2.GrupoPermisoEntity(grupoSocio.id, grupoSocio.clave, grupoSocio.nombre, grupoSocio.descripcion, [], []);
    }
};
exports.RegistrarSocioUseCase = RegistrarSocioUseCase;
exports.RegistrarSocioUseCase = RegistrarSocioUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(socio_repository_1.SOCIO_REPOSITORY)),
    __param(1, (0, common_1.Inject)(usuario_repository_1.USUARIO_REPOSITORY)),
    __param(2, (0, common_1.Inject)(logger_service_1.APP_LOGGER_SERVICE)),
    __param(3, (0, common_1.Inject)(password_encrypter_service_1.PASSWORD_ENCRYPTER_SERVICE)),
    __param(4, (0, typeorm_1.InjectRepository)(grupo_permiso_entity_1.GrupoPermisoOrmEntity)),
    __metadata("design:paramtypes", [socio_repository_1.SocioRepository,
        usuario_repository_1.UsuarioRepository, Object, Object, typeorm_2.Repository])
], RegistrarSocioUseCase);
//# sourceMappingURL=registrarSocio.use-case.js.map