import type {
  EstadoDatosConsulta,
  EstadoEtapaConsulta,
  EtapaConsulta,
  IdEtapaConsulta,
} from '@/types/consulta';

const DEFINICION_ETAPAS: Array<{
  id: IdEtapaConsulta;
  titulo: string;
  descripcion: string;
}> = [
  {
    id: 'contexto',
    titulo: 'Contexto',
    descripcion: 'Datos del socio, ficha de salud y alertas clínicas.',
  },
  {
    id: 'evolucion',
    titulo: 'Evolución',
    descripcion: 'Historial previo y tendencia del paciente.',
  },
  {
    id: 'mediciones',
    titulo: 'Mediciones',
    descripcion: 'Registro antropométrico de la consulta.',
  },
  {
    id: 'observacion',
    titulo: 'Clínica',
    descripcion: 'Comentario profesional y acuerdos clínicos.',
  },
  {
    id: 'planObjetivos',
    titulo: 'Plan',
    descripcion: 'Plan alimentario y objetivos de seguimiento.',
  },
  {
    id: 'fotos',
    titulo: 'Fotos',
    descripcion: 'Tomas de frente, perfil, espalda u otra.',
  },
  {
    id: 'adjuntos',
    titulo: 'Adjuntos',
    descripcion: 'Estudios, análisis o documentos de respaldo.',
  },
  {
    id: 'revision',
    titulo: 'Revisión',
    descripcion: 'Checklist final antes del cierre clínico.',
  },
];

export function obtenerEtapasConsulta(
  datos: EstadoDatosConsulta,
): EtapaConsulta[] {
  return DEFINICION_ETAPAS.map((etapa) => ({
    ...etapa,
    estado: obtenerEstadoEtapa(etapa.id, datos),
  }));
}

function obtenerEstadoEtapa(
  etapa: IdEtapaConsulta,
  datos: EstadoDatosConsulta,
): EstadoEtapaConsulta {
  if (!datos.cargoTurno) {
    return etapa === 'contexto' ? 'pendiente' : 'bloqueada';
  }

  if (etapa === 'contexto') {
    return 'completa';
  }

  if (etapa === 'evolucion') {
    if (datos.errorEvolucion) return 'error';
    return datos.cargoEvolucion ? 'completa' : 'pendiente';
  }

  if (etapa === 'mediciones') {
    return datos.hayMedicionBase ? 'completa' : 'error';
  }

  if (etapa === 'observacion') {
    return datos.hayComentarioClinico ? 'completa' : 'error';
  }

  if (etapa === 'planObjetivos') {
    return datos.seModificoPlanObjetivos ? 'completa' : 'omitida';
  }

  if (etapa === 'fotos') {
    return datos.cantidadFotosSesion > 0 ? 'completa' : 'omitida';
  }

  if (etapa === 'adjuntos') {
    return datos.cantidadAdjuntos > 0 ? 'completa' : 'omitida';
  }

  return datos.hayMedicionBase && datos.hayComentarioClinico
    ? 'completa'
    : 'pendiente';
}

export function puedeCerrarConsulta(etapas: EtapaConsulta[]): boolean {
  return etapas.every(
    (etapa) => etapa.estado !== 'error' && etapa.estado !== 'bloqueada',
  );
}
