import { PersonaEntity } from '../Persona/persona.entity';
import { Rol } from './Rol';
import { GrupoPermisoEntity } from './grupo-permiso.entity';
import { AccionPermisoEntity } from './accion-permiso.entity';

export class UsuarioEntity {
  idUsuario: number | null;
  email: string;
  contraseña: string;
  fechaHoraAlta: Date;
  persona: PersonaEntity | null;
  rol: Rol;
  grupos: GrupoPermisoEntity[];
  acciones: AccionPermisoEntity[];

  constructor(
    idUsuario: number | null = null,
    email: string,
    contraseña: string,
    persona: PersonaEntity | null = null,
    rol: Rol,
    grupos: GrupoPermisoEntity[] = [],
    acciones: AccionPermisoEntity[] = [],
  ) {
    this.idUsuario = idUsuario;
    this.email = email;
    this.contraseña = contraseña;
    this.fechaHoraAlta = new Date();
    this.persona = persona;
    this.rol = rol;
    this.grupos = grupos;
    this.acciones = acciones;
  }

  getAccionesEfectivas(): string[] {
    const accionesMap = new Set<string>();

    for (const accion of this.acciones) {
      accionesMap.add(accion.clave);
    }

    const visitarGrupo = (
      grupo: GrupoPermisoEntity,
      visitados: Set<number>,
    ) => {
      if (visitados.has(grupo.id)) {
        return;
      }

      visitados.add(grupo.id);

      for (const accion of grupo.acciones) {
        accionesMap.add(accion.clave);
      }

      for (const hijo of grupo.hijos) {
        visitarGrupo(hijo, visitados);
      }
    };

    for (const grupo of this.grupos) {
      visitarGrupo(grupo, new Set<number>());
    }

    return Array.from(accionesMap);
  }
}
