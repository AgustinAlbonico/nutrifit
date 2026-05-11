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
exports.ProgresoController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const subir_foto_progreso_use_case_1 = require("../../../application/fotos/use-cases/subir-foto-progreso.use-case");
const obtener_galeria_fotos_use_case_1 = require("../../../application/fotos/use-cases/obtener-galeria-fotos.use-case");
const eliminar_foto_progreso_use_case_1 = require("../../../application/fotos/use-cases/eliminar-foto-progreso.use-case");
const crear_objetivo_use_case_1 = require("../../../application/objetivos/use-cases/crear-objetivo.use-case");
const actualizar_objetivo_use_case_1 = require("../../../application/objetivos/use-cases/actualizar-objetivo.use-case");
const marcar_objetivo_completado_use_case_1 = require("../../../application/objetivos/use-cases/marcar-objetivo-completado.use-case");
const obtener_objetivos_activos_use_case_1 = require("../../../application/objetivos/use-cases/obtener-objetivos-activos.use-case");
const objetivo_dto_1 = require("../../../application/objetivos/dtos/objetivo.dto");
const logger_service_1 = require("../../../domain/services/logger.service");
const app_logger_service_1 = require("../../../infrastructure/common/logger/app-logger.service");
const actions_decorator_1 = require("../../../infrastructure/auth/decorators/actions.decorator");
const role_decorator_1 = require("../../../infrastructure/auth/decorators/role.decorator");
const auth_guard_1 = require("../../../infrastructure/auth/guards/auth.guard");
const actions_guard_1 = require("../../../infrastructure/auth/guards/actions.guard");
const roles_guard_1 = require("../../../infrastructure/auth/guards/roles.guard");
const socio_resource_access_guard_1 = require("../../../infrastructure/auth/guards/socio-resource-access.guard");
const Rol_1 = require("../../../domain/entities/Usuario/Rol");
let ProgresoController = class ProgresoController {
    subirFotoProgresoUseCase;
    obtenerGaleriaFotosUseCase;
    eliminarFotoProgresoUseCase;
    crearObjetivoUseCase;
    actualizarObjetivoUseCase;
    marcarObjetivoCompletadoUseCase;
    obtenerObjetivosActivosUseCase;
    logger;
    constructor(subirFotoProgresoUseCase, obtenerGaleriaFotosUseCase, eliminarFotoProgresoUseCase, crearObjetivoUseCase, actualizarObjetivoUseCase, marcarObjetivoCompletadoUseCase, obtenerObjetivosActivosUseCase, logger) {
        this.subirFotoProgresoUseCase = subirFotoProgresoUseCase;
        this.obtenerGaleriaFotosUseCase = obtenerGaleriaFotosUseCase;
        this.eliminarFotoProgresoUseCase = eliminarFotoProgresoUseCase;
        this.crearObjetivoUseCase = crearObjetivoUseCase;
        this.actualizarObjetivoUseCase = actualizarObjetivoUseCase;
        this.marcarObjetivoCompletadoUseCase = marcarObjetivoCompletadoUseCase;
        this.obtenerObjetivosActivosUseCase = obtenerObjetivosActivosUseCase;
        this.logger = logger;
    }
    async subirFoto(socioId, file, tipoFoto, notas) {
        this.logger.log(`Subiendo foto de progreso para socio ${socioId}`);
        if (!file) {
            throw new Error('Se requiere un archivo de imagen');
        }
        return await this.subirFotoProgresoUseCase.execute({
            socioId,
            tipoFoto: tipoFoto.toLowerCase(),
            notas,
        }, file.buffer, file.mimetype);
    }
    async obtenerGaleria(socioId) {
        this.logger.log(`Obteniendo galeria de fotos para socio ${socioId}`);
        return await this.obtenerGaleriaFotosUseCase.execute(socioId);
    }
    async eliminarFoto(socioId, fotoId) {
        this.logger.log(`Eliminando foto ${fotoId} del socio ${socioId}`);
        await this.eliminarFotoProgresoUseCase.execute(fotoId, socioId);
    }
    async crearObjetivo(socioId, crearObjetivoDto) {
        this.logger.log(`Creando objetivo para socio ${socioId}`);
        crearObjetivoDto.socioId = socioId;
        return await this.crearObjetivoUseCase.execute(crearObjetivoDto);
    }
    async obtenerObjetivos(socioId) {
        this.logger.log(`Obteniendo objetivos para socio ${socioId}`);
        return await this.obtenerObjetivosActivosUseCase.execute(socioId);
    }
    async actualizarObjetivo(socioId, objetivoId, actualizarObjetivoDto) {
        this.logger.log(`Actualizando objetivo ${objetivoId} del socio ${socioId}`);
        return await this.actualizarObjetivoUseCase.execute(objetivoId, actualizarObjetivoDto);
    }
    async marcarObjetivo(socioId, objetivoId, estado) {
        this.logger.log(`Marcando objetivo ${objetivoId} como ${estado} para socio ${socioId}`);
        return await this.marcarObjetivoCompletadoUseCase.execute(objetivoId, estado);
    }
};
exports.ProgresoController = ProgresoController;
__decorate([
    (0, common_1.Post)(':socioId/fotos'),
    (0, role_decorator_1.Rol)(Rol_1.Rol.NUTRICIONISTA, Rol_1.Rol.SOCIO, Rol_1.Rol.ADMIN),
    (0, actions_decorator_1.Actions)('progreso.editar'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, common_1.Param)('socioId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.UploadedFile)()),
    __param(2, (0, common_1.Body)('tipoFoto')),
    __param(3, (0, common_1.Body)('notas')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object, String, String]),
    __metadata("design:returntype", Promise)
], ProgresoController.prototype, "subirFoto", null);
__decorate([
    (0, common_1.Get)(':socioId/fotos'),
    (0, role_decorator_1.Rol)(Rol_1.Rol.NUTRICIONISTA, Rol_1.Rol.SOCIO, Rol_1.Rol.ADMIN),
    __param(0, (0, common_1.Param)('socioId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], ProgresoController.prototype, "obtenerGaleria", null);
__decorate([
    (0, common_1.Delete)(':socioId/fotos/:fotoId'),
    (0, role_decorator_1.Rol)(Rol_1.Rol.NUTRICIONISTA, Rol_1.Rol.SOCIO, Rol_1.Rol.ADMIN),
    (0, actions_decorator_1.Actions)('progreso.editar'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    __param(0, (0, common_1.Param)('socioId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Param)('fotoId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], ProgresoController.prototype, "eliminarFoto", null);
__decorate([
    (0, common_1.Post)(':socioId/objetivos'),
    (0, role_decorator_1.Rol)(Rol_1.Rol.NUTRICIONISTA, Rol_1.Rol.SOCIO, Rol_1.Rol.ADMIN),
    (0, actions_decorator_1.Actions)('progreso.editar'),
    __param(0, (0, common_1.Param)('socioId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, objetivo_dto_1.CrearObjetivoDto]),
    __metadata("design:returntype", Promise)
], ProgresoController.prototype, "crearObjetivo", null);
__decorate([
    (0, common_1.Get)(':socioId/objetivos'),
    (0, role_decorator_1.Rol)(Rol_1.Rol.NUTRICIONISTA, Rol_1.Rol.SOCIO, Rol_1.Rol.ADMIN),
    __param(0, (0, common_1.Param)('socioId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], ProgresoController.prototype, "obtenerObjetivos", null);
__decorate([
    (0, common_1.Patch)(':socioId/objetivos/:objetivoId'),
    (0, role_decorator_1.Rol)(Rol_1.Rol.NUTRICIONISTA, Rol_1.Rol.SOCIO, Rol_1.Rol.ADMIN),
    (0, actions_decorator_1.Actions)('progreso.editar'),
    __param(0, (0, common_1.Param)('socioId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Param)('objetivoId', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, objetivo_dto_1.ActualizarObjetivoDto]),
    __metadata("design:returntype", Promise)
], ProgresoController.prototype, "actualizarObjetivo", null);
__decorate([
    (0, common_1.Patch)(':socioId/objetivos/:objetivoId/estado'),
    (0, role_decorator_1.Rol)(Rol_1.Rol.NUTRICIONISTA, Rol_1.Rol.SOCIO, Rol_1.Rol.ADMIN),
    (0, actions_decorator_1.Actions)('progreso.editar'),
    __param(0, (0, common_1.Param)('socioId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Param)('objetivoId', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Body)('estado')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, String]),
    __metadata("design:returntype", Promise)
], ProgresoController.prototype, "marcarObjetivo", null);
exports.ProgresoController = ProgresoController = __decorate([
    (0, common_1.Controller)('progreso'),
    (0, common_1.UseGuards)(auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, actions_guard_1.ActionsGuard, socio_resource_access_guard_1.SocioResourceAccessGuard),
    __param(7, (0, common_1.Inject)(logger_service_1.APP_LOGGER_SERVICE)),
    __metadata("design:paramtypes", [subir_foto_progreso_use_case_1.SubirFotoProgresoUseCase,
        obtener_galeria_fotos_use_case_1.ObtenerGaleriaFotosUseCase,
        eliminar_foto_progreso_use_case_1.EliminarFotoProgresoUseCase,
        crear_objetivo_use_case_1.CrearObjetivoUseCase,
        actualizar_objetivo_use_case_1.ActualizarObjetivoUseCase,
        marcar_objetivo_completado_use_case_1.MarcarObjetivoCompletadoUseCase,
        obtener_objetivos_activos_use_case_1.ObtenerObjetivosActivosUseCase,
        app_logger_service_1.AppLoggerService])
], ProgresoController);
//# sourceMappingURL=progreso.controller.js.map