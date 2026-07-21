export type FaltanteCierreConsulta = 'MEDICION_BASE' | 'COMENTARIO_CLINICO';

export interface EntradaValidarCierreConsulta {
  tieneMedicionBase: boolean;
  tieneComentarioClinico: boolean;
}

export interface ResultadoValidarCierreConsulta {
  puedeCerrar: boolean;
  faltantes: FaltanteCierreConsulta[];
}

export function validarCierreConsulta(
  entrada: EntradaValidarCierreConsulta,
): ResultadoValidarCierreConsulta {
  const faltantes: FaltanteCierreConsulta[] = [];

  if (!entrada.tieneMedicionBase) {
    faltantes.push('MEDICION_BASE');
  }

  if (!entrada.tieneComentarioClinico) {
    faltantes.push('COMENTARIO_CLINICO');
  }

  return {
    puedeCerrar: faltantes.length === 0,
    faltantes,
  };
}
