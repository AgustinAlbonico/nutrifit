import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseUseCase } from 'src/application/shared/use-case.base';
import {
  BadRequestError,
  ConflictError,
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
import { DataSource, In, Repository } from 'typeorm';
import {
  EditarPlanAlimentacionDto,
  PlanAlimentacionResponseDto,
} from '../dtos';
import { mapPlanToResponse } from './plan-alimentacion.mapper';
import { NotificacionesService } from 'src/application/notificaciones/notificaciones.service';
import { TipoNotificacion } from 'src/domain/entities/Notificacion/tipo-notificacion.enum';
import {
  formatearIncidenciasRestriccion,
  RestriccionesValidator,
} from 'src/application/restricciones/restricciones-validator.service';

@Injectable()
export class EditarPlanAlimentacionUseCase implements BaseUseCase {
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
    private readonly auditoriaService: AuditoriaService,
    private readonly dataSource: DataSource,
    private readonly notificacionesService: NotificacionesService,
    private readonly restriccionesValidator: RestriccionesValidator,
  ) {}

  async execute(
    nutricionistaUserId: number,
    payload: EditarPlanAlimentacionDto,
  ): Promise<PlanAlimentacionResponseDto> {
    try {
      const plan = await this.planRepo.findOne({
        where: { idPlanAlimentacion: payload.planId },
        relations: {
          nutricionista: true,
          socio: { fichaSalud: true },
          dias: { opcionesComida: { items: { alimento: true } } },
        },
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

      const nutricionistaPlan = plan.nutricionista as unknown as {
        idPersona: number | null;
      };
      const socioPlan = plan.socio as unknown as {
        idPersona: number | null;
      };
      const socioPlanId = socioPlan.idPersona;

      if (socioPlanId == null) {
        throw new NotFoundError('Socio', String(payload.planId));
      }

      // Solo el nutricionista dueño o ADMIN puede editar
      if (usuario.rol !== Rol.ADMIN) {
        if (nutricionistaPlan.idPersona !== nutricionistaUserId) {
          throw new ForbiddenError(
            'Solo el nutricionista responsable del plan puede editarlo.',
          );
        }
      }

      // Actualizar campos básicos
      if (payload.objetivoNutricional !== undefined) {
        plan.objetivoNutricional = payload.objetivoNutricional;
      }
      plan.motivoEdicion = payload.motivoEdicion ?? null;
      plan.ultimaEdicion = new Date();

      // Si se envían nuevos días: reemplazar estructura anidada
      if (payload.dias !== undefined) {
        if (payload.dias.length === 0) {
          throw new BadRequestError(
            'El plan debe tener al menos un día configurado.',
          );
        }
        const totalOpciones = payload.dias.reduce(
          (acc, d) => acc + (d.opcionesComida?.length ?? 0),
          0,
        );
        if (totalOpciones === 0) {
          throw new BadRequestError(
            'El plan debe tener al menos una opción de comida en total.',
          );
        }

        // Recolectar IDs de alimentos y validar existencia
        const todosAlimentosIds = [
          ...new Set(
            payload.dias.flatMap((d) =>
              d.opcionesComida.flatMap((o) =>
                o.items.map((item) => item.alimentoId),
              ),
            ),
          ),
        ];
        const alimentos = await this.alimentoRepo.findBy({
          idAlimento: In(todosAlimentosIds),
        });
        if (alimentos.length !== todosAlimentosIds.length) {
          throw new NotFoundError(
            'Uno o más alimentos no existen en el sistema',
          );
        }

        const alimentoMap = new Map(alimentos.map((a) => [a.idAlimento, a]));

        const incidenciasRestriccion =
          await this.restriccionesValidator.generarIncidencias(
            payload.dias.flatMap((diaDto) =>
              diaDto.opcionesComida.flatMap((opcionDto, indiceOpcion) =>
                opcionDto.items.map((itemDto, indiceItem) => {
                  const alimento = alimentoMap.get(itemDto.alimentoId)!;
                  return {
                    dia: diaDto.dia,
                    comida: opcionDto.tipoComida,
                    item: `${indiceOpcion + 1}.${indiceItem + 1}`,
                    alimentoId: alimento.idAlimento,
                    alimentoNombre: alimento.nombre,
                  };
                }),
              ),
            ),
            socioPlanId,
          );

        if (incidenciasRestriccion.length > 0) {
          throw new ConflictError(
            formatearIncidenciasRestriccion(incidenciasRestriccion),
          );
        }

        await this.dataSource.transaction(async (manager) => {
          for (const diaExistente of plan.dias ?? []) {
            for (const opcion of diaExistente.opcionesComida ?? []) {
              await manager.remove(opcion);
            }
            await manager.remove(diaExistente);
          }

          for (const diaDto of payload.dias!) {
            const dia = new DiaPlanOrmEntity();
            dia.dia = diaDto.dia;
            dia.orden = diaDto.orden;
            dia.planAlimentacion = plan;
            const diaGuardado = await manager.save(dia);

            for (const opcionDto of diaDto.opcionesComida) {
              const opcion = new OpcionComidaOrmEntity();
              opcion.tipoComida = opcionDto.tipoComida;
              opcion.comentarios = opcionDto.comentarios ?? null;
              opcion.diaPlan = diaGuardado;
              opcion.items = opcionDto.items.map((itemDto) => {
                const alimento = alimentoMap.get(itemDto.alimentoId)!;
                const item = new ItemComidaOrmEntity();
                item.alimentoId = alimento.idAlimento;
                item.alimentoNombre = alimento.nombre;
                item.cantidad = itemDto.cantidad;
                item.unidad = alimento.unidadMedida;
                item.notas = null;
                item.calorias = alimento.calorias;
                item.proteinas = alimento.proteinas;
                item.carbohidratos = alimento.carbohidratos;
                item.grasas = alimento.grasas;
                item.alimento = alimento;
                item.opcionComida = opcion;
                return item;
              });
              await manager.save(opcion);
            }
          }

          plan.dias = [];
        });
        // Update plan basic fields without triggering relation issues
        await this.planRepo.update(plan.idPlanAlimentacion, {
          objetivoNutricional: plan.objetivoNutricional,
          motivoEdicion: plan.motivoEdicion,
          ultimaEdicion: plan.ultimaEdicion,
        });
      } else {
        await this.planRepo.save(plan);
      }

      const planId = plan.idPlanAlimentacion;

      // Simple query - just get the plan with minimal relations
      const planActualizado = await this.planRepo.findOne({
        where: { idPlanAlimentacion: planId },
        relations: ['socio', 'nutricionista'],
      });

      // Get dias separately to avoid any relation issues
      const dias = await this.diaRepo.find({
        where: { planAlimentacion: { idPlanAlimentacion: planId } },
        relations: [
          'opcionesComida',
          'opcionesComida.items',
          'opcionesComida.items.alimento',
        ],
        order: { orden: 'ASC' },
      });

      if (planActualizado) {
        planActualizado.dias = dias;
      }

      if (!planActualizado) {
        throw new NotFoundError(
          'Plan de alimentación',
          String(plan.idPlanAlimentacion),
        );
      }

      try {
        await this.auditoriaService.registrar({
          usuarioId: nutricionistaUserId,
          accion: AccionAuditoria.PLAN_EDITADO,
          entidad: 'PlanAlimentacion',
          entidadId: plan.idPlanAlimentacion,
          metadata: {
            objetivoNutricional: plan.objetivoNutricional,
            motivoEdicion: payload.motivoEdicion,
          },
        });

        const socioActualizado = planActualizado.socio as unknown as {
          idPersona: number | null;
        };

        if (socioActualizado.idPersona == null) {
          throw new NotFoundError('Socio', String(plan.idPlanAlimentacion));
        }

        await this.notificacionesService.crear({
          destinatarioId: socioActualizado.idPersona,
          tipo: TipoNotificacion.PLAN_EDITADO,
          titulo: 'Plan de alimentación editado',
          mensaje: 'Tu nutricionista actualizó tu plan de alimentación.',
          metadata: { planId: planActualizado.idPlanAlimentacion },
        });

        return mapPlanToResponse(planActualizado);
      } catch (err) {
        console.error('[EditarPlanAlimentacionUseCase] Error in mapper:', err);
        throw err;
      }
    } catch (error) {
      console.error('[EditarPlan] Unexpected error:', error);
      throw error;
    }
  }
}
