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
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const login_dto_1 = require("../../../application/auth/dtos/login.dto");
const login_use_case_1 = require("../../../application/auth/login.use-case");
const logger_service_1 = require("../../../domain/services/logger.service");
const auth_guard_1 = require("../../../infrastructure/auth/guards/auth.guard");
const permisos_service_1 = require("../../../application/permisos/permisos.service");
const usuario_repository_1 = require("../../../domain/entities/Usuario/usuario.repository");
let AuthController = class AuthController {
    loginUseCase;
    permisosService;
    usuarioRepository;
    logger;
    constructor(loginUseCase, permisosService, usuarioRepository, logger) {
        this.loginUseCase = loginUseCase;
        this.permisosService = permisosService;
        this.usuarioRepository = usuarioRepository;
        this.logger = logger;
    }
    async login(body) {
        this.logger.log(`Intentando loguear al usuario con email: ${body.email}`);
        const res = await this.loginUseCase.execute(body);
        this.logger.log(`Login correcto para el usuario con email: ${body.email}, tiene el rol de ${res.rol}`);
        return res;
    }
    async getPermissions(req) {
        const userId = req.user?.id;
        if (!userId) {
            return [];
        }
        return this.permisosService.getAccionesEfectivasUsuario(userId);
    }
    async getProfile(req) {
        const user = req.user;
        const userId = user?.id;
        if (!userId) {
            return {
                idUsuario: null,
                idPersona: null,
                email: null,
                rol: null,
                nombre: null,
                apellido: null,
                fotoPerfilUrl: null,
            };
        }
        const perfil = await this.usuarioRepository.findPerfilByUserId(userId);
        if (!perfil) {
            return {
                idUsuario: userId,
                idPersona: null,
                email: user?.email ?? null,
                rol: user?.rol ?? null,
                nombre: null,
                apellido: null,
                fotoPerfilUrl: null,
            };
        }
        const fotoPerfilUrl = perfil.fotoPerfilKey
            ? `/${perfil.rol === 'SOCIO' ? 'socio' : 'profesional'}/${perfil.idPersona}/foto?v=${encodeURIComponent(perfil.fotoPerfilKey)}`
            : null;
        return {
            idUsuario: perfil.idUsuario,
            idPersona: perfil.idPersona,
            email: perfil.email,
            rol: perfil.rol,
            nombre: perfil.nombre,
            apellido: perfil.apellido,
            fotoPerfilUrl,
        };
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Post)('login'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [login_dto_1.LoginDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    (0, common_1.Get)('permissions'),
    (0, common_1.UseGuards)(auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "getPermissions", null);
__decorate([
    (0, common_1.Get)('perfil'),
    (0, common_1.UseGuards)(auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "getProfile", null);
exports.AuthController = AuthController = __decorate([
    (0, common_1.Controller)('auth'),
    __param(2, (0, common_1.Inject)(usuario_repository_1.USUARIO_REPOSITORY)),
    __param(3, (0, common_1.Inject)(logger_service_1.APP_LOGGER_SERVICE)),
    __metadata("design:paramtypes", [login_use_case_1.LoginUseCase,
        permisos_service_1.PermisosService,
        usuario_repository_1.UsuarioRepository, Object])
], AuthController);
//# sourceMappingURL=auth.controller.js.map