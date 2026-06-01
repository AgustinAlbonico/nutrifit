import { Genero } from './Genero';
import { AuditableEntity } from '../../shared/auditable.entity';

export abstract class PersonaEntity extends AuditableEntity {
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
  fotoPerfilKey: string | null;
  gimnasioId: number;

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
    gimnasioId: number = 1,
    fechaBaja: Date | null = null,
  ) {
    super(fechaBaja);
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
    this.fotoPerfilKey = fotoPerfilKey;
    this.gimnasioId = gimnasioId;
  }
}
