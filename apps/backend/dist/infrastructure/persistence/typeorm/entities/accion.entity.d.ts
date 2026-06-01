import { GrupoPermisoOrmEntity } from './grupo-permiso.entity';
import { UsuarioOrmEntity } from './usuario.entity';
import { AuditableOrmEntity } from "../common/auditable.orm-entity";
export declare class AccionOrmEntity extends AuditableOrmEntity {
    id: number;
    clave: string;
    nombre: string;
    descripcion: string | null;
    grupos: GrupoPermisoOrmEntity[];
    usuarios: UsuarioOrmEntity[];
}
