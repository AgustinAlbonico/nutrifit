import { TurnoEntity } from '../../Turno/turno.entity';
import { Genero } from '../Genero';
import { PersonaEntity } from '../persona.entity';

export class EntrenadorEntity extends PersonaEntity {
  especialidad: string;
  turnos: TurnoEntity[];
  fechaBaja: Date | null;
  fotoPerfilKey: string | null;

  constructor(
    idPersona: number | null = null,
    nombre: string,
    apellido: string,
    fechaNacimiento: Date,
    telefono: string,
    genero: Genero,
    direccion: string,
    ciudad: string,
    provincia: string,
    dni: string,
    especialidad: string,
    turnos: TurnoEntity[] = [],
    fechaBaja: Date | null = null,
    email: string = '',
  ) {
    super(
      idPersona,
      nombre,
      apellido,
      fechaNacimiento,
      telefono,
      genero,
      direccion,
      ciudad,
      provincia,
      dni,
      email,
    );
    this.especialidad = especialidad;
    this.turnos = turnos;
    this.fechaBaja = fechaBaja;
    this.fotoPerfilKey = null;
  }
}
