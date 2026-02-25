import { GrupoPermisoOrmEntity } from './grupo-permiso.entity';
import { UsuarioOrmEntity } from './usuario.entity';
export declare class AccionOrmEntity {
    id: number;
    clave: string;
    nombre: string;
    descripcion: string | null;
    grupos: GrupoPermisoOrmEntity[];
    usuarios: UsuarioOrmEntity[];
}
