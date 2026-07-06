import { Genero } from '../Genero';
import { PersonaEntity } from '../persona.entity';
import { AuditableEntity } from '../../../shared/auditable.entity';

export class RecepcionistaEntity extends PersonaEntity {
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
    fechaBaja: Date | null = null,
    gimnasioId: number = 1,
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
      '',
      null,
      gimnasioId,
    );
    this.fechaBaja = fechaBaja;
  }
}
