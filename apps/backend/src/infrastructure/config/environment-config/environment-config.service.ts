import { Injectable, Logger, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ModuleRef } from '@nestjs/core';
import { IA_CONFIGURACION_SERVICE } from 'src/application/ia-configuracion/ia-configuracion.tokens';
import type {
  IaConfiguracionConsultaService,
  ProveedorIa,
} from 'src/application/ia-configuracion/ia-configuracion.types';
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
  OPENCODE_API_KEY = 'OPENCODE_API_KEY',
  OPENCODE_BASE_URL = 'OPENCODE_BASE_URL',
  OPENCODE_MODEL = 'OPENCODE_MODEL',
  OPENROUTER_API_KEY = 'OPENROUTER_API_KEY',
  OPENROUTER_BASE_URL = 'OPENROUTER_BASE_URL',
  OPENROUTER_MODEL = 'OPENROUTER_MODEL',
  AUSENCIA_UMBRAL_MINUTOS = 'AUSENCIA_UMBRAL_MINUTOS',
}

export type AiProviderName = 'groq' | 'gemini' | 'opencode' | 'openrouter';

const AI_PROVIDER_CHAIN_DEFAULT: AiProviderName[] = [
  'opencode',
  'groq',
  'gemini',
  'openrouter',
];

const MAX_TOKENS_DEFAULT = 2048;
const TEMPERATURA_DEFAULT = 0.7;
const TIMEOUT_DEFAULT_MS = 120000;

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

  constructor(
    private readonly configService: ConfigService,
    @Optional() private readonly moduleRef?: ModuleRef,
  ) {}

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
    const chainDb = this.obtenerIaConfiguracionService()?.obtenerChain();

    if (chainDb && chainDb.length > 0) {
      return chainDb;
    }

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
    return (
      this.obtenerApiKeyIa('groq') ??
      this.getEnvironmentVariable<string>(VariablesEntorno.GROQ_API_KEY)
    );
  }
  getGroqApiKeyOpcional(): string | undefined {
    return (
      this.obtenerApiKeyIa('groq') ??
      this.configService.get<string>(VariablesEntorno.GROQ_API_KEY)
    );
  }
  getGroqBaseUrl(): string {
    return (
      this.obtenerBaseUrlIa('groq') ??
      this.configService.get<string>(
        VariablesEntorno.GROQ_BASE_URL,
        'https://api.groq.com/openai/v1',
      )
    );
  }
  getGroqModel(): string {
    return (
      this.obtenerModelIa('groq') ??
      this.configService.get<string>(
        VariablesEntorno.GROQ_MODEL,
        'llama-3.3-70b-versatile',
      )
    );
  }
  getGeminiApiKey(): string | undefined {
    return (
      this.obtenerApiKeyIa('gemini') ??
      this.configService.get<string>(VariablesEntorno.GEMINI_API_KEY)
    );
  }
  getGeminiModel(): string {
    return (
      this.obtenerModelIa('gemini') ??
      this.configService.get<string>(
        VariablesEntorno.GEMINI_MODEL,
        'gemini-2.0-flash-lite',
      )
    );
  }
  getOpenCodeApiKey(): string | undefined {
    return (
      this.obtenerApiKeyIa('opencode') ??
      this.configService.get<string>(VariablesEntorno.OPENCODE_API_KEY)
    );
  }
  getOpenCodeBaseUrl(): string {
    return (
      this.obtenerBaseUrlIa('opencode') ??
      this.configService.get<string>(
        VariablesEntorno.OPENCODE_BASE_URL,
        'https://opencode.ai/zen/v1',
      )
    );
  }
  getOpenCodeModel(): string {
    return (
      this.obtenerModelIa('opencode') ??
      this.configService.get<string>(
        VariablesEntorno.OPENCODE_MODEL,
        'deepseek-v4-flash-free',
      )
    );
  }
  getOpenRouterApiKey(): string | undefined {
    return (
      this.obtenerApiKeyIa('openrouter') ??
      this.configService.get<string>(VariablesEntorno.OPENROUTER_API_KEY)
    );
  }
  getOpenRouterBaseUrl(): string {
    return (
      this.obtenerBaseUrlIa('openrouter') ??
      this.configService.get<string>(
        VariablesEntorno.OPENROUTER_BASE_URL,
        'https://openrouter.ai/api/v1',
      )
    );
  }
  getOpenRouterModel(): string {
    return (
      this.obtenerModelIa('openrouter') ??
      this.configService.get<string>(
        VariablesEntorno.OPENROUTER_MODEL,
        'meta-llama/llama-3.3-8b-instruct:free',
      )
    );
  }

  getMaxTokensIa(provider: ProveedorIa): number {
    return (
      this.obtenerIaConfiguracionService()?.obtenerMaxTokens(provider) ??
      MAX_TOKENS_DEFAULT
    );
  }

  getTemperatureIa(provider: ProveedorIa): number {
    return (
      this.obtenerIaConfiguracionService()?.obtenerTemperature(provider) ??
      TEMPERATURA_DEFAULT
    );
  }

  getTimeoutMsIa(provider: ProveedorIa): number {
    return (
      this.obtenerIaConfiguracionService()?.obtenerTimeoutMs(provider) ??
      TIMEOUT_DEFAULT_MS
    );
  }

  //Variables de entorno Scheduler
  getAusenciaUmbralMinutos(): number {
    return this.getEnvironmentVariable<number>(
      VariablesEntorno.AUSENCIA_UMBRAL_MINUTOS,
    );
  }

  private esProveedorIaValido(proveedor: string): proveedor is AiProviderName {
    return ['groq', 'gemini', 'opencode', 'openrouter'].includes(proveedor);
  }

  private obtenerIaConfiguracionService():
    | IaConfiguracionConsultaService
    | undefined {
    if (!this.moduleRef) {
      return undefined;
    }

    try {
      return this.moduleRef.get<IaConfiguracionConsultaService>(
        IA_CONFIGURACION_SERVICE,
        { strict: false },
      );
    } catch {
      return undefined;
    }
  }

  private obtenerApiKeyIa(provider: ProveedorIa): string | undefined {
    return this.obtenerIaConfiguracionService()?.obtenerApiKeyDescifrada(
      provider,
    );
  }

  private obtenerModelIa(provider: ProveedorIa): string | undefined {
    return this.obtenerIaConfiguracionService()?.obtenerModel(provider);
  }

  private obtenerBaseUrlIa(provider: ProveedorIa): string | undefined {
    return this.obtenerIaConfiguracionService()?.obtenerBaseUrl(provider);
  }
}
