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

  const crearMedicion = (
    sobrescrituras: Partial<MedicionOrmEntity>,
  ): MedicionOrmEntity =>
    ({
      idMedicion: 1,
      createdAt: new Date('2026-01-10T10:00:00.000Z'),
      peso: 80,
      altura: 180,
      imc: 24.7,
      perimetroCintura: 80,
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
      ...sobrescrituras,
    }) as MedicionOrmEntity;

  const configurarDatos = async (
    genero: Genero | null | undefined,
    mediciones: MedicionOrmEntity[],
  ) => {
    const useCase = await buildUseCase();
    (useCase as unknown as { socioRepository: { findOne: jest.Mock } }).socioRepository.findOne.mockResolvedValue(
      socioConGenero(genero),
    );
    (useCase as unknown as { medicionRepository: { createQueryBuilder: jest.Mock } }).medicionRepository.createQueryBuilder().getMany.mockResolvedValue(
      mediciones,
    );

    return useCase;
  };

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

  it('incluye alerta critica cuando el riesgo cardiovascular actual es alto', async () => {
    const useCase = await configurarDatos(Genero.Masculino, [
      crearMedicion({ idMedicion: 1 }),
      crearMedicion({
        idMedicion: 2,
        createdAt: new Date('2026-06-15T10:00:00.000Z'),
        perimetroCintura: 102,
        perimetroCadera: 100,
      }),
    ]);

    const resultado = await useCase.execute(1);

    expect(resultado.alertasClinicas).toContainEqual({
      severidad: 'critica',
      titulo: 'Riesgo cardiovascular alto',
      mensaje: 'La relacion cintura/cadera actual indica riesgo cardiovascular alto.',
      metrica: 'relacion_cintura_cadera',
      valor: 1.02,
    });
  });

  it('incluye alerta importante cuando el IMC actual esta en obesidad', async () => {
    const useCase = await configurarDatos(Genero.Femenino, [
      crearMedicion({ idMedicion: 1, imc: 28, peso: 90 }),
      crearMedicion({
        idMedicion: 2,
        createdAt: new Date('2026-06-15T10:00:00.000Z'),
        imc: 31.2,
        peso: 101,
      }),
    ]);

    const resultado = await useCase.execute(1);

    expect(resultado.alertasClinicas).toContainEqual({
      severidad: 'importante',
      titulo: 'IMC en rango de obesidad',
      mensaje: 'El IMC actual esta en rango de obesidad y requiere seguimiento clinico.',
      metrica: 'imc',
      valor: 31.2,
    });
  });

  it('incluye alerta informativa cuando el peso cambia rapido entre mediciones', async () => {
    const useCase = await configurarDatos(Genero.Femenino, [
      crearMedicion({ idMedicion: 1, peso: 82, imc: 25.3 }),
      crearMedicion({
        idMedicion: 2,
        createdAt: new Date('2026-06-15T10:00:00.000Z'),
        peso: 76.8,
        imc: 23.7,
      }),
    ]);

    const resultado = await useCase.execute(1);

    expect(resultado.alertasClinicas).toContainEqual({
      severidad: 'informativa',
      titulo: 'Cambio de peso acelerado',
      mensaje: 'El peso cambio 5.2 kg respecto de la medicion anterior.',
      metrica: 'peso',
      valor: -5.2,
    });
  });

  it('incluye alerta critica cuando la tension arterial actual es elevada', async () => {
    const useCase = await configurarDatos(Genero.Masculino, [
      crearMedicion({ idMedicion: 1 }),
      crearMedicion({
        idMedicion: 2,
        createdAt: new Date('2026-06-15T10:00:00.000Z'),
        tensionSistolica: 142,
        tensionDiastolica: 94,
      }),
    ]);

    const resultado = await useCase.execute(1);

    expect(resultado.alertasClinicas).toContainEqual({
      severidad: 'critica',
      titulo: 'Tension arterial elevada',
      mensaje: 'La ultima medicion registra 142/94 mmHg.',
      metrica: 'tension_arterial',
      valor: 142,
    });
  });
});
