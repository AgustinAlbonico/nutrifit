/**
 * Spec de ListarPlanesActivosSocioUseCase (Hotfix Packet 8)
 * =========================================================
 *
 * Cobertura:
 * - 0 planes activos del socio → array vacío [].
 * - 1 plan activo → array con 1 elemento (1 nutricionista).
 * - N planes activos → array con N elementos (N nutricionistas distintos).
 * - 404 si el socio no existe.
 * - 404 si el socio no pertenece al gimnasio del contexto.
 * - Plan sin versión activa → se omite del resultado.
 * - Multi-tenant: filtra por tenantContext.gimnasioId.
 * - Validación del shape del DTO (idPlanAlimentacion, versionId,
 *   nutricionistaId, nutricionistaNombre, plan, validacion).
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ListarPlanesActivosSocioUseCase } from './listar-planes-activos-socio.use-case';
import {
  PlanAlimentacionOrmEntity,
  SocioOrmEntity,
} from 'src/infrastructure/persistence/typeorm/entities';
import {
  PlanAlimentacionVersionRepository,
  PLAN_ALIMENTACION_VERSION_REPOSITORY,
} from 'src/domain/repositories/plan-alimentacion-version.repository';
import { TenantContextService } from 'src/infrastructure/auth/tenant-context.service';
import { NotFoundError } from 'src/domain/exceptions/custom-exceptions';
import { PlanAlimentacionVersionEntity } from 'src/domain/entities/PlanAlimentacionVersion/plan-alimentacion-version.entity';
import { PlanAlimentacionDatosJson } from 'src/domain/entities/PlanAlimentacionVersion/plan-alimentacion-datos-json';
import { DiaSemana } from 'src/domain/entities/DiaPlan/DiaSemana';
import { TipoComida } from 'src/domain/entities/OpcionComida/TipoComida';

const tenantContextMock = {
  gimnasioId: 10,
  isInitialized: true,
} as unknown as TenantContextService;

/**
 * Helper: crea un `macrosPorDia` con los 7 días inicializados al mismo
 * valor. Útil para que el type-checker no se queje de que `Record<...>`
 * requiere todos los días.
 */
function macrosPorDiaTodosDias(calorias: number): PlanAlimentacionDatosJson['macrosPorDia'] {
  return Object.values(DiaSemana).reduce<
    Record<DiaSemana, { calorias: number; proteinas: number; carbohidratos: number; grasas: number }>
  >(
    (acc, dia) => {
      acc[dia as DiaSemana] = {
        calorias,
        proteinas: 100,
        carbohidratos: 250,
        grasas: 70,
      };
      return acc;
    },
    {} as Record<DiaSemana, { calorias: number; proteinas: number; carbohidratos: number; grasas: number }>,
  );
}

const planJsonValido: PlanAlimentacionDatosJson = {
  estructura: [
    {
      dia: DiaSemana.LUNES,
      comidas: [
        {
          tipo: TipoComida.DESAYUNO,
          alternativas: [
            {
              nombre: 'Avena',
              alimentos: [{ alimentoId: 1, cantidad: 100, unidad: 'g' }],
              calorias: 500,
              proteinas: 25,
              carbohidratos: 60,
              grasas: 12,
            },
          ],
        },
        {
          tipo: TipoComida.ALMUERZO,
          alternativas: [
            {
              nombre: 'Pollo con quinoa',
              alimentos: [{ alimentoId: 2, cantidad: 200, unidad: 'g' }],
              calorias: 500,
              proteinas: 31,
              carbohidratos: 63,
              grasas: 14,
            },
          ],
        },
        {
          tipo: TipoComida.MERIENDA,
          alternativas: [
            {
              nombre: 'Frutas',
              alimentos: [{ alimentoId: 3, cantidad: 100, unidad: 'g' }],
              calorias: 500,
              proteinas: 25,
              carbohidratos: 65,
              grasas: 14,
            },
          ],
        },
        {
          tipo: TipoComida.CENA,
          alternativas: [
            {
              nombre: 'Sopa',
              alimentos: [{ alimentoId: 4, cantidad: 200, unidad: 'g' }],
              calorias: 500,
              proteinas: 19,
              carbohidratos: 62,
              grasas: 16,
            },
          ],
        },
      ],
    },
  ],
  macrosPorDia: macrosPorDiaTodosDias(2000),
  razonamientoCumplimiento: {
    restriccionesCumplidas: [
      { restriccion: 'vegano', detalle: 'Cumplido' },
    ],
    restriccionesNoCumplidas: [],
  },
};

