import { GrupoAlimenticio } from './grupo-alimenticio.entity';
import { UnidadMedida } from './UnidadMedida';
export declare class Alimento {
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
    constructor(idAlimento: number | null | undefined, nombre: string, cantidad: number, unidadMedida: UnidadMedida, calorias?: number | null, proteinas?: number | null, carbohidratos?: number | null, grasas?: number | null, hidratosDeCarbono?: number | null);
}
