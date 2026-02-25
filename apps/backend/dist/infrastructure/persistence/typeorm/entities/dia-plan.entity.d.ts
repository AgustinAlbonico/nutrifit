import { DiaSemana } from 'src/domain/entities/DiaPlan/DiaSemana';
import { PlanAlimentacionOrmEntity } from './plan-alimentacion.entity';
import { OpcionComidaOrmEntity } from './opcion-comida.entity';
export declare class DiaPlanOrmEntity {
    idDiaPlan: number;
    dia: DiaSemana;
    orden: number;
    planAlimentacion: PlanAlimentacionOrmEntity;
    opcionesComida: OpcionComidaOrmEntity[];
}
