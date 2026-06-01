import { DiaSemana } from 'src/domain/entities/DiaPlan/DiaSemana';
import { PlanAlimentacionOrmEntity } from './plan-alimentacion.entity';
import { OpcionComidaOrmEntity } from './opcion-comida.entity';
import { AuditableOrmEntity } from "../common/auditable.orm-entity";
export declare class DiaPlanOrmEntity extends AuditableOrmEntity {
    idDiaPlan: number;
    dia: DiaSemana;
    orden: number;
    planAlimentacion: PlanAlimentacionOrmEntity;
    opcionesComida: OpcionComidaOrmEntity[];
}
