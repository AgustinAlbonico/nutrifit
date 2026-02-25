import { UnidadMedida } from 'src/domain/entities/Alimento/UnidadMedida';
import { GrupoAlimenticio } from 'src/domain/entities/Alimento/grupo-alimenticio.entity';
export declare class AlimentoOrmEntity {
    idAlimento: number;
    nombre: string;
    cantidad: number;
    calorias: number | null;
    proteinas: number | null;
    carbohidratos: number | null;
    grasas: number | null;
    hidratosDeCarbono: number | null;
    unidadMedida: UnidadMedida;
    grupoAlimenticio: GrupoAlimenticio;
}
