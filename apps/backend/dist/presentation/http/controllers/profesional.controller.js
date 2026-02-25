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
exports.ProfesionalController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const dtos_1 = require("../../../application/profesionales/dtos");
const use_cases_1 = require("../../../application/profesionales/use-cases");
const Rol_1 = require("../../../domain/entities/Usuario/Rol");
const logger_service_1 = require("../../../domain/services/logger.service");
const object_storage_service_1 = require("../../../domain/services/object-storage.service");
const actions_decorator_1 = require("../../../infrastructure/auth/decorators/actions.decorator");
const public_decorator_1 = require("../../../infrastructure/auth/decorators/public.decorator");
const role_decorator_1 = require("../../../infrastructure/auth/decorators/role.decorator");
const actions_guard_1 = require("../../../infrastructure/auth/guards/actions.guard");
const auth_guard_1 = require("../../../infrastructure/auth/guards/auth.guard");
const roles_guard_1 = require("../../../infrastructure/auth/guards/roles.guard");
let ProfesionalController = class ProfesionalController {
    createNutricionistaUseCase;
    getNutricionistaUseCase;
    listNutricionistasUseCase;
    listProfesionalesPublicosUseCase;
    getPerfilProfesionalPublicoUseCase;
    updateNutricionistaUseCase;
    deleteNutricionistaUseCase;
    reactivarNutricionistaUseCase;
    logger;
    objectStorage;
    constructor(createNutricionistaUseCase, getNutricionistaUseCase, listNutricionistasUseCase, listProfesionalesPublicosUseCase, getPerfilProfesionalPublicoUseCase, updateNutricionistaUseCase, deleteNutricionistaUseCase, reactivarNutricionistaUseCase, logger, objectStorage) {
        this.createNutricionistaUseCase = createNutricionistaUseCase;
        this.getNutricionistaUseCase = getNutricionistaUseCase;
        this.listNutricionistasUseCase = listNutricionistasUseCase;
        this.listProfesionalesPublicosUseCase = listProfesionalesPublicosUseCase;
        this.getPerfilProfesionalPublicoUseCase = getPerfilProfesionalPublicoUseCase;
        this.updateNutricionistaUseCase = updateNutricionistaUseCase;
        this.deleteNutricionistaUseCase = deleteNutricionistaUseCase;
        this.reactivarNutricionistaUseCase = reactivarNutricionistaUseCase;
        this.logger = logger;
        this.objectStorage = objectStorage;
    }
    async create(createNutricionistaDto, file) {
        this.logger.log(`Creando profesional con email: ${createNutricionistaDto.email}`);
        let fotoPerfilKey;
        if (file) {
            const timestamp = Date.now();
            const extension = file.originalname.split('.').pop();
            fotoPerfilKey = `perfiles/nutricionistas/${timestamp}-${Math.random().toString(36).substring(7)}.${extension}`;
            await this.objectStorage.subirArchivo(fotoPerfilKey, file.buffer, file.mimetype);
            this.logger.log(`Foto de perfil subida: ${fotoPerfilKey}`);
        }
        const nutricionista = await this.createNutricionistaUseCase.execute(createNutricionistaDto, fotoPerfilKey);
        return this.mapToResponseDto(nutricionista);
    }
    async findAll() {
        this.logger.log('Listando todos los profesionales');
        const nutricionistas = await this.listNutricionistasUseCase.execute();
        return nutricionistas.map((nutricionista) => this.mapToResponseDto(nutricionista));
    }
    async findDisponiblesForSocio(query) {
        this.logger.log('Listando profesionales activos para socio');
        return this.listProfesionalesPublicosUseCase.execute(query);
    }
    async findPublicProfile(id) {
        this.logger.log(`Consultando perfil publico del profesional ${id}`);
        return this.getPerfilProfesionalPublicoUseCase.execute(id);
    }
    async findOne(id) {
        this.logger.log(`Obteniendo profesional con ID: ${id}`);
        const nutricionista = await this.getNutricionistaUseCase.execute(id);
        return this.mapToResponseDto(nutricionista);
    }
    async update(id, updateNutricionistaDto, file) {
        this.logger.log(`Actualizando profesional con ID: ${id}`);
        let fotoPerfilKey;
        if (file) {
            const timestamp = Date.now();
            const extension = file.originalname.split('.').pop();
            fotoPerfilKey = `perfiles/nutricionistas/${timestamp}-${Math.random().toString(36).substring(7)}.${extension}`;
            await this.objectStorage.subirArchivo(fotoPerfilKey, file.buffer, file.mimetype);
            this.logger.log(`Foto de perfil actualizada: ${fotoPerfilKey}`);
        }
        const nutricionista = await this.updateNutricionistaUseCase.execute(id, updateNutricionistaDto, fotoPerfilKey);
        return this.mapToResponseDto(nutricionista);
    }
    async obtenerFoto(id, res) {
        const nutricionista = await this.getNutricionistaUseCase.execute(id);
        if (!nutricionista || !nutricionista.fotoPerfilKey) {
            return res.redirect('https://ui-avatars.com/api/?name=Nutricionista&background=10b981&color=fff&size=200');
        }
        const archivo = await this.objectStorage.obtenerArchivo(nutricionista.fotoPerfilKey);
        if (!archivo) {
            return res.redirect('https://ui-avatars.com/api/?name=Nutricionista&background=10b981&color=fff&size=200');
        }
        res.setHeader('Content-Type', archivo.mimeType);
        res.setHeader('Cache-Control', 'public, max-age=3600');
        return res.send(archivo.buffer);
    }
    async remove(id) {
        this.logger.log(`Dando de baja profesional con ID: ${id}`);
        await this.deleteNutricionistaUseCase.execute(id);
    }
    async reactivar(id) {
        this.logger.log(`Reactivando profesional con ID: ${id}`);
        await this.reactivarNutricionistaUseCase.execute(id);
    }
    mapToResponseDto(nutricionista) {
        const dto = new dtos_1.NutricionistaResponseDto();
        dto.idPersona = nutricionista.idPersona ?? 0;
        dto.nombre = nutricionista.nombre;
        dto.apellido = nutricionista.apellido;
        dto.fechaNacimiento = nutricionista.fechaNacimiento;
        dto.telefono = nutricionista.telefono;
        dto.genero = nutricionista.genero;
        dto.direccion = nutricionista.direccion;
        dto.ciudad = nutricionista.ciudad;
        dto.provincia = nutricionista.provincia;
        dto.dni = nutricionista.dni;
        dto.matricula = nutricionista.matricula;
        dto.tarifaSesion = nutricionista.tarifaSesion;
        dto.añosExperiencia = nutricionista.añosExperiencia;
        dto.email = nutricionista.email;
        dto.fechaBaja = nutricionista.fechaBaja;
        dto.activo = !nutricionista.fechaBaja;
        dto.fotoPerfilUrl = nutricionista.fotoPerfilKey
            ? `/profesional/${nutricionista.idPersona}/foto?v=${encodeURIComponent(nutricionista.fotoPerfilKey)}`
            : null;
        return dto;
    }
};
exports.ProfesionalController = ProfesionalController;
__decorate([
    (0, common_1.Post)(),
    (0, role_decorator_1.Rol)(Rol_1.Rol.ADMIN),
    (0, actions_decorator_1.Actions)('profesionales.crear'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('foto')),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dtos_1.CreateNutricionistaDto, Object]),
    __metadata("design:returntype", Promise)
], ProfesionalController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, role_decorator_1.Rol)(Rol_1.Rol.ADMIN),
    (0, actions_decorator_1.Actions)('profesionales.listar'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ProfesionalController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('publico/disponibles'),
    (0, role_decorator_1.Rol)(Rol_1.Rol.SOCIO),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dtos_1.ListProfesionalesPublicQueryDto]),
    __metadata("design:returntype", Promise)
], ProfesionalController.prototype, "findDisponiblesForSocio", null);
__decorate([
    (0, common_1.Get)('publico/:id/perfil'),
    (0, role_decorator_1.Rol)(Rol_1.Rol.SOCIO),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], ProfesionalController.prototype, "findPublicProfile", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, role_decorator_1.Rol)(Rol_1.Rol.ADMIN),
    (0, actions_decorator_1.Actions)('profesionales.ver'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], ProfesionalController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, role_decorator_1.Rol)(Rol_1.Rol.ADMIN),
    (0, actions_decorator_1.Actions)('profesionales.actualizar'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('foto')),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, dtos_1.UpdateNutricionistaDto, Object]),
    __metadata("design:returntype", Promise)
], ProfesionalController.prototype, "update", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)(':id/foto'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], ProfesionalController.prototype, "obtenerFoto", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, role_decorator_1.Rol)(Rol_1.Rol.ADMIN),
    (0, actions_decorator_1.Actions)('profesionales.eliminar'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], ProfesionalController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)(':id/reactivar'),
    (0, role_decorator_1.Rol)(Rol_1.Rol.ADMIN),
    (0, actions_decorator_1.Actions)('profesionales.actualizar'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], ProfesionalController.prototype, "reactivar", null);
exports.ProfesionalController = ProfesionalController = __decorate([
    (0, common_1.Controller)('profesional'),
    (0, common_1.UseGuards)(auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, actions_guard_1.ActionsGuard),
    __param(8, (0, common_1.Inject)(logger_service_1.APP_LOGGER_SERVICE)),
    __param(9, (0, common_1.Inject)(object_storage_service_1.OBJECT_STORAGE_SERVICE)),
    __metadata("design:paramtypes", [use_cases_1.CreateNutricionistaUseCase,
        use_cases_1.GetNutricionistaUseCase,
        use_cases_1.ListNutricionistasUseCase,
        use_cases_1.ListProfesionalesPublicosUseCase,
        use_cases_1.GetPerfilProfesionalPublicoUseCase,
        use_cases_1.UpdateNutricionistaUseCase,
        use_cases_1.DeleteNutricionistaUseCase,
        use_cases_1.ReactivarNutricionistaUseCase, Object, Object])
], ProfesionalController);
//# sourceMappingURL=profesional.controller.js.map