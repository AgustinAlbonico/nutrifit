import { RecepcionistaEntity } from 'src/domain/entities/Persona/Recepcionista/recepcionista.entity';

export class RecepcionistaResponseDto {
  idPersona: number;
  nombre: string;
  apellido: string;
  fechaNacimiento: Date;
  telefono: string;
  genero: string;
  direccion: string;
  ciudad: string;
  provincia: string;
  dni: string;
  email: string;
  activo: boolean;
  fotoPerfilUrl?: string;
  fechaBaja: Date | null;

  static fromEntity(entity: RecepcionistaEntity): RecepcionistaResponseDto {
    const dto = new RecepcionistaResponseDto();
    dto.idPersona = entity.idPersona!;
    dto.nombre = entity.nombre;
    dto.apellido = entity.apellido;
    dto.fechaNacimiento = entity.fechaNacimiento;
    dto.telefono = entity.telefono;
    dto.genero = entity.genero;
    dto.direccion = entity.direccion;
    dto.ciudad = entity.ciudad;
    dto.provincia = entity.provincia;
    dto.dni = entity.dni;
    dto.email = entity.email;
    dto.activo = !entity.fechaBaja;
    dto.fechaBaja = entity.fechaBaja;

    if (entity.fotoPerfilKey) {
      dto.fotoPerfilUrl = `/recepcionistas/${entity.idPersona}/foto?v=${encodeURIComponent(
        entity.fotoPerfilKey,
      )}`;
    }

    return dto;
  }
}
