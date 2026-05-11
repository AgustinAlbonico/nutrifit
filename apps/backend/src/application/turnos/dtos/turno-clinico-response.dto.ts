import { TurnoOperacionResponseDto } from './turno-operacion-response.dto';

export class TurnoClinicoResponseDto extends TurnoOperacionResponseDto {
  observaciones?: ObservacionClinicaDtoClinico;
  mediciones?: MedicionDto[];
  ficha?: FichaSaludDto;
}

export class ObservacionClinicaDtoClinico {
  idObservacion: number;
  comentario: string;
  fechaCreacion: string;
}

export class MedicionDto {
  idMedicion: number;
  fecha: string;
  peso?: number;
  altura?: number;
  imc?: number;
}

export class FichaSaludDto {
  fichaSaludId: number;
  altura: number;
  peso: number;
  nivelActividadFisica: string;
  alergias: string[];
  patologias: string[];
}
