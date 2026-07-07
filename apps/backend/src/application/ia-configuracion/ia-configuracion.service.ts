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
