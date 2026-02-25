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
exports.AlimentosController = exports.AlimentoResponseDto = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const alimentos_sync_service_1 = require("../../../infrastructure/alimentos/alimentos-sync.service");
const alimento_entity_1 = require("../../../infrastructure/persistence/typeorm/entities/alimento.entity");
const grupo_alimenticio_entity_1 = require("../../../infrastructure/persistence/typeorm/entities/grupo-alimenticio.entity");
const auth_guard_1 = require("../../../infrastructure/auth/guards/auth.guard");
const roles_guard_1 = require("../../../infrastructure/auth/guards/roles.guard");
const role_decorator_1 = require("../../../infrastructure/auth/decorators/role.decorator");
const Rol_1 = require("../../../domain/entities/Usuario/Rol");
const crear_alimento_dto_1 = require("../../../application/alimentos/dtos/crear-alimento.dto");
const actualizar_alimento_dto_1 = require("../../../application/alimentos/dtos/actualizar-alimento.dto");
const crear_alimento_use_case_1 = require("../../../application/alimentos/use-cases/crear-alimento.use-case");
const actualizar_alimento_use_case_1 = require("../../../application/alimentos/use-cases/actualizar-alimento.use-case");
const eliminar_alimento_use_case_1 = require("../../../application/alimentos/use-cases/eliminar-alimento.use-case");
class AlimentoResponseDto {
    idAlimento;
    nombre;
    cantidad;
    calorias;
    proteinas;
    carbohidratos;
    grasas;
    unidadMedida;
    grupoAlimenticio;
}
exports.AlimentoResponseDto = AlimentoResponseDto;
let AlimentosController = class AlimentosController {
    alimentoRepo;
    grupoRepo;
    alimentosSyncService;
    crearAlimentoUseCase;
    actualizarAlimentoUseCase;
    eliminarAlimentoUseCase;
    constructor(alimentoRepo, grupoRepo, alimentosSyncService, crearAlimentoUseCase, actualizarAlimentoUseCase, eliminarAlimentoUseCase) {
        this.alimentoRepo = alimentoRepo;
        this.grupoRepo = grupoRepo;
        this.alimentosSyncService = alimentosSyncService;
        this.crearAlimentoUseCase = crearAlimentoUseCase;
        this.actualizarAlimentoUseCase = actualizarAlimentoUseCase;
        this.eliminarAlimentoUseCase = eliminarAlimentoUseCase;
    }
    async obtenerGruposAlimenticios() {
        const grupos = await this.grupoRepo.find({ order: { descripcion: 'ASC' } });
        return grupos.map((g) => ({
            idGrupoAlimenticio: g.idGrupoAlimenticio,
            descripcion: g.descripcion,
        }));
    }
    async obtenerEstadoSync() {
        return this.alimentosSyncService.obtenerUltimoEstadoSync();
    }
    async sincronizarAlimentos() {
        return this.alimentosSyncService.sincronizarCatalogo('manual');
    }
    async curarAlimentos() {
        return this.alimentosSyncService.curarCatalogoManual();
    }
    async listarAlimentos(search, limit, grupoId) {
        const take = limit ? Math.min(parseInt(limit, 10), 100) : 50;
        const where = {};
        if (search) {
            where.nombre = (0, typeorm_2.Like)(`%${search}%`);
        }
        if (grupoId) {
            where.grupoAlimenticio = { idGrupoAlimenticio: parseInt(grupoId, 10) };
        }
        const alimentos = await this.alimentoRepo.find({
            where,
            take,
            order: { nombre: 'ASC' },
            relations: grupoId ? ['grupoAlimenticio'] : [],
        });
        return alimentos.map((a) => this.mapToResponse(a));
    }
    async obtenerAlimento(id) {
        const alimento = await this.alimentoRepo.findOne({
            where: { idAlimento: id },
            relations: ['grupoAlimenticio'],
        });
        if (!alimento) {
            return null;
        }
        return this.mapToResponse(alimento);
    }
    async crearAlimento(dto) {
        const alimento = await this.crearAlimentoUseCase.execute(dto);
        return this.mapToResponse(alimento);
    }
    async actualizarAlimento(id, dto) {
        const alimento = await this.actualizarAlimentoUseCase.execute(id, dto);
        return this.mapToResponse(alimento);
    }
    async eliminarAlimento(id) {
        await this.eliminarAlimentoUseCase.execute(id);
    }
    mapToResponse(a) {
        let grupoInfo = null;
        if (a.grupoAlimenticio) {
            const grupos = Array.isArray(a.grupoAlimenticio)
                ? a.grupoAlimenticio
                : [a.grupoAlimenticio];
            if (grupos.length > 0 && grupos[0]) {
                grupoInfo = {
                    id: grupos[0].idGrupoAlimenticio,
                    descripcion: grupos[0].descripcion,
                };
            }
        }
        return {
            idAlimento: a.idAlimento,
            nombre: a.nombre,
            cantidad: a.cantidad,
            calorias: a.calorias,
            proteinas: a.proteinas,
            carbohidratos: a.carbohidratos,
            grasas: a.grasas,
            unidadMedida: a.unidadMedida,
            grupoAlimenticio: grupoInfo,
        };
    }
};
exports.AlimentosController = AlimentosController;
__decorate([
    (0, common_1.Get)('grupos'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AlimentosController.prototype, "obtenerGruposAlimenticios", null);
__decorate([
    (0, common_1.Get)('sync/estado'),
    (0, role_decorator_1.Rol)(Rol_1.Rol.ADMIN),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AlimentosController.prototype, "obtenerEstadoSync", null);
__decorate([
    (0, common_1.Post)('sync'),
    (0, role_decorator_1.Rol)(Rol_1.Rol.ADMIN),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AlimentosController.prototype, "sincronizarAlimentos", null);
__decorate([
    (0, common_1.Post)('sync/curar'),
    (0, role_decorator_1.Rol)(Rol_1.Rol.ADMIN),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AlimentosController.prototype, "curarAlimentos", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('search')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('grupoId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], AlimentosController.prototype, "listarAlimentos", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], AlimentosController.prototype, "obtenerAlimento", null);
__decorate([
    (0, common_1.Post)(),
    (0, role_decorator_1.Rol)(Rol_1.Rol.NUTRICIONISTA, Rol_1.Rol.ADMIN),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [crear_alimento_dto_1.CrearAlimentoDto]),
    __metadata("design:returntype", Promise)
], AlimentosController.prototype, "crearAlimento", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, role_decorator_1.Rol)(Rol_1.Rol.NUTRICIONISTA, Rol_1.Rol.ADMIN),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, actualizar_alimento_dto_1.ActualizarAlimentoDto]),
    __metadata("design:returntype", Promise)
], AlimentosController.prototype, "actualizarAlimento", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, role_decorator_1.Rol)(Rol_1.Rol.NUTRICIONISTA, Rol_1.Rol.ADMIN),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], AlimentosController.prototype, "eliminarAlimento", null);
exports.AlimentosController = AlimentosController = __decorate([
    (0, common_1.Controller)('alimentos'),
    (0, common_1.UseGuards)(auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, role_decorator_1.Rol)(Rol_1.Rol.NUTRICIONISTA, Rol_1.Rol.ADMIN, Rol_1.Rol.SOCIO),
    __param(0, (0, typeorm_1.InjectRepository)(alimento_entity_1.AlimentoOrmEntity)),
    __param(1, (0, typeorm_1.InjectRepository)(grupo_alimenticio_entity_1.GrupoAlimenticioOrmEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        alimentos_sync_service_1.AlimentosSyncService,
        crear_alimento_use_case_1.CrearAlimentoUseCase,
        actualizar_alimento_use_case_1.ActualizarAlimentoUseCase,
        eliminar_alimento_use_case_1.EliminarAlimentoUseCase])
], AlimentosController);
//# sourceMappingURL=alimentos.controller.js.map