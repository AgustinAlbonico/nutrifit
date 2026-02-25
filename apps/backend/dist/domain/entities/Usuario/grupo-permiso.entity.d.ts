import { AccionPermisoEntity } from './accion-permiso.entity';
export declare class GrupoPermisoEntity {
    id: number;
    clave: string;
    nombre: string;
    descripcion: string | null;
    acciones: AccionPermisoEntity[];
    hijos: GrupoPermisoEntity[];
    constructor(id: number, clave: string, nombre: string, descripcion?: string | null, acciones?: AccionPermisoEntity[], hijos?: GrupoPermisoEntity[]);
}
