import { AuditableEntity } from "../../shared/auditable.entity";
export declare class AccionPermisoEntity extends AuditableEntity {
    id: number;
    clave: string;
    nombre: string;
    descripcion: string | null;
    constructor(id: number, clave: string, nombre: string, descripcion?: string | null, fechaBaja?: Date | null);
}
