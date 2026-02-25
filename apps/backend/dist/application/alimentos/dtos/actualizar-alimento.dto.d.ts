import { UnidadMedida } from 'src/domain/entities/Alimento/UnidadMedida';
export declare class ActualizarAlimentoDto {
    nombre?: string;
    cantidad?: number;
    unidadMedida?: UnidadMedida;
    calorias?: number | null;
    proteinas?: number | null;
    carbohidratos?: number | null;
    grasas?: number | null;
    hidratosDeCarbono?: number | null;
    grupoAlimenticioId?: number | null;
}
