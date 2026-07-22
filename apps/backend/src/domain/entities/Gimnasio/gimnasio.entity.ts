export enum EstadoGimnasio {
  PENDIENTE_PAGO = 'PENDIENTE_PAGO',
  ACTIVO = 'ACTIVO',
  SUSPENDIDO = 'SUSPENDIDO',
  DADO_DE_BAJA = 'DADO_DE_BAJA',
}

export interface GimnasioEntityData {
  id: number;
  nombre: string;
  direccion: string;
  telefono: string | null;
  email: string | null;
  ciudad?: string | null;
  estado?: EstadoGimnasio;
  fechaAlta: Date;
  fechaBaja: Date | null;
}

/**
 * Entidad de dominio para Gimnasio.
 * Representa la raiz del tenant en el modelo multi-tenant.
 */
export class GimnasioEntity {
  public readonly id: number;
  public readonly nombre: string;
  public readonly direccion: string;
  public readonly telefono: string | null;
  public readonly email: string | null;
  public readonly ciudad: string | null;
  public readonly estado: EstadoGimnasio;
  public readonly fechaAlta: Date;
  public readonly fechaBaja: Date | null;

  constructor(data: GimnasioEntityData) {
    this.id = data.id;
    this.nombre = data.nombre;
    this.direccion = data.direccion;
    this.telefono = data.telefono;
    this.email = data.email;
    this.ciudad = data.ciudad ?? null;
    this.estado = data.estado ?? EstadoGimnasio.ACTIVO;
    this.fechaAlta = data.fechaAlta;
    this.fechaBaja = data.fechaBaja;
  }

  /** Indica si el gimnasio está activo (no dado de baja) */
  get activo(): boolean {
    return this.estado === EstadoGimnasio.ACTIVO && this.fechaBaja === null;
  }
}
