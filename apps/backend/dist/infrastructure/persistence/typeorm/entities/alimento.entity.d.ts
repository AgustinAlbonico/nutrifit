import { UnidadMedida } from 'src/domain/entities/Alimento/UnidadMedida';
import { GrupoAlimenticioOrmEntity } from './grupo-alimenticio.entity';
import { AuditableOrmEntity } from '../common/auditable.orm-entity';
export declare class AlimentoOrmEntity extends AuditableOrmEntity {
    idAlimento: number;
    nombre: string;
    cantidad: number;
    calorias: number | null;
    proteinas: number | null;
    carbohidratos: number | null;
    grasas: number | null;
    hidratosDeCarbono: number | null;
    unidadMedida: UnidadMedida;
    grupoAlimenticio: GrupoAlimenticioOrmEntity[];
}
