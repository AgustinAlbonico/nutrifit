import { AuditableEntity } from '../../shared/auditable.entity';
export declare class PatologiaEntity extends AuditableEntity {
    idPatologia: number | null;
    nombre: string;
    constructor(idPatologia: number | null | undefined, nombre: string, fechaBaja?: Date | null);
}
