import { AuditableEntity } from "../../shared/auditable.entity";
export declare class GrupoAlimenticio extends AuditableEntity {
    idGrupoAlimenticio: number | null;
    descripcion: string;
    constructor(idGrupoAlimenticio: number | null | undefined, descripcion: string, fechaBaja?: Date | null);
}
