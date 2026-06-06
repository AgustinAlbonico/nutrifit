import { Test, TestingModule } from '@nestjs/testing';
import { GetPerfilProfesionalPublicoUseCase } from './get-perfil-profesional-publico.use-case';
import {
  NUTRICIONISTA_REPOSITORY,
  NutricionistaRepository,
} from 'src/domain/entities/Persona/Nutricionista/nutricionista.repository';
import { TenantContextService } from 'src/infrastructure/auth/tenant-context.service';
import { APP_LOGGER_SERVICE } from 'src/domain/services/logger.service';
import { NotFoundError } from 'src/domain/exceptions/custom-exceptions';

describe('GetPerfilProfesionalPublicoUseCase', () => {
  let useCase: GetPerfilProfesionalPublicoUseCase;
  let nutricionistaRepository: jest.Mocked<NutricionistaRepository>;
  let tenantContext: { gimnasioId: number };

  beforeEach(async () => {
    const mockRepo: Partial<jest.Mocked<NutricionistaRepository>> = {
      findById: jest.fn(),
    };
    nutricionistaRepository = mockRepo as jest.Mocked<NutricionistaRepository>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetPerfilProfesionalPublicoUseCase,
        {
          provide: NUTRICIONISTA_REPOSITORY,
          useValue: nutricionistaRepository,
        },
        {
          provide: APP_LOGGER_SERVICE,
          useValue: { log: jest.fn(), warn: jest.fn(), error: jest.fn() },
        },
        {
          provide: TenantContextService,
          useValue: { gimnasioId: 1 },
        },
      ],
    }).compile();

    useCase = module.get<GetPerfilProfesionalPublicoUseCase>(
      GetPerfilProfesionalPublicoUseCase,
    );
    tenantContext = module.get(TenantContextService);
  });

  it('retorna DTO con campos públicos (sin email/telefono/direccion) para nutricionista activo del mismo gym', async () => {
    nutricionistaRepository.findById.mockResolvedValue({
      idPersona: 10,
      nombre: 'Ana',
      apellido: 'Pérez',
      fechaNacimiento: new Date('1990-01-01'),
      telefono: '+5491100000000',
      genero: 'FEMENINO' as never,
      direccion: 'Av. Secreta 123',
      ciudad: 'CABA',
      provincia: 'Buenos Aires',
      dni: '12345678',
      email: 'ana@nutrifit.com',
      matricula: 'MN-100',
      tarifaSesion: 12000,
      añosExperiencia: 5,
      agendas: [
        {
          idAgenda: 1,
          dia: 'LUNES' as never,
          horaInicio: '09:00',
          horaFin: '13:00',
          duracionTurno: 30,
        },
      ],
      formacionAcademica: [
        {
          idFormacion: 1,
          titulo: 'Lic. en Nutrición',
          institucion: 'UBA',
          anioInicio: 2010,
          anioFin: 2015,
        },
      ],
      turnos: [],
      fotoPerfilKey: null,
      gimnasioId: 1,
      fechaBaja: null,
      presentacion: 'Soy Ana',
      certificaciones: 'Cert. A',
    } as never);

    const result = await useCase.execute(10);

    // No debe exponer campos sensibles
    expect(result).not.toHaveProperty('email');
    expect(result).not.toHaveProperty('telefono');
    expect(result).not.toHaveProperty('direccion');
    expect(result).not.toHaveProperty('genero');
    expect(result).not.toHaveProperty('biografia');
    expect(result).not.toHaveProperty('calificacionPromedio');
    expect(result).not.toHaveProperty('totalOpiniones');

    // Sí debe exponer los nuevos
    expect(result.idPersona).toBe(10);
    expect(result.matricula).toBe('MN-100');
    expect(result.presentacion).toBe('Soy Ana');
    expect(result.certificaciones).toBe('Cert. A');
    expect(result.duracionTurnoMin).toBe(30);
    expect(result.formacionAcademica).toHaveLength(1);
    expect(result.formacionAcademica[0].titulo).toBe('Lic. en Nutrición');
    expect(result.horarios).toHaveLength(1);
  });

  it('lanza NotFoundError cuando el nutricionista pertenece a otro gimnasio (RB25, sin leak)', async () => {
    nutricionistaRepository.findById.mockResolvedValue({
      idPersona: 20,
      nombre: 'Otro',
      apellido: 'Gym',
      fechaNacimiento: new Date('1990-01-01'),
      telefono: '',
      genero: 'MASCULINO' as never,
      direccion: '',
      ciudad: '',
      provincia: '',
      dni: '',
      email: '',
      matricula: 'MN-200',
      tarifaSesion: 0,
      añosExperiencia: 0,
      agendas: [],
      formacionAcademica: [],
      turnos: [],
      fotoPerfilKey: null,
      gimnasioId: 999, // otro gimnasio
      fechaBaja: null,
      presentacion: null,
      certificaciones: null,
    } as never);

    await expect(useCase.execute(20)).rejects.toBeInstanceOf(NotFoundError);
  });

  it('lanza NotFoundError cuando el nutricionista está inactivo (fechaBaja != null)', async () => {
    nutricionistaRepository.findById.mockResolvedValue({
      idPersona: 30,
      nombre: 'Baja',
      apellido: 'X',
      fechaNacimiento: new Date('1990-01-01'),
      telefono: '',
      genero: 'OTRO' as never,
      direccion: '',
      ciudad: '',
      provincia: '',
      dni: '',
      email: '',
      matricula: 'MN-300',
      tarifaSesion: 0,
      añosExperiencia: 0,
      agendas: [],
      formacionAcademica: [],
      turnos: [],
      fotoPerfilKey: null,
      gimnasioId: 1,
      fechaBaja: new Date('2025-01-01'),
      presentacion: null,
      certificaciones: null,
    } as never);

    await expect(useCase.execute(30)).rejects.toBeInstanceOf(NotFoundError);
  });
});
