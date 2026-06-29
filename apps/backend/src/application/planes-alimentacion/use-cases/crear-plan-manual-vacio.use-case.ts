import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseUseCase } from 'src/application/shared/use-case.base';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from 'src/domain/exceptions/custom-exceptions';
import { Rol } from 'src/domain/entities/Usuario/Rol';
import { DiaSemana } from 'src/domain/entities/DiaPlan/DiaSemana';
import { TipoComida } from 'src/domain/entities/OpcionComida/TipoComida';
import { UsuarioOrmEntity } from 'src/infrastructure/persistence/typeorm/entities';
import {
  NutricionistaOrmEntity,
  PlanAlimentacionOrmEntity,
  SocioOrmEntity,
} from 'src/infrastructure/persistence/typeorm/entities';
import { TenantContextService } from 'src/infrastructure/auth/tenant-context.service';
import {
  PLAN_ALIMENTACION_VERSION_REPOSITORY,
  PlanAlimentacionVersionRepository,
} from 'src/domain/repositories/plan-alimentacion-version.repository';
import { PlanAlimentacionDatosJson } from 'src/domain/entities/PlanAlimentacionVersion/plan-alimentacion-datos-json';

type BandaMacroManual = 'VERDE' | 'AMARILLO' | 'ROJO';

interface DetalleMacroManualDto {
  real: number;
  objetivo: number;
  desvio: number;
  banda: BandaMacroManual;
}

interface ResumenMacrosDiaManualDto {
  calorias: number;
  proteinas: number;
  carbohidratos: number;
  grasas: number;
  desvioPorcentaje: number;
  banda: BandaMacroManual;
  detallePorMacro: {
    calorias: DetalleMacroManualDto;
    proteinas: DetalleMacroManualDto;
    carbohidratos: DetalleMacroManualDto;
    grasas: DetalleMacroManualDto;
  };
}

export interface CrearPlanManualVacioResponseDto {
  planAlimentacionId: number;
  versionId: number;
  numeroVersion: number;
  plan: PlanAlimentacionDatosJson;
  validacion: {
    restriccionesCumplidas: Array<{ restriccion: string; detalle: string }>;
    restriccionesNoCumplidas: Array<{ restriccion: string; detalle: string }>;
    advertencias: string[];
  };
  macros: {
    cumpleEstructura: boolean;
    diasFaltantes: string[];
    comidasFaltantes: Array<{ dia: string; faltantes: string[] }>;
    advertencias: string[];
    macrosPorDia: Record<string, ResumenMacrosDiaManualDto>;
    bandaGlobal: BandaMacroManual;
    puedeAceptar: boolean;
  };
  advertencias: string[];
}

@Injectable()
export class CrearPlanManualVacioUseCase implements BaseUseCase {
  constructor(
    @InjectRepository(PlanAlimentacionOrmEntity)
    private readonly planRepo: Repository<PlanAlimentacionOrmEntity>,
    @InjectRepository(SocioOrmEntity)
    private readonly socioRepo: Repository<SocioOrmEntity>,
    @InjectRepository(NutricionistaOrmEntity)
    private readonly nutricionistaRepo: Repository<NutricionistaOrmEntity>,
    @InjectRepository(UsuarioOrmEntity)
    private readonly usuarioRepo: Repository<UsuarioOrmEntity>,
    @Inject(PLAN_ALIMENTACION_VERSION_REPOSITORY)
    private readonly planVersionRepo: PlanAlimentacionVersionRepository,
    private readonly tenantContext: TenantContextService,
  ) {}

