import { describe, expect, it } from 'vitest';

import type { HistorialMediciones } from './types';
import { derivarSeriesEvolucion } from './useSeriesEvolucion';

const historialBase: HistorialMediciones = {
  socioId: 10,
  nombreSocio: 'Ana',
  apellidoSocio: 'Perez',
  altura: 165,
  mediciones: [
    {
      idMedicion: 1,
      fecha: '2026-01-10T10:00:00.000Z',
      peso: 80,
      altura: 165,
      imc: 29.4,
      perimetroCintura: 92,
      perimetroCadera: 105,
      perimetroBrazo: 31,
      perimetroMuslo: 60,
      perimetroPecho: 98,
      pliegueTriceps: 25,
      pliegueAbdominal: 32,
      pliegueMuslo: 28,
      porcentajeGrasa: 34,
      masaMagra: 52.8,
      frecuenciaCardiaca: 74,
      tensionSistolica: 118,
      tensionDiastolica: 78,
      notasMedicion: null,
      profesional: null,
    },
    {
      idMedicion: 2,
      fecha: '2026-04-10T10:00:00.000Z',
      peso: 75,
      altura: 165,
      imc: 27.5,
      perimetroCintura: 86,
      perimetroCadera: 101,
      perimetroBrazo: 30,
      perimetroMuslo: 58,
      perimetroPecho: 96,
      pliegueTriceps: 20,
      pliegueAbdominal: 26,
      pliegueMuslo: 24,
      porcentajeGrasa: 30,
      masaMagra: 52.5,
      frecuenciaCardiaca: 70,
      tensionSistolica: 116,
      tensionDiastolica: 76,
      notasMedicion: 'Buen progreso',
      profesional: { id: 2, nombre: 'Laura', apellido: 'Gomez' },
    },
  ],
};

describe('derivarSeriesEvolucion', () => {
  it('ordena ascendente y calcula delta de peso y cintura contra linea base', () => {
    const resultado = derivarSeriesEvolucion(historialBase, 'todo');

    expect(resultado.mediciones).toHaveLength(2);
    expect(resultado.kpis.pesoActual?.valor).toBe(75);
    expect(resultado.kpis.pesoActual?.deltaLineaBase).toBe(-5);
    expect(resultado.kpis.cinturaActual?.deltaLineaBase).toBe(-6);
  });

  it('calcula suma de pliegues y deja disponible la serie clinica', () => {
    const resultado = derivarSeriesEvolucion(historialBase, 'todo');

    expect(resultado.series.pliegues[0].sumaPliegues).toBe(85);
    expect(resultado.series.pliegues[1].sumaPliegues).toBe(70);
  });
});
