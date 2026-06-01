import { AgendaEntity } from '../../Agenda/agenda.entity';
import { FormacionAcademicaEntity } from '../../FormacionAcademica/formacion-academica.entity';
import { TurnoEntity } from '../../Turno/turno.entity';
import { Genero } from '../Genero';
import { PersonaEntity } from '../persona.entity';

export class NutricionistaEntity extends PersonaEntity {
  matricula: string;
  tarifaSesion: number;
  añosExperiencia: number;
  agendas: AgendaEntity[];
  formacionAcademica: FormacionAcademicaEntity[];
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
    experiencia: number,
    tarifaSesion: number,
    agendas: AgendaEntity[] = [],
    formacionAcademica: FormacionAcademicaEntity[] = [],
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
    this.tarifaSesion = tarifaSesion;
    this.añosExperiencia = experiencia;
    this.agendas = agendas;
    this.formacionAcademica = formacionAcademica;
    this.turnos = turnos;
    this.fechaBaja = fechaBaja;
    this.fotoPerfilKey = null;
  }
}
