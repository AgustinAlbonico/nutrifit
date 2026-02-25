import { Repository } from 'typeorm';
import { AccionOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/accion.entity';
import { GrupoPermisoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/grupo-permiso.entity';
import { UsuarioOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/usuario.entity';
import { CreateAccionDto } from './dtos/create-accion.dto';
import { CreateGrupoPermisoDto } from './dtos/create-grupo-permiso.dto';
import { UpdateAccionDto } from './dtos/update-accion.dto';
import { UpdateGrupoPermisoDto } from './dtos/update-grupo-permiso.dto';
export declare class PermisosService {
    private readonly accionRepository;
    private readonly grupoRepository;
    private readonly usuarioRepository;
    constructor(accionRepository: Repository<AccionOrmEntity>, grupoRepository: Repository<GrupoPermisoOrmEntity>, usuarioRepository: Repository<UsuarioOrmEntity>);
    listarAcciones(): Promise<AccionOrmEntity[]>;
    crearAccion(_dto: CreateAccionDto): Promise<AccionOrmEntity>;
    actualizarAccion(actionId: number, dto: UpdateAccionDto): Promise<AccionOrmEntity>;
    listarUsuarios(query?: string): Promise<UsuarioOrmEntity[]>;
    listarUsuariosPaginado(params: {
        page: number;
        limit: number;
        search?: string;
        isActive?: boolean;
    }): Promise<{
        data: UsuarioOrmEntity[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNextPage: boolean;
            hasPreviousPage: boolean;
        };
    }>;
    listarGrupos(): Promise<GrupoPermisoOrmEntity[]>;
    crearGrupo(dto: CreateGrupoPermisoDto): Promise<GrupoPermisoOrmEntity>;
    actualizarGrupo(groupId: number, dto: UpdateGrupoPermisoDto): Promise<GrupoPermisoOrmEntity>;
    asignarAccionesAGrupo(groupId: number, actionIds: number[]): Promise<GrupoPermisoOrmEntity>;
    asignarGruposAUsuario(userId: number, groupIds: number[]): Promise<UsuarioOrmEntity>;
    asignarAccionesAUsuario(userId: number, actionIds: number[]): Promise<UsuarioOrmEntity>;
    getAccionesEfectivasUsuario(userId: number): Promise<string[]>;
    hasAllActions(userId: number, requiredActions: string[]): Promise<boolean>;
    private obtenerAccionesDeGrupoRecursivo;
}
