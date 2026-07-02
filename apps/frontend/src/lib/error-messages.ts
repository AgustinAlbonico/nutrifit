/**
 * Helper que traduce errores de API a mensajes amigables en español.
 *
 * El backend suele devolver mensajes técnicos ("Error interno del servidor",
 * "Not Found", "Forbidden") o códigos como `GROQ_TIMEOUT`, `SERVER_ERROR`,
 * `PLAN_ESTRUCTURA_INVALIDA`. Esta función normaliza esos casos para que
 * el NUT vea qué pasó y qué hacer.
 *
 * No reemplaza la lógica del backend: este helper es solo capa de
 * presentación. Si el backend no provee contexto, devolvemos un fallback
 * neutro.
 */

export interface MensajeErrorApi {
  /** Título corto en una línea (2-5 palabras). */
  titulo: string;
  /** Descripción (1-2 frases). Puede ser null si no hay detalle. */
  descripcion: string | null;
}

interface PatronError {
  coincidencias: string[];
  mensaje: MensajeErrorApi;
}

const PATRONES: PatronError[] = [
  {
    coincidencias: ['groq_timeout', 'timeout', 'timo'],
    mensaje: {
      titulo: 'La IA está sobrecargada',
      descripcion: 'Reintentá en 30 segundos. Mientras tanto podés editar otras secciones.',
    },
  },
  {
    coincidencias: ['ai_rate_limit', 'rate limit', '429', 'límite de uso'],
    mensaje: {
      titulo: 'Se alcanzó el límite diario de uso de la IA',
      descripcion: 'Groq limita la cantidad de generaciones por día. Esperá unos minutos y reintentá, o probá mañana.',
    },
  },
  {
    coincidencias: ['groq_invalid_json', 'json inválido', 'json malformed'],
    mensaje: {
      titulo: 'La IA devolvió un formato inesperado',
      descripcion: 'Reintentá la generación. Si persiste, contactanos.',
    },
  },
  {
    coincidencias: ['plan_estructura_invalida'],
    mensaje: {
      titulo: 'La IA no respetó la estructura solicitada',
      descripcion: 'Reintentá con menos días o comidas para acotar el problema.',
    },
  },
  {
    coincidencias: ['sin permisos', 'forbidden', '403'],
    mensaje: {
      titulo: 'No tenés permisos para esto',
      descripcion: 'Pedile al administrador que revise los permisos de tu rol.',
    },
  },
  {
    coincidencias: ['no encontrad', '404', 'not_found'],
    mensaje: {
      titulo: 'No se encontró el recurso',
      descripcion: 'Es posible que haya sido eliminado o que no pertenezca a tu gimnasio.',
    },
  },
  {
    coincidencias: ['server_error', 'error interno del servidor', '500'],
    mensaje: {
      titulo: 'No pudimos generar el plan',
      descripcion: 'Reintentá en unos minutos. Si el problema continúa, contactanos.',
    },
  },
];

const MENSAJE_POR_DEFECTO: MensajeErrorApi = {
  titulo: 'Algo salió mal',
  descripcion: 'Reintentá en unos minutos. Si persiste, contactanos.',
};

function normalizar(texto: string): string {
  return texto.toLowerCase().trim();
}

export function traducirErrorApi(err: unknown): MensajeErrorApi {
  if (err === null || err === undefined) {
    return MENSAJE_POR_DEFECTO;
  }

  const textoPlano =
    err instanceof Error
      ? err.message
      : typeof err === 'string'
        ? err
        : '';

  const textoNormalizado = normalizar(textoPlano);
  if (!textoNormalizado) {
    return MENSAJE_POR_DEFECTO;
  }

  for (const patron of PATRONES) {
    const match = patron.coincidencias.some((c) =>
      textoNormalizado.includes(c),
    );
    if (match) return patron.mensaje;
  }

  // Si no matchea ningún patrón, devolvemos el mensaje del backend como
  // descripción (mantiene transparencia: el NUT ve exactamente qué dijo
  // el servidor) y un título genérico.
  return {
    titulo: 'Algo salió mal',
    descripcion: textoPlano,
  };
}
