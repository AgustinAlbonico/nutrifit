import { AuditableEntity } from '../../shared/auditable.entity';
export declare class AlergiaEntity extends AuditableEntity {
    idAlergia: number | null;
    nombre: string;
    constructor(idAlergia: number | null | undefined, nombre: string, fechaBaja?: Date | null);
}
