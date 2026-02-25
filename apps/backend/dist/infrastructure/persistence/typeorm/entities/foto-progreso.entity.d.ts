import { SocioOrmEntity } from './persona.entity';
import { TipoFoto } from 'src/domain/entities/FotoProgreso/tipo-foto.enum';
export declare class FotoProgresoOrmEntity {
    idFoto: number;
    socio: SocioOrmEntity;
    tipoFoto: TipoFoto;
    objectKey: string;
    mimeType: string;
    notas: string | null;
    fecha: Date;
}
