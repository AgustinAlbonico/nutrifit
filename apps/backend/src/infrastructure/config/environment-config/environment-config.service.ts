import { Injectable, Logger } from '@nestjs/common';
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
  FRONTEND_URL = 'FRONTEND_URL',
  CORS_ALLOWED_ORIGINS = 'CORS_ALLOWED_ORIGINS',
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
  AI_PROVIDER_CHAIN = 'AI_PROVIDER_CHAIN',
  GROQ_API_KEY = 'GROQ_API_KEY',
  GROQ_BASE_URL = 'GROQ_BASE_URL',
  GROQ_MODEL = 'GROQ_MODEL',
  GEMINI_API_KEY = 'GEMINI_API_KEY',
  GEMINI_MODEL = 'GEMINI_MODEL',
  OPENROUTER_API_KEY = 'OPENROUTER_API_KEY',
  OPENROUTER_BASE_URL = 'OPENROUTER_BASE_URL',
  OPENROUTER_MODEL = 'OPENROUTER_MODEL',
  AUSENCIA_UMBRAL_MINUTOS = 'AUSENCIA_UMBRAL_MINUTOS',
}

export type AiProviderName = 'groq' | 'gemini' | 'openrouter';

const AI_PROVIDER_CHAIN_DEFAULT: AiProviderName[] = [
  'groq',
  'gemini',
  'openrouter',
];

const ORIGENES_DESARROLLO_POR_DEFECTO = [
  'http://localhost:4173',
  'http://127.0.0.1:4173',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];

@Injectable()
export class EnvironmentConfigService
  implements DatabaseConfig, AppConfig, JWTConfig, MinioConfig, SchedulerConfig
{
  private readonly logger = new Logger(EnvironmentConfigService.name);

  constructor(private readonly configService: ConfigService) {}

  private getEnvironmentVariable<T>(key: string): T {
    try {
      return this.configService.getOrThrow<T>(key);
    } catch (error) {
      this.logger.warn(
        `Variable de entorno faltante: ${key}`,
        error instanceof Error ? error.stack : undefined,
      );
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

  getCorsAllowedOrigins(): string[] {
    const configuredOrigins = this.configService.get<string>(
      VariablesEntorno.CORS_ALLOWED_ORIGINS,
      '',
    );
    const frontendUrl = this.configService.get<string>(
      VariablesEntorno.FRONTEND_URL,
      '',
    );

    const origins = [...configuredOrigins.split(','), frontendUrl]
      .map((origin) => origin.trim().replace(/\/+$/, ''))
      .filter((origin) => origin.length > 0);

    const uniqueOrigins = Array.from(new Set(origins));

    if (uniqueOrigins.length > 0) {
      return uniqueOrigins;
    }

    if (this.getNodeEnv() === 'production') {
      throw new EnvironmentConfigurationError(
        `${VariablesEntorno.CORS_ALLOWED_ORIGINS}|${VariablesEntorno.FRONTEND_URL}`,
      );
    }

    return ORIGENES_DESARROLLO_POR_DEFECTO;
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
  getAiProviderChain(): AiProviderName[] {
    const raw = this.configService.get<string>(
      VariablesEntorno.AI_PROVIDER_CHAIN,
      AI_PROVIDER_CHAIN_DEFAULT.join(','),
    );

    const proveedores = raw
      .split(',')
      .map((proveedor) => proveedor.trim().toLowerCase())
      .filter((proveedor): proveedor is AiProviderName =>
        this.esProveedorIaValido(proveedor),
      );

    return proveedores.length > 0 ? proveedores : AI_PROVIDER_CHAIN_DEFAULT;
  }

  getGroqApiKey(): string {
    return this.getEnvironmentVariable<string>(VariablesEntorno.GROQ_API_KEY);
  }
  getGroqApiKeyOpcional(): string | undefined {
    return this.configService.get<string>(VariablesEntorno.GROQ_API_KEY);
  }
  getGroqBaseUrl(): string {
    return this.configService.get<string>(
      VariablesEntorno.GROQ_BASE_URL,
      'https://api.groq.com/openai/v1',
    );
  }
  getGroqModel(): string {
    return this.configService.get<string>(
      VariablesEntorno.GROQ_MODEL,
      'llama-3.3-70b-versatile',
    );
  }
  getGeminiApiKey(): string | undefined {
    return this.configService.get<string>(VariablesEntorno.GEMINI_API_KEY);
  }
  getGeminiModel(): string {
    return this.configService.get<string>(
      VariablesEntorno.GEMINI_MODEL,
      'gemini-2.0-flash-lite',
    );
  }
  getOpenRouterApiKey(): string | undefined {
    return this.configService.get<string>(VariablesEntorno.OPENROUTER_API_KEY);
  }
  getOpenRouterBaseUrl(): string {
    return this.configService.get<string>(
      VariablesEntorno.OPENROUTER_BASE_URL,
      'https://openrouter.ai/api/v1',
    );
  }
  getOpenRouterModel(): string {
    return this.configService.get<string>(
      VariablesEntorno.OPENROUTER_MODEL,
      'meta-llama/llama-3.3-8b-instruct:free',
    );
  }

  //Variables de entorno Scheduler
  getAusenciaUmbralMinutos(): number {
    return this.getEnvironmentVariable<number>(
      VariablesEntorno.AUSENCIA_UMBRAL_MINUTOS,
    );
  }

  private esProveedorIaValido(proveedor: string): proveedor is AiProviderName {
    return ['groq', 'gemini', 'openrouter'].includes(proveedor);
  }
}
