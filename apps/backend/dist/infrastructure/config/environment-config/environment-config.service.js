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
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnvironmentConfigService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const environment_config_error_1 = require("./environment-config.error");
var VariablesEntorno;
(function (VariablesEntorno) {
    VariablesEntorno["PORT"] = "PORT";
    VariablesEntorno["APP_NAME"] = "APP_NAME";
    VariablesEntorno["NODE_ENV"] = "NODE_ENV";
    VariablesEntorno["FRONTEND_URL"] = "FRONTEND_URL";
    VariablesEntorno["CORS_ALLOWED_ORIGINS"] = "CORS_ALLOWED_ORIGINS";
    VariablesEntorno["DATABASE_HOST"] = "DATABASE_HOST";
    VariablesEntorno["DATABASE_PORT"] = "DATABASE_PORT";
    VariablesEntorno["DATABASE_NAME"] = "DATABASE_NAME";
    VariablesEntorno["DATABASE_USER"] = "DATABASE_USER";
    VariablesEntorno["DATABASE_PASSWORD"] = "DATABASE_PASSWORD";
    VariablesEntorno["JWT_SECRET"] = "JWT_SECRET";
    VariablesEntorno["JWT_EXPIRES_IN"] = "JWT_EXPIRES_IN";
    VariablesEntorno["MINIO_ENDPOINT"] = "MINIO_ENDPOINT";
    VariablesEntorno["MINIO_PORT"] = "MINIO_PORT";
    VariablesEntorno["MINIO_ACCESS_KEY"] = "MINIO_ACCESS_KEY";
    VariablesEntorno["MINIO_SECRET_KEY"] = "MINIO_SECRET_KEY";
    VariablesEntorno["MINIO_USE_SSL"] = "MINIO_USE_SSL";
    VariablesEntorno["MINIO_BUCKET_NAME"] = "MINIO_BUCKET_NAME";
    VariablesEntorno["GROQ_API_KEY"] = "GROQ_API_KEY";
    VariablesEntorno["GROQ_BASE_URL"] = "GROQ_BASE_URL";
    VariablesEntorno["GROQ_MODEL"] = "GROQ_MODEL";
    VariablesEntorno["AUSENCIA_UMBRAL_MINUTOS"] = "AUSENCIA_UMBRAL_MINUTOS";
})(VariablesEntorno || (VariablesEntorno = {}));
const ORIGENES_DESARROLLO_POR_DEFECTO = [
    'http://localhost:4173',
    'http://127.0.0.1:4173',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
];
let EnvironmentConfigService = class EnvironmentConfigService {
    configService;
    constructor(configService) {
        this.configService = configService;
    }
    getEnvironmentVariable(key) {
        try {
            return this.configService.getOrThrow(key);
        }
        catch (error) {
            console.log(error);
            throw new environment_config_error_1.EnvironmentConfigurationError(key);
        }
    }
    getJwtSecret() {
        return this.getEnvironmentVariable(VariablesEntorno.JWT_SECRET);
    }
    getJwtExpirationTime() {
        return this.getEnvironmentVariable(VariablesEntorno.JWT_EXPIRES_IN);
    }
    getPort() {
        return this.getEnvironmentVariable(VariablesEntorno.PORT);
    }
    getAppName() {
        return this.getEnvironmentVariable(VariablesEntorno.APP_NAME);
    }
    getCorsAllowedOrigins() {
        const configuredOrigins = this.configService.get(VariablesEntorno.CORS_ALLOWED_ORIGINS, '');
        const frontendUrl = this.configService.get(VariablesEntorno.FRONTEND_URL, '');
        const origins = [...configuredOrigins.split(','), frontendUrl]
            .map((origin) => origin.trim().replace(/\/+$/, ''))
            .filter((origin) => origin.length > 0);
        const uniqueOrigins = Array.from(new Set(origins));
        if (uniqueOrigins.length > 0) {
            return uniqueOrigins;
        }
        if (this.getNodeEnv() === 'production') {
            throw new environment_config_error_1.EnvironmentConfigurationError(`${VariablesEntorno.CORS_ALLOWED_ORIGINS}|${VariablesEntorno.FRONTEND_URL}`);
        }
        return ORIGENES_DESARROLLO_POR_DEFECTO;
    }
    getNodeEnv() {
        return this.getEnvironmentVariable(VariablesEntorno.NODE_ENV);
    }
    getDatabaseHost() {
        return this.getEnvironmentVariable(VariablesEntorno.DATABASE_HOST);
    }
    getDatabasePort() {
        return this.getEnvironmentVariable(VariablesEntorno.DATABASE_PORT);
    }
    getDatabaseUser() {
        return this.getEnvironmentVariable(VariablesEntorno.DATABASE_USER);
    }
    getDatabasePassword() {
        return this.getEnvironmentVariable(VariablesEntorno.DATABASE_PASSWORD);
    }
    getDatabaseName() {
        return this.getEnvironmentVariable(VariablesEntorno.DATABASE_NAME);
    }
    getMinioEndpoint() {
        return this.getEnvironmentVariable(VariablesEntorno.MINIO_ENDPOINT);
    }
    getMinioPort() {
        return this.getEnvironmentVariable(VariablesEntorno.MINIO_PORT);
    }
    getMinioAccessKey() {
        return this.getEnvironmentVariable(VariablesEntorno.MINIO_ACCESS_KEY);
    }
    getMinioSecretKey() {
        return this.getEnvironmentVariable(VariablesEntorno.MINIO_SECRET_KEY);
    }
    getMinioBucketName() {
        return this.getEnvironmentVariable(VariablesEntorno.MINIO_BUCKET_NAME);
    }
    getMinioUseSsl() {
        const valor = this.configService.get(VariablesEntorno.MINIO_USE_SSL, 'false');
        return valor === 'true';
    }
    getGroqApiKey() {
        return this.getEnvironmentVariable(VariablesEntorno.GROQ_API_KEY);
    }
    getGroqBaseUrl() {
        return this.getEnvironmentVariable(VariablesEntorno.GROQ_BASE_URL);
    }
    getGroqModel() {
        return this.getEnvironmentVariable(VariablesEntorno.GROQ_MODEL);
    }
    getAusenciaUmbralMinutos() {
        return this.getEnvironmentVariable(VariablesEntorno.AUSENCIA_UMBRAL_MINUTOS);
    }
};
exports.EnvironmentConfigService = EnvironmentConfigService;
exports.EnvironmentConfigService = EnvironmentConfigService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], EnvironmentConfigService);
//# sourceMappingURL=environment-config.service.js.map