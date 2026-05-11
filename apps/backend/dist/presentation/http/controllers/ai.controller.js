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
exports.AiController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const dto_1 = require("../../../application/ai/dto");
const generar_ideas_comida_dto_1 = require("../../../application/ai/dto/generar-ideas-comida.dto");
const use_cases_1 = require("../../../application/ai/use-cases");
const role_decorator_1 = require("../../../infrastructure/auth/decorators/role.decorator");
const auth_guard_1 = require("../../../infrastructure/auth/guards/auth.guard");
const roles_guard_1 = require("../../../infrastructure/auth/guards/roles.guard");
const Rol_1 = require("../../../domain/entities/Usuario/Rol");
let AiController = class AiController {
    generarRecomendacionUseCase;
    generarPlanSemanalUseCase;
    sugerirSustitucionUseCase;
    analizarPlanNutricionalUseCase;
    generarIdeasComidaUseCase;
    constructor(generarRecomendacionUseCase, generarPlanSemanalUseCase, sugerirSustitucionUseCase, analizarPlanNutricionalUseCase, generarIdeasComidaUseCase) {
        this.generarRecomendacionUseCase = generarRecomendacionUseCase;
        this.generarPlanSemanalUseCase = generarPlanSemanalUseCase;
        this.sugerirSustitucionUseCase = sugerirSustitucionUseCase;
        this.analizarPlanNutricionalUseCase = analizarPlanNutricionalUseCase;
        this.generarIdeasComidaUseCase = generarIdeasComidaUseCase;
    }
    async generarRecomendacion(dto) {
        return this.generarRecomendacionUseCase.execute({
            socioId: dto.socioId,
            tipoComida: dto.tipoComida,
            preferenciasAdicionales: dto.preferenciasAdicionales,
        });
    }
    async generarPlanSemanal(dto) {
        return this.generarPlanSemanalUseCase.execute({
            socioId: dto.socioId,
            caloriasObjetivo: dto.caloriasObjetivo,
            diasAGenerar: dto.diasAGenerar,
        });
    }
    async sugerirSustitucion(dto) {
        return this.sugerirSustitucionUseCase.execute({
            alimento: dto.alimento,
            razon: dto.razon,
        });
    }
    async analizarPlan(dto) {
        return this.analizarPlanNutricionalUseCase.execute({
            planId: dto.planId,
        });
    }
    async generarIdeasComida(dto) {
        const socioId = dto.socioId ?? 0;
        return this.generarIdeasComidaUseCase.execute(socioId, dto);
    }
};
exports.AiController = AiController;
__decorate([
    (0, common_1.Post)('recomendacion'),
    (0, role_decorator_1.Rol)(Rol_1.Rol.NUTRICIONISTA),
    (0, swagger_1.ApiOperation)({ summary: 'Generar recomendación de comida con IA' }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Recomendación generada exitosamente',
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Datos inválidos o alérgenos detectados',
    }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'No autorizado' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.GenerarRecomendacionDto]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "generarRecomendacion", null);
__decorate([
    (0, common_1.Post)('plan-semanal'),
    (0, role_decorator_1.Rol)(Rol_1.Rol.NUTRICIONISTA),
    (0, swagger_1.ApiOperation)({ summary: 'Generar plan semanal con IA' }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Plan semanal generado exitosamente',
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Datos inválidos o alérgenos detectados',
    }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'No autorizado' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.GenerarPlanSemanalDto]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "generarPlanSemanal", null);
__decorate([
    (0, common_1.Post)('sustitucion'),
    (0, role_decorator_1.Rol)(Rol_1.Rol.NUTRICIONISTA, Rol_1.Rol.SOCIO),
    (0, swagger_1.ApiOperation)({ summary: 'Sugerir sustitución de alimento con IA' }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Sustitución sugerida exitosamente',
    }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'No autorizado' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.SugerirSustitucionDto]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "sugerirSustitucion", null);
__decorate([
    (0, common_1.Post)('analisis'),
    (0, role_decorator_1.Rol)(Rol_1.Rol.NUTRICIONISTA),
    (0, swagger_1.ApiOperation)({ summary: 'Analizar plan nutricional con IA' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Análisis completado exitosamente' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Plan no encontrado' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'No autorizado' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.AnalizarPlanDto]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "analizarPlan", null);
__decorate([
    (0, common_1.Post)('ideas-comida'),
    (0, role_decorator_1.Rol)(Rol_1.Rol.NUTRICIONISTA),
    (0, swagger_1.ApiOperation)({
        summary: 'Generar exactamente 2 ideas de comida con IA (RF36-RF38)',
    }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Exactamente 2 propuestas generadas exitosamente',
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Datos inválidos, restricciones no cumplibles o error de IA',
    }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'No autorizado' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [generar_ideas_comida_dto_1.GenerarIdeasComidaInputDto]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "generarIdeasComida", null);
exports.AiController = AiController = __decorate([
    (0, swagger_1.ApiTags)('IA - Recomendaciones Nutricionales'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('ia'),
    (0, common_1.UseGuards)(auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [use_cases_1.GenerarRecomendacionComidaUseCase,
        use_cases_1.GenerarPlanSemanalUseCase,
        use_cases_1.SugerirSustitucionUseCase,
        use_cases_1.AnalizarPlanNutricionalUseCase,
        use_cases_1.GenerarIdeasComidaUseCase])
], AiController);
//# sourceMappingURL=ai.controller.js.map