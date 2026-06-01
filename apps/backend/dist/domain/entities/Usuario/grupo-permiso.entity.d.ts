import { AccionPermisoEntity } from './accion-permiso.entity';
import { AuditableEntity } from "../../shared/auditable.entity";
export declare class GrupoPermisoEntity extends AuditableEntity {
    id: number;
    clave: string;
    nombre: string;
    descripcion: string | null;
    acciones: AccionPermisoEntity[];
    hijos: GrupoPermisoEntity[];
    constructor(id: number, clave: string, nombre: string, descripcion?: string | null, acciones?: AccionPermisoEntity[], hijos?: GrupoPermisoEntity[], fechaBaja?: Date | null);
}
