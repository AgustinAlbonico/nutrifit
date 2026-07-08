import { Inject, Injectable } from '@nestjs/common';

import type { GeneracionPlanIaEntity } from 'src/domain/entities/GeneracionPlanIa/generacion-plan-ia.entity';
import {
  GENERACION_PLAN_IA_REPOSITORY,
  GeneracionPlanIaRepository,
} from 'src/domain/repositories/generacion-plan-ia.repository';
import {
  APP_LOGGER_SERVICE,
  IAppLoggerService,
} from 'src/domain/services/logger.service';

import {
  GenerarPlanSemanalUseCase,
  type ProgresoGeneracionPlanIa,
  type SolicitudPlanSemanal,
} from './generar-plan-semanal.use-case';

@Injectable()
export class EjecutarGeneracionPlanSemanalBackgroundService {
  constructor(
    @Inject(GENERACION_PLAN_IA_REPOSITORY)
    private readonly generacionRepo: GeneracionPlanIaRepository,
    private readonly generarPlanSemanalUseCase: GenerarPlanSemanalUseCase,
    @Inject(APP_LOGGER_SERVICE)
    private readonly logger: IAppLoggerService,
  ) {}

  async ejecutar(generacionId: number): Promise<void> {
    try {
      const generacion = await this.generacionRepo.obtenerPorId(generacionId);
      if (!generacion?.estaActiva()) {
        return;
      }

      const generacionEnEjecucion = await this.generacionRepo.actualizarSiActiva(
        generacion.id,
        {
          estado: 'GENERANDO',
          mensajeEstado: 'Generando plan con IA',
          proveedorActual: 'automático',
          iniciadoEn: new Date(),
        },
      );

      if (!generacionEnEjecucion) {
        return;
      }

      const solicitud = this.construirSolicitud(generacionEnEjecucion);
      const respuesta = await this.generarPlanSemanalUseCase.execute(solicitud, {
        onProgreso: async (progreso) => {
          await this.persistirProgreso(generacion.id, progreso);
        },
      });

      await this.generacionRepo.actualizarSiActiva(generacion.id, {
        estado: 'COMPLETADO',
        mensajeEstado: 'Plan generado correctamente',
        respuestaJson: respuesta,
        planAlimentacionId: respuesta.planAlimentacionId,
        finalizadoEn: new Date(),
      });
    } catch (error) {
      await this.marcarErrorSiActiva(generacionId, error);
    }
  }

  private async persistirProgreso(
    generacionId: number,
    progreso: ProgresoGeneracionPlanIa,
  ): Promise<void> {
    const generacionActualizada = await this.generacionRepo.actualizarSiActiva(
      generacionId,
      {
        estado: 'GENERANDO',
        mensajeEstado: this.crearMensajeProgreso(progreso),
        progresoActual: progreso.comidasGeneradas,
        progresoTotal: progreso.comidasTotales,
        diaActual: progreso.dia,
        comidaActual: progreso.tipoComida,
        snapshotParcialJson: progreso.snapshotParcial,
      },
    );

    if (!generacionActualizada) {
      throw new Error('La generación IA ya no está activa');
    }
  }

  private crearMensajeProgreso(progreso: ProgresoGeneracionPlanIa): string {
    return `Generando ${progreso.dia} / ${progreso.tipoComida} (${progreso.comidasGeneradas}/${progreso.comidasTotales})`;
  }

  private async marcarErrorSiActiva(
    generacionId: number,
    error: unknown,
  ): Promise<void> {
    const mensaje = this.obtenerMensajeError(error);

    try {
      const generacionError = await this.generacionRepo.actualizarSiActiva(
        generacionId,
        {
          estado: 'ERROR',
          mensajeEstado: 'La generación falló',
          errorMensaje: mensaje,
          finalizadoEn: new Date(),
        },
      );

      if (!generacionError) {
        return;
      }
    } catch (errorPersistencia) {
      this.logger.error(
        `Error persistiendo fallo de generación IA ${generacionId}: ${this.obtenerMensajeError(
          errorPersistencia,
        )}`,
        this.obtenerStackError(errorPersistencia),
      );
    }

    this.logger.error(
      `Error ejecutando generación IA ${generacionId}: ${mensaje}`,
      this.obtenerStackError(error),
    );
  }

