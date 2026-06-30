import { Test, TestingModule } from '@nestjs/testing';
import { APP_LOGGER_SERVICE } from 'src/domain/services/logger.service';
import { GenerarIdeasComidaUseCase } from './generar-ideas-comida.use-case';
import {
  AI_PROVIDER_SERVICE,
  IAiProviderService,
} from 'src/domain/services/ai-provider.service';
import { FichaSaludOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/ficha-salud.entity';
import {
  AlimentoOrmEntity,
  PlanAlimentacionOrmEntity,
} from 'src/infrastructure/persistence/typeorm/entities';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SocioOrmEntity } from 'src/infrastructure/persistence/typeorm/entities';
import { TenantContextService } from 'src/infrastructure/auth/tenant-context.service';
import { SOCIO_REPOSITORY } from 'src/domain/entities/Persona/Socio/socio.repository';
import { NUTRICIONISTA_REPOSITORY } from 'src/domain/entities/Persona/Nutricionista/nutricionista.repository';
import { PLAN_ALIMENTACION_VERSION_REPOSITORY } from 'src/domain/repositories/plan-alimentacion-version.repository';
import { RestriccionesValidator } from 'src/application/restricciones/restricciones-validator.service';

const loggerMock = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  verbose: jest.fn(),
} as unknown as jest.Mock;

