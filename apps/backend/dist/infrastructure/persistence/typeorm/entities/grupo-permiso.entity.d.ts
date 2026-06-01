import { AccionOrmEntity } from './accion.entity';
import { UsuarioOrmEntity } from './usuario.entity';
import { AuditableOrmEntity } from "../common/auditable.orm-entity";
export declare class GrupoPermisoOrmEntity extends AuditableOrmEntity {
    id: number;
    clave: string;
    nombre: string;
    descripcion: string | null;
    acciones: AccionOrmEntity[];
    usuarios: UsuarioOrmEntity[];
    hijos: GrupoPermisoOrmEntity[];
}
