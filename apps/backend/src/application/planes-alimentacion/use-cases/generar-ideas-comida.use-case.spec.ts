import { Test, TestingModule } from '@nestjs/testing';
import {
  APP_LOGGER_SERVICE,
  IAppLoggerService,
} from 'src/domain/services/logger.service';
import { GenerarIdeasComidaUseCase } from './generar-ideas-comida.use-case';
import {
  AI_PROVIDER_SERVICE,
  IAiProviderService,
} from 'src/domain/services/ai-provider.service';
import { FichaSaludOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/ficha-salud.entity';
import { PlanAlimentacionOrmEntity } from 'src/infrastructure/persistence/typeorm/entities';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SocioOrmEntity, NutricionistaOrmEntity } from 'src/infrastructure/persistence/typeorm/entities';
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

  beforeEach(async () => {
    aiProvider = { generarRecomendacion: jest.fn(), verificarConexion: jest.fn() } as never;
    fichaRepo = { findOne: jest.fn() } as never;
    planRepo = { findOne: jest.fn() } as never;
    const socioRepo = { findOne: jest.fn() } as never;
    const nutriRepo = { findById: jest.fn() } as never;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GenerarIdeasComidaUseCase,
        RestriccionesValidator,
        { provide: AI_PROVIDER_SERVICE, useValue: aiProvider },
        { provide: getRepositoryToken(PlanAlimentacionOrmEntity), useValue: planRepo },
        { provide: getRepositoryToken(FichaSaludOrmEntity), useValue: fichaRepo },
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

    planRepo.findOne!.mockResolvedValue(plan);
    fichaRepo.findOne!.mockResolvedValue(ficha);
    aiProvider.generarRecomendacion.mockResolvedValue({
      ideas: [
        { nombre: 'Avena con frutas', alimentos: [{ alimentoId: 1, cantidad: 50, unidad: 'g', alimentoNombre: 'Avena' }], calorias: 350, proteinas: 12, carbohidratos: 60, grasas: 8 },
        { nombre: 'Huevos revueltos', alimentos: [{ alimentoId: 2, cantidad: 2, unidad: 'unidad', alimentoNombre: 'Huevo' }], calorias: 200, proteinas: 14, carbohidratos: 2, grasas: 15 },
        { nombre: 'Maní tostado', alimentos: [{ alimentoId: 3, cantidad: 30, unidad: 'g', alimentoNombre: 'Maní' }], calorias: 180, proteinas: 8, carbohidratos: 5, grasas: 14 },
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

    planRepo.findOne!.mockResolvedValue(plan);
    fichaRepo.findOne!.mockResolvedValue(null);

    await expect(
      sut.execute(
        { personaId: 5, gimnasioId: 1, rol: 'NUTRICIONISTA' } as never,
        { planAlimentacionId: 1, dia: 'LUNES', tipoComida: 'DESAYUNO' } as never,
      ),
    ).rejects.toMatchObject({ errorCode: 'BAD_REQUEST' });
  });

  it('devuelve 404 si el plan no existe', async () => {
    planRepo.findOne!.mockResolvedValue(null);

    await expect(
      sut.execute(
        { personaId: 5, gimnasioId: 1, rol: 'NUTRICIONISTA' } as never,
        { planAlimentacionId: 999, dia: 'LUNES', tipoComida: 'DESAYUNO' } as never,
      ),
    ).rejects.toMatchObject({ errorCode: 'NOT_FOUND' });
  });
});
