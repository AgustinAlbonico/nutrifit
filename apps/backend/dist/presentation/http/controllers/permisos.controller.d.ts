import { Request } from 'express';
import { PermisosService } from 'src/application/permisos/permisos.service';
import { AsignarAccionesDto } from 'src/application/permisos/dtos/asignar-acciones.dto';
import { AsignarGruposDto } from 'src/application/permisos/dtos/asignar-grupos.dto';
import { CreateAccionDto } from 'src/application/permisos/dtos/create-accion.dto';
import { CreateGrupoPermisoDto } from 'src/application/permisos/dtos/create-grupo-permiso.dto';
import { UpdateAccionDto } from 'src/application/permisos/dtos/update-accion.dto';
import { UpdateGrupoPermisoDto } from 'src/application/permisos/dtos/update-grupo-permiso.dto';
export declare class PermisosController {
    private readonly permisosService;
    constructor(permisosService: PermisosService);
    listarAcciones(): Promise<import("../../../infrastructure/persistence/typeorm/entities").AccionOrmEntity[]>;
    crearAccion(dto: CreateAccionDto): Promise<import("../../../infrastructure/persistence/typeorm/entities").AccionOrmEntity>;
    editarAccion(actionId: number, dto: UpdateAccionDto): Promise<import("../../../infrastructure/persistence/typeorm/entities").AccionOrmEntity>;
    listarGrupos(): Promise<import("../../../infrastructure/persistence/typeorm/entities").GrupoPermisoOrmEntity[]>;
    crearGrupo(dto: CreateGrupoPermisoDto): Promise<import("../../../infrastructure/persistence/typeorm/entities").GrupoPermisoOrmEntity>;
    editarGrupo(groupId: number, dto: UpdateGrupoPermisoDto): Promise<import("../../../infrastructure/persistence/typeorm/entities").GrupoPermisoOrmEntity>;
    asignarAccionesAGrupo(groupId: number, dto: AsignarAccionesDto): Promise<import("../../../infrastructure/persistence/typeorm/entities").GrupoPermisoOrmEntity>;
    asignarGruposAUsuario(userId: number, dto: AsignarGruposDto): Promise<import("../../../infrastructure/persistence/typeorm/entities").UsuarioOrmEntity>;
    asignarAccionesAUsuario(userId: number, dto: AsignarAccionesDto): Promise<import("../../../infrastructure/persistence/typeorm/entities").UsuarioOrmEntity>;
    accionesDeUsuario(userId: number): Promise<string[]>;
    buscarUsuarios(req: Request): Promise<{
        data: import("../../../infrastructure/persistence/typeorm/entities").UsuarioOrmEntity[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNextPage: boolean;
            hasPreviousPage: boolean;
        };
    }>;
    misAcciones(req: Request): Promise<string[]>;
}
