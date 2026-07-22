import { Genero } from './Genero';

export abstract class PersonaEntity {
  idPersona: number | null;
  idPersonaNullable: number | null = null;
  nombre: string;
  apellido: string;
  fechaNacimiento: Date;
  genero: Genero;
  telefono: string;
  direccion: string;
  ciudad: string;
  provincia: string;
  dni: string;
  email: string;
  fechaBaja: Date | null;
  fotoPerfilKey: string | null;
  observaciones: string | null;
  /** ID del gimnasio al que pertenece esta persona (tenant isolation) */
  gimnasioId: number | null;

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
    email: string = '',
    fotoPerfilKey: string | null = null,
    gimnasioId: number | null = null,
    observaciones: string | null = null,
  ) {
    this.idPersona = idPersona;
    this.idPersonaNullable = idPersona;
    this.nombre = nombre;
    this.apellido = apellido;
    this.fechaNacimiento = fechaNacimiento;
    this.telefono = telefono;
    this.genero = genero;
    this.direccion = direccion;
    this.ciudad = ciudad;
    this.provincia = provincia;
    this.dni = dni;
    this.email = email;
    this.fechaBaja = null;
    this.fotoPerfilKey = fotoPerfilKey;
    this.gimnasioId = gimnasioId;
    this.observaciones = observaciones;
  }
}
