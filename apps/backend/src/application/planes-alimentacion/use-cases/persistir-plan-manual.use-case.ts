/**
 * PersistirPlanManualUseCase
 * ============================
 *
 * Persiste el draft manual de un plan (editado slot por slot en el frontend)
 * como una NUEVA versión inmutable V2 con `motivoCambio='edicion_manual'`.
 *
 * Arquitectura V2:
 *  - Las versiones son inmutables. Cada cambio produce una nueva fila.
 *  - El flag `activa` designa cuál es la "visible" para el socio en MiPlan.
 *  - `dias` (en PlanAlimentacion) se mantiene sincronizado con la versión
 *    activa para legibilidad (los días reales viven en PlanAlimentacionVersion).
 *
 * Flujo:
 *  1. Validar plan existe, activo, NUT dueño (o ADMIN del gimnasio).
 *  2. Validar alimentos existen y restricciones.
 *  3. Construir `datosJson` con la estructura del frontend.
 *  4. Calcular `numeroVersion` = max(existente) + 1.
 *  5. Crear nueva versión via `planVersionRepo.crear({...})` con activa=true.
 *  6. Marcar anteriores como activa=false (transaccional).
 *  7. (Opcional) Sincronizar `dias` del plan con la nueva estructura.
 *  8. Auditar PLAN_EDITADO (tolerante a fallos).
 *
 * NO usar como V1: si no hay versiones previas, motivoCambio='creacion_inicial'.
 */

import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { BaseUseCase } from 'src/application/shared/use-case.base';
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from 'src/domain/exceptions/custom-exceptions';
import { Rol } from 'src/domain/entities/Usuario/Rol';
import { UsuarioOrmEntity } from 'src/infrastructure/persistence/typeorm/entities';
import {
  AlimentoOrmEntity,
  DiaPlanOrmEntity,
  ItemComidaOrmEntity,
  NutricionistaOrmEntity,
  OpcionComidaOrmEntity,
  PlanAlimentacionOrmEntity,
  SocioOrmEntity,
} from 'src/infrastructure/persistence/typeorm/entities';
import { AuditoriaService } from 'src/infrastructure/services/auditoria/auditoria.service';
import { AccionAuditoria } from 'src/infrastructure/persistence/typeorm/entities/auditoria.entity';
import { NotificacionesService } from 'src/application/notificaciones/notificaciones.service';
import { TipoNotificacion } from 'src/domain/entities/Notificacion/tipo-notificacion.enum';
import {
  formatearIncidenciasRestriccion,
  RestriccionesValidator,
} from 'src/application/restricciones/restricciones-validator.service';
import { TenantContextService } from 'src/infrastructure/auth/tenant-context.service';
import {
  PLAN_ALIMENTACION_VERSION_REPOSITORY,
  PlanAlimentacionVersionRepository,
} from 'src/domain/repositories/plan-alimentacion-version.repository';
import { PlanAlimentacionDatosJson } from 'src/domain/entities/PlanAlimentacionVersion/plan-alimentacion-datos-json';
import {
  APP_LOGGER_SERVICE,
  IAppLoggerService,
} from 'src/domain/services/logger.service';
import { PlanAlimentacionResponseDto } from '../dtos';
import { mapPlanToResponse } from './plan-alimentacion.mapper';
import { PersistirPlanManualDto } from '../dtos/persistir-plan-manual.dto';

@Injectable()
export class PersistirPlanManualUseCase implements BaseUseCase {
  constructor(
    @InjectRepository(PlanAlimentacionOrmEntity)
    private readonly planRepo: Repository<PlanAlimentacionOrmEntity>,
    @InjectRepository(DiaPlanOrmEntity)
    private readonly diaRepo: Repository<DiaPlanOrmEntity>,
    @InjectRepository(OpcionComidaOrmEntity)
    private readonly opcionRepo: Repository<OpcionComidaOrmEntity>,
    @InjectRepository(AlimentoOrmEntity)
    private readonly alimentoRepo: Repository<AlimentoOrmEntity>,
    @InjectRepository(SocioOrmEntity)
    private readonly socioRepo: Repository<SocioOrmEntity>,
    @InjectRepository(NutricionistaOrmEntity)
    private readonly nutricionistaRepo: Repository<NutricionistaOrmEntity>,
    @InjectRepository(UsuarioOrmEntity)
    private readonly usuarioRepo: Repository<UsuarioOrmEntity>,
    @Inject(PLAN_ALIMENTACION_VERSION_REPOSITORY)
    private readonly planVersionRepo: PlanAlimentacionVersionRepository,
    private readonly dataSource: DataSource,
    private readonly auditoriaService: AuditoriaService,
    private readonly notificacionesService: NotificacionesService,
    private readonly restriccionesValidator: RestriccionesValidator,
    private readonly tenantContext: TenantContextService,
    @Inject(APP_LOGGER_SERVICE)
    private readonly logger: IAppLoggerService,
  ) {}

