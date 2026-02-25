import { Alimento } from '../Alimento/alimento.entity';
import { TipoComida } from './TipoComida';
export declare class OpcionComidaEntity {
    idOpcionComida: number | null;
    tipoComida: TipoComida;
    descripcion: string | null;
    alimentos: Alimento[];
    constructor(idOpcionComida: number | null | undefined, tipoComida: TipoComida, descripcion?: string | null, alimentos?: Alimento[]);
}
