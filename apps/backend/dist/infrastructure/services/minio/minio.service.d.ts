import { OnModuleInit } from '@nestjs/common';
import { IObjectStorageService } from 'src/domain/services/object-storage.service';
import { EnvironmentConfigService } from 'src/infrastructure/config/environment-config/environment-config.service';
export declare class MinioService implements IObjectStorageService, OnModuleInit {
    private readonly configService;
    private readonly logger;
    private readonly minioClient;
    private readonly bucketName;
    constructor(configService: EnvironmentConfigService);
    onModuleInit(): Promise<void>;
    private asegurarBucketExiste;
    private configurarPoliticaPublica;
    subirArchivo(objectKey: string, buffer: Buffer, mimeType: string): Promise<void>;
    eliminarArchivo(objectKey: string): Promise<void>;
    obtenerUrlFirmada(objectKey: string, expirySeconds?: number): Promise<string>;
    archivoExiste(objectKey: string): Promise<boolean>;
    obtenerArchivo(objectKey: string): Promise<{
        buffer: Buffer;
        mimeType: string;
    } | null>;
}
export declare const MINIO_SERVICE_PROVIDER: {
    provide: symbol;
    useClass: typeof MinioService;
};
