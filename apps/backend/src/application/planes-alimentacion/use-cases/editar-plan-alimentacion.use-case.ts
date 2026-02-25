import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
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
  FichaSaludOrmEntity,
  NutricionistaOrmEntity,
  OpcionComidaOrmEntity,
  PlanAlimentacionOrmEntity,
  SocioOrmEntity,
} from 'src/infrastructure/persistence/typeorm/entities';
import { DataSource, In, Repository } from 'typeorm';
import {
  EditarPlanAlimentacionDto,
  PlanAlimentacionResponseDto,
} from '../dtos';
import { mapPlanToResponse } from './plan-alimentacion.mapper';

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
    @InjectRepository(FichaSaludOrmEntity)
    private readonly fichaSaludRepo: Repository<FichaSaludOrmEntity>,
    @InjectRepository(UsuarioOrmEntity)
    private readonly usuarioRepo: Repository<UsuarioOrmEntity>,
    private readonly dataSource: DataSource,
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
          dias: { opcionesComida: { alimentos: true } },
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

      // Solo el nutricionista dueño o ADMIN puede editar
      if (usuario.rol !== Rol.ADMIN) {
        if ((plan.nutricionista as any).idPersona !== nutricionistaUserId) {
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
              d.opcionesComida.flatMap((o) => o.alimentosIds),
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

        // Validar alergias/restricciones del socio
        const socioConFicha = plan.socio as any;
        const fichaSalud = socioConFicha?.fichaSalud
          ? await this.fichaSaludRepo.findOne({
              where: { idFichaSalud: socioConFicha.fichaSalud.idFichaSalud },
              relations: { alergias: true },
            })
          : null;

        if (fichaSalud?.alergias?.length) {
          const nombresAlergias = fichaSalud.alergias.map((a) =>
            a.nombre.toLowerCase(),
          );
          const alimentoConflicto = alimentos.find((al) =>
            nombresAlergias.some((alergia) =>
              al.nombre.toLowerCase().includes(alergia),
            ),
          );
          if (alimentoConflicto) {
            throw new ForbiddenError(
              `El alimento "${alimentoConflicto.nombre}" puede estar relacionado con una alergia registrada del socio.`,
            );
          }
        }

        const alimentoMap = new Map(alimentos.map((a) => [a.idAlimento, a]));

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
              opcion.alimentos = opcionDto.alimentosIds.map(
                (id) => alimentoMap.get(id)!,
              );
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
        where: { planAlimentacion: { idPlanAlimentacion: planId } as any },
        relations: ['opcionesComida', 'opcionesComida.alimentos'],
        order: { orden: 'ASC' },
      });

      if (planActualizado) {
        (planActualizado as any).dias = dias;
      }

      if (!planActualizado) {
        throw new NotFoundError(
          'Plan de alimentación',
          String(plan.idPlanAlimentacion),
        );
      }

      try {
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
