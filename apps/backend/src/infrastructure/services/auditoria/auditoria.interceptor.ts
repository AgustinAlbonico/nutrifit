import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { Observable, tap } from 'rxjs';

import type { UsuarioAutenticadoPayload } from 'src/infrastructure/auth/decorators/current-user.decorator';
import { extraerOrigenRequest } from 'src/infrastructure/common/http/request-origin.helper';
import { AccionAuditoria } from 'src/infrastructure/persistence/typeorm/entities/auditoria.entity';
import { AuditoriaService } from './auditoria.service';
import { AuditoriaEntityRegistry } from './auditoria-entity.registry';
import { AUDITORIA_METADATA_KEY, AuditOptions } from './auditoria.decorator';

interface RequestAuditada extends Request {
  user?: UsuarioAutenticadoPayload;
}

@Injectable()
export class AuditoriaInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly auditoriaService: AuditoriaService,
    private readonly entityRegistry: AuditoriaEntityRegistry,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<unknown>> {
    const opciones = this.reflector.getAllAndOverride<AuditOptions>(
      AUDITORIA_METADATA_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!opciones) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<RequestAuditada>();
    const entidad = opciones.entidad ?? 'Turno';
    const entidadIdInicial = this.resolverEntidadId(request, opciones);
    const valoresAntes = await this.cargarSnapshotAntes(
      opciones.accion,
      entidad,
      entidadIdInicial,
    );

    return next.handle().pipe(
      tap((respuesta: unknown) => {
        void this.registrarAuditoria(
          request,
          opciones,
          entidad,
          entidadIdInicial,
          valoresAntes,
          respuesta,
        );
      }),
    );
  }

  private async registrarAuditoria(
    request: RequestAuditada,
    opciones: AuditOptions,
    entidad: string,
    entidadIdInicial: number | string | null,
    valoresAntes: Record<string, unknown> | null,
    respuesta: unknown,
  ): Promise<void> {
    const entidadId =
      entidadIdInicial ?? this.extraerEntidadIdDeRespuesta(respuesta);
    const valoresDespues = await this.entityRegistry.cargar(entidad, entidadId);
    const origen = extraerOrigenRequest(request);

    await this.auditoriaService.registrar({
      gimnasioId: request.user?.gimnasioId ?? null,
      usuarioId: request.user?.id ?? null,
      modulo: opciones.modulo,
      entidad,
      entidadId,
      accion: opciones.accion,
      tipoAccion: opciones.tipoAccion,
      descripcion: opciones.descripcion,
      valoresAntes,
      valoresDespues,
      ip: origen.ip,
      userAgent: origen.userAgent,
      camposSensibles: opciones.camposSensibles,
    });
  }

  private async cargarSnapshotAntes(
    accion: string,
    entidad: string,
    entidadId: number | string | null,
  ): Promise<Record<string, unknown> | null> {
    if (accion === AccionAuditoria.CREATE || accion === 'CREATE') {
      return null;
    }

    return this.entityRegistry.cargar(entidad, entidadId);
  }

  private resolverEntidadId(
    request: Request,
    opciones: AuditOptions,
  ): number | string | null {
    const nombreParam = opciones.entidadIdParam ?? 'id';
    const valor = request.params[nombreParam] ?? request.params.turnoId;
    return typeof valor === 'string' || typeof valor === 'number'
      ? valor
      : null;
  }

  private extraerEntidadIdDeRespuesta(
    respuesta: unknown,
  ): number | string | null {
    if (!respuesta || typeof respuesta !== 'object') {
      return null;
    }

    const registro = respuesta as Record<string, unknown>;
    const valor = registro.idTurno ?? registro.id ?? null;
    return typeof valor === 'number' || typeof valor === 'string'
      ? valor
      : null;
  }
}
