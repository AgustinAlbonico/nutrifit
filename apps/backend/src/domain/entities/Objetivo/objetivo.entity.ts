export type TipoMetrica =
  | 'PESO'
  | 'CINTURA'
  | 'CADERA'
  | 'BRAZO'
  | 'MUSLO'
  | 'PECHO';

export type EstadoObjetivo = 'ACTIVO' | 'COMPLETADO' | 'ABANDONADO';

export class ObjetivoEntity {
  idObjetivo: number | null;
  socioId: number;
  tipoMetrica: TipoMetrica;
  valorInicial: number;
  valorObjetivo: number;
  valorActual: number;
  estado: EstadoObjetivo;
  fechaInicio: Date;
  fechaObjetivo: Date | null;
  createdAt: Date;
  updatedAt: Date;

  constructor(
    idObjetivo: number | null = null,
    socioId: number,
    tipoMetrica: TipoMetrica,
    valorInicial: number,
    valorObjetivo: number,
    valorActual: number,
    estado: EstadoObjetivo,
    fechaInicio: Date,
    fechaObjetivo: Date | null = null,
    createdAt: Date = new Date(),
    updatedAt: Date = new Date(),
  ) {
    this.idObjetivo = idObjetivo;
    this.socioId = socioId;
    this.tipoMetrica = tipoMetrica;
    this.valorInicial = valorInicial;
    this.valorObjetivo = valorObjetivo;
    this.valorActual = valorActual;
    this.estado = estado;
    this.fechaInicio = fechaInicio;
    this.fechaObjetivo = fechaObjetivo;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  calcularProgreso(): number {
    const recorridoTotal = this.valorObjetivo - this.valorInicial;

    if (recorridoTotal === 0) {
      return 100;
    }

    const recorridoActual = this.valorActual - this.valorInicial;
    const progreso = (recorridoActual / recorridoTotal) * 100;

    if (!Number.isFinite(progreso)) {
      return 0;
    }

    return Math.max(0, Math.min(100, Number(progreso.toFixed(2))));
  }
}
