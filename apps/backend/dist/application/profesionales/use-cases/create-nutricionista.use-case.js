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
exports.CreateNutricionistaUseCase = void 0;
const common_1 = require("@nestjs/common");
const nutricionista_entity_1 = require("../../../domain/entities/Persona/Nutricionista/nutricionista.entity");
const nutricionista_repository_1 = require("../../../domain/entities/Persona/Nutricionista/nutricionista.repository");
const logger_service_1 = require("../../../domain/services/logger.service");
const usuario_entity_1 = require("../../../domain/entities/Usuario/usuario.entity");
const password_encrypter_service_1 = require("../../../domain/services/password-encrypter.service");
const Rol_1 = require("../../../domain/entities/Usuario/Rol");
const usuario_repository_1 = require("../../../domain/entities/Usuario/usuario.repository");
const custom_exceptions_1 = require("../../../domain/exceptions/custom-exceptions");
const typeorm_1 = require("@nestjs/typeorm");
const grupo_permiso_entity_1 = require("../../../infrastructure/persistence/typeorm/entities/grupo-permiso.entity");
const typeorm_2 = require("typeorm");
const grupo_permiso_entity_2 = require("../../../domain/entities/Usuario/grupo-permiso.entity");
let CreateNutricionistaUseCase = class CreateNutricionistaUseCase {
    nutricionistaRepository;
    usuarioRepository;
    logger;
    passwordEncrypter;
    grupoPermisoRepository;
    constructor(nutricionistaRepository, usuarioRepository, logger, passwordEncrypter, grupoPermisoRepository) {
        this.nutricionistaRepository = nutricionistaRepository;
        this.usuarioRepository = usuarioRepository;
        this.logger = logger;
        this.passwordEncrypter = passwordEncrypter;
        this.grupoPermisoRepository = grupoPermisoRepository;
    }
    async execute(payload, fotoPerfilKey) {
        const foundByEmail = await this.usuarioRepository.findByEmail(payload.email);
        if (foundByEmail) {
            this.logger.warn(`El email ${payload.email} ya está registrado.`);
            throw new custom_exceptions_1.ConflictError('El email ya está registrado.');
        }
        const foundByDni = await this.nutricionistaRepository.findByDni(payload.dni);
        if (foundByDni) {
            this.logger.warn(`El DNI ${payload.dni} ya está registrado.`);
            throw new custom_exceptions_1.ConflictError('El DNI ya está registrado.');
        }
        const foundByMatricula = await this.nutricionistaRepository.findByMatricula(payload.matricula);
        if (foundByMatricula) {
            this.logger.warn(`La matrícula ${payload.matricula} ya está registrada.`);
            throw new custom_exceptions_1.ConflictError('La matrícula ya está registrada.');
        }
        const { nombre, apellido, fechaNacimiento, telefono, genero, direccion, ciudad, provincia, dni, matricula, tarifaSesion, añosExperiencia, } = payload;
        const nutricionistaEntity = new nutricionista_entity_1.NutricionistaEntity(null, nombre, apellido, new Date(fechaNacimiento), telefono, genero, direccion, ciudad, provincia, dni, añosExperiencia, tarifaSesion, [], [], []);
        nutricionistaEntity.matricula = matricula;
        if (fotoPerfilKey) {
            nutricionistaEntity.fotoPerfilKey = fotoPerfilKey;
        }
        const nutricionistaCreado = await this.nutricionistaRepository.save(nutricionistaEntity);
        this.logger.log(`Nutricionista ${nutricionistaCreado.idPersona} creado: ${nutricionistaCreado.nombre}`);
        this.logger.log(`Creando Usuario para el nutricionista ${nutricionistaCreado.idPersona}`);
        const contraseñaEncriptada = await this.passwordEncrypter.encryptPassword(payload.contrasena);
        const grupoProfesional = await this.obtenerGrupoProfesionalPorDefecto();
        const usuario = new usuario_entity_1.UsuarioEntity(null, payload.email, contraseñaEncriptada, nutricionistaCreado, Rol_1.Rol.NUTRICIONISTA, [grupoProfesional]);
        const usuarioCreado = await this.usuarioRepository.save(usuario);
        this.logger.log(`Usuario creado para nutricionista: ${nutricionistaCreado.idPersona}`);
        return nutricionistaCreado;
    }
    async obtenerGrupoProfesionalPorDefecto() {
        const grupoProfesional = await this.grupoPermisoRepository.findOne({
            where: { clave: 'PROFESIONAL' },
        });
        if (!grupoProfesional) {
            throw new common_1.BadRequestException('No existe el grupo PROFESIONAL. Debe estar cargado por seed antes de crear profesionales.');
        }
        return new grupo_permiso_entity_2.GrupoPermisoEntity(grupoProfesional.id, grupoProfesional.clave, grupoProfesional.nombre, grupoProfesional.descripcion, [], []);
    }
};
exports.CreateNutricionistaUseCase = CreateNutricionistaUseCase;
exports.CreateNutricionistaUseCase = CreateNutricionistaUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(nutricionista_repository_1.NUTRICIONISTA_REPOSITORY)),
    __param(1, (0, common_1.Inject)(usuario_repository_1.USUARIO_REPOSITORY)),
    __param(2, (0, common_1.Inject)(logger_service_1.APP_LOGGER_SERVICE)),
    __param(3, (0, common_1.Inject)(password_encrypter_service_1.PASSWORD_ENCRYPTER_SERVICE)),
    __param(4, (0, typeorm_1.InjectRepository)(grupo_permiso_entity_1.GrupoPermisoOrmEntity)),
    __metadata("design:paramtypes", [nutricionista_repository_1.NutricionistaRepository,
        usuario_repository_1.UsuarioRepository, Object, Object, typeorm_2.Repository])
], CreateNutricionistaUseCase);
//# sourceMappingURL=create-nutricionista.use-case.js.map