  async execute(
    nutricionistaUserId: number,
    socioId: number,
  ): Promise<CrearPlanManualVacioResponseDto> {
    const usuario = await this.usuarioRepo.findOne({
      where: { idUsuario: nutricionistaUserId },
    });
    if (!usuario) {
      throw new ForbiddenError('Usuario no encontrado.');
    }

    let nutricionista: NutricionistaOrmEntity | null = null;

    if (usuario.rol === Rol.ADMIN) {
      nutricionista = await this.nutricionistaRepo.findOne({
        where: { gimnasioId: this.tenantContext.gimnasioId },
        order: { idPersona: 'ASC' },
      });
      if (!nutricionista) {
        throw new ForbiddenError(
          'No hay nutricionistas disponibles para asignar al plan.',
        );
      }
    } else {
      nutricionista = await this.nutricionistaRepo.findOne({
        where: {
          idPersona: nutricionistaUserId,
          gimnasioId: this.tenantContext.gimnasioId,
        },
      });
      if (!nutricionista) {
        throw new ForbiddenError(
          'El usuario autenticado no es un nutricionista válido.',
        );
      }
    }

    const socio = await this.socioRepo.findOne({
      where: {
        idPersona: socioId,
        gimnasioId: this.tenantContext.gimnasioId,
      },
      relations: { usuario: true },
    });
    if (!socio) {
      throw new NotFoundError('Socio', String(socioId));
    }

    const planActivoExistente = await this.planRepo.findOne({
      where: {
        socio: { idPersona: socioId, gimnasioId: this.tenantContext.gimnasioId },
        activo: true,
      },
    });
    if (planActivoExistente) {
      throw new ConflictError(
        'El socio ya cuenta con un plan de alimentación activo. Edite el existente o elimínelo para crear uno nuevo.',
      );
    }

    const plan = new PlanAlimentacionOrmEntity();
    plan.fechaCreacion = new Date();
    plan.objetivoNutricional = 'Plan de alimentación manual';
    plan.socio = socio as unknown as PlanAlimentacionOrmEntity['socio'];
    plan.nutricionista = nutricionista as unknown as PlanAlimentacionOrmEntity['nutricionista'];
    plan.eliminadoEn = null;
    plan.motivoEliminacion = null;
    plan.motivoEdicion = null;
    plan.ultimaEdicion = null;

    const planGuardado = await this.planRepo.save(plan);

    const estructuraVacia: PlanAlimentacionDatosJson['estructura'] = (
      Object.values(DiaSemana) as DiaSemana[]
    ).map((dia) => ({
      dia,
      comidas: (['DESAYUNO', 'ALMUERZO', 'MERIENDA', 'CENA'] as TipoComida[]).map(
        (tipo) => ({
          tipo,
          alternativas: [],
        }),
      ),
    }));

    const macrosPorDia = estructuraVacia.reduce<
      Record<string, { calorias: number; proteinas: number; carbohidratos: number; grasas: number }>
    >((acc, d) => {
      acc[d.dia] = { calorias: 0, proteinas: 0, carbohidratos: 0, grasas: 0 };
      return acc;
    }, {});

    const datosJson: PlanAlimentacionDatosJson = {
      estructura: estructuraVacia,
      macrosPorDia: macrosPorDia as PlanAlimentacionDatosJson['macrosPorDia'],
      razonamientoCumplimiento: {
        restriccionesCumplidas: [],
        restriccionesNoCumplidas: [],
      },
    };

    const versionCreada = await this.planVersionRepo.crear({
      idPlanAlimentacion: planGuardado.idPlanAlimentacion,
      numeroVersion: 1,
      datosJson,
      motivoCambio: 'creacion_inicial',
      activa: true,
      createdBy: nutricionistaUserId,
    });

    const macrosDetallados = Object.values(DiaSemana).reduce<
      Record<string, ResumenMacrosDiaManualDto>
    >((acc, dia) => {
      acc[dia] = this.crearResumenMacrosDiaVacio();
      return acc;
    }, {});

    return {
      planAlimentacionId: planGuardado.idPlanAlimentacion,
      versionId: versionCreada.idPlanAlimentacionVersion,
      numeroVersion: versionCreada.numeroVersion,
      plan: datosJson,
      validacion: {
        restriccionesCumplidas: [],
        restriccionesNoCumplidas: [],
        advertencias: [],
      },
      macros: {
        cumpleEstructura: false,
        diasFaltantes: [],
        comidasFaltantes: [],
        advertencias: [],
        macrosPorDia: macrosDetallados,
        bandaGlobal: 'VERDE',
        puedeAceptar: false,
      },
      advertencias: [],
    };
  }

  private crearResumenMacrosDiaVacio(): ResumenMacrosDiaManualDto {
    const detalleVacio: DetalleMacroManualDto = {
      real: 0,
      objetivo: 0,
      desvio: 0,
      banda: 'VERDE',
    };

    return {
      calorias: 0,
      proteinas: 0,
      carbohidratos: 0,
      grasas: 0,
      desvioPorcentaje: 0,
      banda: 'VERDE',
      detallePorMacro: {
        calorias: detalleVacio,
        proteinas: detalleVacio,
        carbohidratos: detalleVacio,
        grasas: detalleVacio,
      },
    };
  }
}
