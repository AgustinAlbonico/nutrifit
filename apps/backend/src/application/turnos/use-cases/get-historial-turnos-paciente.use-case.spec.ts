import { NotFoundError, ForbiddenError } from 'src/domain/exceptions/custom-exceptions';
import { EstadoTurno } from 'src/domain/entities/Turno/EstadoTurno';
import { TurnoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities';

describe('GetHistorialTurnosPacienteUseCase (TDD)', () => {
  // Casos cubiertos:
  // 1. Ordena desc por fecha+hora y expone flags clinicos.
  // 2. Filtra por la dupla nutricionista+socio dentro del gimnasio.
  // 3. Lanza NotFound si el nutricionista no existe.
  // 4. Lanza NotFound si el socio no existe.
  // 5. Lanza Forbidden si no hay vinculo previo (cualquier estado).
  // 6. Incluye turnos en cualquier estado (no solo cerradas).

  const makeTurno = (overrides: Record<string, unknown>): TurnoOrmEntity =>
    ({
      idTurno: 1,
      fechaTurno: new Date('2026-06-15T03:00:00.000Z'),
      horaTurno: '10:00',
      estadoTurno: EstadoTurno.PROGRAMADO,
      mediciones: [],
      observacionClinica: null,
      adjuntos: [],
      ...overrides,
    }) as unknown as TurnoOrmEntity;

  const buildUseCase = async () => {
    const turnoRepository = {
      find: jest.fn(),
      count: jest.fn(),
    };
    const socioRepository = {
      findOne: jest.fn(),
    };
    const nutricionistaRepository = {
      findById: jest.fn(),
    };
    const tenantContext = { gimnasioId: 1, isInitialized: true };
    const logger = { log: jest.fn() };
    const fotoProgresoOrmRepository = {
      find: jest.fn().mockResolvedValue([]),
    };

    const mod = await import(
      './get-historial-turnos-paciente.use-case'
    );
    const useCase = new mod.GetHistorialTurnosPacienteUseCase(
      turnoRepository as never,
      socioRepository as never,
      fotoProgresoOrmRepository as never,
      nutricionistaRepository as never,
      tenantContext as never,
      logger as never,
    );

    return { useCase, turnoRepository, socioRepository, nutricionistaRepository, fotoProgresoOrmRepository };
  };

  it('retorna los turnos del par nutri-socio ordenados desc con flags clinicos', async () => {
    const { useCase, turnoRepository, socioRepository, nutricionistaRepository, fotoProgresoOrmRepository } =
      await buildUseCase();
    nutricionistaRepository.findById.mockResolvedValue({ idPersona: 5 });
    socioRepository.findOne.mockResolvedValue({ idPersona: 273 });
    turnoRepository.count.mockResolvedValue(3);
    turnoRepository.find.mockResolvedValue([
      makeTurno({
        idTurno: 180,
        fechaTurno: new Date('2026-06-22T03:00:00.000Z'),
        horaTurno: '09:00',
        estadoTurno: EstadoTurno.PROGRAMADO,
        mediciones: [],
        observacionClinica: null,
        adjuntos: [],
      }),
      makeTurno({
        idTurno: 175,
        fechaTurno: new Date('2026-06-11T03:00:00.000Z'),
        horaTurno: '12:00',
        estadoTurno: EstadoTurno.AUSENTE,
        mediciones: [{ idMedicion: 1 }],
        observacionClinica: { comentario: 'Observación' },
        adjuntos: [{ idAdjunto: 1 }, { idAdjunto: 2 }],
      }),
      makeTurno({
        idTurno: 73,
        fechaTurno: new Date('2026-05-29T03:00:00.000Z'),
        horaTurno: '15:00',
        estadoTurno: EstadoTurno.REALIZADO,
        mediciones: [],
        observacionClinica: null,
        adjuntos: [],
      }),
    ]);
    fotoProgresoOrmRepository.find.mockResolvedValueOnce([
      { turno: { idTurno: 175 } },
      { turno: { idTurno: 175 } },
    ]);

    const result = await useCase.execute(5, 273);

    expect(result).toHaveLength(3);
    expect(result[0]).toMatchObject({
      idTurno: 180,
      estadoTurno: 'PROGRAMADO',
      tieneMedicion: false,
      tieneObservacion: false,
      cantidadAdjuntos: 0,
      cantidadFotos: 0,
    });
    expect(result[1]).toMatchObject({
      idTurno: 175,
      estadoTurno: 'AUSENTE',
      tieneMedicion: true,
      tieneObservacion: true,
      cantidadAdjuntos: 2,
      cantidadFotos: 2,
    });
    expect(result[2]).toMatchObject({
      idTurno: 73,
      estadoTurno: 'REALIZADO',
      tieneMedicion: false,
      tieneObservacion: false,
      cantidadAdjuntos: 0,
      cantidadFotos: 0,
    });
  });

  it('filtra por la dupla nutricionista+socio y respeta el gimnasio del tenant', async () => {
    const { useCase, turnoRepository, socioRepository, nutricionistaRepository, fotoProgresoOrmRepository } =
      await buildUseCase();
    nutricionistaRepository.findById.mockResolvedValue({ idPersona: 5 });
    socioRepository.findOne.mockResolvedValue({ idPersona: 273 });
    turnoRepository.count.mockResolvedValue(1);
    turnoRepository.find.mockResolvedValue([]);
    fotoProgresoOrmRepository.find.mockResolvedValue([]);

    await useCase.execute(5, 273);

    expect(turnoRepository.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          nutricionista: expect.objectContaining({
            idPersona: 5,
            gimnasioId: 1,
          }),
          socio: expect.objectContaining({ idPersona: 273 }),
        }),
        order: { fechaTurno: 'DESC', horaTurno: 'DESC' },
      }),
    );
  });

  it('lanza NotFoundError si el nutricionista no existe', async () => {
    const { useCase, nutricionistaRepository } = await buildUseCase();
    nutricionistaRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute(999, 1)).rejects.toBeInstanceOf(NotFoundError);
  });

  it('lanza NotFoundError si el socio no existe', async () => {
    const { useCase, nutricionistaRepository, socioRepository } = await buildUseCase();
    nutricionistaRepository.findById.mockResolvedValue({ idPersona: 5 });
    socioRepository.findOne.mockResolvedValue(null);

    await expect(useCase.execute(5, 999)).rejects.toBeInstanceOf(NotFoundError);
  });

  it('lanza ForbiddenError si el par nutri-socio no tiene vinculo previo', async () => {
    const { useCase, nutricionistaRepository, socioRepository, turnoRepository } =
      await buildUseCase();
    nutricionistaRepository.findById.mockResolvedValue({ idPersona: 5 });
    socioRepository.findOne.mockResolvedValue({ idPersona: 273 });
    turnoRepository.count.mockResolvedValue(0);

    await expect(useCase.execute(5, 273)).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('incluye turnos en cualquier estado (no solo cerradas)', async () => {
    const { useCase, turnoRepository, socioRepository, nutricionistaRepository, fotoProgresoOrmRepository } =
      await buildUseCase();
    nutricionistaRepository.findById.mockResolvedValue({ idPersona: 5 });
    socioRepository.findOne.mockResolvedValue({ idPersona: 273 });
    turnoRepository.count.mockResolvedValue(1);
    turnoRepository.find.mockResolvedValue([
      makeTurno({ idTurno: 1, estadoTurno: EstadoTurno.CANCELADO }),
      makeTurno({ idTurno: 2, estadoTurno: EstadoTurno.AUSENTE }),
      makeTurno({ idTurno: 3, estadoTurno: EstadoTurno.PROGRAMADO }),
    ]);
    fotoProgresoOrmRepository.find.mockResolvedValue([]);

    const result = await useCase.execute(5, 273);

    expect(result.map((r) => r.estadoTurno)).toEqual([
      EstadoTurno.CANCELADO,
      EstadoTurno.AUSENTE,
      EstadoTurno.PROGRAMADO,
    ]);
    expect(turnoRepository.find).toHaveBeenCalledTimes(1);
  });
});
