import { OpcionComidaEntity } from '../OpcionComida/opcion-comida.entity';
import { DiaSemana } from './DiaSemana';
import { AuditableEntity } from "../../shared/auditable.entity";
export declare class DiaPlanEntity extends AuditableEntity {
    idDiaPlan: number | null;
    dia: DiaSemana;
    orden: number;
    opcionesComida: OpcionComidaEntity[];
    constructor(idDiaPlan: number | null | undefined, dia: DiaSemana, orden: number, opcionesComida?: OpcionComidaEntity[], fechaBaja?: Date | null);
}
