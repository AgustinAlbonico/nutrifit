import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DatabaseConfig } from 'src/domain/config/database.config';
import { EnvironmentConfigurationError } from './environment-config.error';
import { AppConfig } from 'src/domain/config/app.config';
import { JWTConfig } from 'src/domain/config/jwt.config';
import { MinioConfig } from 'src/domain/config/minio.config';
import { SchedulerConfig } from 'src/domain/config/scheduler.config';

enum VariablesEntorno {
  PORT = 'PORT',
  APP_NAME = 'APP_NAME',
  NODE_ENV = 'NODE_ENV',
  DATABASE_HOST = 'DATABASE_HOST',
  DATABASE_PORT = 'DATABASE_PORT',
  DATABASE_NAME = 'DATABASE_NAME',
  DATABASE_USER = 'DATABASE_USER',
  DATABASE_PASSWORD = 'DATABASE_PASSWORD',
  JWT_SECRET = 'JWT_SECRET',
  JWT_EXPIRES_IN = 'JWT_EXPIRES_IN',
  MINIO_ENDPOINT = 'MINIO_ENDPOINT',
  MINIO_PORT = 'MINIO_PORT',
  MINIO_ACCESS_KEY = 'MINIO_ACCESS_KEY',
  MINIO_SECRET_KEY = 'MINIO_SECRET_KEY',
  MINIO_USE_SSL = 'MINIO_USE_SSL',
  MINIO_BUCKET_NAME = 'MINIO_BUCKET_NAME',
  GROQ_API_KEY = 'GROQ_API_KEY',
  GROQ_BASE_URL = 'GROQ_BASE_URL',
  GROQ_MODEL = 'GROQ_MODEL',
  AUSENCIA_UMBRAL_MINUTOS = 'AUSENCIA_UMBRAL_MINUTOS',
}

@Injectable()
export class EnvironmentConfigService
  implements DatabaseConfig, AppConfig, JWTConfig, MinioConfig, SchedulerConfig
{
  constructor(private readonly configService: ConfigService) {}

  private getEnvironmentVariable<T>(key: string): T {
    try {
      return this.configService.getOrThrow<T>(key);
    } catch (error) {
      console.log(error);
      throw new EnvironmentConfigurationError(key);
    }
  }

  //JWT
  getJwtSecret(): string {
    return this.getEnvironmentVariable<string>(VariablesEntorno.JWT_SECRET);
  }

  getJwtExpirationTime(): string {
    return this.getEnvironmentVariable<string>(VariablesEntorno.JWT_EXPIRES_IN);
  }

  //Variables globales
  getPort(): number {
    return this.getEnvironmentVariable<number>(VariablesEntorno.PORT);
  }

  getAppName(): string {
    return this.getEnvironmentVariable<string>(VariablesEntorno.APP_NAME);
  }

  getNodeEnv(): 'production' | 'test' | 'dev' {
    return this.getEnvironmentVariable<'production' | 'test' | 'dev'>(
      VariablesEntorno.NODE_ENV,
    );
  }

  //Variables de entorno DB
  getDatabaseHost(): string {
    return this.getEnvironmentVariable<string>(VariablesEntorno.DATABASE_HOST);
  }

  getDatabasePort(): number {
    return this.getEnvironmentVariable<number>(VariablesEntorno.DATABASE_PORT);
  }

  getDatabaseUser(): string {
    return this.getEnvironmentVariable<string>(VariablesEntorno.DATABASE_USER);
  }

  getDatabasePassword(): string {
    return this.getEnvironmentVariable<string>(
      VariablesEntorno.DATABASE_PASSWORD,
    );
  }

  getDatabaseName(): string {
    return this.getEnvironmentVariable<string>(VariablesEntorno.DATABASE_NAME);
  }

  //Variables de entorno MinIO
  getMinioEndpoint(): string {
    return this.getEnvironmentVariable<string>(VariablesEntorno.MINIO_ENDPOINT);
  }

  getMinioPort(): number {
    return this.getEnvironmentVariable<number>(VariablesEntorno.MINIO_PORT);
  }

  getMinioAccessKey(): string {
    return this.getEnvironmentVariable<string>(
      VariablesEntorno.MINIO_ACCESS_KEY,
    );
  }

  getMinioSecretKey(): string {
    return this.getEnvironmentVariable<string>(
      VariablesEntorno.MINIO_SECRET_KEY,
    );
  }

  getMinioBucketName(): string {
    return this.getEnvironmentVariable<string>(
      VariablesEntorno.MINIO_BUCKET_NAME,
    );
  }

  getMinioUseSsl(): boolean {
    const valor = this.configService.get<string>(
      VariablesEntorno.MINIO_USE_SSL,
      'false',
    );
    return valor === 'true';
  }
  getGroqApiKey(): string {
    return this.getEnvironmentVariable<string>(VariablesEntorno.GROQ_API_KEY);
  }
  getGroqBaseUrl(): string {
    return this.getEnvironmentVariable<string>(VariablesEntorno.GROQ_BASE_URL);
  }
  getGroqModel(): string {
    return this.getEnvironmentVariable<string>(VariablesEntorno.GROQ_MODEL);
  }

  //Variables de entorno Scheduler
  getAusenciaUmbralMinutos(): number {
    return this.getEnvironmentVariable<number>(
      VariablesEntorno.AUSENCIA_UMBRAL_MINUTOS,
    );
  }
}
