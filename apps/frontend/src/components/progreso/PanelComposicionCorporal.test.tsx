import { render, screen } from '@testing-library/react';

import { PanelComposicionCorporal } from './PanelComposicionCorporal';
import type { KpiEvolucion } from './types';

describe('PanelComposicionCorporal', () => {
  const kpiCompleto: KpiEvolucion = {
    valor: 23,
    deltaLineaBase: -9,
    deltaPorcentual: -28.1,
    unidad: '%',
    tendenciaTexto: 'vs linea base',
  };

  const kpiMasaMagra: KpiEvolucion = {
    valor: 62.4,
    deltaLineaBase: -0.2,
    deltaPorcentual: -0.3,
    unidad: 'kg',
    tendenciaTexto: 'vs linea base',
  };

  it('muestra grasa y masa magra cuando ambos estan cargados', () => {
    render(
      <PanelComposicionCorporal
        grasaCorporal={kpiCompleto}
        masaMagra={kpiMasaMagra}
      />,
    );

    expect(screen.getByText('23 %')).toBeInTheDocument();
    expect(screen.getByText('62.4 kg')).toBeInTheDocument();
    expect(screen.getByText('Masa magra')).toBeInTheDocument();
  });

  it('indica que masa magra no aplica si no hay grasa corporal cargada', () => {
    const kpiGrasaVacio: KpiEvolucion = {
      ...kpiCompleto,
      valor: null,
      deltaLineaBase: null,
      deltaPorcentual: null,
      tendenciaTexto: null,
    };

    render(
      <PanelComposicionCorporal
        grasaCorporal={kpiGrasaVacio}
        masaMagra={kpiMasaMagra}
      />,
    );

    expect(screen.getByText('No aplica')).toBeInTheDocument();
    expect(
      screen.getByText(/requiere porcentaje de grasa corporal para calcularse/i),
    ).toBeInTheDocument();
  });
});
