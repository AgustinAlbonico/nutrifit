import type { Response } from 'express';
import { CreateNutricionistaDto, ListProfesionalesPublicQueryDto, NutricionistaResponseDto, PerfilProfesionalPublicoResponseDto, ProfesionalPublicoResponseDto, UpdateNutricionistaDto } from 'src/application/profesionales/dtos';
import { CreateNutricionistaUseCase, DeleteNutricionistaUseCase, GetNutricionistaUseCase, GetPerfilProfesionalPublicoUseCase, ListNutricionistasUseCase, ListProfesionalesPublicosUseCase, ReactivarNutricionistaUseCase, UpdateNutricionistaUseCase } from 'src/application/profesionales/use-cases';
import { IAppLoggerService } from 'src/domain/services/logger.service';
import { IObjectStorageService } from 'src/domain/services/object-storage.service';
export declare class ProfesionalController {
    private readonly createNutricionistaUseCase;
    private readonly getNutricionistaUseCase;
    private readonly listNutricionistasUseCase;
    private readonly listProfesionalesPublicosUseCase;
    private readonly getPerfilProfesionalPublicoUseCase;
    private readonly updateNutricionistaUseCase;
    private readonly deleteNutricionistaUseCase;
    private readonly reactivarNutricionistaUseCase;
    private readonly logger;
    private readonly objectStorage;
    constructor(createNutricionistaUseCase: CreateNutricionistaUseCase, getNutricionistaUseCase: GetNutricionistaUseCase, listNutricionistasUseCase: ListNutricionistasUseCase, listProfesionalesPublicosUseCase: ListProfesionalesPublicosUseCase, getPerfilProfesionalPublicoUseCase: GetPerfilProfesionalPublicoUseCase, updateNutricionistaUseCase: UpdateNutricionistaUseCase, deleteNutricionistaUseCase: DeleteNutricionistaUseCase, reactivarNutricionistaUseCase: ReactivarNutricionistaUseCase, logger: IAppLoggerService, objectStorage: IObjectStorageService);
    create(createNutricionistaDto: CreateNutricionistaDto, file?: Express.Multer.File): Promise<NutricionistaResponseDto>;
    findAll(): Promise<NutricionistaResponseDto[]>;
    findDisponiblesForSocio(query: ListProfesionalesPublicQueryDto): Promise<ProfesionalPublicoResponseDto[]>;
    findPublicProfile(id: number): Promise<PerfilProfesionalPublicoResponseDto>;
    findOne(id: number): Promise<NutricionistaResponseDto>;
    update(id: number, updateNutricionistaDto: UpdateNutricionistaDto, file?: Express.Multer.File): Promise<NutricionistaResponseDto>;
    obtenerFoto(id: number, res: Response): Promise<void | Response<any, Record<string, any>>>;
    remove(id: number): Promise<void>;
    reactivar(id: number): Promise<void>;
    private mapToResponseDto;
}
