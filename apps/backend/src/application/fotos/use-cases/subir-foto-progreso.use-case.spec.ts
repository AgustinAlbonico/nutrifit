import { SubirFotoProgresoUseCase } from './subir-foto-progreso.use-case';
import { TipoFoto } from 'src/domain/entities/FotoProgreso/tipo-foto.enum';
import { FotoProgresoRepository } from 'src/infrastructure/persistence/typeorm/repositories/foto-progreso.repository';
import { FotoProgresoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/foto-progreso.entity';
import { SocioOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/persona.entity';
import { TurnoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/turno.entity';
import { IObjectStorageService } from 'src/domain/services/object-storage.service';

describe('SubirFotoProgresoUseCase', () => {
  let useCase: SubirFotoProgresoUseCase;
  let objectStorageService: jest.Mocked<IObjectStorageService>;
  let fotoProgresoRepository: jest.Mocked<
    FotoProgresoRepository & {
      saveForSocio: jest.Mock;
    }
  >;

  beforeEach(() => {
    objectStorageService = {
      subirArchivo: jest.fn().mockResolvedValue(undefined),
      eliminarArchivo: jest.fn(),
      obtenerUrlFirmada: jest
        .fn()
        .mockResolvedValue('https://firmada.test/foto'),
      archivoExiste: jest.fn(),
      obtenerArchivo: jest.fn(),
    };
    fotoProgresoRepository = {
      save: jest.fn(),
      saveForSocio: jest.fn(),
    } as unknown as typeof fotoProgresoRepository;
    useCase = new SubirFotoProgresoUseCase(
      objectStorageService,
      fotoProgresoRepository,
    );
  });

  it('guarda la foto asociada al turno de la sesion cuando recibe turnoId', async () => {
    const socio = { idPersona: 12 } as SocioOrmEntity;
    const turno = { idTurno: 77 } as TurnoOrmEntity;
    const fotoGuardada = {
      idFoto: 44,
      socio,
      turno,
      tipoFoto: TipoFoto.FRENTE,
      objectKey: 'progreso/12/frente/2026-06-18_123.jpg',
      mimeType: 'image/jpeg',
      notas: 'Foto inicial',
      fecha: new Date('2026-06-18T12:00:00.000Z'),
    } as FotoProgresoOrmEntity;
    fotoProgresoRepository.save.mockResolvedValue(fotoGuardada);
    fotoProgresoRepository.saveForSocio.mockResolvedValue(fotoGuardada);

    const resultado = await useCase.execute(
      {
        socioId: 12,
        turnoId: 77,
        tipoFoto: TipoFoto.FRENTE,
        notas: 'Foto inicial',
      },
      Buffer.from('imagen'),
      'image/jpeg',
    );

    expect(fotoProgresoRepository.saveForSocio).toHaveBeenCalledWith({
      socioId: 12,
      turnoId: 77,
      tipoFoto: TipoFoto.FRENTE,
      notas: 'Foto inicial',
      objectKey: expect.stringMatching(/^progreso\/12\/frente\//),
      mimeType: 'image/jpeg',
    });
    expect(resultado).toMatchObject({
      idFoto: 44,
      socioId: 12,
      turnoId: 77,
      tipoFoto: TipoFoto.FRENTE,
      urlFirmada: 'https://firmada.test/foto',
    });
  });
});
