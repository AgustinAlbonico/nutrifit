import { ProgresoController } from './progreso.controller';
import { TipoFoto } from 'src/domain/entities/FotoProgreso/tipo-foto.enum';

describe('ProgresoController', () => {
  it('pasa turnoId al caso de uso al subir una foto de progreso', async () => {
    const subirFotoProgresoUseCase = {
      execute: jest.fn().mockResolvedValue({ idFoto: 10 }),
    };
    const controller = new ProgresoController(
      subirFotoProgresoUseCase as never,
      { execute: jest.fn() } as never,
      { execute: jest.fn() } as never,
      { execute: jest.fn() } as never,
      { execute: jest.fn() } as never,
      { execute: jest.fn() } as never,
      { execute: jest.fn() } as never,
      { log: jest.fn() } as never,
    );

    await (
      controller.subirFoto as unknown as (
        socioId: number,
        file: Express.Multer.File,
        tipoFoto: string,
        notas?: string,
        turnoIdRaw?: string,
      ) => Promise<unknown>
    )(
      12,
      {
        buffer: Buffer.from('imagen'),
        mimetype: 'image/jpeg',
      } as Express.Multer.File,
      'Frente',
      'Foto inicial',
      '77',
    );

    expect(subirFotoProgresoUseCase.execute).toHaveBeenCalledWith(
      {
        socioId: 12,
        tipoFoto: TipoFoto.FRENTE,
        notas: 'Foto inicial',
        turnoId: 77,
      },
      expect.any(Buffer),
      'image/jpeg',
    );
  });
});
