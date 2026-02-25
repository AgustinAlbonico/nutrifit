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
exports.SugerirSustitucionUseCase = void 0;
const common_1 = require("@nestjs/common");
const logger_service_1 = require("../../../domain/services/logger.service");
const ai_provider_service_1 = require("../../../domain/services/ai-provider.service");
const generar_recomendacion_comida_use_case_1 = require("./generar-recomendacion-comida.use-case");
let SugerirSustitucionUseCase = class SugerirSustitucionUseCase {
    aiProvider;
    logger;
    constructor(aiProvider, logger) {
        this.aiProvider = aiProvider;
        this.logger = logger;
    }
    async execute(solicitud) {
        try {
            const prompt = this.construirPrompt(solicitud);
            const schema = {
                alimentoOriginal: { type: 'string' },
                alimentoSugerido: { type: 'string' },
                razon: { type: 'string' },
                caloriasEquivalentes: { type: 'boolean' },
            };
            const resultado = await this.aiProvider.generarRecomendacion(prompt, schema);
            this.logger.log(`Sustitución sugerida: ${solicitud.alimento} -> ${resultado.alimentoSugerido}`);
            return {
                exito: true,
                datos: resultado,
                error: null,
                disclaimer: generar_recomendacion_comida_use_case_1.DISCLAIMER_IA,
            };
        }
        catch (error) {
            const mensaje = error instanceof Error ? error.message : String(error);
            this.logger.error(`Error sugiriendo sustitución: ${mensaje}`);
            return {
                exito: false,
                datos: null,
                error: mensaje,
                disclaimer: generar_recomendacion_comida_use_case_1.DISCLAIMER_IA,
            };
        }
    }
    construirPrompt(solicitud) {
        const razon = solicitud.razon ?? 'preferencia personal';
        return `Eres un nutricionista profesional. Sugiere UNA sustitución para un alimento.

SOLICITUD:
- Alimento a sustituir: ${solicitud.alimento}
- Razón de la sustitución: ${razon}

REGLAS IMPORTANTES:
1. El alimento sugerido debe tener valor nutricional similar
2. Considera la razón de la sustitución (alergia, preferencia, disponibilidad)
3. La sustitución debe ser práctica y accesible en Argentina
4. Si las calorías son equivalentes, marca caloriasEquivalentes como true
5. Explica brevemente la razón nutricional de la sustitución
6. Responde SOLO con el JSON solicitado

Genera la sugerencia en formato JSON.`;
    }
};
exports.SugerirSustitucionUseCase = SugerirSustitucionUseCase;
exports.SugerirSustitucionUseCase = SugerirSustitucionUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(ai_provider_service_1.AI_PROVIDER_SERVICE)),
    __param(1, (0, common_1.Inject)(logger_service_1.APP_LOGGER_SERVICE)),
    __metadata("design:paramtypes", [Object, Object])
], SugerirSustitucionUseCase);
//# sourceMappingURL=sugerir-sustitucion.use-case.js.map