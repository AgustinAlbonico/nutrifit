import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseUseCase } from 'src/application/shared/use-case.base';
import { NotFoundError } from 'src/domain/exceptions/custom-exceptions';
import { Repository } from 'typeorm';
import {
  PlanAlimentacionOrmEntity,
  SocioOrmEntity,
} from 'src/infrastructure/persistence/typeorm/entities';
import {
  PLAN_ALIMENTACION_VERSION_REPOSITORY,
  PlanAlimentacionVersionRepository,
} from 'src/domain/repositories/plan-alimentacion-version.repository';
import { TenantContextService } from 'src/infrastructure/auth/tenant-context.service';
import type { PlanAlimentacionDatosJson } from 'src/domain/entities/PlanAlimentacionVersion/plan-alimentacion-datos-json';
import { formatArgentinaDate } from 'src/common/utils/argentina-datetime.util';

/**
 * PlanSocioActivoDTO — DTO que devuelve el endpoint
 * `GET /planes-alimentacion/socio/:socioId/activo`.
 *
 * Un socio puede tener planes activos con varios nutricionistas (RF-010),
 * por lo que la respuesta es SIEMPRE un array (vacío si no hay planes
 * activos). Esto refleja el shape que consume `MiPlanPage.tsx` en el
 * frontend para renderizar N cards, una por nutricionista.
 *
 * Hotfix Packet 8 (plan-alimentacion-ia-v2): antes el endpoint
 * devolvía `PlanAlimentacionResponseDto | null` (DTO legacy, un solo
 * plan). Ahora devuelve `PlanSocioActivoDTO[]`.
 *
 * Solo se incluyen planes con:
 *   - `activo = true`
 *   - `estado = 'ACTIVO'`
 *   - al menos 1 versión con `activa = true`
 */
export interface PlanSocioActivoDTO {
  /** `plan_alimentacion.id_plan_alimentacion`. */
  idPlanAlimentacion: number;
  /** `plan_alimentacion_version.id_plan_alimentacion_version` (la activa). */
  versionId: number;
  /** Número de versión (1, 2, 3...). */
  numeroVersion: number;
  /** Nutricionista dueño del plan. */
  nutricionistaId: number;
  /** Nombre completo del nutricionista (`nombre apellido`). */
  nutricionistaNombre: string;
  /** Fecha de creación / activación del plan (ISO 8601). */
  fechaInicio: string;
  /** Snapshot V2 del plan (estructura + macros + razonamiento). */
  plan: PlanAlimentacionDatosJson;
  /** Objetivo nutricional textual del plan. */
  objetivoNutricional: string;
  /** Metadata de validación más reciente (restricciones + macros). */
  validacion: {
    restriccionesCumplidas: number;
    restriccionesNoCumplidas: number;
    bandaGlobal: 'VERDE' | 'AMARILLO' | 'ROJO';
  };
}

/**
 * ListarPlanesActivosSocioUseCase — Hotfix Packet 8
 * ==================================================
 *
 * Retorna TODOS los planes activos del socio (uno por nutricionista).
 *
 * Cada elemento es un `PlanSocioActivoDTO` que contiene:
 *   - Datos del plan (id, objetivo, fecha).
 *   - Datos del nutricionista dueño.
 *   - Versión activa del plan (snapshot V2).
 *   - Metadata de validación reciente.
 *
 * Casos:
 *   - 0 planes activos → `[]`.
 *   - 1 plan activo (1 NUT) → array de 1 elemento.
 *   - N planes activos (N NUTs) → array de N elementos.
 *
 * Multi-tenant: filtra por `tenantContext.gimnasioId`.
 *
 * Errores:
 *   - 404 `NotFoundError('Socio', id)` si el socio no existe o no
 *     pertenece al gimnasio del contexto.
 */
@Injectable()
export class ListarPlanesActivosSocioUseCase implements BaseUseCase {
  constructor(
    @InjectRepository(PlanAlimentacionOrmEntity)
    private readonly planRepo: Repository<PlanAlimentacionOrmEntity>,
    @InjectRepository(SocioOrmEntity)
    private readonly socioRepo: Repository<SocioOrmEntity>,
    @Inject(PLAN_ALIMENTACION_VERSION_REPOSITORY)
    private readonly planVersionRepo: PlanAlimentacionVersionRepository,
    private readonly tenantContext: TenantContextService,
  ) {}

