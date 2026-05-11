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
} from 'src/infrastructure/persistence/typeorm/entities';
import { AuditoriaService } from 'src/infrastructure/services/auditoria/auditoria.service';
import { AccionAuditoria } from 'src/infrastructure/persistence/typeorm/entities/auditoria.entity';
import { Repository } from 'typeorm';
import { EliminarPlanAlimentacionDto } from '../dtos';
import { NotificacionesService } from 'src/application/notificaciones/notificaciones.service';
import { TipoNotificacion } from 'src/domain/entities/Notificacion/tipo-notificacion.enum';

export class EliminarPlanAlimentacionResponseDto {
  mensaje: string;
  planId: number;
  eliminadoEn: Date;
}

@Injectable()
export class EliminarPlanAlimentacionUseCase implements BaseUseCase {
  constructor(
    @InjectRepository(PlanAlimentacionOrmEntity)
    private readonly planRepo: Repository<PlanAlimentacionOrmEntity>,
    @InjectRepository(NutricionistaOrmEntity)
    private readonly nutricionistaRepo: Repository<NutricionistaOrmEntity>,
    @InjectRepository(UsuarioOrmEntity)
    private readonly usuarioRepo: Repository<UsuarioOrmEntity>,
    private readonly auditoriaService: AuditoriaService,
    private readonly notificacionesService: NotificacionesService,
  ) {}

  async execute(
    nutricionistaUserId: number,
    payload: EliminarPlanAlimentacionDto,
  ): Promise<EliminarPlanAlimentacionResponseDto> {
    const plan = await this.planRepo.findOne({
      where: { idPlanAlimentacion: payload.planId },
      relations: { nutricionista: true },
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

    // Solo el nutricionista dueño o ADMIN puede eliminar
    if (usuario.rol !== Rol.ADMIN) {
      if ((plan.nutricionista as any).idPersona !== nutricionistaUserId) {
        throw new ForbiddenError(
          'Solo el nutricionista responsable del plan puede eliminarlo.',
        );
      }
    }

    // Soft delete
    plan.activo = false;
    plan.eliminadoEn = new Date();
    plan.motivoEliminacion = payload.motivoEliminacion;

    await this.planRepo.save(plan);

    await this.auditoriaService.registrar({
      usuarioId: nutricionistaUserId,
      accion: AccionAuditoria.PLAN_DELETED,
      entidad: 'PlanAlimentacion',
      entidadId: plan.idPlanAlimentacion,
      metadata: {
        motivoEliminacion: payload.motivoEliminacion,
        socioId: (plan.socio as any)?.idPersona,
      },
    });

    await this.notificacionesService.crear({
      destinatarioId: (plan.socio as any)?.idPersona,
      tipo: TipoNotificacion.PLAN_ELIMINADO,
      titulo: 'Plan de alimentación eliminado',
      mensaje: 'Tu plan de alimentación activo fue eliminado.',
      metadata: { planId: plan.idPlanAlimentacion },
    });

    return {
      mensaje: 'Plan de alimentación eliminado correctamente.',
      planId: plan.idPlanAlimentacion,
      eliminadoEn: plan.eliminadoEn,
    };
  }
}
