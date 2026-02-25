import { TipoComida } from 'src/domain/entities/OpcionComida/TipoComida';
import { Alimento } from 'src/domain/entities/Alimento/alimento.entity';
import { DiaPlanOrmEntity } from './dia-plan.entity';
export declare class OpcionComidaOrmEntity {
    idOpcionComida: number;
    comentarios: string | null;
    tipoComida: TipoComida;
    diaPlan: DiaPlanOrmEntity;
    alimentos: Alimento[];
}
