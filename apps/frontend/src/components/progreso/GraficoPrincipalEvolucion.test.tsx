import { render, screen } from '@testing-library/react';

import { GraficoPrincipalEvolucion } from './GraficoPrincipalEvolucion';
import type { HistorialMediciones, ResumenProgreso } from './types';

const historialBase: HistorialMediciones = {
  socioId: 10,
  nombreSocio: 'Ana',
  apellidoSocio: 'Perez',
  altura: 165,
  mediciones: [
    {
      idMedicion: 1,
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
      profesional: null,
    },
  ],
};

const resumenBase: ResumenProgreso = {
  peso: { inicial: 80, actual: 75, diferencia: -5, tendencia: 'bajando' },
  imc: { inicial: 29.4, actual: 27.5, diferencia: -1.9, categoriaActual: 'sobrepeso' },
  perimetros: {
    cintura: { inicial: 92, actual: 86, diferencia: -6, tendencia: 'bajando' },
    cadera: { inicial: 105, actual: 101, diferencia: -4, tendencia: 'bajando' },
    brazo: { inicial: 31, actual: 30, diferencia: -1, tendencia: 'bajando' },
    muslo: { inicial: 60, actual: 58, diferencia: -2, tendencia: 'bajando' },
  },
  relacionCinturaCadera: { inicial: 0.876, actual: 0.851, riesgoCardiovascular: 'moderado' },
  rangoSaludable: { pesoMinimo: 50.36, pesoMaximo: 67.81 },
  totalMediciones: 1,
  primeraMedicion: '2026-04-10T10:00:00.000Z',
  ultimaMedicion: '2026-04-10T10:00:00.000Z',
};

describe('GraficoPrincipalEvolucion', () => {
  it('muestra selector de metricas y modo pliegues', () => {
    render(
      <GraficoPrincipalEvolucion
        modo="pliegues"
        onCambiarModo={() => {}}
        historial={historialBase}
        resumen={resumenBase}
      />,
    );

    expect(screen.getByRole('button', { name: /pliegues/i })).toBeInTheDocument();
    expect(screen.getAllByText('Pliegues cutaneos').length).toBeGreaterThan(0);
  });
});
