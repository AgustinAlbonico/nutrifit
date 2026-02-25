export class SocioResponseDto {
  idPersona: number;
  nombre: string;
  apellido: string;
  dni: string;
  fechaNacimiento: string;
  telefono: string;
  genero: string;
  direccion: string;
  ciudad: string;
  provincia: string;
  email: string;
  fechaBaja: string | null;
  activo: boolean;
  fotoPerfilUrl: string | null;

  constructor(socio: any) {
    this.idPersona = socio.idPersona;
    this.nombre = socio.nombre;
    this.apellido = socio.apellido;
    this.dni = socio.dni ?? '';
    this.fechaNacimiento = socio.fechaNacimiento?.toISOString?.()
      ? socio.fechaNacimiento.toISOString().split('T')[0]
      : socio.fechaNacimiento;
    this.telefono = socio.telefono;
    this.genero = socio.genero;
    this.direccion = socio.direccion;
    this.ciudad = socio.ciudad;
    this.provincia = socio.provincia;
    this.email = socio.email ?? '';
    this.fechaBaja = socio.fechaBaja
      ? (socio.fechaBaja.toISOString?.() ?? socio.fechaBaja)
      : null;
    this.activo = !socio.fechaBaja;
    this.fotoPerfilUrl = socio.fotoPerfilKey
      ? `/socio/${socio.idPersona}/foto?v=${encodeURIComponent(socio.fotoPerfilKey)}`
      : null;
  }
}
