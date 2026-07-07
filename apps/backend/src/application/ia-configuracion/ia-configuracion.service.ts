import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';

import {
  BadRequestError,
  NotFoundError,
} from 'src/domain/exceptions/custom-exceptions';
import { EncriptacionService } from 'src/infrastructure/security/encriptacion.service';
import { IaConfiguracionOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/ia-configuracion.entity';

import { GuardarIaConfiguracionDto } from './dto/guardar-ia-configuracion.dto';
import { IaConfiguracionResponse } from './dto/ia-configuracion.response';
import {
  ConfiguracionIaCache,
  PROVEEDORES_IA,
  ProveedorIa,
  esProveedorIa,
} from './ia-configuracion.types';

@Injectable()
export class IaConfiguracionService implements OnModuleInit {
  private readonly logger = new Logger(IaConfiguracionService.name);
  private readonly cache = new Map<ProveedorIa, ConfiguracionIaCache>();

  constructor(
    @InjectRepository(IaConfiguracionOrmEntity)
    private readonly repositorio: Repository<IaConfiguracionOrmEntity>,
    private readonly encriptacionService: EncriptacionService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.inicializar();
  }

  async inicializar(): Promise<void> {
    const configuraciones = await this.repositorio.find({
      where: { gimnasioId: IsNull() },
      order: { orden: 'ASC', provider: 'ASC' },
    });

    this.cache.clear();

    for (const configuracion of configuraciones) {
      this.cache.set(configuracion.provider, this.mapearCache(configuracion));
    }

    this.logger.log(
      `Configuración IA cargada: ${configuraciones.length} providers`,
    );
  }

  obtenerTodas(): IaConfiguracionResponse[] {
    return Array.from(this.cache.values())
      .sort((a, b) => a.orden - b.orden || a.provider.localeCompare(b.provider))
      .map((configuracion) => this.mapearResponse(configuracion));
  }

  obtenerPorProvider(provider: ProveedorIa): IaConfiguracionResponse | null {
    this.validarProvider(provider);
    const configuracion = this.cache.get(provider);
    return configuracion ? this.mapearResponse(configuracion) : null;
  }

  obtenerApiKeyDescifrada(provider: ProveedorIa): string | undefined {
    this.validarProvider(provider);
    const apiKeyEncrypted = this.cache.get(provider)?.apiKeyEncrypted;
    return apiKeyEncrypted
      ? this.encriptacionService.descifrar(apiKeyEncrypted)
      : undefined;
  }

  obtenerChain(): ProveedorIa[] {
    return Array.from(this.cache.values())
      .filter((configuracion) => configuracion.habilitado)
      .sort((a, b) => a.orden - b.orden || a.provider.localeCompare(b.provider))
      .map((configuracion) => configuracion.provider);
  }

  obtenerModel(provider: ProveedorIa): string | undefined {
    this.validarProvider(provider);
    return this.cache.get(provider)?.model ?? undefined;
  }

  obtenerBaseUrl(provider: ProveedorIa): string | undefined {
    this.validarProvider(provider);
    return this.cache.get(provider)?.baseUrl ?? undefined;
  }

  obtenerMaxTokens(provider: ProveedorIa): number | undefined {
    this.validarProvider(provider);
    return this.cache.get(provider)?.maxTokens ?? undefined;
  }

  obtenerTemperature(provider: ProveedorIa): number | undefined {
    this.validarProvider(provider);
    return this.cache.get(provider)?.temperature ?? undefined;
  }

  obtenerTimeoutMs(provider: ProveedorIa): number | undefined {
    this.validarProvider(provider);
    return this.cache.get(provider)?.timeoutMs ?? undefined;
  }

  async guardar(
    provider: ProveedorIa,
    dto: GuardarIaConfiguracionDto,
  ): Promise<IaConfiguracionResponse> {
    this.validarProvider(provider);

    const existente = await this.repositorio.findOne({
      where: { provider, gimnasioId: IsNull() },
    });

    const entidad =
      existente ?? this.repositorio.create({ provider, gimnasioId: null });
    const apiKeyNormalizada = dto.apiKey?.trim();

    if (apiKeyNormalizada) {
      entidad.apiKeyEncrypted =
        this.encriptacionService.cifrar(apiKeyNormalizada);
    }

    if (dto.model !== undefined) {
      entidad.model = this.normalizarTextoNullable(dto.model);
    }

    if (dto.baseUrl !== undefined) {
      entidad.baseUrl = this.normalizarTextoNullable(dto.baseUrl);
    }

    if (dto.maxTokens !== undefined) {
      entidad.maxTokens = dto.maxTokens;
    }

    if (dto.temperature !== undefined) {
      entidad.temperature = dto.temperature.toFixed(3);
    }

    if (dto.timeoutMs !== undefined) {
      entidad.timeoutMs = dto.timeoutMs;
    }

    if (dto.habilitado !== undefined) {
      entidad.habilitado = dto.habilitado;
    }

    if (dto.orden !== undefined) {
      entidad.orden = dto.orden;
    }

    const guardada = await this.repositorio.save(entidad);
    const configuracionCache = this.mapearCache(guardada);
    this.cache.set(provider, configuracionCache);

    return this.mapearResponse(configuracionCache);
  }

  async eliminar(provider: ProveedorIa): Promise<void> {
    this.validarProvider(provider);
    const resultado = await this.repositorio.delete({
      provider,
      gimnasioId: IsNull(),
    });

    if (!resultado.affected) {
      throw new NotFoundError('Configuración IA', provider);
    }

    this.cache.delete(provider);
  }

  probarConexion(
    provider: ProveedorIa,
    dto: GuardarIaConfiguracionDto = {},
  ): Promise<{ ok: boolean; mensaje: string }> {
    this.validarProvider(provider);

    const configuracion = this.cache.get(provider);
    const apiKey = dto.apiKey?.trim() || this.obtenerApiKeyDescifrada(provider);
    const model =
      this.normalizarTextoNullable(dto.model) ?? configuracion?.model;

    if (!apiKey) {
      return Promise.resolve({
        ok: false,
        mensaje: `El provider ${provider} no tiene API key configurada.`,
      });
    }

    if (apiKey.length < 20) {
      return Promise.resolve({
        ok: false,
        mensaje: `La API key de ${provider} tiene formato inválido.`,
      });
    }

    if (!model) {
      return Promise.resolve({
        ok: false,
        mensaje: `El provider ${provider} no tiene modelo configurado.`,
      });
    }

    return Promise.resolve({
      ok: true,
      mensaje: `Configuración de ${provider} lista para usar.`,
    });
  }

  async obtenerModelosRemotos(
    provider: ProveedorIa,
    dto: GuardarIaConfiguracionDto = {},
  ): Promise<{
    ok: boolean;
    modelos: Array<{ id: string; nombre?: string }>;
    mensaje?: string;
  }> {
    this.validarProvider(provider);

    const configuracion = this.cache.get(provider);
    const apiKey = dto.apiKey?.trim() || this.obtenerApiKeyDescifrada(provider);
    const baseUrl =
      this.normalizarTextoNullable(dto.baseUrl) ??
      configuracion?.baseUrl ??
      this.obtenerBaseUrlDefault(provider);

    if (!apiKey) {
      return {
        ok: false,
        modelos: [],
        mensaje: `El provider ${provider} no tiene API key configurada. Cargá la key primero o pasala en el body.`,
      };
    }

    if (!baseUrl) {
      return {
        ok: false,
        modelos: [],
        mensaje: `No se pudo determinar la base URL de ${provider}.`,
      };
    }

    const urlModelos =
      provider === 'gemini'
        ? `${baseUrl.replace(/\/$/, '')}/models?key=${encodeURIComponent(apiKey)}`
        : `${baseUrl.replace(/\/$/, '')}/models`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    try {
      const headers: Record<string, string> = { Accept: 'application/json' };
      if (provider !== 'gemini') {
        headers.Authorization = `Bearer ${apiKey}`;
      }

      const respuesta = await fetch(urlModelos, {
        method: 'GET',
        headers,
        signal: controller.signal,
      });

      if (!respuesta.ok) {
        if (respuesta.status === 401 || respuesta.status === 403) {
          return {
            ok: false,
            modelos: [],
            mensaje: `API key inválida o sin permisos (HTTP ${respuesta.status}).`,
          };
        }
        return {
          ok: false,
          modelos: [],
          mensaje: `El provider ${provider} respondio HTTP ${respuesta.status}.`,
        };
      }

      const data = (await respuesta.json()) as Record<string, unknown>;
      const modelos = this.normalizarModelos(provider, data);

      if (modelos.length === 0) {
        return {
          ok: false,
          modelos: [],
          mensaje: `El provider ${provider} no devolvio modelos.`,
        };
      }

      return { ok: true, modelos };
    } catch (error) {
      const detalle = this.describirErrorFetch(error);
      return {
        ok: false,
        modelos: [],
        mensaje: `No se pudieron obtener los modelos de ${provider}: ${detalle}`,
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  private normalizarModelos(
    provider: ProveedorIa,
    data: Record<string, unknown>,
  ): Array<{ id: string; nombre?: string }> {
    const lista: unknown[] =
      provider === 'gemini'
        ? Array.isArray(data['models'])
          ? (data['models'] as unknown[])
          : []
        : Array.isArray(data['data'])
          ? (data['data'] as unknown[])
          : [];

    const normalizados: Array<{ id: string; nombre?: string }> = [];

    for (const item of lista) {
      if (!item || typeof item !== 'object') continue;
      const obj = item as Record<string, unknown>;

      if (provider === 'gemini') {
        const nombre = obj['name'];
        if (typeof nombre === 'string' && nombre.length > 0) {
          const id = nombre.startsWith('models/')
            ? nombre.slice('models/'.length)
            : nombre;
          const display = obj['displayName'];
          normalizados.push({
            id,
            nombre: typeof display === 'string' ? display : undefined,
          });
        }
        continue;
      }

      const id = obj['id'];
      if (typeof id === 'string' && id.length > 0) {
        const owned = obj['owned_by'];
        normalizados.push({
          id,
          nombre: typeof owned === 'string' ? owned : undefined,
        });
      }
    }

    return normalizados;
  }

  private describirErrorFetch(error: unknown): string {
    if (error instanceof Error) {
      if (error.name === 'AbortError') return 'timeout (8s)';
      return error.message;
    }
    return 'error desconocido';
  }

  private obtenerBaseUrlDefault(provider: ProveedorIa): string | undefined {
    const defaults: Record<ProveedorIa, string | undefined> = {
      opencode: 'https://opencode.ai/zen/v1',
      groq: 'https://api.groq.com/openai/v1',
      gemini: 'https://generativelanguage.googleapis.com/v1beta',
      openrouter: 'https://openrouter.ai/api/v1',
    };
    return defaults[provider];
  }

  private validarProvider(provider: string): asserts provider is ProveedorIa {
    if (!esProveedorIa(provider)) {
      throw new BadRequestError(
        `Provider IA inválido. Valores permitidos: ${PROVEEDORES_IA.join(', ')}`,
      );
    }
  }

  private mapearCache(entidad: IaConfiguracionOrmEntity): ConfiguracionIaCache {
    return {
      provider: entidad.provider,
      apiKeyEncrypted: entidad.apiKeyEncrypted,
      model: entidad.model,
      baseUrl: entidad.baseUrl,
      maxTokens: entidad.maxTokens,
      temperature: entidad.temperature ? Number(entidad.temperature) : null,
      timeoutMs: entidad.timeoutMs,
      habilitado: entidad.habilitado,
      orden: entidad.orden,
      actualizadoEn: entidad.actualizadoEn,
    };
  }

  private mapearResponse(
    configuracion: ConfiguracionIaCache,
  ): IaConfiguracionResponse {
    return {
      provider: configuracion.provider,
      apiKeyConfigurada: Boolean(configuracion.apiKeyEncrypted),
      model: configuracion.model,
      baseUrl: configuracion.baseUrl,
      maxTokens: configuracion.maxTokens,
      temperature: configuracion.temperature,
      timeoutMs: configuracion.timeoutMs,
      habilitado: configuracion.habilitado,
      orden: configuracion.orden,
      actualizadoEn: configuracion.actualizadoEn,
    };
  }

  private normalizarTextoNullable(valor: string | undefined): string | null {
    const normalizado = valor?.trim();
    return normalizado ? normalizado : null;
  }
}
