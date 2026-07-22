import { AgendaEntity } from '../../Agenda/agenda.entity';
import { CertificacionEntity } from '../../Certificacion/certificacion.entity';
import { DiplomaEntity } from '../../Diploma/diploma.entity';
import { FormacionAcademicaEntity } from '../../FormacionAcademica/formacion-academica.entity';
import { TurnoEntity } from '../../Turno/turno.entity';
import { Genero } from '../Genero';
import { PersonaEntity } from '../persona.entity';
import { AuditableEntity } from '../../../shared/auditable.entity';

export class NutricionistaEntity extends PersonaEntity {
  matricula: string;
  tarifaSesion: number;
  aniosExperiencia: number;
  agendas: AgendaEntity[];
  formacionAcademica: FormacionAcademicaEntity[];
  certificaciones: CertificacionEntity[];
  diplomas: DiplomaEntity[];
  turnos: TurnoEntity[];
  fotoPerfilKey: string | null;
  presentacion: string | null;
  duracionTurnoMin: number;
  matriculaDocumentoKey: string | null;
  /**
   * Notas persistentes privadas del nutricionista para la IA (max 2000 chars).
   * Se concatenan con `plan_alimentacion.notas_generacion` al construir el
   * prompt de generación de planes. Son preferencias blandas (no restricciones
   * duras del socio) y aplican a TODAS las futuras generaciones del NUT.
   */
  preferenciasIa: string | null;

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
    certificaciones: CertificacionEntity[] = [],
    diplomas: DiplomaEntity[] = [],
    turnos: TurnoEntity[] = [],
    fechaBaja: Date | null = null,
    email: string = '',
    presentacion: string | null = null,
    duracionTurnoMin: number = 30,
    matriculaDocumentoKey: string | null = null,
    preferenciasIa: string | null = null,
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
      null,
      null,
    );
    this.matricula = '';
    this.tarifaSesion = tarifaSesion;
    this.aniosExperiencia = experiencia;
    this.agendas = agendas;
    this.formacionAcademica = formacionAcademica;
    this.certificaciones = certificaciones;
    this.diplomas = diplomas;
    this.turnos = turnos;
    this.fechaBaja = fechaBaja;
    this.fotoPerfilKey = null;
    this.presentacion = presentacion;
    this.duracionTurnoMin = duracionTurnoMin;
    this.matriculaDocumentoKey = matriculaDocumentoKey;
    this.preferenciasIa = preferenciasIa;
  }
}