describe('GenerarIdeasComidaUseCase', () => {
  let sut: GenerarIdeasComidaUseCase;
  let aiProvider: jest.Mocked<IAiProviderService>;
  let fichaRepo: jest.Mocked<Repository<FichaSaludOrmEntity>>;
  let planRepo: jest.Mocked<Repository<PlanAlimentacionOrmEntity>>;
  let alimentoRepo: jest.Mocked<Repository<AlimentoOrmEntity>>;

  const planBase = {
    idPlanAlimentacion: 1,
    activo: true,
    nutricionista: { idPersona: 5 },
    socio: { idPersona: 50 },
  } as unknown as PlanAlimentacionOrmEntity;

  const fichaBase = {
    idFichaSalud: 1,
    alergias: [],
    restriccionesAlimentarias: null,
    patologias: [],
    medicacionActual: null,
    suplementosActuales: null,
  } as unknown as FichaSaludOrmEntity;

  beforeEach(async () => {
    aiProvider = {
      generarRecomendacion: jest.fn(),
      verificarConexion: jest.fn(),
    } as never;
    fichaRepo = { findOne: jest.fn() } as never;
    planRepo = { findOne: jest.fn() } as never;
    alimentoRepo = {
      find: jest.fn().mockResolvedValue([
        { idAlimento: 1, nombre: 'Avena' },
        { idAlimento: 2, nombre: 'Huevo' },
        { idAlimento: 3, nombre: 'Maní' },
        { idAlimento: 4, nombre: 'Yogur natural' },
        { idAlimento: 5, nombre: 'Banana' },
        { idAlimento: 6, nombre: 'Manzana' },
      ]),
    } as never;
    const socioRepo = { findOne: jest.fn() } as never;
    const nutriRepo = { findById: jest.fn() } as never;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GenerarIdeasComidaUseCase,
        RestriccionesValidator,
        { provide: AI_PROVIDER_SERVICE, useValue: aiProvider },
        {
          provide: getRepositoryToken(PlanAlimentacionOrmEntity),
          useValue: planRepo,
        },
        {
          provide: getRepositoryToken(FichaSaludOrmEntity),
          useValue: fichaRepo,
        },
        {
          provide: getRepositoryToken(AlimentoOrmEntity),
          useValue: alimentoRepo,
        },
        { provide: getRepositoryToken(SocioOrmEntity), useValue: socioRepo },
        { provide: NUTRICIONISTA_REPOSITORY, useValue: nutriRepo },
        { provide: SOCIO_REPOSITORY, useValue: socioRepo },
        { provide: PLAN_ALIMENTACION_VERSION_REPOSITORY, useValue: {} },
        { provide: TenantContextService, useValue: {} },
        { provide: APP_LOGGER_SERVICE, useValue: loggerMock },
      ],
    }).compile();

    sut = module.get(GenerarIdeasComidaUseCase);
  });

  it('normaliza alternativas cuando la IA responde con la clave del contrato del editor', async () => {
    planRepo.findOne.mockResolvedValue(planBase);
    fichaRepo.findOne.mockResolvedValue(fichaBase);
    aiProvider.generarRecomendacion.mockResolvedValue({
      alternativas: [
        {
          nombre: 'Avena con banana',
          alimentos: [
            {
              alimentoId: 1,
              cantidad: 50,
              unidad: 'g',
              nombre: 'Avena',
            },
          ],
          calorias: 330,
          proteinas: 11,
          carbohidratos: 58,
          grasas: 7,
        },
      ],
    });

    const respuesta = await sut.execute(
      { personaId: 5, gimnasioId: 1, rol: 'NUTRICIONISTA' } as never,
      {
        planAlimentacionId: 1,
        dia: 'LUNES',
        tipoComida: 'DESAYUNO',
        cantidadAlternativas: 1,
      } as never,
    );

    expect(respuesta.alternativas).toHaveLength(1);
    expect(respuesta.alternativas[0]).toMatchObject({
      nombre: 'Avena con banana',
      alimentos: [
        expect.objectContaining({
          alimentoNombre: 'Avena',
          nombre: 'Avena',
        }),
      ],
    });
  });

  it('resuelve alimentos generados por nombre a ids reales del catalogo', async () => {
    planRepo.findOne.mockResolvedValue(planBase);
    fichaRepo.findOne.mockResolvedValue(fichaBase);
    alimentoRepo.find.mockResolvedValue([
      {
        idAlimento: 77,
        nombre: 'Avena',
        cantidad: 100,
        unidadMedida: 'g',
      } as unknown as AlimentoOrmEntity,
    ]);
    aiProvider.generarRecomendacion.mockResolvedValue({
      alternativas: [
        {
          nombre: 'Avena con frutas',
          alimentos: [
            {
              cantidad: 50,
              unidad: 'g',
              alimentoNombre: 'Avena',
            },
          ],
          calorias: 330,
          proteinas: 11,
          carbohidratos: 58,
          grasas: 7,
        },
      ],
    });

    const respuesta = await sut.execute(
      { personaId: 5, gimnasioId: 1, rol: 'NUTRICIONISTA' } as never,
      {
        planAlimentacionId: 1,
        dia: 'LUNES',
        tipoComida: 'DESAYUNO',
        cantidadAlternativas: 1,
      } as never,
    );

    expect(respuesta.alternativas[0].alimentos[0]).toMatchObject({
      alimentoId: 77,
      alimentoNombre: 'Avena',
      nombre: 'Avena',
    });
  });

  it('no confia en ids positivos inventados por la IA cuando el nombre no existe en catalogo', async () => {
    planRepo.findOne.mockResolvedValue(planBase);
    fichaRepo.findOne.mockResolvedValue(fichaBase);
    alimentoRepo.find.mockResolvedValue([
      {
        idAlimento: 123,
        nombre: 'Huevo',
        cantidad: 1,
        unidadMedida: 'unidad',
      } as unknown as AlimentoOrmEntity,
    ]);
    aiProvider.generarRecomendacion.mockResolvedValue({
      alternativas: [
        {
          nombre: 'Plátano con yogur',
          alimentos: [
            {
              alimentoId: 123,
              cantidad: 100,
              unidad: 'g',
              alimentoNombre: 'Plátano',
            },
          ],
          calorias: 180,
          proteinas: 8,
          carbohidratos: 30,
          grasas: 3,
        },
      ],
    });

    await expect(
      sut.execute(
        { personaId: 5, gimnasioId: 1, rol: 'NUTRICIONISTA' } as never,
        {
          planAlimentacionId: 1,
          dia: 'LUNES',
          tipoComida: 'DESAYUNO',
          cantidadAlternativas: 1,
        } as never,
      ),
    ).rejects.toMatchObject({ errorCode: 'BAD_REQUEST' });
  });

  it('resuelve sinonimos y plurales comunes contra nombres canonicos del catalogo', async () => {
    planRepo.findOne.mockResolvedValue(planBase);
    fichaRepo.findOne.mockResolvedValue(fichaBase);
    alimentoRepo.find.mockResolvedValue([
      { idAlimento: 5, nombre: 'Banana' } as unknown as AlimentoOrmEntity,
      { idAlimento: 2, nombre: 'Huevo' } as unknown as AlimentoOrmEntity,
    ]);
    aiProvider.generarRecomendacion.mockResolvedValue({
      alternativas: [
        {
          nombre: 'Banana con huevo',
          alimentos: [
            {
              alimentoId: 999,
              cantidad: 1,
              unidad: 'unidad',
              alimentoNombre: 'Plátano',
            },
            {
              alimentoId: 998,
              cantidad: 1,
              unidad: 'unidad',
              alimentoNombre: 'Huevos',
            },
          ],
          calorias: 183,
          proteinas: 8,
          carbohidratos: 28,
          grasas: 5,
        },
      ],
    });

    const respuesta = await sut.execute(
      { personaId: 5, gimnasioId: 1, rol: 'NUTRICIONISTA' } as never,
      {
        planAlimentacionId: 1,
        dia: 'LUNES',
        tipoComida: 'DESAYUNO',
        cantidadAlternativas: 1,
      } as never,
    );

    expect(respuesta.alternativas[0].alimentos).toEqual([
      expect.objectContaining({ alimentoId: 5, alimentoNombre: 'Banana' }),
      expect.objectContaining({ alimentoId: 2, alimentoNombre: 'Huevo' }),
    ]);
  });

  it('reemplaza nombres genericos de la IA por nombres descriptivos basados en alimentos', async () => {
    planRepo.findOne.mockResolvedValue(planBase);
    fichaRepo.findOne.mockResolvedValue(fichaBase);
    alimentoRepo.find.mockResolvedValue([
      {
        idAlimento: 4,
        nombre: 'Yogur natural',
      } as unknown as AlimentoOrmEntity,
      { idAlimento: 6, nombre: 'Manzana' } as unknown as AlimentoOrmEntity,
    ]);
    aiProvider.generarRecomendacion.mockResolvedValue({
      alternativas: [
        {
          nombre: 'Desayuno 1',
          alimentos: [
            {
              cantidad: 200,
              unidad: 'g',
              alimentoNombre: 'Yogur natural',
            },
            {
              cantidad: 1,
              unidad: 'unidad',
              alimentoNombre: 'Manzana',
            },
          ],
          calorias: 220,
          proteinas: 20,
          carbohidratos: 30,
          grasas: 8,
        },
      ],
    });

    const respuesta = await sut.execute(
      { personaId: 5, gimnasioId: 1, rol: 'NUTRICIONISTA' } as never,
      {
        planAlimentacionId: 1,
        dia: 'LUNES',
        tipoComida: 'DESAYUNO',
        cantidadAlternativas: 1,
      } as never,
    );

    expect(respuesta.alternativas[0].nombre).toBe('Yogur natural con Manzana');
  });

  it('envia un schema explicito al provider para evitar respuestas con formato ambiguo', async () => {
    planRepo.findOne.mockResolvedValue(planBase);
    fichaRepo.findOne.mockResolvedValue(fichaBase);
    aiProvider.generarRecomendacion.mockResolvedValue({
      alternativas: [
        {
          nombre: 'Yogur con granola',
          alimentos: [
            {
              alimentoId: 2,
              cantidad: 200,
              unidad: 'g',
              alimentoNombre: 'Yogur natural',
            },
          ],
          calorias: 280,
          proteinas: 16,
          carbohidratos: 35,
          grasas: 8,
        },
      ],
    });

    await sut.execute(
      { personaId: 5, gimnasioId: 1, rol: 'NUTRICIONISTA' } as never,
      {
        planAlimentacionId: 1,
        dia: 'LUNES',
        tipoComida: 'DESAYUNO',
        cantidadAlternativas: 1,
      } as never,
    );

    const llamada = aiProvider.generarRecomendacion.mock.calls[0] as [
      string,
      { schema: { properties: Record<string, unknown> } },
    ];

    expect(llamada[0]).toEqual(expect.any(String));
    expect(llamada[1].schema.properties).toHaveProperty('alternativas');
  });

  it('no devuelve exito vacio si la IA no genera alternativas parseables', async () => {
    planRepo.findOne.mockResolvedValue(planBase);
    fichaRepo.findOne.mockResolvedValue(fichaBase);
    aiProvider.generarRecomendacion.mockResolvedValue({ alternativas: [] });

    await expect(
      sut.execute(
        { personaId: 5, gimnasioId: 1, rol: 'NUTRICIONISTA' } as never,
        {
          planAlimentacionId: 1,
          dia: 'LUNES',
          tipoComida: 'DESAYUNO',
          cantidadAlternativas: 1,
        } as never,
      ),
    ).rejects.toMatchObject({ errorCode: 'BAD_REQUEST' });
  });

  it('retorna alternativas que pasan el filtro de restricciones', async () => {
    const plan = {
      idPlanAlimentacion: 1,
      activo: true,
      nutricionista: { idPersona: 5 },
      socio: { idPersona: 50 },
    } as unknown as PlanAlimentacionOrmEntity;
    const ficha = {
      idFichaSalud: 1,
      alergias: ['Maní'],
      restriccionesAlimentarias: 'vegano',
      patologias: [],
      medicacionActual: null,
      suplementosActuales: null,
    } as unknown as FichaSaludOrmEntity;

    planRepo.findOne.mockResolvedValue(plan);
    fichaRepo.findOne.mockResolvedValue(ficha);
    aiProvider.generarRecomendacion.mockResolvedValue({
      ideas: [
        {
          nombre: 'Avena con frutas',
          alimentos: [
            {
              alimentoId: 1,
              cantidad: 50,
              unidad: 'g',
              alimentoNombre: 'Avena',
            },
          ],
          calorias: 350,
          proteinas: 12,
          carbohidratos: 60,
          grasas: 8,
        },
        {
          nombre: 'Huevos revueltos',
          alimentos: [
            {
              alimentoId: 2,
              cantidad: 2,
              unidad: 'unidad',
              alimentoNombre: 'Huevo',
            },
          ],
          calorias: 200,
          proteinas: 14,
          carbohidratos: 2,
          grasas: 15,
        },
        {
          nombre: 'Maní tostado',
          alimentos: [
            {
              alimentoId: 3,
              cantidad: 30,
              unidad: 'g',
              alimentoNombre: 'Maní',
            },
          ],
          calorias: 180,
          proteinas: 8,
          carbohidratos: 5,
          grasas: 14,
        },
      ],
    });

    const respuesta = await sut.execute(
      { personaId: 5, gimnasioId: 1, rol: 'NUTRICIONISTA' } as never,
      { planAlimentacionId: 1, dia: 'LUNES', tipoComida: 'DESAYUNO' } as never,
    );

    expect(respuesta.alternativas.length).toBeGreaterThan(0);
    // Huevos revueltos descartado por vegano, Maní tostado descartado por alergia
    const nombres = respuesta.alternativas.map((a) => a.nombre);
    expect(nombres).not.toContain('Huevos revueltos');
    expect(nombres).not.toContain('Maní tostado');
  });

  it('rechaza al 400 si el paciente no tiene ficha', async () => {
    const plan = {
      idPlanAlimentacion: 1,
      activo: true,
      nutricionista: { idPersona: 5 },
      socio: { idPersona: 50 },
    } as unknown as PlanAlimentacionOrmEntity;

    planRepo.findOne.mockResolvedValue(plan);
    fichaRepo.findOne.mockResolvedValue(null);

    await expect(
      sut.execute(
        { personaId: 5, gimnasioId: 1, rol: 'NUTRICIONISTA' } as never,
        {
          planAlimentacionId: 1,
          dia: 'LUNES',
          tipoComida: 'DESAYUNO',
        } as never,
      ),
    ).rejects.toMatchObject({ errorCode: 'BAD_REQUEST' });
  });

  it('devuelve 404 si el plan no existe', async () => {
    planRepo.findOne.mockResolvedValue(null);

    await expect(
      sut.execute(
        { personaId: 5, gimnasioId: 1, rol: 'NUTRICIONISTA' } as never,
        {
          planAlimentacionId: 999,
          dia: 'LUNES',
          tipoComida: 'DESAYUNO',
        } as never,
      ),
    ).rejects.toMatchObject({ errorCode: 'NOT_FOUND' });
  });
});
