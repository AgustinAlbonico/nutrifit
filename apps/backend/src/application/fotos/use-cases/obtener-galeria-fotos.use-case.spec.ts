import { ObtenerGaleriaFotosUseCase } from './obtener-galeria-fotos.use-case';
import { TipoFoto } from 'src/domain/entities/FotoProgreso/tipo-foto.enum';
import { FotoProgresoRepository } from 'src/infrastructure/persistence/typeorm/repositories/foto-progreso.repository';
import { FotoProgresoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/foto-progreso.entity';
import { SocioOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/persona.entity';
import { TurnoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/turno.entity';
import { IObjectStorageService } from 'src/domain/services/object-storage.service';

describe('ObtenerGaleriaFotosUseCase', () => {
  let useCase: ObtenerGaleriaFotosUseCase;
  let objectStorageService: jest.Mocked<IObjectStorageService>;
  let fotoProgresoRepository: jest.Mocked<FotoProgresoRepository>;

  beforeEach(() => {
    objectStorageService = {
      subirArchivo: jest.fn(),
      eliminarArchivo: jest.fn(),
      obtenerUrlFirmada: jest
        .fn()
        .mockImplementation((objectKey: string) =>
          Promise.resolve(`url:${objectKey}`),
        ),
      archivoExiste: jest.fn(),
      obtenerArchivo: jest.fn(),
    };
    fotoProgresoRepository = {
      findBySocioId: jest.fn(),
    } as unknown as jest.Mocked<FotoProgresoRepository>;
    useCase = new ObtenerGaleriaFotosUseCase(
      objectStorageService,
      fotoProgresoRepository,
    );
  });

  it('devuelve fotos agrupadas por tipo, por sesion y separa historicas sin turno', async () => {
    const socio = { idPersona: 12 } as SocioOrmEntity;
    const turno = {
      idTurno: 77,
      fechaTurno: new Date('2026-06-18T00:00:00.000Z'),
      horaTurno: '09:30',
    } as TurnoOrmEntity;
    fotoProgresoRepository.findBySocioId.mockResolvedValue([
      {
        idFoto: 1,
        socio,
        turno,
        tipoFoto: TipoFoto.FRENTE,
        objectKey: 'foto-sesion-frente.jpg',
        mimeType: 'image/jpeg',
        notas: null,
        fecha: new Date('2026-06-18T09:40:00.000Z'),
      },
      {
        idFoto: 2,
        socio,
        turno: null,
        tipoFoto: TipoFoto.PERFIL,
        objectKey: 'foto-historica-perfil.jpg',
        mimeType: 'image/jpeg',
        notas: null,
        fecha: new Date('2026-06-01T09:40:00.000Z'),
      },
    ] as unknown as FotoProgresoOrmEntity[]);

    const resultado = await useCase.execute(12);

    expect(resultado.fotos).toHaveLength(2);
    expect(resultado.sesiones).toEqual([
      {
        turnoId: 77,
        fechaTurno: '2026-06-18',
        horaTurno: '09:30',
        fotos: [
          {
            tipoFoto: TipoFoto.FRENTE,
            fotos: [
              expect.objectContaining({
                idFoto: 1,
                turnoId: 77,
                urlFirmada: 'url:foto-sesion-frente.jpg',
              }),
            ],
          },
        ],
      },
    ]);
    expect(resultado.fotosHistoricasSinSesion).toEqual([
      {
        tipoFoto: TipoFoto.PERFIL,
        fotos: [expect.objectContaining({ idFoto: 2, turnoId: null })],
      },
    ]);
  });
});
