import { Test, TestingModule } from '@nestjs/testing';
import { ListarSociosUseCase } from './listarSocios.use-case';
import { SocioEntity } from 'src/domain/entities/Persona/Socio/socio.entity';
import {
  SOCIO_REPOSITORY,
  SocioRepository,
} from 'src/domain/entities/Persona/Socio/socio.repository';
import { TenantContextService } from 'src/infrastructure/auth/tenant-context.service';
import { Rol } from 'src/domain/entities/Usuario/Rol';

describe('ListarSociosUseCase', () => {
  let useCase: ListarSociosUseCase;
  let mockSocioRepository: jest.Mocked<SocioRepository>;
  let mockTenantContext: jest.Mocked<TenantContextService>;

  const mockSocio = (overrides: Partial<SocioEntity> = {}): SocioEntity => {
    const socio = {
      idPersona: 1,
      nombre: 'Juan',
      apellido: 'Pérez',
      fechaNacimiento: new Date('1990-01-01'),
      telefono: '123456',
      genero: 'MASCULINO' as any,
      direccion: 'Calle 1',
      ciudad: 'Ciudad',
      provincia: 'Provincia',
      dni: '12345678',
      email: 'juan@test.com',
      gimnasioId: 1,
      planesAlimentacion: [],
      turnos: [],
      fichaSalud: null,
      fechaBaja: null,
      fotoPerfilKey: null,
    } as unknown as SocioEntity;
    Object.assign(socio, overrides);
    return socio;
  };

  const setRol = (rol: Rol | null): void => {
    Object.defineProperty(mockTenantContext, 'rol', {
      get: () => rol,
      configurable: true,
    });
  };

  const setGimnasioId = (gimnasioId: number | null): void => {
    Object.defineProperty(mockTenantContext, 'gimnasioId', {
      get: () => gimnasioId,
      configurable: true,
    });
  };

  beforeEach(async () => {
    mockSocioRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      reactivar: jest.fn(),
    } as unknown as jest.Mocked<SocioRepository>;

    mockTenantContext = {} as jest.Mocked<TenantContextService>;
    setRol(Rol.RECEPCIONISTA);
    setGimnasioId(1);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ListarSociosUseCase,
        { provide: SOCIO_REPOSITORY, useValue: mockSocioRepository },
        { provide: TenantContextService, useValue: mockTenantContext },
      ],
    }).compile();

    useCase = module.get<ListarSociosUseCase>(ListarSociosUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('ADMIN debe retornar todos los socios del repository sin filtrar', async () => {
      setRol(Rol.ADMIN);
      const sociosMock = [
        mockSocio({ idPersona: 1, gimnasioId: 1 }),
        mockSocio({ idPersona: 2, gimnasioId: 2 }),
      ];
      mockSocioRepository.findAll.mockResolvedValue(sociosMock);

      const resultado = await useCase.execute();

      expect(mockSocioRepository.findAll).toHaveBeenCalled();
      expect(resultado).toHaveLength(2);
    });

    it('SUPERADMIN debe retornar todos los socios del repository sin filtrar', async () => {
      setRol(Rol.SUPERADMIN);
      setGimnasioId(null);
      const sociosMock = [
        mockSocio({ idPersona: 1, gimnasioId: 1 }),
        mockSocio({ idPersona: 2, gimnasioId: 2 }),
      ];
      mockSocioRepository.findAll.mockResolvedValue(sociosMock);

      const resultado = await useCase.execute();

      expect(resultado).toHaveLength(2);
    });

    it('debe retornar array vacio cuando no hay socios', async () => {
      mockSocioRepository.findAll.mockResolvedValue([]);

      const resultado = await useCase.execute();

      expect(resultado).toEqual([]);
    });

    it('RECEPCIONISTA debe filtrar por gimnasio del contexto', async () => {
      setRol(Rol.RECEPCIONISTA);
      setGimnasioId(1);
      const sociosMock = [
        mockSocio({ idPersona: 1, gimnasioId: 1 }),
        mockSocio({ idPersona: 2, gimnasioId: 2 }),
        mockSocio({ idPersona: 3, gimnasioId: 1 }),
      ];
      mockSocioRepository.findAll.mockResolvedValue(sociosMock);

      const resultado = await useCase.execute();

      expect(resultado).toHaveLength(2);
      expect(resultado.map((s) => s.idPersona)).toEqual([1, 3]);
    });

    it('debe retornar vacio si el gimnasio del contexto es null y no es admin', async () => {
      setRol(Rol.RECEPCIONISTA);
      setGimnasioId(null);
      const sociosMock = [mockSocio({ idPersona: 1, gimnasioId: 1 })];
      mockSocioRepository.findAll.mockResolvedValue(sociosMock);

      const resultado = await useCase.execute();

      expect(resultado).toEqual([]);
    });

    it('debe delegar en repository para findById', async () => {
      const socioMock = mockSocio({ idPersona: 5 });
      mockSocioRepository.findById.mockResolvedValue(socioMock);

      const resultado = await useCase.findById(5);

      expect(mockSocioRepository.findById).toHaveBeenCalledWith(5);
      expect(resultado?.idPersona).toBe(5);
    });

    it('debe retornar null cuando findById no encuentra nada', async () => {
      mockSocioRepository.findById.mockResolvedValue(null);

      const resultado = await useCase.findById(999);

      expect(resultado).toBeNull();
    });
  });
});
