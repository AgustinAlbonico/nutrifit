import { describe, expect, it } from 'vitest';

import { obtenerEtapasConsulta } from './estadoEtapas';

describe('obtenerEtapasConsulta', () => {
  it('marca contexto, evolucion, mediciones y observacion como completas cuando hay datos minimos', () => {
    const etapas = obtenerEtapasConsulta({
      cargoTurno: true,
      cargoEvolucion: true,
      hayMedicionBase: true,
      hayComentarioClinico: true,
      seModificoPlanObjetivos: false,
      cantidadFotosSesion: 0,
      cantidadAdjuntos: 0,
      errorEvolucion: false,
    });

    expect(etapas).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'contexto', estado: 'completa' }),
        expect.objectContaining({ id: 'evolucion', estado: 'completa' }),
        expect.objectContaining({ id: 'mediciones', estado: 'completa' }),
        expect.objectContaining({ id: 'observacion', estado: 'completa' }),
      ]),
    );
  });

  it('marca mediciones y observacion en error cuando faltan los minimos de cierre', () => {
    const etapas = obtenerEtapasConsulta({
      cargoTurno: true,
      cargoEvolucion: true,
      hayMedicionBase: false,
      hayComentarioClinico: false,
      seModificoPlanObjetivos: false,
      cantidadFotosSesion: 0,
      cantidadAdjuntos: 0,
      errorEvolucion: false,
    });

    expect(etapas).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'mediciones', estado: 'error' }),
        expect.objectContaining({ id: 'observacion', estado: 'error' }),
      ]),
    );
  });

  it('marca fotos y adjuntos como omitidos cuando no se cargaron porque no bloquean el cierre', () => {
    const etapas = obtenerEtapasConsulta({
      cargoTurno: true,
      cargoEvolucion: true,
      hayMedicionBase: true,
      hayComentarioClinico: true,
      seModificoPlanObjetivos: false,
      cantidadFotosSesion: 0,
      cantidadAdjuntos: 0,
      errorEvolucion: false,
    });

    expect(etapas).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'fotos', estado: 'omitida' }),
        expect.objectContaining({ id: 'adjuntos', estado: 'omitida' }),
      ]),
    );
  });

  it('marca evolucion como error si la carga de historial falla', () => {
    const etapas = obtenerEtapasConsulta({
      cargoTurno: true,
      cargoEvolucion: false,
      hayMedicionBase: true,
      hayComentarioClinico: true,
      seModificoPlanObjetivos: false,
      cantidadFotosSesion: 0,
      cantidadAdjuntos: 0,
      errorEvolucion: true,
    });

    expect(etapas).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'evolucion', estado: 'error' }),
      ]),
    );
  });
});
