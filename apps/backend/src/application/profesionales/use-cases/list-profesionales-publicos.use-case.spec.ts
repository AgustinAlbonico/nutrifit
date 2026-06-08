import { Test, TestingModule } from '@nestjs/testing';
import { ListProfesionalesPublicosUseCase } from './list-profesionales-publicos.use-case';
import {
  NUTRICIONISTA_REPOSITORY,
  NutricionistaRepository,
} from 'src/domain/entities/Persona/Nutricionista/nutricionista.repository';
import { TenantContextService } from 'src/infrastructure/auth/tenant-context.service';
import { APP_LOGGER_SERVICE } from 'src/domain/services/logger.service';
import { SlotComputationService } from 'src/application/turnos/services/slot-computation.service';
import { NutricionistaEntity } from 'src/domain/entities/Persona/Nutricionista/nutricionista.entity';

describe('ListProfesionalesPublicosUseCase', () => {
  let useCase: ListProfesionalesPublicosUseCase;
  let nutricionistaRepository: jest.Mocked<NutricionistaRepository>;
  let slotComputation: { contarSlotsProximos: jest.Mock };

  beforeEach(async () => {
    const mockRepo: Partial<jest.Mocked<NutricionistaRepository>> = {
      findAll: jest.fn(),
    };
    nutricionistaRepository = mockRepo as jest.Mocked<NutricionistaRepository>;
    slotComputation = { contarSlotsProximos: jest.fn().mockResolvedValue(0) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ListProfesionalesPublicosUseCase,
        {
          provide: NUTRICIONISTA_REPOSITORY,
          useValue: nutricionistaRepository,
        },
        {
          provide: APP_LOGGER_SERVICE,
          useValue: { log: jest.fn(), warn: jest.fn(), error: jest.fn() },
        },
        {
          provide: SlotComputationService,
          useValue: slotComputation,
        },
        {
          provide: TenantContextService,
          useValue: { gimnasioId: 1 },
        },
      ],
    }).compile();

    useCase = module.get<ListProfesionalesPublicosUseCase>(
      ListProfesionalesPublicosUseCase,
    );
  });

  it('retorna catalogo vacío cuando no hay nutricionistas activos', async () => {
    nutricionistaRepository.findAll.mockResolvedValue([]);

    const result = await useCase.execute({});

    expect(result.items).toEqual([]);
    expect(result.pagination.total).toBe(0);
    expect(result.pagination.page).toBe(1);
    expect(result.pagination.per_page).toBe(12);
    expect(result.pagination.total_pages).toBe(1);
  });

  it('incluye solo nutricionistas activos (excluye fechaBaja) y no expone datos sensibles', async () => {
    const activo = crearNutri({ idPersona: 1, fechaBaja: null });
    const inactivo = crearNutri({ idPersona: 2, fechaBaja: new Date('2025-01-01') });
    nutricionistaRepository.findAll.mockResolvedValue([activo, inactivo]);
    slotComputation.contarSlotsProximos.mockResolvedValue(5);

    const result = await useCase.execute({});

    expect(result.items).toHaveLength(1);
    expect(result.pagination.total).toBe(1);
    expect(result.items[0].idPersona).toBe(1);

    // Validar ausencia de campos sensibles
    const item = result.items[0] as unknown as Record<string, unknown>;
    expect(item).not.toHaveProperty('email');
    expect(item).not.toHaveProperty('telefono');
    expect(item).not.toHaveProperty('direccion');
    // Sí incluye los nuevos
    expect(result.items[0].duracionTurnoMin).toBe(30);
    expect(result.items[0].slotsProximos7Dias).toBe(5);
  });

  it('aplica filtro ?disponible=true (solo incluye los que tienen slots)', async () => {
    nutricionistaRepository.findAll.mockResolvedValue([
      crearNutri({ idPersona: 1, fechaBaja: null }),
      crearNutri({ idPersona: 2, fechaBaja: null }),
    ]);
    slotComputation.contarSlotsProximos
      .mockResolvedValueOnce(0) // nutri 1 sin slots
      .mockResolvedValueOnce(10); // nutri 2 con slots

    const result = await useCase.execute({ disponible: true });

    expect(result.items).toHaveLength(1);
    expect(result.items[0].idPersona).toBe(2);
  });

  it('pagina correctamente con page=2 limit=1', async () => {
    nutricionistaRepository.findAll.mockResolvedValue([
      crearNutri({ idPersona: 1, nombre: 'Aaa', apellido: 'Zzz' }),
      crearNutri({ idPersona: 2, nombre: 'Bbb', apellido: 'Yyy' }),
      crearNutri({ idPersona: 3, nombre: 'Ccc', apellido: 'Xxx' }),
    ]);
    slotComputation.contarSlotsProximos.mockResolvedValue(1);

    const result = await useCase.execute({ page: 2, limit: 1 });

    expect(result.items).toHaveLength(1);
    expect(result.pagination.page).toBe(2);
    expect(result.pagination.per_page).toBe(1);
    expect(result.pagination.total).toBe(3);
    expect(result.pagination.total_pages).toBe(3);
  });
});

function crearNutri(overrides: {
  idPersona: number;
  fechaBaja?: Date | null;
  nombre?: string;
  apellido?: string;
}): NutricionistaEntity {
  return {
    idPersona: overrides.idPersona,
    idPersonaNullable: overrides.idPersona,
    nombre: overrides.nombre ?? 'Test',
    apellido: overrides.apellido ?? 'Nutri',
    fechaNacimiento: new Date('1990-01-01'),
    telefono: '+5491100000000',
    genero: 'OTRO' as never,
    direccion: 'Calle Falsa 123',
    ciudad: 'CABA',
    provincia: 'Buenos Aires',
    dni: '12345678',
    email: 'test@nutrifit.com',
    matricula: `MN-${overrides.idPersona}`,
    tarifaSesion: 10000,
    aniosExperiencia: 3,
    agendas: [
      {
        idAgenda: 1,
        dia: 'LUNES' as never,
        horaInicio: '09:00',
        horaFin: '13:00',
        duracionTurno: 30,
        fechaBaja: null,
      },
    ],
    formacionAcademica: [],
    turnos: [],
    fotoPerfilKey: null,
    gimnasioId: 1,
    fechaBaja: overrides.fechaBaja ?? null,
    presentacion: 'Hola',
    certificaciones: null,
  };
}
