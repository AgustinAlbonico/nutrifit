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
exports.UpdateNutricionistaUseCase = void 0;
const common_1 = require("@nestjs/common");
const nutricionista_repository_1 = require("../../../domain/entities/Persona/Nutricionista/nutricionista.repository");
const logger_service_1 = require("../../../domain/services/logger.service");
const password_encrypter_service_1 = require("../../../domain/services/password-encrypter.service");
const usuario_repository_1 = require("../../../domain/entities/Usuario/usuario.repository");
const custom_exceptions_1 = require("../../../domain/exceptions/custom-exceptions");
let UpdateNutricionistaUseCase = class UpdateNutricionistaUseCase {
    nutricionistaRepository;
    usuarioRepository;
    logger;
    passwordEncrypter;
    constructor(nutricionistaRepository, usuarioRepository, logger, passwordEncrypter) {
        this.nutricionistaRepository = nutricionistaRepository;
        this.usuarioRepository = usuarioRepository;
        this.logger = logger;
        this.passwordEncrypter = passwordEncrypter;
    }
    async execute(id, payload, fotoPerfilKey) {
        const nutricionista = await this.nutricionistaRepository.findById(id);
        if (!nutricionista) {
            this.logger.warn(`Nutricionista con ID ${id} no encontrado.`);
            throw new custom_exceptions_1.NotFoundError('Nutricionista no encontrado.');
        }
        const todosUsuarios = await this.usuarioRepository.findAll();
        const usuario = todosUsuarios.find((u) => u.persona?.idPersona === nutricionista.idPersona);
        const currentEmail = usuario?.email;
        if (payload.email && currentEmail && payload.email !== currentEmail) {
            const foundByEmail = await this.usuarioRepository.findByEmail(payload.email);
            if (foundByEmail) {
                this.logger.warn(`El email ${payload.email} ya está registrado.`);
                throw new custom_exceptions_1.ConflictError('El email ya está registrado.');
            }
        }
        if (payload.dni && payload.dni !== nutricionista.dni) {
            const foundByDni = await this.nutricionistaRepository.findByDni(payload.dni);
            if (foundByDni) {
                this.logger.warn(`El DNI ${payload.dni} ya está registrado.`);
                throw new custom_exceptions_1.ConflictError('El DNI ya está registrado.');
            }
        }
        if (payload.matricula && payload.matricula !== nutricionista.matricula) {
            const foundByMatricula = await this.nutricionistaRepository.findByMatricula(payload.matricula);
            if (foundByMatricula) {
                this.logger.warn(`La matrícula ${payload.matricula} ya está registrada.`);
                throw new custom_exceptions_1.ConflictError('La matrícula ya está registrada.');
            }
        }
        if (payload.nombre)
            nutricionista.nombre = payload.nombre;
        if (payload.apellido)
            nutricionista.apellido = payload.apellido;
        if (payload.fechaNacimiento)
            nutricionista.fechaNacimiento = new Date(payload.fechaNacimiento);
        if (payload.telefono)
            nutricionista.telefono = payload.telefono;
        if (payload.genero)
            nutricionista.genero = payload.genero;
        if (payload.direccion)
            nutricionista.direccion = payload.direccion;
        if (payload.ciudad)
            nutricionista.ciudad = payload.ciudad;
        if (payload.provincia)
            nutricionista.provincia = payload.provincia;
        if (payload.dni)
            nutricionista.dni = payload.dni;
        if (payload.matricula)
            nutricionista.matricula = payload.matricula;
        if (payload.tarifaSesion !== undefined)
            nutricionista.tarifaSesion = payload.tarifaSesion;
        if (payload.añosExperiencia !== undefined)
            nutricionista.añosExperiencia = payload.añosExperiencia;
        if (fotoPerfilKey) {
            nutricionista.fotoPerfilKey = fotoPerfilKey;
        }
        const nutricionistaActualizado = await this.nutricionistaRepository.update(id, nutricionista);
        if (usuario) {
            if (payload.email) {
                usuario.email = payload.email;
            }
            if (payload.contrasena) {
                usuario.contraseña = await this.passwordEncrypter.encryptPassword(payload.contrasena);
            }
            if (payload.email || payload.contrasena) {
                await this.usuarioRepository.update(usuario.idUsuario, usuario);
            }
        }
        this.logger.log(`Nutricionista ${id} actualizado: ${nutricionistaActualizado.nombre}`);
        return nutricionistaActualizado;
    }
};
exports.UpdateNutricionistaUseCase = UpdateNutricionistaUseCase;
exports.UpdateNutricionistaUseCase = UpdateNutricionistaUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(nutricionista_repository_1.NUTRICIONISTA_REPOSITORY)),
    __param(1, (0, common_1.Inject)(usuario_repository_1.USUARIO_REPOSITORY)),
    __param(2, (0, common_1.Inject)(logger_service_1.APP_LOGGER_SERVICE)),
    __param(3, (0, common_1.Inject)(password_encrypter_service_1.PASSWORD_ENCRYPTER_SERVICE)),
    __metadata("design:paramtypes", [nutricionista_repository_1.NutricionistaRepository,
        usuario_repository_1.UsuarioRepository, Object, Object])
], UpdateNutricionistaUseCase);
//# sourceMappingURL=update-nutricionista.use-case.js.map