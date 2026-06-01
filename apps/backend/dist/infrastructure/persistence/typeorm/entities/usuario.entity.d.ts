import { PersonaOrmEntity } from './persona.entity';
import { Rol } from 'src/domain/entities/Usuario/Rol';
import { GrupoPermisoOrmEntity } from './grupo-permiso.entity';
import { AccionOrmEntity } from './accion.entity';
import { AuditableOrmEntity } from "../common/auditable.orm-entity";
export declare class UsuarioOrmEntity extends AuditableOrmEntity {
    idUsuario: number | null;
    email: string;
    contraseña: string;
    fechaHoraAlta: Date;
    persona: PersonaOrmEntity | null;
    rol: Rol;
    grupos: GrupoPermisoOrmEntity[];
    acciones: AccionOrmEntity[];
}
