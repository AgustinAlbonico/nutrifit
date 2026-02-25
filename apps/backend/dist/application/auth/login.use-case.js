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
exports.LoginUseCase = void 0;
const common_1 = require("@nestjs/common");
const usuario_repository_1 = require("../../domain/entities/Usuario/usuario.repository");
const custom_exceptions_1 = require("../../domain/exceptions/custom-exceptions");
const password_encrypter_service_1 = require("../../domain/services/password-encrypter.service");
const jwt_service_1 = require("../../domain/services/jwt.service");
const logger_service_1 = require("../../domain/services/logger.service");
let LoginUseCase = class LoginUseCase {
    userRepository;
    passwordEncrypter;
    jwtService;
    loggerService;
    constructor(userRepository, passwordEncrypter, jwtService, loggerService) {
        this.userRepository = userRepository;
        this.passwordEncrypter = passwordEncrypter;
        this.jwtService = jwtService;
        this.loggerService = loggerService;
    }
    async execute(payload) {
        this.loggerService.log('LoginUseCase: Ejecutando el caso de uso de login para el usuario: ' +
            payload.email);
        const { email, contrasena } = payload;
        const user = await this.userRepository.findByEmail(email);
        if (!user)
            throw new custom_exceptions_1.UnauthorizedError('No se encontró el usuario');
        const isPasswordValid = await this.passwordEncrypter.comparePasswords(contrasena, user.contraseña);
        if (!isPasswordValid)
            throw new custom_exceptions_1.UnauthorizedError('Contraseña incorrecta');
        const jwtPayload = {
            id: user.idUsuario,
            email: user.email,
            rol: user.rol,
            acciones: user.getAccionesEfectivas(),
        };
        const token = this.jwtService.sign(jwtPayload);
        this.loggerService.log('LoginUseCase: Login exitoso para el usuario: ' + user.email);
        return { token, rol: user.rol, acciones: user.getAccionesEfectivas() };
    }
};
exports.LoginUseCase = LoginUseCase;
exports.LoginUseCase = LoginUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(usuario_repository_1.USUARIO_REPOSITORY)),
    __param(1, (0, common_1.Inject)(password_encrypter_service_1.PASSWORD_ENCRYPTER_SERVICE)),
    __param(2, (0, common_1.Inject)(jwt_service_1.JWT_SERVICE)),
    __param(3, (0, common_1.Inject)(logger_service_1.APP_LOGGER_SERVICE)),
    __metadata("design:paramtypes", [usuario_repository_1.UsuarioRepository, Object, Object, Object])
], LoginUseCase);
//# sourceMappingURL=login.use-case.js.map