import { OpcionComidaEntity } from '../OpcionComida/opcion-comida.entity';
import { DiaSemana } from './DiaSemana';
export declare class DiaPlanEntity {
    idDiaPlan: number | null;
    dia: DiaSemana;
    orden: number;
    opcionesComida: OpcionComidaEntity[];
    constructor(idDiaPlan: number | null | undefined, dia: DiaSemana, orden: number, opcionesComida?: OpcionComidaEntity[]);
}
