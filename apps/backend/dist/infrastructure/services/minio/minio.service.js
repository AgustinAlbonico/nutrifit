"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var MinioService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MINIO_SERVICE_PROVIDER = exports.MinioService = void 0;
const common_1 = require("@nestjs/common");
const Minio = __importStar(require("minio"));
const object_storage_service_1 = require("../../../domain/services/object-storage.service");
const environment_config_service_1 = require("../../config/environment-config/environment-config.service");
let MinioService = MinioService_1 = class MinioService {
    configService;
    logger = new common_1.Logger(MinioService_1.name);
    minioClient;
    bucketName;
    constructor(configService) {
        this.configService = configService;
        this.bucketName = this.configService.getMinioBucketName();
        this.minioClient = new Minio.Client({
            endPoint: this.configService.getMinioEndpoint(),
            port: this.configService.getMinioPort(),
            useSSL: this.configService.getMinioUseSsl(),
            accessKey: this.configService.getMinioAccessKey(),
            secretKey: this.configService.getMinioSecretKey(),
        });
    }
    async onModuleInit() {
        await this.asegurarBucketExiste();
    }
    async asegurarBucketExiste() {
        try {
            const existe = await this.minioClient.bucketExists(this.bucketName);
            if (!existe) {
                await this.minioClient.makeBucket(this.bucketName, 'us-east-1');
                this.logger.log(`Bucket '${this.bucketName}' creado exitosamente`);
                await this.configurarPoliticaPublica();
            }
            else {
                this.logger.log(`Bucket '${this.bucketName}' ya existe`);
            }
        }
        catch (error) {
            this.logger.error(`Error al verificar/crear bucket: ${error}`);
            throw error;
        }
    }
    async configurarPoliticaPublica() {
        const politica = {
            Version: '2012-10-17',
            Statement: [
                {
                    Effect: 'Allow',
                    Principal: { AWS: ['*'] },
                    Action: ['s3:GetObject'],
                    Resource: [`arn:aws:s3:::${this.bucketName}/*`],
                },
            ],
        };
        await this.minioClient.setBucketPolicy(this.bucketName, JSON.stringify(politica));
        this.logger.log(`Política pública configurada para bucket '${this.bucketName}'`);
    }
    async subirArchivo(objectKey, buffer, mimeType) {
        try {
            await this.minioClient.putObject(this.bucketName, objectKey, buffer, buffer.length, {
                'Content-Type': mimeType,
            });
            this.logger.log(`Archivo subido: ${objectKey}`);
        }
        catch (error) {
            this.logger.error(`Error al subir archivo ${objectKey}: ${error}`);
            throw error;
        }
    }
    async eliminarArchivo(objectKey) {
        try {
            await this.minioClient.removeObject(this.bucketName, objectKey);
            this.logger.log(`Archivo eliminado: ${objectKey}`);
        }
        catch (error) {
            this.logger.error(`Error al eliminar archivo ${objectKey}: ${error}`);
            throw error;
        }
    }
    async obtenerUrlFirmada(objectKey, expirySeconds = 3600) {
        try {
            const url = await this.minioClient.presignedGetObject(this.bucketName, objectKey, expirySeconds);
            return url;
        }
        catch (error) {
            this.logger.error(`Error al generar URL firmada para ${objectKey}: ${error}`);
            throw error;
        }
    }
    async archivoExiste(objectKey) {
        try {
            await this.minioClient.statObject(this.bucketName, objectKey);
            return true;
        }
        catch {
            return false;
        }
    }
    async obtenerArchivo(objectKey) {
        try {
            const stat = await this.minioClient.statObject(this.bucketName, objectKey);
            const mimeType = stat.metaData?.['content-type'] || 'application/octet-stream';
            const dataStream = await this.minioClient.getObject(this.bucketName, objectKey);
            const chunks = [];
            for await (const chunk of dataStream) {
                chunks.push(chunk);
            }
            const buffer = Buffer.concat(chunks);
            return { buffer, mimeType };
        }
        catch (error) {
            this.logger.error(`Error al obtener archivo ${objectKey}: ${error}`);
            return null;
        }
    }
};
exports.MinioService = MinioService;
exports.MinioService = MinioService = MinioService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [environment_config_service_1.EnvironmentConfigService])
], MinioService);
exports.MINIO_SERVICE_PROVIDER = {
    provide: object_storage_service_1.OBJECT_STORAGE_SERVICE,
    useClass: MinioService,
};
//# sourceMappingURL=minio.service.js.map