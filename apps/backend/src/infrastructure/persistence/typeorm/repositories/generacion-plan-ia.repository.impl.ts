import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  FindOptionsWhere,
  In,
  IsNull,
  QueryFailedError,
  Repository,
} from 'typeorm';
import type { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';

import { GeneracionPlanIaEntity } from 'src/domain/entities/GeneracionPlanIa/generacion-plan-ia.entity';
import {
  ActualizarGeneracionPlanIaInput,
  BuscarGeneracionActivaInput,
  CrearGeneracionPlanIaInput,
  ExpirarGeneracionesPlanIaVencidasGlobalInput,
  ExpirarGeneracionesPlanIaVencidasInput,
  GeneracionPlanIaRepository,
} from 'src/domain/repositories/generacion-plan-ia.repository';

import { GeneracionPlanIaOrmEntity } from '../entities/generacion-plan-ia.entity';

const ESTADOS_ACTIVOS = ['PENDIENTE', 'GENERANDO'] as const;
const CANTIDAD_MAXIMA_INTENTOS_DEADLOCK = 3;
const ESPERA_BASE_DEADLOCK_MS = 50;

type CambiosGeneracionPlanIa = QueryDeepPartialEntity<GeneracionPlanIaOrmEntity>;

@Injectable()
export class GeneracionPlanIaRepositoryImpl
  implements GeneracionPlanIaRepository
{
  constructor(
    @InjectRepository(GeneracionPlanIaOrmEntity)
    private readonly repo: Repository<GeneracionPlanIaOrmEntity>,
  ) {}

  async crear(
    input: CrearGeneracionPlanIaInput,
  ): Promise<GeneracionPlanIaEntity> {
    const orm = this.repo.create({
      socioId: input.socioId,
      nutricionistaId: input.nutricionistaId,
      gimnasioId: input.gimnasioId,
      planAlimentacionId: input.planAlimentacionId,
      estado: 'PENDIENTE',
      solicitudJson: input.solicitudJson,
      proveedorActual: null,
      mensajeEstado: input.mensajeEstado ?? 'Generación en cola',
      errorMensaje: null,
      respuestaJson: null,
      progresoActual: null,
      progresoTotal: null,
      diaActual: null,
      comidaActual: null,
      snapshotParcialJson: null,
      iniciadoEn: null,
      finalizadoEn: null,
    });

    return this.toDomain(await this.repo.save(orm));
  }

  async obtenerPorId(id: number): Promise<GeneracionPlanIaEntity | null> {
    const orm = await this.repo.findOne({
      where: { idGeneracionPlanIa: id },
    });
    return orm ? this.toDomain(orm) : null;
  }

  async obtenerActiva(
    input: BuscarGeneracionActivaInput,
  ): Promise<GeneracionPlanIaEntity | null> {
    const estado = In([...ESTADOS_ACTIVOS]);
    const base = {
      socioId: input.socioId,
      gimnasioId: input.gimnasioId,
      estado,
    } satisfies FindOptionsWhere<GeneracionPlanIaOrmEntity>;

    const where: FindOptionsWhere<GeneracionPlanIaOrmEntity>[] =
      typeof input.planAlimentacionId === 'number'
        ? [
            { ...base, planAlimentacionId: input.planAlimentacionId },
            { ...base, planAlimentacionId: IsNull() },
          ]
        : [base];

    const orm = await this.repo.findOne({
      where,
      order: { creadoEn: 'DESC' },
    });

    return orm ? this.toDomain(orm) : null;
  }

  async expirarActivasVencidas(
    input: ExpirarGeneracionesPlanIaVencidasInput,
  ): Promise<number> {
    const query = this.repo
      .createQueryBuilder()
      .update(GeneracionPlanIaOrmEntity)
      .set({
        estado: 'ERROR',
        mensajeEstado: input.mensajeEstado,
        errorMensaje: input.errorMensaje,
        finalizadoEn: input.finalizadoEn,
      })
      .where('id_socio = :socioId', { socioId: input.socioId })
      .andWhere('id_gimnasio = :gimnasioId', {
        gimnasioId: input.gimnasioId,
      })
      .andWhere('estado IN (:...estadosActivos)', {
        estadosActivos: [...ESTADOS_ACTIVOS],
      })
      .andWhere(
        `(
          (estado = :estadoPendiente AND creado_en < :fechaCorte)
          OR
          (estado = :estadoGenerando AND COALESCE(iniciado_en, actualizado_en, creado_en) < :fechaCorte)
        )`,
        {
          estadoPendiente: 'PENDIENTE',
          estadoGenerando: 'GENERANDO',
          fechaCorte: input.fechaCorte,
        },
      );

    if (typeof input.planAlimentacionId === 'number') {
      query.andWhere(
        '(id_plan_alimentacion = :planAlimentacionId OR id_plan_alimentacion IS NULL)',
        { planAlimentacionId: input.planAlimentacionId },
      );
    }

    const resultado = await this.ejecutarConReintentosDeadlock(() =>
      query.execute(),
    );
    return resultado.affected ?? 0;
  }

  async expirarActivasVencidasGlobal(
    input: ExpirarGeneracionesPlanIaVencidasGlobalInput,
  ): Promise<number> {
    const resultado = await this.ejecutarConReintentosDeadlock(() =>
      this.repo
        .createQueryBuilder()
        .update(GeneracionPlanIaOrmEntity)
        .set({
          estado: 'ERROR',
          mensajeEstado: input.mensajeEstado,
          errorMensaje: input.errorMensaje,
          finalizadoEn: input.finalizadoEn,
        })
        .where('estado IN (:...estadosActivos)', {
          estadosActivos: [...ESTADOS_ACTIVOS],
        })
        .andWhere(
          `(
            (estado = :estadoPendiente AND creado_en < :fechaCorte)
            OR
            (estado = :estadoGenerando AND COALESCE(iniciado_en, actualizado_en, creado_en) < :fechaCorte)
          )`,
          {
            estadoPendiente: 'PENDIENTE',
            estadoGenerando: 'GENERANDO',
            fechaCorte: input.fechaCorte,
          },
        )
        .execute(),
    );

    return resultado.affected ?? 0;
  }

  async actualizarSiActiva(
    id: number,
    input: ActualizarGeneracionPlanIaInput,
  ): Promise<GeneracionPlanIaEntity | null> {
    const resultado = await this.ejecutarConReintentosDeadlock(() =>
      this.repo
        .createQueryBuilder()
        .update(GeneracionPlanIaOrmEntity)
        .set(this.crearCambiosActualizacion(input))
        .where('id_generacion_plan_ia = :id', { id })
        .andWhere('estado IN (:...estadosActivos)', {
          estadosActivos: [...ESTADOS_ACTIVOS],
        })
        .execute(),
    );

    if (!resultado.affected) {
      return null;
    }

    return this.obtenerPorId(id);
  }

  async actualizar(
    id: number,
    input: ActualizarGeneracionPlanIaInput,
  ): Promise<GeneracionPlanIaEntity> {
    const orm = await this.repo.findOne({ where: { idGeneracionPlanIa: id } });
    if (!orm) {
      throw new Error(`Generación IA ${id} no encontrada después de actualizar`);
    }

    orm.estado = input.estado;

    if (input.proveedorActual !== undefined) {
      orm.proveedorActual = input.proveedorActual;
    }
    if (input.mensajeEstado !== undefined) {
      orm.mensajeEstado = input.mensajeEstado;
    }
    if (input.errorMensaje !== undefined) {
      orm.errorMensaje = input.errorMensaje;
    }
    if (input.respuestaJson !== undefined) {
      orm.respuestaJson = input.respuestaJson;
    }
    if (input.planAlimentacionId !== undefined) {
      orm.planAlimentacionId = input.planAlimentacionId;
    }
    if (input.iniciadoEn !== undefined) {
      orm.iniciadoEn = input.iniciadoEn;
    }
    if (input.finalizadoEn !== undefined) {
      orm.finalizadoEn = input.finalizadoEn;
    }
    if (input.progresoActual !== undefined) {
      orm.progresoActual = input.progresoActual;
    }
    if (input.progresoTotal !== undefined) {
      orm.progresoTotal = input.progresoTotal;
    }
    if (input.diaActual !== undefined) {
      orm.diaActual = input.diaActual;
    }
    if (input.comidaActual !== undefined) {
      orm.comidaActual = input.comidaActual;
    }
    if (input.snapshotParcialJson !== undefined) {
      orm.snapshotParcialJson = input.snapshotParcialJson;
    }

    return this.toDomain(await this.repo.save(orm));
  }

  private crearCambiosActualizacion(
    input: ActualizarGeneracionPlanIaInput,
  ): CambiosGeneracionPlanIa {
    const cambios: CambiosGeneracionPlanIa = {
      estado: input.estado,
    };

    if (input.proveedorActual !== undefined) {
      cambios.proveedorActual = input.proveedorActual;
    }
    if (input.mensajeEstado !== undefined) {
      cambios.mensajeEstado = input.mensajeEstado;
    }
    if (input.errorMensaje !== undefined) {
      cambios.errorMensaje = input.errorMensaje;
    }
    if (input.respuestaJson !== undefined) {
      cambios.respuestaJson =
        input.respuestaJson === null
          ? () => 'NULL'
          : (input.respuestaJson as CambiosGeneracionPlanIa['respuestaJson']);
    }
    if (input.planAlimentacionId !== undefined) {
      cambios.planAlimentacionId = input.planAlimentacionId;
    }
    if (input.iniciadoEn !== undefined) {
      cambios.iniciadoEn = input.iniciadoEn;
    }
    if (input.finalizadoEn !== undefined) {
      cambios.finalizadoEn = input.finalizadoEn;
    }
    if (input.progresoActual !== undefined) {
      cambios.progresoActual = input.progresoActual;
    }
    if (input.progresoTotal !== undefined) {
      cambios.progresoTotal = input.progresoTotal;
    }
    if (input.diaActual !== undefined) {
      cambios.diaActual = input.diaActual;
    }
    if (input.comidaActual !== undefined) {
      cambios.comidaActual = input.comidaActual;
    }
    if (input.snapshotParcialJson !== undefined) {
      cambios.snapshotParcialJson =
        input.snapshotParcialJson === null
          ? () => 'NULL'
          : (input.snapshotParcialJson as CambiosGeneracionPlanIa['snapshotParcialJson']);
    }

    return cambios;
  }

  private async ejecutarConReintentosDeadlock<T>(
    operacion: () => Promise<T>,
  ): Promise<T> {
    for (
      let intento = 1;
      intento <= CANTIDAD_MAXIMA_INTENTOS_DEADLOCK;
      intento++
    ) {
      try {
        return await operacion();
      } catch (error) {
        const puedeReintentar =
          this.esDeadlockMysql(error) &&
          intento < CANTIDAD_MAXIMA_INTENTOS_DEADLOCK;

        if (!puedeReintentar) {
          throw error;
        }

        await this.dormir(ESPERA_BASE_DEADLOCK_MS * intento);
      }
    }

    throw new Error('No se pudo ejecutar la operación sobre generación IA');
  }

  private esDeadlockMysql(error: unknown): boolean {
    if (!(error instanceof QueryFailedError)) {
      return false;
    }

    const driverError: unknown = error.driverError;
    if (!driverError || typeof driverError !== 'object') {
      return false;
    }

    const detalle = driverError as Record<string, unknown>;
    return (
      detalle.code === 'ER_LOCK_DEADLOCK' ||
      detalle.errno === 1213 ||
      detalle.sqlState === '40001'
    );
  }

  private async dormir(ms: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }

  private toDomain(orm: GeneracionPlanIaOrmEntity): GeneracionPlanIaEntity {
    return new GeneracionPlanIaEntity(
      orm.idGeneracionPlanIa,
      orm.socioId,
      orm.nutricionistaId,
      orm.gimnasioId,
      orm.planAlimentacionId,
      orm.estado,
      orm.solicitudJson,
      orm.proveedorActual,
      orm.mensajeEstado,
      orm.errorMensaje,
      orm.respuestaJson,
      orm.creadoEn,
      orm.actualizadoEn,
      orm.iniciadoEn,
      orm.finalizadoEn,
      orm.progresoActual,
      orm.progresoTotal,
      orm.diaActual,
      orm.comidaActual,
      orm.snapshotParcialJson,
    );
  }
}
