import { PersonaEntity } from '../Persona/persona.entity';
import { Rol } from './Rol';
import { GrupoPermisoEntity } from './grupo-permiso.entity';
import { AccionPermisoEntity } from './accion-permiso.entity';
export declare class UsuarioEntity {
    idUsuario: number | null;
    email: string;
    contraseña: string;
    fechaHoraAlta: Date;
    persona: PersonaEntity | null;
    rol: Rol;
    grupos: GrupoPermisoEntity[];
    acciones: AccionPermisoEntity[];
    constructor(idUsuario: number | null | undefined, email: string, contraseña: string, persona: (PersonaEntity | null) | undefined, rol: Rol, grupos?: GrupoPermisoEntity[], acciones?: AccionPermisoEntity[]);
    getAccionesEfectivas(): string[];
}
