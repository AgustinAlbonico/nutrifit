import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as Minio from 'minio';
import {
  IObjectStorageService,
  OBJECT_STORAGE_SERVICE,
} from 'src/domain/services/object-storage.service';
import { EnvironmentConfigService } from 'src/infrastructure/config/environment-config/environment-config.service';

@Injectable()
export class MinioService implements IObjectStorageService, OnModuleInit {
  private readonly logger = new Logger(MinioService.name);
  private readonly minioClient: Minio.Client;
  private readonly bucketName: string;

  constructor(private readonly configService: EnvironmentConfigService) {
    this.bucketName = this.configService.getMinioBucketName();

    this.minioClient = new Minio.Client({
      endPoint: this.configService.getMinioEndpoint(),
      port: this.configService.getMinioPort(),
      useSSL: this.configService.getMinioUseSsl(),
      accessKey: this.configService.getMinioAccessKey(),
      secretKey: this.configService.getMinioSecretKey(),
    });
  }

  async onModuleInit(): Promise<void> {
    await this.asegurarBucketExiste();
  }

  private async asegurarBucketExiste(): Promise<void> {
    try {
      const existe = await this.minioClient.bucketExists(this.bucketName);
      if (!existe) {
        await this.minioClient.makeBucket(this.bucketName, 'us-east-1');
        this.logger.log(`Bucket '${this.bucketName}' creado exitosamente`);

        // Configurar política pública para lectura de objetos
        await this.configurarPoliticaPublica();
      } else {
        this.logger.log(`Bucket '${this.bucketName}' ya existe`);
      }
    } catch (error) {
      this.logger.error(`Error al verificar/crear bucket: ${error}`);
      throw error;
    }
  }

  private async configurarPoliticaPublica(): Promise<void> {
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

    await this.minioClient.setBucketPolicy(
      this.bucketName,
      JSON.stringify(politica),
    );
    this.logger.log(
      `Política pública configurada para bucket '${this.bucketName}'`,
    );
  }

  async subirArchivo(
    objectKey: string,
    buffer: Buffer,
    mimeType: string,
  ): Promise<void> {
    try {
      await this.minioClient.putObject(
        this.bucketName,
        objectKey,
        buffer,
        buffer.length,
        {
          'Content-Type': mimeType,
        },
      );
      this.logger.log(`Archivo subido: ${objectKey}`);
    } catch (error) {
      this.logger.error(`Error al subir archivo ${objectKey}: ${error}`);
      throw error;
    }
  }

  async eliminarArchivo(objectKey: string): Promise<void> {
    try {
      await this.minioClient.removeObject(this.bucketName, objectKey);
      this.logger.log(`Archivo eliminado: ${objectKey}`);
    } catch (error) {
      this.logger.error(`Error al eliminar archivo ${objectKey}: ${error}`);
      throw error;
    }
  }

  async obtenerUrlFirmada(
    objectKey: string,
    expirySeconds: number = 3600,
  ): Promise<string> {
    try {
      const url = await this.minioClient.presignedGetObject(
        this.bucketName,
        objectKey,
        expirySeconds,
      );
      return url;
    } catch (error) {
      this.logger.error(
        `Error al generar URL firmada para ${objectKey}: ${error}`,
      );
      throw error;
    }
  }

  async archivoExiste(objectKey: string): Promise<boolean> {
    try {
      await this.minioClient.statObject(this.bucketName, objectKey);
      return true;
    } catch {
      return false;
    }
  }

  async obtenerArchivo(
    objectKey: string,
  ): Promise<{ buffer: Buffer; mimeType: string } | null> {
    try {
      const stat = await this.minioClient.statObject(
        this.bucketName,
        objectKey,
      );
      const mimeType =
        stat.metaData?.['content-type'] || 'application/octet-stream';

      const dataStream = await this.minioClient.getObject(
        this.bucketName,
        objectKey,
      );

      const chunks: Buffer[] = [];
      for await (const chunk of dataStream) {
        chunks.push(chunk);
      }
      const buffer = Buffer.concat(chunks);

      return { buffer, mimeType };
    } catch (error) {
      this.logger.error(`Error al obtener archivo ${objectKey}: ${error}`);
      return null;
    }
  }
}

// Provider token para inyección de dependencias
export const MINIO_SERVICE_PROVIDER = {
  provide: OBJECT_STORAGE_SERVICE,
  useClass: MinioService,
};
