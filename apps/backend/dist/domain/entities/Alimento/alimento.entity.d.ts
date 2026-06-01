import { GrupoAlimenticio } from './grupo-alimenticio.entity';
import { UnidadMedida } from './UnidadMedida';
import { AuditableEntity } from '../../shared/auditable.entity';
export declare class Alimento extends AuditableEntity {
    idAlimento: number | null;
    nombre: string;
    cantidad: number;
    unidadMedida: UnidadMedida;
    grupoAlimenticio: GrupoAlimenticio;
    calorias: number | null;
    proteinas: number | null;
    carbohidratos: number | null;
    grasas: number | null;
    hidratosDeCarbono: number | null;
    constructor(idAlimento: number | null | undefined, nombre: string, cantidad: number, unidadMedida: UnidadMedida, calorias?: number | null, proteinas?: number | null, carbohidratos?: number | null, grasas?: number | null, hidratosDeCarbono?: number | null, fechaBaja?: Date | null);
}
