import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { BaseUseCase } from 'src/application/shared/use-case.base';
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from 'src/domain/exceptions/custom-exceptions';
import {
  PLAN_ALIMENTACION_VERSION_REPOSITORY,
  PlanAlimentacionVersionRepository,
} from 'src/domain/repositories/plan-alimentacion-version.repository';
import {
  AlimentoOrmEntity,
  DiaPlanOrmEntity,
  ItemComidaOrmEntity,
  OpcionComidaOrmEntity,
  PlanAlimentacionOrmEntity,
  PlanAlimentacionVersionOrmEntity,
  SocioOrmEntity,
} from 'src/infrastructure/persistence/typeorm/entities';
import { TenantContextService } from 'src/infrastructure/auth/tenant-context.service';
import { NotificacionesService } from 'src/application/notificaciones/notificaciones.service';
import { TipoNotificacion } from 'src/domain/entities/Notificacion/tipo-notificacion.enum';
import { AccionAuditoria } from 'src/infrastructure/persistence/typeorm/entities/auditoria.entity';
import { AuditoriaService } from 'src/infrastructure/services/auditoria/auditoria.service';
import {
  APP_LOGGER_SERVICE,
  IAppLoggerService,
} from 'src/domain/services/logger.service';
import {
  MacrosValidator,
  type ObjetivoNutricional,
} from 'src/domain/validators/macros-validator';
import {
  RestriccionesValidatorV2,
  type FichaClinicaParaValidacion,
} from 'src/domain/validators/restricciones-validator-v2';
import { RespuestaGuardarVersionDto } from '../dtos';
import { UnidadMedida } from 'src/domain/entities/Alimento/UnidadMedida';
import { BloqueoGeneracionPlanIaService } from '../services/bloqueo-generacion-plan-ia.service';

export interface SolicitudGuardarVersion {
  planAlimentacionId: number;
  nutricionistaUserId: number;
  gimnasioId: number;
}

@Injectable()
export class GuardarVersionPlanUseCase implements BaseUseCase {
  private static readonly ENUM_VALORES_UNIDAD = Object.values(
    UnidadMedida,
  ) as string[];

  private static readonly SINONIMOS_UNIDAD: Record<string, UnidadMedida> = {
    g: UnidadMedida.GRAMO,
    gr: UnidadMedida.GRAMO,
    gramos: UnidadMedida.GRAMO,
    kg: UnidadMedida.KILOGRAMO,
    kilo: UnidadMedida.KILOGRAMO,
    kilos: UnidadMedida.KILOGRAMO,
    kilogramos: UnidadMedida.KILOGRAMO,
    ml: UnidadMedida.MILILITRO,
    mililitros: UnidadMedida.MILILITRO,
    l: UnidadMedida.LITRO,
    lt: UnidadMedida.LITRO,
    litros: UnidadMedida.LITRO,
    mg: UnidadMedida.MILIGRAMO,
    miligramos: UnidadMedida.MILIGRAMO,
    u: UnidadMedida.UNIDAD,
    unid: UnidadMedida.UNIDAD,
    unidades: UnidadMedida.UNIDAD,
    rebanada: UnidadMedida.UNIDAD,
    rebanadas: UnidadMedida.UNIDAD,
    porcion: UnidadMedida.UNIDAD,
    porciones: UnidadMedida.UNIDAD,
    pieza: UnidadMedida.UNIDAD,
    piezas: UnidadMedida.UNIDAD,
    tazas: UnidadMedida.TAZA,
    cucharadas: UnidadMedida.CUCHARADA,
    cucharaditas: UnidadMedida.CUCHARADITA,
  };

  private static normalizarUnidad(
    input: string | undefined,
  ): UnidadMedida | null {
    if (!input) return null;
    const limpio = input.trim().toLowerCase();
    if (GuardarVersionPlanUseCase.ENUM_VALORES_UNIDAD.includes(limpio)) {
      return limpio as UnidadMedida;
    }
    return GuardarVersionPlanUseCase.SINONIMOS_UNIDAD[limpio] ?? null;
  }

  constructor(
    @InjectRepository(PlanAlimentacionOrmEntity)
    private readonly planRepo: Repository<PlanAlimentacionOrmEntity>,
    @InjectRepository(SocioOrmEntity)
    private readonly socioRepo: Repository<SocioOrmEntity>,
    @InjectRepository(DiaPlanOrmEntity)
    private readonly diaRepo: Repository<DiaPlanOrmEntity>,
    @InjectRepository(OpcionComidaOrmEntity)
    private readonly opcionRepo: Repository<OpcionComidaOrmEntity>,
    @InjectRepository(AlimentoOrmEntity)
    private readonly alimentoRepo: Repository<AlimentoOrmEntity>,
    @Inject(PLAN_ALIMENTACION_VERSION_REPOSITORY)
    private readonly planVersionRepo: PlanAlimentacionVersionRepository,
    private readonly notificacionesService: NotificacionesService,
    private readonly auditoriaService: AuditoriaService,
    private readonly tenantContext: TenantContextService,
    private readonly dataSource: DataSource,
    private readonly bloqueoGeneracionPlanIa: BloqueoGeneracionPlanIaService,
    @Inject(APP_LOGGER_SERVICE)
    private readonly logger: IAppLoggerService,
  ) {}

