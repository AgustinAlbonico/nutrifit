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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var GroqService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GroqService = void 0;
const common_1 = require("@nestjs/common");
const environment_config_service_1 = require("../../../infrastructure/config/environment-config/environment-config.service");
const openai_1 = __importDefault(require("openai"));
let GroqService = GroqService_1 = class GroqService {
    configService;
    logger = new common_1.Logger(GroqService_1.name);
    client;
    baseUrl;
    model;
    constructor(configService) {
        this.configService = configService;
        this.baseUrl = this.configService.getGroqBaseUrl();
        this.model = this.configService.getGroqModel();
        this.client = new openai_1.default({
            apiKey: this.configService.getGroqApiKey(),
            baseURL: this.baseUrl,
        });
    }
    async generarRecomendacion(prompt, schema) {
        try {
            this.logger.log('Iniciando llamada a Groq API');
            const schemaDescription = JSON.stringify(schema, null, 2);
            const response = await this.client.chat.completions.create({
                messages: [
                    {
                        role: 'system',
                        content: 'Eres un asistente de nutrición profesional. DEBES responder ÚNICAMENTE con un JSON válido que coincida exactamente con el esquema proporcionado. No incluyas texto adicional, markdown ni explicaciones fuera del JSON.',
                    },
                    {
                        role: 'user',
                        content: `${prompt}\n\nEsquema JSON requerido:\n${schemaDescription}\n\nResponde SOLO con el JSON, sin texto adicional.`,
                    },
                ],
                model: this.model,
                temperature: 0.7,
                max_tokens: 2048,
                response_format: { type: 'json_object' },
            });
            const content = response.choices[0].message?.content;
            if (!content) {
                throw new Error('La API de Groq no devolvió contenido');
            }
            const parsed = JSON.parse(content);
            this.logger.log('Respuesta de Groq API procesada exitosamente');
            return parsed;
        }
        catch (error) {
            const detalle = error instanceof Error ? error.message : String(error);
            this.logger.error(`Error en GroqService: ${detalle}`);
            throw new Error(`No se pudo generar la recomendación: ${detalle}`);
        }
    }
    verificarConexion() {
        try {
            const apiKey = this.configService.getGroqApiKey();
            if (!apiKey) {
                this.logger.warn('GROQ_API_KEY no configurada');
                return Promise.resolve(false);
            }
            if (apiKey.length < 20) {
                this.logger.warn('GROQ_API_KEY tiene formato inválido');
                return Promise.resolve(false);
            }
            this.logger.log('Groq API configurada correctamente');
            return Promise.resolve(true);
        }
        catch (error) {
            this.logger.error(`Error verificando conexión Groq: ${error}`);
            return Promise.resolve(false);
        }
    }
};
exports.GroqService = GroqService;
exports.GroqService = GroqService = GroqService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [environment_config_service_1.EnvironmentConfigService])
], GroqService);
//# sourceMappingURL=groq.service.js.map