  async execute(
    userId: number,
    userRol: string,
    planId: number,
    payload: PersistirPlanManualDto,
  ): Promise<PlanAlimentacionResponseDto> {
    // 1) Validar plan
    const plan = await this.planRepo.findOne({
      where: { idPlanAlimentacion: planId },
      relations: { nutricionista: true, socio: true },
    });
    if (!plan) {
      throw new NotFoundError('Plan de alimentación', String(planId));
    }
    if (!plan.activo) {
      throw new BadRequestError(
        'El plan no está activo. No se puede editar.',
      );
    }

    // 2) Auth: NUT dueño o ADMIN del gimnasio
    const esDueno =
      (plan.nutricionista as unknown as { idPersona: number | null })
        ?.idPersona === userId;
    const esAdmin = userRol === Rol.ADMIN;
    if (!esDueno && !esAdmin) {
      throw new ForbiddenError(
        'Solo el nutricionista responsable del plan puede editarlo.',
      );
    }

    // 3) Validar días y opciones no vacíos
    if (payload.dias.length === 0) {
      throw new BadRequestError(
        'El plan debe tener al menos un día configurado.',
      );
    }
    const totalAlternativas = payload.dias.reduce(
      (acc, d) => acc + d.comidas.reduce((a, c) => a + c.alternativas.length, 0),
      0,
    );
    if (totalAlternativas === 0) {
      throw new BadRequestError(
        'El plan debe tener al menos una alternativa en total.',
      );
    }

    // 4) Validar alimentos existen
    const todosAlimentosIds = [
      ...new Set(
        payload.dias.flatMap((d) =>
          d.comidas.flatMap((c) =>
            c.alternativas.flatMap((a) => a.alimentos.map((i) => i.alimentoId)),
          ),
        ),
      ),
    ];
    const alimentos = await this.alimentoRepo.findBy({
      idAlimento: In(todosAlimentosIds),
    });
    if (alimentos.length !== todosAlimentosIds.length) {
      throw new NotFoundError('Uno o más alimentos no existen en el sistema.');
    }
    const alimentoMap = new Map(alimentos.map((a) => [a.idAlimento, a]));

    // 5) Validar restricciones del paciente
    const socio = plan.socio as unknown as SocioOrmEntity;
    const socioId = (socio as unknown as { idPersona: number | null }).idPersona;
    if (socioId == null) {
      throw new NotFoundError('Socio', String(planId));
    }
    const incidencias = await this.restriccionesValidator.generarIncidencias(
      payload.dias.flatMap((diaDto) =>
        diaDto.comidas.flatMap((comidaDto) =>
          comidaDto.alternativas.flatMap((altDto, idxAlt) =>
            altDto.alimentos.map((itemDto, idxItem) => {
              const alimento = alimentoMap.get(itemDto.alimentoId)!;
              return {
                dia: diaDto.dia,
                comida: comidaDto.tipoComida,
                item: `${idxAlt + 1}.${idxItem + 1}`,
                alimentoId: alimento.idAlimento,
                alimentoNombre: alimento.nombre,
              };
            }),
          ),
        ),
      ),
      socioId,
    );
    if (incidencias.length > 0) {
      throw new BadRequestError(
        `Restricciones del paciente: ${formatearIncidenciasRestriccion(incidencias)}`,
      );
    }

    // 6) Construir datosJson de la nueva versión
    const estructura: PlanAlimentacionDatosJson['estructura'] = payload.dias.map(
      (d) => ({
        dia: d.dia,
        comidas: d.comidas.map((c) => ({
          tipo: c.tipoComida,
          alternativas: c.alternativas.map((a) => {
            const itemSnapshots = a.alimentos.map((i) => {
              const al = alimentoMap.get(i.alimentoId)!;
              return {
                alimentoId: al.idAlimento,
                cantidad: i.cantidad,
                unidad: i.unidad ?? al.unidadMedida,
              };
            });
            // Macros por alternativa = suma simple de los items (proporción a cantidad/unidad)
            const totalCal = a.alimentos.reduce((acc, i) => {
              const al = alimentoMap.get(i.alimentoId)!;
              return acc + (al.calorias ?? 0);
            }, 0);
            const totalPro = a.alimentos.reduce((acc, i) => {
              const al = alimentoMap.get(i.alimentoId)!;
              return acc + (al.proteinas ?? 0);
            }, 0);
            const totalCarb = a.alimentos.reduce((acc, i) => {
              const al = alimentoMap.get(i.alimentoId)!;
              return acc + (al.carbohidratos ?? 0);
            }, 0);
            const totalGras = a.alimentos.reduce((acc, i) => {
              const al = alimentoMap.get(i.alimentoId)!;
              return acc + (al.grasas ?? 0);
            }, 0);
            return {
              nombre: a.nombre ?? '',
              alimentos: itemSnapshots,
              calorias: totalCal,
              proteinas: totalPro,
              carbohidratos: totalCarb,
              grasas: totalGras,
            };
          }),
        })),
      }),
    );

    // Resumen de macros (placeholder: 0; PlanAlimentacionVersion lo recalcula al activarse)
    const resumenMacros = estructura.reduce<
      Record<string, { calorias: number; proteinas: number; carbohidratos: number; grasas: number }>
    >((acc, d) => {
      acc[d.dia] = { calorias: 0, proteinas: 0, carbohidratos: 0, grasas: 0 };
      return acc;
    }, {});

    const datosJson: PlanAlimentacionDatosJson = {
      estructura,
      macrosPorDia: resumenMacros as PlanAlimentacionDatosJson['macrosPorDia'],
      razonamientoCumplimiento: {
        restriccionesCumplidas: [],
        restriccionesNoCumplidas: [],
      },
    };

    // 7) Calcular nuevo numeroVersion
    const versionesExistentes = await this.planVersionRepo.listarPorPlan(planId);
    const maxVersion = versionesExistentes.reduce(
      (max, v) => Math.max(max, v.numeroVersion),
      0,
    );
    const nuevoNumeroVersion = maxVersion + 1;
    const esCreacionInicial = versionesExistentes.length === 0;

    // 8) Transacción: crear nueva versión, desactivar anteriores
    const nuevaVersion = await this.dataSource.transaction(async () => {
      const versionCreada = await this.planVersionRepo.crear({
        idPlanAlimentacion: planId,
        numeroVersion: nuevoNumeroVersion,
        datosJson,
        motivoCambio: esCreacionInicial ? 'creacion_inicial' : 'edicion_manual',
        activa: true,
        createdBy: userId,
      });

      // Marcar anteriores como inactivas
      for (const v of versionesExistentes) {
        if (v.activa) {
          await this.planVersionRepo.marcarActiva(planId, v.idPlanAlimentacionVersion);
        }
      }
      // Reactivar la nueva (la lógica anterior las desactivó)
      await this.planVersionRepo.marcarActiva(planId, versionCreada.idPlanAlimentacionVersion);

      // Sincronizar `dias` del plan activo con la nueva estructura
      for (const diaExistente of plan.dias ?? []) {
        for (const opcion of diaExistente.opcionesComida ?? []) {
          await this.opcionRepo.remove(opcion);
        }
        await this.diaRepo.remove(diaExistente);
      }
      for (const [idx, diaEstructura] of estructura.entries()) {
        const dia = new DiaPlanOrmEntity();
        dia.dia = diaEstructura.dia;
        dia.orden = idx + 1;
        dia.planAlimentacion = plan;
        const diaGuardado = await this.diaRepo.save(dia);
        for (const comidaEstructura of diaEstructura.comidas) {
          const opcion = new OpcionComidaOrmEntity();
          opcion.tipoComida = comidaEstructura.tipo;
          opcion.comentarios = null;
          opcion.diaPlan = diaGuardado;
          for (const alt of comidaEstructura.alternativas) {
            for (const ali of alt.alimentos) {
              const item = new ItemComidaOrmEntity();
              const al = alimentoMap.get(ali.alimentoId)!;
              item.alimentoId = al.idAlimento;
              item.alimentoNombre = al.nombre;
              item.cantidad = ali.cantidad;
              item.unidad = (ali.unidad ?? al.unidadMedida) as never;
              item.notas = null;
              item.calorias = al.calorias;
              item.proteinas = al.proteinas;
              item.carbohidratos = al.carbohidratos;
              item.grasas = al.grasas;
              item.alimento = al;
              item.opcionComida = opcion;
              opcion.items = [...(opcion.items ?? []), item];
            }
          }
          if (opcion.items) {
            await this.opcionRepo.save(opcion);
          }
        }
      }

      return versionCreada;
    });

    // 9) Auditoría (tolerante)
    try {
      await this.auditoriaService.registrar({
        accion: AccionAuditoria.PLAN_EDITADO,
        entidad: 'PlanAlimentacion',
        entidadId: planId,
        usuarioId: userId,
        gimnasioId: this.tenantContext.gimnasioId,
        metadata: {
          versionId: nuevaVersion.idPlanAlimentacionVersion,
          numeroVersion: nuevoNumeroVersion,
          motivoCambio: esCreacionInicial ? 'creacion_inicial' : 'edicion_manual',
        },
      });
    } catch (error) {
      this.logger.warn(
        `Auditoria PLAN_EDITADO falló (no afecta operación): ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }

    // 10) Recargar plan completo con relaciones
    const planCompleto = await this.planRepo.findOne({
      where: { idPlanAlimentacion: planId },
      relations: {
        dias: { opcionesComida: { items: { alimento: true } } },
        socio: true,
        nutricionista: true,
      },
    });

    return mapPlanToResponse(planCompleto!);
  }
}