  async execute(socioId: number): Promise<PlanSocioActivoDTO[]> {
    // 1) Validar que el socio existe y pertenece al gimnasio
    const socio = await this.socioRepo.findOne({
      where: {
        idPersona: socioId,
        gimnasioId: this.tenantContext.gimnasioId,
      },
    });
    if (!socio) {
      throw new NotFoundError('Socio', String(socioId));
    }

    // 2) Buscar planes activos (activo=true, estado='ACTIVO')
    const planesActivos = await this.planRepo.find({
      where: {
        socio: {
          idPersona: socioId,
          gimnasioId: this.tenantContext.gimnasioId,
        },
        activo: true,
        estado: 'ACTIVO',
      },
      relations: { nutricionista: true },
      order: { fechaCreacion: 'DESC' },
    });

    if (planesActivos.length === 0) {
      return [];
    }

    // 3) Para cada plan, obtener la versión activa
    const resultado: PlanSocioActivoDTO[] = [];
    for (const plan of planesActivos) {
      const versionActiva =
        await this.planVersionRepo.obtenerActiva(plan.idPlanAlimentacion);
      if (!versionActiva) {
        // Plan marcado como activo pero sin versión activa: lo salteamos
        // (no debería pasar, pero es defensa en profundidad).
        continue;
      }

      const nutri = plan.nutricionista as unknown as {
        idPersona: number | null;
        nombre: string;
        apellido: string;
      };

      const datosJson = versionActiva.datosJson;

      resultado.push({
        idPlanAlimentacion: plan.idPlanAlimentacion,
        versionId: versionActiva.idPlanAlimentacionVersion,
        numeroVersion: versionActiva.numeroVersion,
        nutricionistaId: nutri?.idPersona ?? 0,
        nutricionistaNombre: `${nutri?.nombre ?? ''} ${
          nutri?.apellido ?? ''
        }`.trim(),
        fechaInicio: formatArgentinaDate(plan.fechaCreacion),
        plan: datosJson,
        objetivoNutricional: plan.objetivoNutricional,
        validacion: {
          restriccionesCumplidas:
            datosJson?.razonamientoCumplimiento?.restriccionesCumplidas
              ?.length ?? 0,
          restriccionesNoCumplidas:
            datosJson?.razonamientoCumplimiento?.restriccionesNoCumplidas
              ?.length ?? 0,
          bandaGlobal: this.calcularBandaGlobal(datosJson),
        },
      });
    }

    return resultado;
  }

  /**
   * Calcula la banda global de desvío de macros a partir del snapshot
   * persistido. Si no hay info, devuelve 'VERDE' (default conservador).
   *
   * Esta es una vista resumida para el frontend — la validación
   * detallada la hace `MacrosValidator` cuando el NUT activa una
   * versión nueva.
   *
   * Heurística: comparamos `calorias` real vs target 2000 kcal/día.
   *   - desvío > 10% → ROJO
   *   - desvío > 5%  → AMARILLO
   *   - resto        → VERDE
   *
   * El backend `ResumenMacrosDia` no persiste `desvioPorcentaje` (solo
   * macros crudos). Por eso recalculamos acá con la heurística
   * consistente con `calcularObjetivoMacros(2000 kcal)` del
   * use-case de generación.
   */
  private calcularBandaGlobal(
    datosJson: PlanAlimentacionDatosJson | null | undefined,
  ): 'VERDE' | 'AMARILLO' | 'ROJO' {
    const TARGET_CALORIAS = 2000;
    if (!datosJson?.macrosPorDia) {
      return 'VERDE';
    }
    const dias = Object.values(datosJson.macrosPorDia);
    if (dias.length === 0) {
      return 'VERDE';
    }
    const desvios = dias
      .map((d) => {
        const real = d.calorias ?? 0;
        if (real === 0) return 0;
        return Math.abs(((real - TARGET_CALORIAS) / TARGET_CALORIAS) * 100);
      })
      .filter((d) => Number.isFinite(d));
    if (desvios.length === 0) {
      return 'VERDE';
    }
    const promedio = desvios.reduce((a, b) => a + b, 0) / desvios.length;
    if (promedio > 10) return 'ROJO';
    if (promedio > 5) return 'AMARILLO';
    return 'VERDE';
  }
}