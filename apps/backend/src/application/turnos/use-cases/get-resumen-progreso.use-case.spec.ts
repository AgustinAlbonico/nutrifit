import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TenantContextService } from 'src/infrastructure/auth/tenant-context.service';
import { Genero } from 'src/domain/entities/Persona/Genero';
import { MedicionOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/medicion.entity';
import { SocioOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/persona.entity';
import { NotFoundError } from 'src/domain/exceptions/custom-exceptions';
import { GetResumenProgresoUseCase } from './get-resumen-progreso.use-case';

describe('GetResumenProgresoUseCase - Riesgo Cardiovascular por genero', () => {
  const buildUseCase = async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetResumenProgresoUseCase,
          {
            provide: getRepositoryToken(MedicionOrmEntity),
            useValue: {
              createQueryBuilder: jest.fn().mockReturnValue({
                innerJoin: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                getMany: jest.fn().mockResolvedValue([]),
              }),
            },
          },
        {
          provide: getRepositoryToken(SocioOrmEntity),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: TenantContextService,
          useValue: {
            gimnasioId: 1,
          },
        },
      ],
    }).compile();

    return module.get(GetResumenProgresoUseCase);
  };

  const socioConGenero = (genero: Genero | null | undefined) =>
    ({
      idPersona: 1,
      genero,
      fichaSalud: { altura: 180 },
    }) as never;

  it.each([
    { genero: Genero.Masculino, relacion: 0.89, esperado: 'bajo' },
    { genero: Genero.Masculino, relacion: 0.95, esperado: 'moderado' },
    { genero: Genero.Masculino, relacion: 1.01, esperado: 'alto' },
    { genero: Genero.Femenino, relacion: 0.79, esperado: 'bajo' },
    { genero: Genero.Femenino, relacion: 0.85, esperado: 'moderado' },
    { genero: Genero.Femenino, relacion: 0.91, esperado: 'alto' },
  ])(
    'clasifica correctamente por sexo y relacion ($genero, $relacion)',
    async ({ genero, relacion, esperado }) => {
      const useCase = await buildUseCase();
      (useCase as unknown as { socioRepository: { findOne: jest.Mock } }).socioRepository.findOne.mockResolvedValue(
        socioConGenero(genero),
      );
      (useCase as unknown as { medicionRepository: { createQueryBuilder: jest.Mock } }).medicionRepository.createQueryBuilder().getMany.mockResolvedValue(
        [
          {
            idMedicion: 1,
            createdAt: new Date('2026-01-10T10:00:00.000Z'),
            peso: 80,
            altura: 180,
            imc: 24.7,
            perimetroCintura: 95,
            perimetroCadera: 100,
            perimetroBrazo: 32,
            perimetroMuslo: 58,
            perimetroPecho: 100,
            pliegueTriceps: null,
            pliegueAbdominal: null,
            pliegueMuslo: null,
            porcentajeGrasa: null,
            masaMagra: null,
            frecuenciaCardiaca: null,
            tensionSistolica: null,
            tensionDiastolica: null,
            notasMedicion: null,
            turno: { nutricionista: { idPersona: 5 } },
          },
          {
            idMedicion: 2,
            createdAt: new Date('2026-06-15T10:00:00.000Z'),
            peso: 78,
            altura: 180,
            imc: 24.1,
            perimetroCintura: relacion,
            perimetroCadera: 1,
            perimetroBrazo: 32,
            perimetroMuslo: 58,
            perimetroPecho: 100,
            pliegueTriceps: null,
            pliegueAbdominal: null,
            pliegueMuslo: null,
            porcentajeGrasa: null,
            masaMagra: null,
            frecuenciaCardiaca: null,
            tensionSistolica: null,
            tensionDiastolica: null,
            notasMedicion: null,
            turno: { nutricionista: { idPersona: 5 } },
          },
        ],
      );

      const resultado = await useCase.execute(1);
      expect(resultado.relacionCinturaCadera.riesgoCardiovascular).toBe(esperado);
    },
  );

  it('no clasifica el riesgo cuando el genero es OTRO', async () => {
    const useCase = await buildUseCase();
    (useCase as unknown as { socioRepository: { findOne: jest.Mock } }).socioRepository.findOne.mockResolvedValue(
      socioConGenero(Genero.Otro),
    );
    (useCase as unknown as { medicionRepository: { createQueryBuilder: jest.Mock } }).medicionRepository.createQueryBuilder().getMany.mockResolvedValue(
      [
        {
          idMedicion: 1,
          createdAt: new Date('2026-06-15T10:00:00.000Z'),
          peso: 80,
          altura: 180,
          imc: 24.7,
          perimetroCintura: 95,
          perimetroCadera: 100,
          perimetroBrazo: 32,
          perimetroMuslo: 58,
          perimetroPecho: 100,
          pliegueTriceps: null,
          pliegueAbdominal: null,
          pliegueMuslo: null,
          porcentajeGrasa: null,
          masaMagra: null,
          frecuenciaCardiaca: null,
          tensionSistolica: null,
          tensionDiastolica: null,
          notasMedicion: null,
          turno: { nutricionista: { idPersona: 5 } },
        },
      ],
    );

    const resultado = await useCase.execute(1);
    expect(resultado.relacionCinturaCadera.riesgoCardiovascular).toBeNull();
  });

  it('no clasifica el riesgo cuando el genero es null', async () => {
    const useCase = await buildUseCase();
    (useCase as unknown as { socioRepository: { findOne: jest.Mock } }).socioRepository.findOne.mockResolvedValue(
      socioConGenero(null),
    );
    (useCase as unknown as { medicionRepository: { createQueryBuilder: jest.Mock } }).medicionRepository.createQueryBuilder().getMany.mockResolvedValue(
      [
        {
          idMedicion: 1,
          createdAt: new Date('2026-06-15T10:00:00.000Z'),
          peso: 80,
          altura: 180,
          imc: 24.7,
          perimetroCintura: 95,
          perimetroCadera: 100,
          perimetroBrazo: 32,
          perimetroMuslo: 58,
          perimetroPecho: 100,
          pliegueTriceps: null,
          pliegueAbdominal: null,
          pliegueMuslo: null,
          porcentajeGrasa: null,
          masaMagra: null,
          frecuenciaCardiaca: null,
          tensionSistolica: null,
          tensionDiastolica: null,
          notasMedicion: null,
          turno: { nutricionista: { idPersona: 5 } },
        },
      ],
    );

    const resultado = await useCase.execute(1);
    expect(resultado.relacionCinturaCadera.riesgoCardiovascular).toBeNull();
  });
});
