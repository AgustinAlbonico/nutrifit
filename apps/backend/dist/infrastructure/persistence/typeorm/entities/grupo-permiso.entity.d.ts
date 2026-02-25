import { AccionOrmEntity } from './accion.entity';
import { UsuarioOrmEntity } from './usuario.entity';
export declare class GrupoPermisoOrmEntity {
    id: number;
    clave: string;
    nombre: string;
    descripcion: string | null;
    acciones: AccionOrmEntity[];
    usuarios: UsuarioOrmEntity[];
    hijos: GrupoPermisoOrmEntity[];
}
