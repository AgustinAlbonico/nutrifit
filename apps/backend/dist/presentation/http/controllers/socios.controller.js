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
exports.SocioController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const registrarSocio_dto_1 = require("../../../application/socios/dtos/registrarSocio.dto");
const actualizarSocio_dto_1 = require("../../../application/socios/dtos/actualizarSocio.dto");
const socio_response_dto_1 = require("../../../application/socios/dtos/socio-response.dto");
const registrarSocio_use_case_1 = require("../../../application/socios/registrarSocio.use-case");
const listarSocios_use_case_1 = require("../../../application/socios/listarSocios.use-case");
const actualizarSocio_use_case_1 = require("../../../application/socios/actualizarSocio.use-case");
const eliminarSocio_use_case_1 = require("../../../application/socios/eliminarSocio.use-case");
const reactivarSocio_use_case_1 = require("../../../application/socios/reactivarSocio.use-case");
const buscar_socios_con_ficha_use_case_1 = require("../../../application/socios/buscar-socios-con-ficha.use-case");
const logger_service_1 = require("../../../domain/services/logger.service");
const object_storage_service_1 = require("../../../domain/services/object-storage.service");
const app_logger_service_1 = require("../../../infrastructure/common/logger/app-logger.service");
const actions_decorator_1 = require("../../../infrastructure/auth/decorators/actions.decorator");
const public_decorator_1 = require("../../../infrastructure/auth/decorators/public.decorator");
const role_decorator_1 = require("../../../infrastructure/auth/decorators/role.decorator");
const auth_guard_1 = require("../../../infrastructure/auth/guards/auth.guard");
const actions_guard_1 = require("../../../infrastructure/auth/guards/actions.guard");
const roles_guard_1 = require("../../../infrastructure/auth/guards/roles.guard");
const Rol_1 = require("../../../domain/entities/Usuario/Rol");
let SocioController = class SocioController {
    registrarSocioUseCase;
    listarSociosUseCase;
    actualizarSocioUseCase;
    eliminarSocioUseCase;
    reactivarSocioUseCase;
    buscarSociosConFichaUseCase;
    logger;
    objectStorage;
    constructor(registrarSocioUseCase, listarSociosUseCase, actualizarSocioUseCase, eliminarSocioUseCase, reactivarSocioUseCase, buscarSociosConFichaUseCase, logger, objectStorage) {
        this.registrarSocioUseCase = registrarSocioUseCase;
        this.listarSociosUseCase = listarSociosUseCase;
        this.actualizarSocioUseCase = actualizarSocioUseCase;
        this.eliminarSocioUseCase = eliminarSocioUseCase;
        this.reactivarSocioUseCase = reactivarSocioUseCase;
        this.buscarSociosConFichaUseCase = buscarSociosConFichaUseCase;
        this.logger = logger;
        this.objectStorage = objectStorage;
    }
    async listarSocios() {
        this.logger.log('Listando todos los socios');
        const socios = await this.listarSociosUseCase.execute();
        return socios.map((socio) => new socio_response_dto_1.SocioResponseDto(socio));
    }
    async buscarSociosConFicha(busqueda) {
        this.logger.log(`Buscando socios con ficha: ${busqueda ?? 'todos'}`);
        return this.buscarSociosConFichaUseCase.execute(busqueda);
    }
    async registrarSocio(registrarSocioDto, file) {
        this.logger.log('Registrando Socio' + registrarSocioDto.email);
        let fotoPerfilKey;
        if (file) {
            const timestamp = Date.now();
            const extension = file.originalname.split('.').pop();
            fotoPerfilKey = `perfiles/socios/${timestamp}-${Math.random().toString(36).substring(7)}.${extension}`;
            await this.objectStorage.subirArchivo(fotoPerfilKey, file.buffer, file.mimetype);
            this.logger.log(`Foto de perfil subida: ${fotoPerfilKey}`);
        }
        return await this.registrarSocioUseCase.execute(registrarSocioDto, fotoPerfilKey);
    }
    async actualizarSocio(id, actualizarSocioDto, file) {
        this.logger.log(`Actualizando socio ${id}`);
        let fotoPerfilKey;
        if (file) {
            const timestamp = Date.now();
            const extension = file.originalname.split('.').pop();
            fotoPerfilKey = `perfiles/socios/${timestamp}-${Math.random().toString(36).substring(7)}.${extension}`;
            await this.objectStorage.subirArchivo(fotoPerfilKey, file.buffer, file.mimetype);
            this.logger.log(`Foto de perfil actualizada: ${fotoPerfilKey}`);
        }
        const socioActualizado = await this.actualizarSocioUseCase.execute(id, actualizarSocioDto, fotoPerfilKey);
        return new socio_response_dto_1.SocioResponseDto(socioActualizado);
    }
    async obtenerFoto(id, res) {
        const socio = await this.listarSociosUseCase.findById(id);
        if (!socio || !socio.fotoPerfilKey) {
            return res.redirect('https://ui-avatars.com/api/?name=Socio&background=6366f1&color=fff&size=200');
        }
        const archivo = await this.objectStorage.obtenerArchivo(socio.fotoPerfilKey);
        if (!archivo) {
            return res.redirect('https://ui-avatars.com/api/?name=Socio&background=6366f1&color=fff&size=200');
        }
        res.setHeader('Content-Type', archivo.mimeType);
        res.setHeader('Cache-Control', 'public, max-age=3600');
        return res.send(archivo.buffer);
    }
    async eliminarSocio(id) {
        this.logger.log(`Dando de baja socio ${id}`);
        await this.eliminarSocioUseCase.execute(id);
        return { message: 'Socio dado de baja exitosamente' };
    }
    async reactivarSocio(id) {
        this.logger.log(`Reactivando socio ${id}`);
        await this.reactivarSocioUseCase.execute(id);
        return { message: 'Socio reactivado exitosamente' };
    }
};
exports.SocioController = SocioController;
__decorate([
    (0, common_1.Get)(),
    (0, role_decorator_1.Rol)(Rol_1.Rol.ADMIN),
    (0, actions_decorator_1.Actions)('socios.ver'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SocioController.prototype, "listarSocios", null);
__decorate([
    (0, common_1.Get)('buscar-con-ficha'),
    (0, role_decorator_1.Rol)(Rol_1.Rol.NUTRICIONISTA),
    __param(0, (0, common_1.Query)('q')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SocioController.prototype, "buscarSociosConFicha", null);
__decorate([
    (0, common_1.Post)(),
    (0, role_decorator_1.Rol)(Rol_1.Rol.ADMIN),
    (0, actions_decorator_1.Actions)('socios.registrar'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('foto')),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [registrarSocio_dto_1.RegistrarSocioDto, Object]),
    __metadata("design:returntype", Promise)
], SocioController.prototype, "registrarSocio", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, role_decorator_1.Rol)(Rol_1.Rol.ADMIN),
    (0, actions_decorator_1.Actions)('socios.editar'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('foto')),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, actualizarSocio_dto_1.ActualizarSocioDto, Object]),
    __metadata("design:returntype", Promise)
], SocioController.prototype, "actualizarSocio", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)(':id/foto'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], SocioController.prototype, "obtenerFoto", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, role_decorator_1.Rol)(Rol_1.Rol.ADMIN),
    (0, actions_decorator_1.Actions)('socios.eliminar'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], SocioController.prototype, "eliminarSocio", null);
__decorate([
    (0, common_1.Post)(':id/reactivar'),
    (0, role_decorator_1.Rol)(Rol_1.Rol.ADMIN),
    (0, actions_decorator_1.Actions)('socios.reactivar'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], SocioController.prototype, "reactivarSocio", null);
exports.SocioController = SocioController = __decorate([
    (0, common_1.Controller)('socio'),
    (0, common_1.UseGuards)(auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, actions_guard_1.ActionsGuard),
    __param(6, (0, common_1.Inject)(logger_service_1.APP_LOGGER_SERVICE)),
    __param(7, (0, common_1.Inject)(object_storage_service_1.OBJECT_STORAGE_SERVICE)),
    __metadata("design:paramtypes", [registrarSocio_use_case_1.RegistrarSocioUseCase,
        listarSocios_use_case_1.ListarSociosUseCase,
        actualizarSocio_use_case_1.ActualizarSocioUseCase,
        eliminarSocio_use_case_1.EliminarSocioUseCase,
        reactivarSocio_use_case_1.ReactivarSocioUseCase,
        buscar_socios_con_ficha_use_case_1.BuscarSociosConFichaUseCase,
        app_logger_service_1.AppLoggerService, Object])
], SocioController);
//# sourceMappingURL=socios.controller.js.map