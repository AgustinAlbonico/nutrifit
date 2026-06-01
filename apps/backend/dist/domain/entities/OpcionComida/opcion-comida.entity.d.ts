import { Alimento } from '../Alimento/alimento.entity';
import { TipoComida } from './TipoComida';
import { AuditableEntity } from "../../shared/auditable.entity";
export declare class OpcionComidaEntity extends AuditableEntity {
    idOpcionComida: number | null;
    tipoComida: TipoComida;
    descripcion: string | null;
    alimentos: Alimento[];
    constructor(idOpcionComida: number | null | undefined, tipoComida: TipoComida, descripcion?: string | null, alimentos?: Alimento[], fechaBaja?: Date | null);
}
