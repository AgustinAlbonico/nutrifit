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
import { Repository } from 'typeorm';
import { CrearPlanAlimentacionDto, PlanAlimentacionResponseDto } from '../dtos';
import { mapPlanToResponse } from './plan-alimentacion.mapper';
import { NotificacionesService } from 'src/application/notificaciones/notificaciones.service';
import { TipoNotificacion } from 'src/domain/entities/Notificacion/tipo-notificacion.enum';
import {
  formatearIncidenciasRestriccion,
  RestriccionesValidator,
} from 'src/application/restricciones/restricciones-validator.service';

@Injectable()
export class CrearPlanAlimentacionUseCase implements BaseUseCase {
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
    private readonly notificacionesService: NotificacionesService,
    private readonly restriccionesValidator: RestriccionesValidator,
  ) {}

  async execute(
    nutricionistaUserId: number,
    payload: CrearPlanAlimentacionDto,
  ): Promise<PlanAlimentacionResponseDto> {
    // Obtener usuario para verificar rol
    const usuario = await this.usuarioRepo.findOne({
      where: { idUsuario: nutricionistaUserId },
    });

    if (!usuario) {
      throw new ForbiddenError('Usuario no encontrado.');
    }

    let nutricionista: NutricionistaOrmEntity | null = null;

    // Si es ADMIN, puede crear planes sin ser nutricionista
    if (usuario.rol === Rol.ADMIN) {
      // Buscar el nutricionista que tiene turno con el socio (el más reciente)
      const socio = await this.socioRepo.findOne({
        where: { idPersona: payload.socioId },
      });
      if (!socio) {
        throw new NotFoundError('Socio', String(payload.socioId));
      }
      // Para ADMIN, usaremos el primer nutricionista disponible como creador
      nutricionista = await this.nutricionistaRepo.findOne({
        where: {},
        order: { idPersona: 'ASC' },
      });
      if (!nutricionista) {
        throw new ForbiddenError(
          'No hay nutricionistas disponibles para asignar al plan.',
        );
      }
    } else {
      // Para NUTRICIONISTA, validar que sea nutricionista válido
      nutricionista = await this.nutricionistaRepo.findOne({
        where: { idPersona: nutricionistaUserId },
      });
      if (!nutricionista) {
        throw new ForbiddenError(
          'El usuario autenticado no es un nutricionista válido.',
        );
      }
    }

    // Resolver socio
    const socio = await this.socioRepo.findOne({
      where: { idPersona: payload.socioId },
      relations: { fichaSalud: true },
    });
    if (!socio) {
      throw new NotFoundError('Socio', String(payload.socioId));
    }

    // Validar plan activo único por socio
    const planActivoExistente = await this.planRepo.findOne({
      where: {
        socio: { idPersona: payload.socioId },
        activo: true,
      },
    });
    if (planActivoExistente) {
      throw new ConflictError(
        'El socio ya cuenta con un plan de alimentación activo. Debe eliminarlo antes de crear uno nuevo.',
      );
    }

    // Validar estructura: al menos 1 día con al menos 1 opción de comida
    if (!payload.dias || payload.dias.length === 0) {
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

    // Recolectar todos los IDs de alimentos pedidos
    const todosAlimentosIds = [
      ...new Set(
        payload.dias.flatMap((d) =>
          d.opcionesComida.flatMap((o) =>
            o.items.map((item) => item.alimentoId),
          ),
        ),
      ),
    ];

    // Cargar alimentos y validar que existen
    const alimentos = await this.alimentoRepo.findByIds(todosAlimentosIds);
    if (alimentos.length !== todosAlimentosIds.length) {
      throw new NotFoundError('Uno o más alimentos no existen en el sistema');
    }

    // Mapa rápido id -> entidad alimento
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
        socio.idPersona ?? payload.socioId,
      );

    if (incidenciasRestriccion.length > 0) {
      throw new ConflictError(
        formatearIncidenciasRestriccion(incidenciasRestriccion),
      );
    }

    // Crear plan
    const plan = new PlanAlimentacionOrmEntity();
    plan.fechaCreacion = new Date();
    plan.objetivoNutricional = payload.objetivoNutricional;
    plan.socio = socio as unknown as PlanAlimentacionOrmEntity['socio'];
    plan.nutricionista =
      nutricionista as unknown as PlanAlimentacionOrmEntity['nutricionista'];
    plan.activo = true;
    plan.eliminadoEn = null;
    plan.motivoEliminacion = null;
    plan.motivoEdicion = null;
    plan.ultimaEdicion = null;

    const planGuardado = await this.planRepo.save(plan);

    // Crear días y opciones
    for (const diaDto of payload.dias) {
      const dia = new DiaPlanOrmEntity();
      dia.dia = diaDto.dia;
      dia.orden = diaDto.orden;
      dia.planAlimentacion = planGuardado;
      const diaGuardado = await this.diaRepo.save(dia);

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
        await this.opcionRepo.save(opcion);
      }
    }

    // Recargar con relaciones completas
    const planCompleto = await this.planRepo.findOne({
      where: { idPlanAlimentacion: planGuardado.idPlanAlimentacion },
      relations: {
        dias: { opcionesComida: { items: { alimento: true } } },
        socio: true,
        nutricionista: true,
      },
    });

    if (socio.idPersona) {
      await this.notificacionesService.crear({
        destinatarioId: socio.idPersona,
        tipo: TipoNotificacion.PLAN_CREADO,
        titulo: 'Plan de alimentación creado',
        mensaje: 'Tu nutricionista creó un nuevo plan de alimentación.',
        metadata: { planId: planGuardado.idPlanAlimentacion },
      });
    }

    return mapPlanToResponse(planCompleto!);
  }
}
