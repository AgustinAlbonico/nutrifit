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
exports.AnalizarPlanNutricionalUseCase = void 0;
const common_1 = require("@nestjs/common");
const custom_exceptions_1 = require("../../../domain/exceptions/custom-exceptions");
const logger_service_1 = require("../../../domain/services/logger.service");
const ai_provider_service_1 = require("../../../domain/services/ai-provider.service");
const typeorm_1 = require("@nestjs/typeorm");
const entities_1 = require("../../../infrastructure/persistence/typeorm/entities");
const typeorm_2 = require("typeorm");
const generar_recomendacion_comida_use_case_1 = require("./generar-recomendacion-comida.use-case");
let AnalizarPlanNutricionalUseCase = class AnalizarPlanNutricionalUseCase {
    aiProvider;
    planRepository;
    logger;
    constructor(aiProvider, planRepository, logger) {
        this.aiProvider = aiProvider;
        this.planRepository = planRepository;
        this.logger = logger;
    }
    async execute(solicitud) {
        try {
            const plan = await this.planRepository.findOne({
                where: { idPlanAlimentacion: solicitud.planId },
                relations: ['dias', 'dias.opcionesComida'],
            });
            if (!plan) {
                throw new custom_exceptions_1.NotFoundError('Plan de alimentación', String(solicitud.planId));
            }
            const resumenPlan = this.extraerResumenPlan(plan);
            const prompt = this.construirPrompt(resumenPlan);
            const schema = {
                caloriasDiarias: { type: 'number' },
                proteinasGramos: { type: 'number' },
                carbohidratosGramos: { type: 'number' },
                grasasGramos: { type: 'number' },
                fibraGramos: { type: 'number' },
                sodioMg: { type: 'number' },
                azucaresGramos: { type: 'number' },
                distribucionMacros: {
                    type: 'object',
                    properties: {
                        proteinas: { type: 'number' },
                        carbohidratos: { type: 'number' },
                        grasas: { type: 'number' },
                    },
                },
                advertencias: { type: 'array', items: { type: 'string' } },
            };
            const resultado = await this.aiProvider.generarRecomendacion(prompt, schema);
            this.validarAnalisis(resultado);
            this.logger.log(`Análisis nutricional completado para plan ${solicitud.planId}`);
            return {
                exito: true,
                datos: resultado,
                error: null,
                disclaimer: generar_recomendacion_comida_use_case_1.DISCLAIMER_IA,
            };
        }
        catch (error) {
            const mensaje = error instanceof Error ? error.message : String(error);
            this.logger.error(`Error analizando plan nutricional: ${mensaje}`);
            return {
                exito: false,
                datos: null,
                error: mensaje,
                disclaimer: generar_recomendacion_comida_use_case_1.DISCLAIMER_IA,
            };
        }
    }
    extraerResumenPlan(plan) {
        const dias = plan.dias ?? [];
        let resumen = `Plan con ${dias.length} días.\n`;
        for (const dia of dias) {
            resumen += `\nDía ${dia.dia} (orden: ${dia.orden}):\n`;
            const opciones = dia.opcionesComida ?? [];
            for (const opcion of opciones) {
                const alimentosStr = (opcion.alimentos ?? [])
                    .map((a) => a.nombre)
                    .join(', ');
                resumen += `- ${opcion.tipoComida}: ${alimentosStr || 'Sin alimentos'}${opcion.comentarios ? ` (${opcion.comentarios})` : ''}\n`;
            }
        }
        return resumen;
    }
    construirPrompt(resumenPlan) {
        return `Eres un nutricionista profesional. Analiza el siguiente plan de alimentación y proporciona un análisis nutricional.

PLAN DE ALIMENTACIÓN:
${resumenPlan}

ANÁLISIS REQUERIDO:
1. Estima las calorías diarias promedio
2. Estima los gramos de macronutrientes (proteínas, carbohidratos, grasas)
3. Estima fibra, sodio y azúcares si es posible
4. Calcula la distribución porcentual de macronutrientes
5. Identifica advertencias o mejoras potenciales

REGLAS IMPORTANTES:
1. Los valores deben ser estimaciones realistas basadas en los alimentos mencionados
2. Las advertencias deben ser específicas y útiles
3. Si falta información, usa null para esos valores
4. Responde SOLO con el JSON solicitado

Genera el análisis en formato JSON.`;
    }
    validarAnalisis(analisis) {
        if (analisis.caloriasDiarias < 1000) {
            analisis.caloriasDiarias = 1000;
        }
        if (analisis.caloriasDiarias > 4000) {
            analisis.caloriasDiarias = 4000;
        }
        const totalMacros = analisis.distribucionMacros.proteinas +
            analisis.distribucionMacros.carbohidratos +
            analisis.distribucionMacros.grasas;
        if (Math.abs(totalMacros - 100) > 5) {
            const factor = 100 / totalMacros;
            analisis.distribucionMacros.proteinas = Math.round(analisis.distribucionMacros.proteinas * factor);
            analisis.distribucionMacros.carbohidratos = Math.round(analisis.distribucionMacros.carbohidratos * factor);
            analisis.distribucionMacros.grasas =
                100 -
                    analisis.distribucionMacros.proteinas -
                    analisis.distribucionMacros.carbohidratos;
        }
        if (!analisis.advertencias) {
            analisis.advertencias = [];
        }
    }
};
exports.AnalizarPlanNutricionalUseCase = AnalizarPlanNutricionalUseCase;
exports.AnalizarPlanNutricionalUseCase = AnalizarPlanNutricionalUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(ai_provider_service_1.AI_PROVIDER_SERVICE)),
    __param(1, (0, typeorm_1.InjectRepository)(entities_1.PlanAlimentacionOrmEntity)),
    __param(2, (0, common_1.Inject)(logger_service_1.APP_LOGGER_SERVICE)),
    __metadata("design:paramtypes", [Object, typeorm_2.Repository, Object])
], AnalizarPlanNutricionalUseCase);
//# sourceMappingURL=analizar-plan-nutricional.use-case.js.map