  private obtenerMensajeError(error: unknown): string {
    return error instanceof Error
      ? error.message
      : 'No se pudo generar el plan con IA';
  }

  private obtenerStackError(error: unknown): string | undefined {
    return error instanceof Error ? error.stack : undefined;
  }

  private construirSolicitud(
    generacion: GeneracionPlanIaEntity,
  ): SolicitudPlanSemanal {
    const data = this.leerObjeto(generacion.solicitudJson);

    return {
      socioId: this.leerNumero(data, 'socioId'),
      nutricionistaId: this.leerNumero(data, 'nutricionistaId'),
      gimnasioId: this.leerNumero(data, 'gimnasioId'),
      diasAGenerar: this.leerNumeroOpcional(data, 'diasAGenerar'),
      comidasPorDia: this.leerNumeroOpcional(data, 'comidasPorDia'),
      alternativasPorComida: this.leerNumeroOpcional(
        data,
        'alternativasPorComida',
      ),
      notasGeneracion: this.leerTextoOpcional(data, 'notasGeneracion'),
      fechaInicio: this.leerFechaOpcional(data, 'fechaInicio'),
      caloriasLimite: this.leerNumeroOpcional(data, 'caloriasLimite'),
      proteinasEstimadas: this.leerNumeroOpcional(data, 'proteinasEstimadas'),
      carbohidratosEstimados: this.leerNumeroOpcional(
        data,
        'carbohidratosEstimados',
      ),
      grasasEstimados: this.leerNumeroOpcional(data, 'grasasEstimados'),
      alimentosPreferidos: this.leerTextosOpcional(data, 'alimentosPreferidos'),
      alimentosEvitados: this.leerTextosOpcional(data, 'alimentosEvitados'),
    };
  }

  private leerObjeto(value: unknown): Record<string, unknown> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      throw new Error('La solicitud persistida de generación IA es inválida');
    }

    return value as Record<string, unknown>;
  }

  private leerNumero(data: Record<string, unknown>, key: string): number {
    const value = data[key];
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      throw new Error(`La solicitud persistida no incluye ${key} válido`);
    }

    return value;
  }

  private leerNumeroOpcional(
    data: Record<string, unknown>,
    key: string,
  ): number | undefined {
    const value = data[key];
    if (value === undefined || value === null) {
      return undefined;
    }

    if (typeof value !== 'number' || !Number.isFinite(value)) {
      throw new Error(`La solicitud persistida no incluye ${key} válido`);
    }

    return value;
  }

  private leerTextoOpcional(
    data: Record<string, unknown>,
    key: string,
  ): string | undefined {
    const value = data[key];
    if (value === undefined || value === null) {
      return undefined;
    }

    if (typeof value !== 'string') {
      throw new Error(`La solicitud persistida no incluye ${key} válido`);
    }

    return value;
  }

  private leerFechaOpcional(
    data: Record<string, unknown>,
    key: string,
  ): Date | undefined {
    const value = data[key];
    if (value === undefined || value === null) {
      return undefined;
    }

    if (value instanceof Date) {
      return value;
    }

    if (typeof value === 'string') {
      const fecha = new Date(value);
      if (!Number.isNaN(fecha.getTime())) {
        return fecha;
      }
    }

    throw new Error(`La solicitud persistida no incluye ${key} válido`);
  }

  private leerTextosOpcional(
    data: Record<string, unknown>,
    key: string,
  ): string[] | undefined {
    const value = data[key];
    if (value === undefined || value === null) {
      return undefined;
    }

    if (!Array.isArray(value) || !value.every((item) => typeof item === 'string')) {
      throw new Error(`La solicitud persistida no incluye ${key} válido`);
    }

    return value;
  }
}
