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
 *  1. Validar plan existe, editable, NUT dueño (o ADMIN del gimnasio).
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
  PlanAlimentacionVersionOrmEntity,
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
import { BloqueoGeneracionPlanIaService } from '../services/bloqueo-generacion-plan-ia.service';

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
    private readonly bloqueoGeneracionPlanIa: BloqueoGeneracionPlanIaService,
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
    if ((plan as { estado?: string }).estado === 'FINALIZADO') {
      throw new BadRequestError('El plan está finalizado. No se puede editar.');
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
      (acc, d) =>
        acc + d.comidas.reduce((a, c) => a + c.alternativas.length, 0),
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
    const socioId = (socio as unknown as { idPersona: number | null })
      .idPersona;
    if (socioId == null) {
      throw new NotFoundError('Socio', String(planId));
    }

    await this.bloqueoGeneracionPlanIa.verificarSinGeneracionActiva({
      socioId,
      gimnasioId: this.tenantContext.gimnasioId,
      planAlimentacionId: planId,
    });

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
    const estructura: PlanAlimentacionDatosJson['estructura'] =
      payload.dias.map((d) => ({
        dia: d.dia,
        comidas: d.comidas.map((c) => ({
          tipo: c.tipoComida,
          alternativas: c.alternativas.map((a) => {
            let totalCal = 0;
            let totalPro = 0;
            let totalCarb = 0;
            let totalGras = 0;

            const itemSnapshots = a.alimentos.map((i) => {
              const al = alimentoMap.get(i.alimentoId)!;
              const factorNormalizacion =
                al.unidadMedida === 'kilogramo' ? 1 / 10 : 1;
              const kcalPor100g = (al.calorias ?? 0) * factorNormalizacion;
              const proPor100g = (al.proteinas ?? 0) * factorNormalizacion;
              const carbPor100g = (al.carbohidratos ?? 0) * factorNormalizacion;
              const grasPor100g = (al.grasas ?? 0) * factorNormalizacion;
              const factor = i.cantidad / 100;
              const cal = Math.round(kcalPor100g * factor * 100) / 100;
              const pro = Math.round(proPor100g * factor * 100) / 100;
              const carb = Math.round(carbPor100g * factor * 100) / 100;
              const gras = Math.round(grasPor100g * factor * 100) / 100;

              totalCal += cal;
              totalPro += pro;
              totalCarb += carb;
              totalGras += gras;

              return {
                alimentoId: al.idAlimento,
                nombre: al.nombre,
                cantidad: i.cantidad,
                unidad: i.unidad ?? al.unidadMedida,
                calorias: cal,
                proteinas: pro,
                carbohidratos: carb,
                grasas: gras,
              };
            });

            return {
              nombre: a.nombre ?? '',
              alimentos: itemSnapshots,
              calorias: Math.round(totalCal * 100) / 100,
              proteinas: Math.round(totalPro * 100) / 100,
              carbohidratos: Math.round(totalCarb * 100) / 100,
              grasas: Math.round(totalGras * 100) / 100,
            };
          }),
        })),
      }));

    // Resumen de macros (placeholder: 0; PlanAlimentacionVersion lo recalcula al activarse)
    const resumenMacros = estructura.reduce<
      Record<
        string,
        {
          calorias: number;
          proteinas: number;
          carbohidratos: number;
          grasas: number;
        }
      >
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

    // 7) Guardar o actualizar versión borrador (numeroVersion = 0)
    const esCreacionInicial =
      (await this.planVersionRepo.listarPorPlan(planId)).length === 0;

    const nuevaVersion = await this.dataSource.transaction(async (manager) => {
      const versionRepo = manager.getRepository(
        PlanAlimentacionVersionOrmEntity,
      );
      let orm = await versionRepo.findOne({
        where: {
          idPlanAlimentacion: planId,
          numeroVersion: 0,
        },
      });

      if (orm) {
        orm.datosJson = datosJson;
        orm.motivoCambio = esCreacionInicial
          ? 'creacion_inicial'
          : 'edicion_manual';
        orm.createdBy = userId;
        orm.createdAt = new Date();
      } else {
        orm = versionRepo.create({
          idPlanAlimentacion: planId,
          numeroVersion: 0,
          datosJson,
          motivoCambio: esCreacionInicial
            ? 'creacion_inicial'
            : 'edicion_manual',
          // Activar la primera version persistida para que el plan deje
          // el estado BORRADOR y sea visible al socio en MiPlanPage.
          activa: esCreacionInicial,
          createdBy: userId,
        });
      }
      const saved = await versionRepo.save(orm);
      return saved;
    });

    // Si es la primera version persistida, activar el plan para que el
    // NUT deje de ver "0 planes activos" despues de guardar el borrador.
    if (esCreacionInicial && nuevaVersion.activa) {
      await this.planRepo.update(
        { idPlanAlimentacion: planId },
        { activo: true, estado: 'ACTIVO', ultimaEdicion: new Date() },
      );
    }

    // 10) Recargar plan completo
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
