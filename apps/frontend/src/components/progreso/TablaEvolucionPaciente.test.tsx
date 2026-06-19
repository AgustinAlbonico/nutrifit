import { fireEvent, render, screen } from '@testing-library/react';

import { TablaEvolucionPaciente } from './TablaEvolucionPaciente';

describe('TablaEvolucionPaciente', () => {
  it('muestra columnas principales y permite expandir una fila', () => {
    render(
      <TablaEvolucionPaciente
        filas={[
          {
            id: 1,
            fecha: '10 abr 2026',
            peso: '75 kg',
            imc: '27.5',
            cintura: '86 cm',
            pecho: '98 cm',
            deltaPeso: '-5 kg',
            detalle: 'Buen progreso',
          },
        ]}
      />,
    );

    expect(screen.getByText('Peso')).toBeInTheDocument();
    expect(screen.getByText('IMC')).toBeInTheDocument();
    expect(screen.getByText('Pecho')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /ver detalle/i }));
    expect(screen.getByText('Buen progreso')).toBeInTheDocument();
  });
});
