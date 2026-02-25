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
exports.ActualizarSocioUseCase = void 0;
const common_1 = require("@nestjs/common");
const socio_entity_1 = require("../../domain/entities/Persona/Socio/socio.entity");
const socio_repository_1 = require("../../domain/entities/Persona/Socio/socio.repository");
const usuario_repository_1 = require("../../domain/entities/Usuario/usuario.repository");
const password_encrypter_service_1 = require("../../domain/services/password-encrypter.service");
let ActualizarSocioUseCase = class ActualizarSocioUseCase {
    socioRepository;
    usuarioRepository;
    passwordEncrypter;
    constructor(socioRepository, usuarioRepository, passwordEncrypter) {
        this.socioRepository = socioRepository;
        this.usuarioRepository = usuarioRepository;
        this.passwordEncrypter = passwordEncrypter;
    }
    async execute(id, payload, fotoPerfilKey) {
        const socioExistente = await this.socioRepository.findById(id);
        if (!socioExistente) {
            throw new common_1.NotFoundException(`Socio con id ${id} no encontrado`);
        }
        const socioActualizado = new socio_entity_1.SocioEntity(id, payload.nombre ?? socioExistente.nombre, payload.apellido ?? socioExistente.apellido, payload.fechaNacimiento
            ? new Date(payload.fechaNacimiento)
            : socioExistente.fechaNacimiento, payload.telefono ?? socioExistente.telefono, payload.genero ?? socioExistente.genero, payload.direccion ?? socioExistente.direccion, payload.ciudad ?? socioExistente.ciudad, payload.provincia ?? socioExistente.provincia, payload.dni ?? socioExistente.dni, socioExistente.turnos, socioExistente.fichaSalud, socioExistente.planesAlimentacion);
        if (fotoPerfilKey) {
            socioActualizado.fotoPerfilKey = fotoPerfilKey;
        }
        else if (socioExistente.fotoPerfilKey) {
            socioActualizado.fotoPerfilKey = socioExistente.fotoPerfilKey;
        }
        const result = await this.socioRepository.update(id, socioActualizado);
        if (payload.contrasena) {
            const usuario = await this.usuarioRepository.findByPersonaId(id);
            if (usuario) {
                const contrasenaEncriptada = await this.passwordEncrypter.encryptPassword(payload.contrasena);
                await this.usuarioRepository.update(usuario.idUsuario, usuario);
            }
        }
        return result;
    }
};
exports.ActualizarSocioUseCase = ActualizarSocioUseCase;
exports.ActualizarSocioUseCase = ActualizarSocioUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(socio_repository_1.SOCIO_REPOSITORY)),
    __param(1, (0, common_1.Inject)(usuario_repository_1.USUARIO_REPOSITORY)),
    __param(2, (0, common_1.Inject)(password_encrypter_service_1.PASSWORD_ENCRYPTER_SERVICE)),
    __metadata("design:paramtypes", [socio_repository_1.SocioRepository,
        usuario_repository_1.UsuarioRepository, Object])
], ActualizarSocioUseCase);
//# sourceMappingURL=actualizarSocio.use-case.js.map