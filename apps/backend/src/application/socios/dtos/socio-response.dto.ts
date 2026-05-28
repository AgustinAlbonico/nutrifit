import { SocioEntity } from 'src/domain/entities/Persona/Socio/socio.entity';

/**
 * Forma mínima necesaria para construir un `SocioResponseDto`.
 * Compatible con `SocioEntity` y con resultados crudos del repositorio
 * que mantengan los mismos campos.
 */
export interface SocioResponseSource {
  idPersona: number | null;
  nombre: string;
  apellido: string;
  dni: string | null;
  fechaNacimiento: Date | string;
  telefono: string;
  genero: string;
  direccion: string;
  ciudad: string;
  provincia: string;
  email?: string | null;
  fechaBaja?: Date | string | null;
  fotoPerfilKey?: string | null;
}

function formatearFecha(fecha: Date | string | null | undefined): string | null {
  if (fecha === null || fecha === undefined) {
    return null;
  }

  if (fecha instanceof Date) {
    return fecha.toISOString().split('T')[0] ?? null;
  }

  return fecha;
}

function formatearFechaBaja(
  fecha: Date | string | null | undefined,
): string | null {
  if (fecha === null || fecha === undefined) {
    return null;
  }

  if (fecha instanceof Date) {
    return fecha.toISOString();
  }

  return fecha;
}

export class SocioResponseDto {
  idPersona: number | null;
  nombre: string;
  apellido: string;
  dni: string;
  fechaNacimiento: string | null;
  telefono: string;
  genero: string;
  direccion: string;
  ciudad: string;
  provincia: string;
  email: string;
  fechaBaja: string | null;
  activo: boolean;
  fotoPerfilUrl: string | null;

  constructor(socio: SocioEntity | SocioResponseSource) {
    this.idPersona = socio.idPersona;
    this.nombre = socio.nombre;
    this.apellido = socio.apellido;
    this.dni = socio.dni ?? '';
    this.fechaNacimiento = formatearFecha(socio.fechaNacimiento);
    this.telefono = socio.telefono;
    this.genero = socio.genero;
    this.direccion = socio.direccion;
    this.ciudad = socio.ciudad;
    this.provincia = socio.provincia;
    this.email = socio.email ?? '';
    this.fechaBaja = formatearFechaBaja(socio.fechaBaja);
    this.activo = !socio.fechaBaja;
    this.fotoPerfilUrl = socio.fotoPerfilKey
      ? `/socio/${socio.idPersona}/foto?v=${encodeURIComponent(socio.fotoPerfilKey)}`
      : null;
  }
}
