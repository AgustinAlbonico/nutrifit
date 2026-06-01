import { TipoComida } from 'src/domain/entities/OpcionComida/TipoComida';
import { DiaPlanOrmEntity } from './dia-plan.entity';
import { ItemComidaOrmEntity } from './item-comida.entity';
import { AlimentoOrmEntity } from './alimento.entity';
import { AuditableOrmEntity } from "../common/auditable.orm-entity";
export declare class OpcionComidaOrmEntity extends AuditableOrmEntity {
    idOpcionComida: number;
    comentarios: string | null;
    tipoComida: TipoComida;
    diaPlan: DiaPlanOrmEntity;
    items: ItemComidaOrmEntity[];
    get alimentos(): AlimentoOrmEntity[];
    set alimentos(alimentos: AlimentoOrmEntity[]);
    get tieneItemsReales(): boolean;
}
