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
exports.GenerarRecomendacionComidaUseCase = exports.DISCLAIMER_IA = void 0;
const common_1 = require("@nestjs/common");
const custom_exceptions_1 = require("../../../domain/exceptions/custom-exceptions");
const logger_service_1 = require("../../../domain/services/logger.service");
const ai_provider_service_1 = require("../../../domain/services/ai-provider.service");
const preparar_contexto_paciente_use_case_1 = require("./preparar-contexto-paciente.use-case");
exports.DISCLAIMER_IA = 'Esta recomendación es orientación general y no sustituye consejo médico profesional. Consulte siempre con su nutricionista.';
let GenerarRecomendacionComidaUseCase = class GenerarRecomendacionComidaUseCase {
    aiProvider;
    prepararContextoPaciente;
    logger;
    constructor(aiProvider, prepararContextoPaciente, logger) {
        this.aiProvider = aiProvider;
        this.prepararContextoPaciente = prepararContextoPaciente;
        this.logger = logger;
    }
    async execute(solicitud) {
        try {
            const contexto = await this.prepararContextoPaciente.execute(solicitud.socioId);
            this.validarContexto(contexto);
            const prompt = this.construirPrompt(contexto, solicitud);
            const schema = {
                opciones: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            nombre: { type: 'string' },
                            descripcion: { type: 'string' },
                            ingredientes: { type: 'array', items: { type: 'string' } },
                            caloriasEstimadas: { type: 'number' },
                            proteinas: { type: 'number' },
                            carbohidratos: { type: 'number' },
                            grasas: { type: 'number' },
                            tipoComida: { type: 'string' },
                        },
                    },
                },
            };
            const resultado = await this.aiProvider.generarRecomendacion(prompt, schema);
            const opciones = resultado.opciones || [];
            for (const opcion of opciones) {
                this.validarRecomendacion(opcion, contexto);
            }
            this.logger.log(`Recomendaciones de comida generadas para socio ${solicitud.socioId}: ${opciones.length} opciones`);
            return {
                exito: true,
                datos: opciones,
                error: null,
                disclaimer: exports.DISCLAIMER_IA,
            };
        }
        catch (error) {
            const mensaje = error instanceof Error ? error.message : String(error);
            this.logger.error(`Error generando recomendaciones: ${mensaje}`);
            return {
                exito: false,
                datos: null,
                error: mensaje,
                disclaimer: exports.DISCLAIMER_IA,
            };
        }
    }
    validarContexto(contexto) {
        if (contexto.alergias.length > 10) {
            throw new custom_exceptions_1.BadRequestError('Demasiadas alergias registradas. Consulte con su nutricionista para una recomendación personalizada.');
        }
    }
    construirPrompt(contexto, solicitud) {
        const tipoComida = solicitud.tipoComida ?? 'ALMUERZO';
        const preferencias = solicitud.preferenciasAdicionales ?? 'Ninguna';
        return `Eres un nutricionista profesional. Genera CINCO (5) opciones de comida diferentes para un paciente.

CONTEXTO DEL PACIENTE (anonimizado):
- Objetivo: ${contexto.objetivoPersonal}
- Nivel de actividad física: ${contexto.nivelActividadFisica}
- Peso: ${contexto.peso ?? 'No especificado'} kg
- Altura: ${contexto.altura ?? 'No especificado'} cm
- Alergias: ${contexto.alergias.length > 0 ? contexto.alergias.join(', ') : 'Ninguna'}
- Patologías: ${contexto.patologias.length > 0 ? contexto.patologias.join(', ') : 'Ninguna'}
- Restricciones alimentarias: ${contexto.restriccionesAlimentarias ?? 'Ninguna'}
- Frecuencia de comidas: ${contexto.frecuenciaComidas ?? 'No especificado'}
- Medicamentos actuales: ${contexto.medicamentosActuales ?? 'Ninguno'}
- Suplementos actuales: ${contexto.suplementosActuales ?? 'Ninguno'}

SOLICITUD:
- Tipo de comida: ${tipoComida}
- Preferencias adicionales: ${preferencias}

REGLAS IMPORTANTES:
1. NUNCA incluyas ingredientes que estén en las alergias del paciente
2. Considera las patologías y restricciones alimentarias
3. Las calorías deben estar entre 200-800 kcal por comida
4. El balance de macronutrientes debe ser saludable
5. Responde SOLO con el JSON solicitado, sin texto adicional
6. Genera EXACTAMENTE 5 opciones DIFERENTES entre sí
7. Varía los ingredientes y estilos de preparación entre opciones

Genera las recomendaciones en formato JSON con un array "opciones".`;
    }
    validarRecomendacion(recomendacion, contexto) {
        if (recomendacion.caloriasEstimadas < 200) {
            recomendacion.caloriasEstimadas = 200;
        }
        if (recomendacion.caloriasEstimadas > 800) {
            recomendacion.caloriasEstimadas = 800;
        }
        const ingredientesLower = recomendacion.ingredientes.map((i) => i.toLowerCase());
        for (const alergia of contexto.alergias) {
            const alergiaLower = alergia.toLowerCase();
            const contieneAlergeno = ingredientesLower.some((ing) => ing.includes(alergiaLower));
            if (contieneAlergeno) {
                throw new custom_exceptions_1.BadRequestError(`La recomendación contiene un alérgeno: ${alergia}. Por seguridad, no se puede sugerir esta comida.`);
            }
        }
    }
};
exports.GenerarRecomendacionComidaUseCase = GenerarRecomendacionComidaUseCase;
exports.GenerarRecomendacionComidaUseCase = GenerarRecomendacionComidaUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(ai_provider_service_1.AI_PROVIDER_SERVICE)),
    __param(2, (0, common_1.Inject)(logger_service_1.APP_LOGGER_SERVICE)),
    __metadata("design:paramtypes", [Object, preparar_contexto_paciente_use_case_1.PrepararContextoPacienteUseCase, Object])
], GenerarRecomendacionComidaUseCase);
//# sourceMappingURL=generar-recomendacion-comida.use-case.js.map