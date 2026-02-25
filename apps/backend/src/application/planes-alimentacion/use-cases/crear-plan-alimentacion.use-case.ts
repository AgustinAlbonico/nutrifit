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
  FichaSaludOrmEntity,
  NutricionistaOrmEntity,
  OpcionComidaOrmEntity,
  PlanAlimentacionOrmEntity,
  SocioOrmEntity,
} from 'src/infrastructure/persistence/typeorm/entities';
import { Repository } from 'typeorm';
import { CrearPlanAlimentacionDto, PlanAlimentacionResponseDto } from '../dtos';
import { mapPlanToResponse } from './plan-alimentacion.mapper';

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
    @InjectRepository(FichaSaludOrmEntity)
    private readonly fichaSaludRepo: Repository<FichaSaludOrmEntity>,
    @InjectRepository(UsuarioOrmEntity)
    private readonly usuarioRepo: Repository<UsuarioOrmEntity>,
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
          d.opcionesComida.flatMap((o) => o.alimentosIds),
        ),
      ),
    ];

    // Cargar alimentos y validar que existen
    const alimentos = await this.alimentoRepo.findByIds(todosAlimentosIds);
    if (alimentos.length !== todosAlimentosIds.length) {
      throw new NotFoundError('Uno o más alimentos no existen en el sistema');
    }

    // Validar alergias/restricciones del socio contra alimentos seleccionados
    const fichaSalud = socio.fichaSalud
      ? await this.fichaSaludRepo.findOne({
          where: {
            idFichaSalud: (socio.fichaSalud as FichaSaludOrmEntity)
              .idFichaSalud,
          },
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
        throw new ConflictError(
          `El alimento "${alimentoConflicto.nombre}" puede estar relacionado con una alergia registrada del socio.`,
        );
      }
    }

    // Mapa rápido id -> entidad alimento
    const alimentoMap = new Map(alimentos.map((a) => [a.idAlimento, a]));

    // Crear plan
    const plan = new PlanAlimentacionOrmEntity();
    plan.fechaCreacion = new Date();
    plan.objetivoNutricional = payload.objetivoNutricional;
    plan.socio = socio as any;
    plan.nutricionista = nutricionista as any;
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
        opcion.alimentos = opcionDto.alimentosIds.map(
          (id) => alimentoMap.get(id)!,
        );
        await this.opcionRepo.save(opcion);
      }
    }

    // Recargar con relaciones completas
    const planCompleto = await this.planRepo.findOne({
      where: { idPlanAlimentacion: planGuardado.idPlanAlimentacion },
      relations: {
        dias: { opcionesComida: { alimentos: true } },
        socio: true,
        nutricionista: true,
      },
    });

    return mapPlanToResponse(planCompleto!);
  }
}
