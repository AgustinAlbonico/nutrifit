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
  DiaPlanOrmEntity,
  OpcionComidaOrmEntity,
} from 'src/infrastructure/persistence/typeorm/entities';
import { Repository, DataSource } from 'typeorm';

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
  ) {}

  async execute(
    nutricionistaUserId: number,
    payload: VaciarContenidoPlanDto,
  ): Promise<VaciarContenidoPlanResponseDto> {
    const plan = await this.planRepo.findOne({
      where: { idPlanAlimentacion: payload.planId },
      relations: { nutricionista: true, dias: true },
    });

    if (!plan || !plan.activo) {
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
      if ((plan.nutricionista as any).idPersona !== nutricionistaUserId) {
        throw new ForbiddenError(
          'Solo el nutricionista responsable del plan puede vaciarlo.',
        );
      }
    }

    // Contar elementos a eliminar
    const diasDelPlan = await this.diaPlanRepo.find({
      where: {
        planAlimentacion: { idPlanAlimentacion: payload.planId } as any,
      },
      relations: { opcionesComida: true },
    });

    let totalOpciones = 0;
    const diasIds = diasDelPlan.map((dia) => {
      totalOpciones += dia.opcionesComida?.length ?? 0;
      return dia.idDiaPlan;
    });

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

      // 3. Actualizar fecha de edición del plan
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
