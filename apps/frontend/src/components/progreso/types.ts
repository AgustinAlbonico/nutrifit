// Tipos para el módulo de progreso

export type Tendencia = 'subiendo' | 'bajando' | 'estable';
export type CategoriaIMC = 'bajo_peso' | 'normal' | 'sobrepeso' | 'obesidad';
export type RiesgoCardiovascular = 'bajo' | 'moderado' | 'alto';

export interface MedicionHistorial {
  idMedicion: number;
  fecha: string;
  peso: number;
  altura: number;
  imc: number;
  perimetroCintura: number | null;
  perimetroCadera: number | null;
  perimetroBrazo: number | null;
  perimetroMuslo: number | null;
  perimetroPecho: number | null;
  pliegueTriceps: number | null;
  pliegueAbdominal: number | null;
  pliegueMuslo: number | null;
  porcentajeGrasa: number | null;
  masaMagra: number | null;
  frecuenciaCardiaca: number | null;
  tensionSistolica: number | null;
  tensionDiastolica: number | null;
  notasMedicion: string | null;
  profesional: {
    id: number | null;
    nombre: string;
    apellido: string;
  } | null;
}

export interface ProgresoMetrica {
  inicial: number | null;
  actual: number | null;
  diferencia: number | null;
  tendencia: Tendencia | null;
}

export interface ResumenProgreso {
  peso: {
    inicial: number | null;
    actual: number | null;
    diferencia: number | null;
    tendencia: Tendencia | null;
  };
  imc: {
    inicial: number | null;
    actual: number | null;
    diferencia: number | null;
    categoriaActual: CategoriaIMC | null;
  };
  perimetros: {
    cintura: ProgresoMetrica;
    cadera: ProgresoMetrica;
    brazo: ProgresoMetrica;
    muslo: ProgresoMetrica;
  };
  relacionCinturaCadera: {
    inicial: number | null;
    actual: number | null;
    riesgoCardiovascular: RiesgoCardiovascular | null;
  };
  rangoSaludable: {
    pesoMinimo: number | null;
    pesoMaximo: number | null;
  };
  totalMediciones: number;
  primeraMedicion: string | null;
  ultimaMedicion: string | null;
}

export interface HistorialMediciones {
  socioId: number;
  nombreSocio: string;
  apellidoSocio: string;
  altura: number;
  mediciones: MedicionHistorial[];
}

// Datos formateados para gráficos
export interface DatoGraficoPeso {
  fecha: string;
  fechaFormateada: string;
  peso: number;
  imc: number;
  objetivo?: number;
  pesoMinimoSaludable?: number;
  pesoMaximoSaludable?: number;
}

export interface DatoGraficoPerimetros {
  fecha: string;
  fechaFormateada: string;
  cintura: number | null;
  cadera: number | null;
  brazo: number | null;
  muslo: number | null;
}

export interface DatoGraficoComposicion {
  fecha: string;
  fechaFormateada: string;
  porcentajeGrasa: number | null;
  masaMagra: number | null;
}

export interface DatoGraficoSignosVitales {
  fecha: string;
  fechaFormateada: string;
  frecuenciaCardiaca: number | null;
  tensionSistolica: number | null;
  tensionDiastolica: number | null;
}

// Tipos para fotos de progreso
export type TipoFoto = 'frente' | 'perfil' | 'espalda' | 'otro';

export interface FotoProgreso {
  idFoto: number;
  socioId: number;
  tipoFoto: TipoFoto;
  objectKey: string;
  mimeType: string;
  notas: string | null;
  fecha: string;
  urlFirmada: string;
}

export interface FotosPorTipo {
  tipoFoto: TipoFoto;
  fotos: FotoProgreso[];
}

export interface GaleriaFotos {
  fotos: FotosPorTipo[];
}

// Tipos para objetivos
export type TipoMetrica = 'PESO' | 'CINTURA' | 'CADERA' | 'BRAZO' | 'MUSLO' | 'PECHO';
export type EstadoObjetivo = 'ACTIVO' | 'COMPLETADO' | 'ABANDONADO';

export interface Objetivo {
  idObjetivo: number;
  socioId: number;
  tipoMetrica: TipoMetrica;
  valorInicial: number;
  valorActual: number;
  valorObjetivo: number;
  estado: EstadoObjetivo;
  fechaInicio: string;
  fechaObjetivo: string | null;
  createdAt: string;
  updatedAt: string;
  progreso: number;
}

export interface ListaObjetivos {
  activos: Objetivo[];
  completados: Objetivo[];
}

// DTOs para crear/actualizar
export interface CrearObjetivoDto {
  tipoMetrica: TipoMetrica;
  valorInicial: number;
  valorObjetivo: number;
  fechaObjetivo?: string;
}

export interface ActualizarObjetivoDto {
  valorActual: number;
}
