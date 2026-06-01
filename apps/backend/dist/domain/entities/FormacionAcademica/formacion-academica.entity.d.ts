import { AuditableEntity } from "../../shared/auditable.entity";
export declare class FormacionAcademicaEntity extends AuditableEntity {
    idFormacionAcademica: number | null;
    titulo: string;
    institucion: string;
    añoComienzo: number;
    añoFin: number;
    nivel: string;
    constructor(idFormacionAcademica: number | null | undefined, titulo: string, institucion: string, añoComienzo: number, añoFin: number, nivel: string, fechaBaja?: Date | null);
}
