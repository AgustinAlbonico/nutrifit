import { SocioOrmEntity } from './persona.entity';
import { TipoFoto } from 'src/domain/entities/FotoProgreso/tipo-foto.enum';
import { AuditableOrmEntity } from "../common/auditable.orm-entity";
export declare class FotoProgresoOrmEntity extends AuditableOrmEntity {
    idFoto: number;
    socio: SocioOrmEntity;
    tipoFoto: TipoFoto;
    objectKey: string;
    mimeType: string;
    notas: string | null;
    fecha: Date;
}
