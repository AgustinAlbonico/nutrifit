import { Repository } from 'typeorm';
import { AlimentosSyncService, EstadoSyncAlimentos, ResultadoSyncAlimentos } from 'src/infrastructure/alimentos/alimentos-sync.service';
import { AlimentoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/alimento.entity';
import { GrupoAlimenticioOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/grupo-alimenticio.entity';
import { GrupoAlimenticioDto } from 'src/application/alimentos/dtos/grupo-alimenticio.dto';
import { CrearAlimentoDto } from 'src/application/alimentos/dtos/crear-alimento.dto';
import { ActualizarAlimentoDto } from 'src/application/alimentos/dtos/actualizar-alimento.dto';
import { CrearAlimentoUseCase } from 'src/application/alimentos/use-cases/crear-alimento.use-case';
import { ActualizarAlimentoUseCase } from 'src/application/alimentos/use-cases/actualizar-alimento.use-case';
import { EliminarAlimentoUseCase } from 'src/application/alimentos/use-cases/eliminar-alimento.use-case';
export declare class AlimentoResponseDto {
    idAlimento: number;
    nombre: string;
    cantidad: number;
    calorias: number | null;
    proteinas: number | null;
    carbohidratos: number | null;
    grasas: number | null;
    unidadMedida: string;
    grupoAlimenticio: {
        id: number;
        descripcion: string;
    } | null;
}
export declare class AlimentosController {
    private readonly alimentoRepo;
    private readonly grupoRepo;
    private readonly alimentosSyncService;
    private readonly crearAlimentoUseCase;
    private readonly actualizarAlimentoUseCase;
    private readonly eliminarAlimentoUseCase;
    constructor(alimentoRepo: Repository<AlimentoOrmEntity>, grupoRepo: Repository<GrupoAlimenticioOrmEntity>, alimentosSyncService: AlimentosSyncService, crearAlimentoUseCase: CrearAlimentoUseCase, actualizarAlimentoUseCase: ActualizarAlimentoUseCase, eliminarAlimentoUseCase: EliminarAlimentoUseCase);
    obtenerGruposAlimenticios(): Promise<GrupoAlimenticioDto[]>;
    obtenerEstadoSync(): Promise<EstadoSyncAlimentos | null>;
    sincronizarAlimentos(): Promise<ResultadoSyncAlimentos>;
    curarAlimentos(): Promise<{
        eliminados: number;
        renombrados: number;
        duplicadosDetectados: number;
        ruidososDetectados: number;
    }>;
    listarAlimentos(search?: string, limit?: string, grupoId?: string): Promise<AlimentoResponseDto[]>;
    obtenerAlimento(id: number): Promise<AlimentoResponseDto | null>;
    crearAlimento(dto: CrearAlimentoDto): Promise<AlimentoResponseDto>;
    actualizarAlimento(id: number, dto: ActualizarAlimentoDto): Promise<AlimentoResponseDto>;
    eliminarAlimento(id: number): Promise<void>;
    private mapToResponse;
}
