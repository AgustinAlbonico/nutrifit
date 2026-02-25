import { SubirFotoProgresoUseCase } from 'src/application/fotos/use-cases/subir-foto-progreso.use-case';
import { ObtenerGaleriaFotosUseCase } from 'src/application/fotos/use-cases/obtener-galeria-fotos.use-case';
import { EliminarFotoProgresoUseCase } from 'src/application/fotos/use-cases/eliminar-foto-progreso.use-case';
import { CrearObjetivoUseCase } from 'src/application/objetivos/use-cases/crear-objetivo.use-case';
import { ActualizarObjetivoUseCase } from 'src/application/objetivos/use-cases/actualizar-objetivo.use-case';
import { MarcarObjetivoCompletadoUseCase } from 'src/application/objetivos/use-cases/marcar-objetivo-completado.use-case';
import { ObtenerObjetivosActivosUseCase } from 'src/application/objetivos/use-cases/obtener-objetivos-activos.use-case';
import { CrearObjetivoDto, ActualizarObjetivoDto } from 'src/application/objetivos/dtos/objetivo.dto';
import { AppLoggerService } from 'src/infrastructure/common/logger/app-logger.service';
export declare class ProgresoController {
    private readonly subirFotoProgresoUseCase;
    private readonly obtenerGaleriaFotosUseCase;
    private readonly eliminarFotoProgresoUseCase;
    private readonly crearObjetivoUseCase;
    private readonly actualizarObjetivoUseCase;
    private readonly marcarObjetivoCompletadoUseCase;
    private readonly obtenerObjetivosActivosUseCase;
    private readonly logger;
    constructor(subirFotoProgresoUseCase: SubirFotoProgresoUseCase, obtenerGaleriaFotosUseCase: ObtenerGaleriaFotosUseCase, eliminarFotoProgresoUseCase: EliminarFotoProgresoUseCase, crearObjetivoUseCase: CrearObjetivoUseCase, actualizarObjetivoUseCase: ActualizarObjetivoUseCase, marcarObjetivoCompletadoUseCase: MarcarObjetivoCompletadoUseCase, obtenerObjetivosActivosUseCase: ObtenerObjetivosActivosUseCase, logger: AppLoggerService);
    subirFoto(socioId: number, file: Express.Multer.File, tipoFoto: string, notas?: string): Promise<import("../../../application/fotos/dtos/subir-foto.dto").FotoProgresoResponseDto>;
    obtenerGaleria(socioId: number): Promise<import("../../../application/fotos/dtos/subir-foto.dto").GaleriaFotosResponseDto>;
    eliminarFoto(socioId: number, fotoId: number): Promise<void>;
    crearObjetivo(socioId: number, crearObjetivoDto: CrearObjetivoDto): Promise<import("src/application/objetivos/dtos/objetivo.dto").ObjetivoResponseDto>;
    obtenerObjetivos(socioId: number): Promise<import("src/application/objetivos/dtos/objetivo.dto").ListaObjetivosResponseDto>;
    actualizarObjetivo(socioId: number, objetivoId: number, actualizarObjetivoDto: ActualizarObjetivoDto): Promise<import("src/application/objetivos/dtos/objetivo.dto").ObjetivoResponseDto>;
    marcarObjetivo(socioId: number, objetivoId: number, estado: 'COMPLETADO' | 'ABANDONADO'): Promise<import("src/application/objetivos/dtos/objetivo.dto").ObjetivoResponseDto>;
}
