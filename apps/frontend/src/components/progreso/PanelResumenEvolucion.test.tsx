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
          grasaCorporalActual: {
            valor: 26,
            deltaLineaBase: -4,
            deltaPorcentual: -13.33,
            unidad: '%',
            tendenciaTexto: 'vs linea base',
          },
          masaMagraActual: {
            valor: 62.2,
            deltaLineaBase: 1.8,
            deltaPorcentual: 2.98,
            unidad: 'kg',
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
    expect(screen.getByText('Grasa corporal')).toBeInTheDocument();
    expect(screen.getByText('26 %')).toBeInTheDocument();
    expect(screen.getByText('Masa magra')).toBeInTheDocument();
    expect(screen.getByText('62.2 kg')).toBeInTheDocument();
  });

  it('muestra la relacion cintura-cadera y la categoria de riesgo cuando hay dato', () => {
    render(
      <PanelResumenEvolucion
        titulo="Evolucion de Ana"
        subtitulo="Datos del paciente"
        rangoTemporal="todo"
        onCambiarRango={() => {}}
        kpis={{
          pesoActual: { valor: 75, deltaLineaBase: -5, deltaPorcentual: null, unidad: 'kg', tendenciaTexto: null },
          cinturaActual: { valor: 86, deltaLineaBase: -6, deltaPorcentual: null, unidad: 'cm', tendenciaTexto: null },
        }}
        riesgoCardiovascular={{
          relacion: 0.87,
          categoria: 'bajo',
        }}
      />,
    );

    expect(screen.getByText('0.87')).toBeInTheDocument();
    expect(screen.getByText('Bajo')).toBeInTheDocument();
  });

  it('indica que el riesgo no aplica cuando la relacion no se puede clasificar', () => {
    render(
      <PanelResumenEvolucion
        titulo="Evolucion de Ana"
        subtitulo="Datos del paciente"
        rangoTemporal="todo"
        onCambiarRango={() => {}}
        kpis={{
          pesoActual: { valor: 75, deltaLineaBase: null, deltaPorcentual: null, unidad: 'kg', tendenciaTexto: null },
          cinturaActual: { valor: 86, deltaLineaBase: null, deltaPorcentual: null, unidad: 'cm', tendenciaTexto: null },
        }}
        riesgoCardiovascular={{
          relacion: 0.87,
          categoria: null,
        }}
      />,
    );

    expect(screen.getByText('No aplica')).toBeInTheDocument();
    expect(
      screen.getByText(/requiere sexo biologico clasificado/i),
    ).toBeInTheDocument();
  });
});