  async execute(
    solicitud: SolicitudGuardarVersion,
  ): Promise<RespuestaGuardarVersionDto> {
    const { planAlimentacionId, nutricionistaUserId, gimnasioId } = solicitud;

    // 1) Cargar plan
    const plan = await this.planRepo.findOne({
      where: { idPlanAlimentacion: planAlimentacionId },
      relations: { socio: true, nutricionista: { usuario: true }, dias: { opcionesComida: { items: true } } },
    });
    if (!plan) {
      throw new NotFoundError('Plan de alimentación', String(planAlimentacionId));
    }

    // 2) Multi-tenant
    if (
      plan.socio &&
      (plan.socio as unknown as { gimnasioId: number | null }).gimnasioId !==
        this.tenantContext.gimnasioId
    ) {
      throw new ForbiddenError('El plan pertenece a otro gimnasio');
    }

    // 3) Plan FINALIZADO → no se puede activar/guardar nada
    if (plan.estado === 'FINALIZADO') {
      throw new ConflictError(
        'PLAN_FINALIZADO: el plan está finalizado y no admite guardar nuevas versiones',
      );
    }

    // 4) NUT dueño
    const ownerId = plan.nutricionista.idPersona;
    if (ownerId !== nutricionistaUserId) {
      throw new ForbiddenError(
        'Solo el nutricionista responsable del plan puede guardar versiones.',
      );
    }

    const socioId = (plan.socio as unknown as { idPersona: number | null })
      .idPersona;
    if (socioId == null) {
      throw new NotFoundError('Socio', String(planAlimentacionId));
    }

    await this.bloqueoGeneracionPlanIa.verificarSinGeneracionActiva({
      socioId,
      gimnasioId,
      planAlimentacionId,
    });

    // 5) Buscar versión borrador (numeroVersion = 0)
    const versionesExistentes = await this.planVersionRepo.listarPorPlan(planAlimentacionId);
    const borrador = versionesExistentes.find((v) => v.numeroVersion === 0);
    if (!borrador) {
      throw new BadRequestError('No hay cambios pendientes de guardar en este plan (borrador no encontrado).');
    }

    const { datosJson, motivoCambio } = borrador;

    // 6) Calcular nuevo numeroVersion correlativo
    const maxVersion = versionesExistentes.reduce(
      (max, v) => Math.max(max, v.numeroVersion),
      0,
    );
    const nuevoNumeroVersion = maxVersion + 1;

    // 7) Cargar alimentos para sincronización de tablas
    const todosAlimentosIds = [
      ...new Set(
        datosJson.estructura.flatMap((d) =>
          d.comidas.flatMap((c) =>
            c.alternativas.flatMap((a) => a.alimentos.map((i) => i.alimentoId)),
          ),
        ),
      ),
    ];
    const alimentos = await this.alimentoRepo.findBy({
      idAlimento: In(todosAlimentosIds),
    });
    const alimentoMap = new Map(alimentos.map((a) => [a.idAlimento, a]));

    // 8) Transacción atómica
    const nuevaVersion = await this.dataSource.transaction(async (manager) => {
      const versionRepo = manager.getRepository(PlanAlimentacionVersionOrmEntity);
      const planRepoTx = manager.getRepository(PlanAlimentacionOrmEntity);
      const diaRepoTx = manager.getRepository(DiaPlanOrmEntity);
      const opcionRepoTx = manager.getRepository(OpcionComidaOrmEntity);

      // 8a) Crear nueva versión correlativa real activa
      const versionCreada = versionRepo.create({
        idPlanAlimentacion: planAlimentacionId,
        numeroVersion: nuevoNumeroVersion,
        datosJson,
        motivoCambio: motivoCambio || 'edicion_manual',
        activa: true,
        createdBy: plan.nutricionista.idPersona ?? 0,
      });
      const savedVersion = (await versionRepo.save(versionCreada)) as PlanAlimentacionVersionOrmEntity;

      // 8b) Desactivar todas las versiones anteriores del plan
      await versionRepo
        .createQueryBuilder()
        .update()
        .set({ activa: false })
        .where('id_plan_alimentacion = :planId', { planId: planAlimentacionId })
        .execute();

      // Reactivar la nueva creada
      await versionRepo
        .createQueryBuilder()
        .update()
        .set({ activa: true })
        .where('id_plan_alimentacion_version = :versionId', {
          versionId: savedVersion.idPlanAlimentacionVersion,
        })
        .execute();

      // 8c) Marcar plan como ACTIVO
      await planRepoTx
        .createQueryBuilder()
        .update()
        .set({ estado: 'ACTIVO', activo: true, ultimaEdicion: new Date() })
        .where('id_plan_alimentacion = :planId', { planId: planAlimentacionId })
        .execute();

      // 8d) Sincronizar `dias` de la base de datos activa con la estructura de la versión
      for (const diaExistente of plan.dias ?? []) {
        for (const opcion of diaExistente.opcionesComida ?? []) {
          await opcionRepoTx.remove(opcion);
        }
        await diaRepoTx.remove(diaExistente);
      }

      for (const [idx, diaEstructura] of datosJson.estructura.entries()) {
        const dia = new DiaPlanOrmEntity();
        dia.dia = diaEstructura.dia;
        dia.orden = idx + 1;
        dia.planAlimentacion = plan;
        const diaGuardado = await diaRepoTx.save(dia);

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
              const unidadNormalizada = GuardarVersionPlanUseCase.normalizarUnidad(
                ali.unidad,
              );
              if (ali.unidad && !unidadNormalizada) {
                this.logger.warn(
                  `unidad invalida "${ali.unidad}" para alimentoId=${ali.alimentoId}; fallback a "${al.unidadMedida}".`,
                );
              }
              item.unidad = unidadNormalizada ?? al.unidadMedida;
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
            await opcionRepoTx.save(opcion);
          }
        }
      }

      return savedVersion;
    });

    // 9) Notificación al socio
    try {
      const socioPersonaId = (plan.socio as unknown as { idPersona: number | null })
        .idPersona;
      if (socioPersonaId) {
        const socio = await this.socioRepo.findOne({
          where: { idPersona: socioPersonaId },
          relations: { usuario: true },
        });
        if (socio?.usuario?.idUsuario) {
          await this.notificacionesService.crear({
            destinatarioId: socio.usuario.idUsuario,
            tipo: TipoNotificacion.PLAN_ACTIVO,
            titulo: 'Tu plan de alimentación está activo',
            mensaje: `Tu nutricionista guardó una nueva versión del plan. Revisala en la app.`,
            metadata: {
              planId: plan.idPlanAlimentacion,
              versionId: nuevaVersion!.idPlanAlimentacionVersion,
              numeroVersion: nuevoNumeroVersion,
            },
          });
        }
      }
    } catch (error) {
      this.logger.warn(
        `Notificación PLAN_ACTIVO falló (no afecta operación): ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    // 10) Auditoría
    try {
      await this.auditoriaService.registrar({
        accion: AccionAuditoria.PLAN_ACTIVADO,
        entidad: 'PlanAlimentacion',
        entidadId: plan.idPlanAlimentacion,
        usuarioId: nutricionistaUserId,
        gimnasioId: gimnasioId,
        metadata: {
          versionId: nuevaVersion!.idPlanAlimentacionVersion,
          numeroVersion: nuevoNumeroVersion,
          motivoCambio: nuevaVersion!.motivoCambio,
        },
      });
    } catch (error) {
      this.logger.warn(
        `Auditoria PLAN_ACTIVADO falló: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    const objetivoMacros: ObjetivoNutricional = {
      caloriasDiarias: 2000,
      proteinasDiarias: 150,
      carbohidratosDiarios: 200,
      grasasDiarias: 70,
    };
    const fichaClinicaValidacion: FichaClinicaParaValidacion = {
      alergias: [],
      restriccionesAlimentarias: null,
      patologias: [],
      objetivoPersonal: motivoCambio ?? null,
    };
    const macros = MacrosValidator.validar(
      datosJson as unknown as Parameters<typeof MacrosValidator.validar>[0],
      objetivoMacros,
    );
    const validacion = RestriccionesValidatorV2.validarPlanCompleto(
      datosJson as unknown as Parameters<typeof RestriccionesValidatorV2.validarPlanCompleto>[0],
      fichaClinicaValidacion,
    );

    return {
      idPlanAlimentacion,
      planAlimentacionId,
      versionId: nuevaVersion!.idPlanAlimentacionVersion,
      numeroVersion: nuevoNumeroVersion,
      motivoCambio,
      plan: datosJson as unknown as RespuestaGuardarVersionDto['plan'],
      validacion,
      macros,
      advertencias: [],
    };
  }
}
