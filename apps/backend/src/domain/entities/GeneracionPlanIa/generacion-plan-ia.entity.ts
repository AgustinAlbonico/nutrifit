export type EstadoGeneracionPlanIa =
  | 'PENDIENTE'
  | 'GENERANDO'
  | 'COMPLETADO'
  | 'ERROR'
  | 'CANCELADO';

export class GeneracionPlanIaEntity {
  constructor(
    public readonly id: number,
    public readonly socioId: number,
    public readonly nutricionistaId: number,
    public readonly gimnasioId: number,
    public readonly planAlimentacionId: number | null,
    public readonly estado: EstadoGeneracionPlanIa,
    public readonly solicitudJson: unknown,
    public readonly proveedorActual: string | null,
    public readonly mensajeEstado: string | null,
    public readonly errorMensaje: string | null,
    public readonly respuestaJson: unknown | null,
    public readonly creadoEn: Date,
    public readonly actualizadoEn: Date,
    public readonly iniciadoEn: Date | null,
    public readonly finalizadoEn: Date | null,
  ) {}

  estaActiva(): boolean {
    return this.estado === 'PENDIENTE' || this.estado === 'GENERANDO';
  }
}
