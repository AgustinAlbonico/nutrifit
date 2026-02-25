import type { Response } from 'express';
import { RegistrarSocioDto } from 'src/application/socios/dtos/registrarSocio.dto';
import { ActualizarSocioDto } from 'src/application/socios/dtos/actualizarSocio.dto';
import { SocioResponseDto } from 'src/application/socios/dtos/socio-response.dto';
import { RegistrarSocioUseCase } from 'src/application/socios/registrarSocio.use-case';
import { ListarSociosUseCase } from 'src/application/socios/listarSocios.use-case';
import { ActualizarSocioUseCase } from 'src/application/socios/actualizarSocio.use-case';
import { EliminarSocioUseCase } from 'src/application/socios/eliminarSocio.use-case';
import { ReactivarSocioUseCase } from 'src/application/socios/reactivarSocio.use-case';
import { BuscarSociosConFichaUseCase } from 'src/application/socios/buscar-socios-con-ficha.use-case';
import { IObjectStorageService } from 'src/domain/services/object-storage.service';
import { AppLoggerService } from 'src/infrastructure/common/logger/app-logger.service';
export declare class SocioController {
    private readonly registrarSocioUseCase;
    private readonly listarSociosUseCase;
    private readonly actualizarSocioUseCase;
    private readonly eliminarSocioUseCase;
    private readonly reactivarSocioUseCase;
    private readonly buscarSociosConFichaUseCase;
    private readonly logger;
    private readonly objectStorage;
    constructor(registrarSocioUseCase: RegistrarSocioUseCase, listarSociosUseCase: ListarSociosUseCase, actualizarSocioUseCase: ActualizarSocioUseCase, eliminarSocioUseCase: EliminarSocioUseCase, reactivarSocioUseCase: ReactivarSocioUseCase, buscarSociosConFichaUseCase: BuscarSociosConFichaUseCase, logger: AppLoggerService, objectStorage: IObjectStorageService);
    listarSocios(): Promise<SocioResponseDto[]>;
    buscarSociosConFicha(busqueda?: string): Promise<import("src/application/socios/buscar-socios-con-ficha.use-case").SocioConFichaDto[]>;
    registrarSocio(registrarSocioDto: RegistrarSocioDto, file?: Express.Multer.File): Promise<import("../../../domain/entities/Usuario/usuario.entity").UsuarioEntity>;
    actualizarSocio(id: number, actualizarSocioDto: ActualizarSocioDto, file?: Express.Multer.File): Promise<SocioResponseDto>;
    obtenerFoto(id: number, res: Response): Promise<void | Response<any, Record<string, any>>>;
    eliminarSocio(id: number): Promise<{
        message: string;
    }>;
    reactivarSocio(id: number): Promise<{
        message: string;
    }>;
}
