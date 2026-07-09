import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseUseCase } from 'src/application/shared/use-case.base';
import {
  ForbiddenError,
  NotFoundError,
} from 'src/domain/exceptions/custom-exceptions';
import { Rol } from 'src/domain/entities/Usuario/Rol';
import {
  UsuarioOrmEntity,
  NutricionistaOrmEntity,
  PlanAlimentacionOrmEntity,
  PlanAlimentacionVersionOrmEntity,
  DiaPlanOrmEntity,
  OpcionComidaOrmEntity,
} from 'src/infrastructure/persistence/typeorm/entities';
import { Repository, DataSource } from 'typeorm';
import { TenantContextService } from 'src/infrastructure/auth/tenant-context.service';
import { BloqueoGeneracionPlanIaService } from '../services/bloqueo-generacion-plan-ia.service';

export class VaciarContenidoPlanDto {
  planId: number;
}

export class VaciarContenidoPlanResponseDto {
  mensaje: string;
  planId: number;
  diasEliminados: number;
  opcionesEliminadas: number;
  vaciadoEn: Date;
}

const DIAS_PLAN = [
  'LUNES',
  'MARTES',
  'MIERCOLES',
  'JUEVES',
  'VIERNES',
  'SABADO',
  'DOMINGO',
] as const;

const TIPOS_COMIDA_PLAN = [
  'DESAYUNO',
  'ALMUERZO',
  'MERIENDA',
  'CENA',
  'COLACION',
] as const;

@Injectable()
export class VaciarContenidoPlanUseCase implements BaseUseCase {
  constructor(
    @InjectRepository(PlanAlimentacionOrmEntity)
    private readonly planRepo: Repository<PlanAlimentacionOrmEntity>,
    @InjectRepository(NutricionistaOrmEntity)
    private readonly nutricionistaRepo: Repository<NutricionistaOrmEntity>,
    @InjectRepository(UsuarioOrmEntity)
    private readonly usuarioRepo: Repository<UsuarioOrmEntity>,
    @InjectRepository(DiaPlanOrmEntity)
    private readonly diaPlanRepo: Repository<DiaPlanOrmEntity>,
    @InjectRepository(OpcionComidaOrmEntity)
    private readonly opcionComidaRepo: Repository<OpcionComidaOrmEntity>,
    private readonly dataSource: DataSource,
    private readonly tenantContext: TenantContextService,
    private readonly bloqueoGeneracionPlanIa: BloqueoGeneracionPlanIaService,
  ) {}

  async execute(
    nutricionistaUserId: number,
    payload: VaciarContenidoPlanDto,
  ): Promise<VaciarContenidoPlanResponseDto> {
    const plan = await this.planRepo.findOne({
      where: {
        idPlanAlimentacion: payload.planId,
        socio: { gimnasioId: this.tenantContext.gimnasioId },
      },
      relations: { nutricionista: { usuario: true }, socio: true, dias: true },
    });

    if (!plan) {
      throw new NotFoundError('Plan de alimentación', String(payload.planId));
    }

    // Obtener usuario para verificar rol
    const usuario = await this.usuarioRepo.findOne({
      where: { idUsuario: nutricionistaUserId },
    });

    if (!usuario) {
      throw new ForbiddenError('Usuario no encontrado.');
    }

    // Solo el nutricionista dueño o ADMIN puede vaciar
    if (usuario.rol !== Rol.ADMIN) {
      const ownerId = plan.nutricionista.usuario?.idUsuario ?? plan.nutricionista.idPersona;
      if (ownerId !== nutricionistaUserId) {
        throw new ForbiddenError(
          'Solo el nutricionista responsable del plan puede vaciarlo.',
        );
      }
    }

    const socioId = plan.socio?.idPersona ?? null;
    if (socioId !== null) {
      await this.bloqueoGeneracionPlanIa.verificarSinGeneracionActiva({
        socioId,
        gimnasioId: this.tenantContext.gimnasioId,
        planAlimentacionId: payload.planId,
      });
    }

    // Contar elementos a eliminar
    const diasDelPlan = await this.diaPlanRepo.find({
      where: {
        planAlimentacion: { idPlanAlimentacion: payload.planId },
      },
      relations: { opcionesComida: true },
    });

    let totalOpciones = 0;
    const diasIds = diasDelPlan.map((dia) => {
      totalOpciones += dia.opcionesComida?.length ?? 0;
      return dia.idDiaPlan;
    });

    // Estructura vacía para sobrescribir datosJson de la versión activa.
    // Mantiene el shape de PlanAlimentacionDatosJson (7 días × 5 comidas) para
    // que el frontend muestre slots vacíos en vez de caer al fallback.
    const estructuraVacia = {
      estructura: DIAS_PLAN.map((dia) => ({
        dia,
        comidas: TIPOS_COMIDA_PLAN.map((tipo) => ({ tipo, alternativas: [] })),
      })),
      macrosPorDia: DIAS_PLAN.reduce(
        (acc, dia) => {
          acc[dia] = { calorias: 0, proteinas: 0, carbohidratos: 0, grasas: 0 };
          return acc;
        },
        {} as Record<(typeof DIAS_PLAN)[number], { calorias: number; proteinas: number; carbohidratos: number; grasas: number }>,
      ),
      razonamientoCumplimiento: {
        restriccionesCumplidas: [],
        restriccionesNoCumplidas: [],
      },
    };

    // Ejecutar en transacción para garantizar consistencia
    await this.dataSource.transaction(async (manager) => {
      // 1. Eliminar opciones de comida (primero porque tienen FK a dia_plan)
      if (diasIds.length > 0) {
        await manager
          .createQueryBuilder()
          .delete()
          .from(OpcionComidaOrmEntity)
          .where('id_dia_plan IN (:...diasIds)', { diasIds })
          .execute();
      }

      // 2. Eliminar días del plan
      if (diasIds.length > 0) {
        await manager
          .createQueryBuilder()
          .delete()
          .from(DiaPlanOrmEntity)
          .where('id_plan_alimentacion = :planId', {
            planId: payload.planId,
          })
          .execute();
      }

      // 3. Sobrescribir datosJson de la versión activa para que el frontend
      // muestre el plan vacío al recargar. V1, V2 anteriores quedan como
      // histórico inmutable (no se tocan).
      await manager
        .createQueryBuilder()
        .update(PlanAlimentacionVersionOrmEntity)
        .set({
          datos_json: JSON.stringify(estructuraVacia),
        })
        .where('id_plan_alimentacion = :planId AND activa = :activa', {
          planId: payload.planId,
          activa: true,
        })
        .execute();

      // 4. Actualizar fecha de edición del plan
      await manager
        .createQueryBuilder()
        .update(PlanAlimentacionOrmEntity)
        .set({
          ultimaEdicion: new Date(),
          motivoEdicion: 'Contenido del plan vaciado',
        })
        .where('id_plan_alimentacion = :planId', { planId: payload.planId })
        .execute();
    });

    return {
      mensaje: 'Contenido del plan vaciado correctamente.',
      planId: plan.idPlanAlimentacion,
      diasEliminados: diasIds.length,
      opcionesEliminadas: totalOpciones,
      vaciadoEn: new Date(),
    };
  }
}