describe('ListarPlanesActivosSocioUseCase', () => {
  let useCase: ListarPlanesActivosSocioUseCase;
  let planRepoMock: jest.Mocked<Repository<PlanAlimentacionOrmEntity>>;
  let socioRepoMock: jest.Mocked<Repository<SocioOrmEntity>>;
  let planVersionRepoMock: jest.Mocked<PlanAlimentacionVersionRepository>;

  beforeEach(async () => {
    planRepoMock = {
      find: jest.fn(),
    } as unknown as jest.Mocked<Repository<PlanAlimentacionOrmEntity>>;

    socioRepoMock = {
      findOne: jest.fn(),
    } as unknown as jest.Mocked<Repository<SocioOrmEntity>>;

    planVersionRepoMock = {
      obtenerActiva: jest.fn(),
    } as unknown as jest.Mocked<PlanAlimentacionVersionRepository>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ListarPlanesActivosSocioUseCase,
        { provide: getRepositoryToken(PlanAlimentacionOrmEntity), useValue: planRepoMock },
        { provide: getRepositoryToken(SocioOrmEntity), useValue: socioRepoMock },
        {
          provide: PLAN_ALIMENTACION_VERSION_REPOSITORY,
          useValue: planVersionRepoMock,
        },
        { provide: TenantContextService, useValue: tenantContextMock },
      ],
    }).compile();

    useCase = module.get<ListarPlanesActivosSocioUseCase>(
      ListarPlanesActivosSocioUseCase,
    );
  });

  function setupSocioMock() {
    socioRepoMock.findOne.mockResolvedValue({
      idPersona: 50,
      gimnasioId: 10,
    } as SocioOrmEntity);
  }

  it('socio no existe → throw NotFoundError', async () => {
    socioRepoMock.findOne.mockResolvedValue(null);

    await expect(useCase.execute(999)).rejects.toBeInstanceOf(NotFoundError);
    await expect(useCase.execute(999)).rejects.toThrow(/Socio/);
  });

  it('socio no pertenece al gimnasio del contexto → throw NotFoundError', async () => {
    socioRepoMock.findOne.mockResolvedValue(null);

    await expect(useCase.execute(50)).rejects.toBeInstanceOf(NotFoundError);
  });

  it('socio existe pero sin planes activos → array vacío []', async () => {
    setupSocioMock();
    planRepoMock.find.mockResolvedValue([]);

    const resultado = await useCase.execute(50);

    expect(resultado).toEqual([]);
    expect(resultado).toHaveLength(0);
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(planVersionRepoMock.obtenerActiva).not.toHaveBeenCalled();
  });

  it('1 plan activo (1 nutricionista) → array con 1 elemento', async () => {
    setupSocioMock();

    const planActivo: Partial<PlanAlimentacionOrmEntity> = {
      idPlanAlimentacion: 100,
      fechaCreacion: new Date('2026-06-01'),
      objetivoNutricional: 'Plan para bajar de peso',
      activo: true,
      estado: 'ACTIVO',
      socio: { idPersona: 50, gimnasioId: 10 } as never,
      nutricionista: {
        idPersona: 200,
        nombre: 'María',
        apellido: 'García',
      } as never,
    };

    planRepoMock.find.mockResolvedValue([
      planActivo as unknown as PlanAlimentacionOrmEntity,
    ]);

    planVersionRepoMock.obtenerActiva.mockResolvedValue(
      new PlanAlimentacionVersionEntity(
        555,
        100,
        1,
        planJsonValido,
        'creacion_inicial',
        true,
        new Date(),
        200,
      ),
    );

    const resultado = await useCase.execute(50);

    expect(resultado).toHaveLength(1);
    expect(resultado[0]).toMatchObject({
      idPlanAlimentacion: 100,
      versionId: 555,
      numeroVersion: 1,
      nutricionistaId: 200,
      nutricionistaNombre: 'María García',
      objetivoNutricional: 'Plan para bajar de peso',
      fechaInicio: new Date('2026-06-01').toISOString(),
    });
    expect(resultado[0].plan).toEqual(planJsonValido);
    expect(resultado[0].validacion).toEqual({
      restriccionesCumplidas: 1,
      restriccionesNoCumplidas: 0,
      bandaGlobal: 'VERDE',
    });

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(planRepoMock.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          activo: true,
          estado: 'ACTIVO',
          socio: expect.objectContaining({
            idPersona: 50,
            gimnasioId: 10,
          }),
        }),
      }),
    );
  });

  it('2 planes activos (2 nutricionistas distintos) → array con 2 elementos', async () => {
    setupSocioMock();

    const planNUT1: Partial<PlanAlimentacionOrmEntity> = {
      idPlanAlimentacion: 100,
      fechaCreacion: new Date('2026-06-01'),
      objetivoNutricional: 'Plan NUT 1',
      activo: true,
      estado: 'ACTIVO',
      socio: { idPersona: 50, gimnasioId: 10 } as never,
      nutricionista: {
        idPersona: 200,
        nombre: 'María',
        apellido: 'García',
      } as never,
    };

    const planNUT2: Partial<PlanAlimentacionOrmEntity> = {
      idPlanAlimentacion: 101,
      fechaCreacion: new Date('2026-06-15'),
      objetivoNutricional: 'Plan NUT 2',
      activo: true,
      estado: 'ACTIVO',
      socio: { idPersona: 50, gimnasioId: 10 } as never,
      nutricionista: {
        idPersona: 300,
        nombre: 'Juan',
        apellido: 'Pérez',
      } as never,
    };

    planRepoMock.find.mockResolvedValue([
      planNUT1 as unknown as PlanAlimentacionOrmEntity,
      planNUT2 as unknown as PlanAlimentacionOrmEntity,
    ]);

    planVersionRepoMock.obtenerActiva
      .mockResolvedValueOnce(
        new PlanAlimentacionVersionEntity(
          555,
          100,
          1,
          planJsonValido,
          'creacion_inicial',
          true,
          new Date(),
          200,
        ),
      )
      .mockResolvedValueOnce(
        new PlanAlimentacionVersionEntity(
          666,
          101,
          2,
          planJsonValido,
          'regeneracion_completa',
          true,
          new Date(),
          300,
        ),
      );

    const resultado = await useCase.execute(50);

    expect(resultado).toHaveLength(2);
    expect(resultado[0].nutricionistaId).toBe(200);
    expect(resultado[0].nutricionistaNombre).toBe('María García');
    expect(resultado[0].idPlanAlimentacion).toBe(100);
    expect(resultado[0].versionId).toBe(555);
    expect(resultado[1].nutricionistaId).toBe(300);
    expect(resultado[1].nutricionistaNombre).toBe('Juan Pérez');
    expect(resultado[1].idPlanAlimentacion).toBe(101);
    expect(resultado[1].versionId).toBe(666);

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(planVersionRepoMock.obtenerActiva).toHaveBeenCalledTimes(2);
  });

  it('plan activo pero sin versión activa → se omite del resultado', async () => {
    setupSocioMock();

    const planActivo: Partial<PlanAlimentacionOrmEntity> = {
      idPlanAlimentacion: 100,
      fechaCreacion: new Date('2026-06-01'),
      objetivoNutricional: 'Plan huérfano',
      activo: true,
      estado: 'ACTIVO',
      socio: { idPersona: 50, gimnasioId: 10 } as never,
      nutricionista: {
        idPersona: 200,
        nombre: 'María',
        apellido: 'García',
      } as never,
    };

    planRepoMock.find.mockResolvedValue([
      planActivo as unknown as PlanAlimentacionOrmEntity,
    ]);
    planVersionRepoMock.obtenerActiva.mockResolvedValue(null);

    const resultado = await useCase.execute(50);

    expect(resultado).toEqual([]);
  });

  it('multi-tenant: filtra por tenantContext.gimnasioId en la query', async () => {
    setupSocioMock();
    planRepoMock.find.mockResolvedValue([]);

    await useCase.execute(50);

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(planRepoMock.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          socio: expect.objectContaining({ gimnasioId: 10 }),
        }),
      }),
    );
  });

  it('shape del DTO: incluye todos los campos esperados (PlanSocioActivoDTO)', async () => {
    setupSocioMock();

    planRepoMock.find.mockResolvedValue([
      {
        idPlanAlimentacion: 100,
        fechaCreacion: new Date('2026-06-01'),
        objetivoNutricional: 'Test',
        activo: true,
        estado: 'ACTIVO',
        socio: { idPersona: 50, gimnasioId: 10 } as never,
        nutricionista: {
          idPersona: 200,
          nombre: 'María',
          apellido: 'García',
        } as never,
      } as unknown as PlanAlimentacionOrmEntity,
    ]);
    planVersionRepoMock.obtenerActiva.mockResolvedValue(
      new PlanAlimentacionVersionEntity(
        555,
        100,
        1,
        planJsonValido,
        'creacion_inicial',
        true,
        new Date(),
        200,
      ),
    );

    const resultado = await useCase.execute(50);

    const dto = resultado[0];
    expect(dto).toHaveProperty('idPlanAlimentacion');
    expect(dto).toHaveProperty('versionId');
    expect(dto).toHaveProperty('numeroVersion');
    expect(dto).toHaveProperty('nutricionistaId');
    expect(dto).toHaveProperty('nutricionistaNombre');
    expect(dto).toHaveProperty('fechaInicio');
    expect(dto).toHaveProperty('plan');
    expect(dto).toHaveProperty('objetivoNutricional');
    expect(dto).toHaveProperty('validacion');
    expect(dto.validacion).toHaveProperty('restriccionesCumplidas');
    expect(dto.validacion).toHaveProperty('restriccionesNoCumplidas');
    expect(dto.validacion).toHaveProperty('bandaGlobal');
  });

  it('cálculo de bandaGlobal: macros con calorias >10% arriba del target → ROJO', async () => {
    setupSocioMock();

    // 2500 kcal/día vs target 2000 → desvío = 25% > 10% → ROJO
    const planJsonRojo: PlanAlimentacionDatosJson = {
      estructura: planJsonValido.estructura,
      macrosPorDia: macrosPorDiaTodosDias(2500),
      razonamientoCumplimiento: {
        restriccionesCumplidas: [],
        restriccionesNoCumplidas: [],
      },
    };

    planRepoMock.find.mockResolvedValue([
      {
        idPlanAlimentacion: 100,
        fechaCreacion: new Date('2026-06-01'),
        objetivoNutricional: 'Plan rojo',
        activo: true,
        estado: 'ACTIVO',
        socio: { idPersona: 50, gimnasioId: 10 } as never,
        nutricionista: {
          idPersona: 200,
          nombre: 'M',
          apellido: 'G',
        } as never,
      } as unknown as PlanAlimentacionOrmEntity,
    ]);
    planVersionRepoMock.obtenerActiva.mockResolvedValue(
      new PlanAlimentacionVersionEntity(
        555,
        100,
        1,
        planJsonRojo,
        'creacion_inicial',
        true,
        new Date(),
        200,
      ),
    );

    const resultado = await useCase.execute(50);

    expect(resultado[0].validacion.bandaGlobal).toBe('ROJO');
  });
});