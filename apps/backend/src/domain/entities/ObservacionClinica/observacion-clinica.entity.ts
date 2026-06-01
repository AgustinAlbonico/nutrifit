import { AuditableEntity } from '../../shared/auditable.entity';

export class ObservacionClinicaEntity extends AuditableEntity {
  idObservacion: number | null;
  comentario: string;
  peso: number;
  altura: number;
  imc: number;
  objetivosSocio: string;
  sugerencias: string | null;
  habitosSocio: string | null;
  circunferenciaCintura: number;

  constructor(
    idObservacion: number | null = null,
    comentario: string,
    peso: number,
    altura: number,
    imc: number,
    objetivosSocio: string,
    sugerencias: string | null = null,
    habitosSocio: string | null = null,
    circunferenciaCintura: number,
    fechaBaja: Date | null = null,
  ) {
    super(fechaBaja);
    this.idObservacion = idObservacion;
    this.comentario = comentario;
    this.peso = peso;
    this.altura = altura;
    this.imc = imc;
    this.objetivosSocio = objetivosSocio;
    this.sugerencias = sugerencias;
    this.habitosSocio = habitosSocio;
    this.circunferenciaCintura = circunferenciaCintura;
  }
}
