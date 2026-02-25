import { Genero } from './Genero';

export abstract class PersonaEntity {
  idPersona: number | null;
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
  ) {
    this.idPersona = idPersona;
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
  }
}
