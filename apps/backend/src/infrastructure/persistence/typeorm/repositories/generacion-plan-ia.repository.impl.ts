import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, In, IsNull, Repository } from 'typeorm';

import { GeneracionPlanIaEntity } from 'src/domain/entities/GeneracionPlanIa/generacion-plan-ia.entity';
import {
  ActualizarGeneracionPlanIaInput,
  BuscarGeneracionActivaInput,
  CrearGeneracionPlanIaInput,
  GeneracionPlanIaRepository,
} from 'src/domain/repositories/generacion-plan-ia.repository';

import { GeneracionPlanIaOrmEntity } from '../entities/generacion-plan-ia.entity';

const ESTADOS_ACTIVOS = ['PENDIENTE', 'GENERANDO'] as const;

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

    return this.toDomain(await this.repo.save(orm));
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
    );
  }
}
