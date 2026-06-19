import { render, screen } from '@testing-library/react';

import { PanelResumenEvolucion } from './PanelResumenEvolucion';

describe('PanelResumenEvolucion', () => {
  it('muestra titulo, subtitulo, rango temporal y kpis principales', () => {
    render(
      <PanelResumenEvolucion
        titulo="Evolucion de Ana Perez"
        subtitulo="12 mediciones desde 10/01/2026"
        rangoTemporal="todo"
        onCambiarRango={() => {}}
        kpis={{
          pesoActual: {
            valor: 75,
            deltaLineaBase: -5,
            deltaPorcentual: -6.25,
            unidad: 'kg',
            tendenciaTexto: 'vs linea base',
          },
          cinturaActual: {
            valor: 86,
            deltaLineaBase: -6,
            deltaPorcentual: -6.52,
            unidad: 'cm',
            tendenciaTexto: 'vs linea base',
          },
        }}
      />,
    );

    expect(screen.getByText('Evolucion de Ana Perez')).toBeInTheDocument();
    expect(screen.getByText('12 mediciones desde 10/01/2026')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /todo/i })).toBeInTheDocument();
    expect(screen.getByText('Peso actual')).toBeInTheDocument();
    expect(screen.getByText('75 kg')).toBeInTheDocument();
    expect(screen.getByText('Cintura actual')).toBeInTheDocument();
    expect(screen.getByText('86 cm')).toBeInTheDocument();
  });
});
