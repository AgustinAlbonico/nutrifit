export type TendenciaReporteEvolucion = 'subiendo' | 'bajando' | 'estable';

export interface FiltrosReporteEvolucionPacienteDto {
  fechaInicio?: Date;
  fechaFin?: Date;
}

export interface ReporteEvolucionPacienteDto {
  socio: {
    id: number;
    nombre: string;
    apellido: string;
  };
  periodo: {
    fechaInicio: string | null;
    fechaFin: string | null;
  };
  resumen: {
    totalMediciones: number;
    pesoInicial: number | null;
    pesoActual: number | null;
    diferenciaPeso: number | null;
    tendenciaPeso: TendenciaReporteEvolucion | null;
    imcInicial: number | null;
    imcActual: number | null;
    diferenciaImc: number | null;
    consultasRealizadas: number;
    diasEnTratamiento: number | null;
    ultimaConsulta: string | null;
    sinControles: boolean;
    diasDesdeUltimoControl: number | null;
    umbralSinControlDias: 30;
    planActivo: boolean;
    objetivoPeso: {
      idObjetivo: number;
      valorObjetivo: number;
      progresoPorcentaje: number;
      fechaObjetivo: string | null;
    } | null;
  };
  grafico: {
    evolucion: Array<{
      fecha: string;
      peso: number;
      imc: number;
      perimetroCintura: number | null;
      porcentajeGrasa: number | null;
      masaMagra: number | null;
    }>;
  };
}
