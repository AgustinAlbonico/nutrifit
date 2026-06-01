import { EstadoObjetivo, TipoMetrica } from 'src/domain/entities/Objetivo/objetivo.entity';
import { SocioOrmEntity } from './persona.entity';
import { AuditableOrmEntity } from "../common/auditable.orm-entity";
export declare class ObjetivoOrmEntity extends AuditableOrmEntity {
    idObjetivo: number;
    socioId: number;
    tipoMetrica: TipoMetrica;
    valorInicial: number;
    valorObjetivo: number;
    valorActual: number;
    estado: EstadoObjetivo;
    fechaInicio: Date;
    fechaObjetivo: Date | null;
    createdAt: Date;
    updatedAt: Date;
    socio: SocioOrmEntity;
}
