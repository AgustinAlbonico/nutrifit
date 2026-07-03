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
            cadera: '101 cm',
            pecho: '98 cm',
            grasaCorporal: '26 %',
            masaMagra: '62.2 kg',
            frecuenciaCardiaca: '72 lpm',
            tensionArterial: '120/80',
            deltaPeso: '-5 kg',
            detalle: 'Buen progreso',
          },
        ]}
      />,
    );

    expect(screen.getByText('Peso')).toBeInTheDocument();
    expect(screen.getByText('IMC')).toBeInTheDocument();
    expect(screen.getByText('Cadera')).toBeInTheDocument();
    expect(screen.getByText('Pecho')).toBeInTheDocument();
    expect(screen.getByText('Grasa')).toBeInTheDocument();
    expect(screen.getByText('FC')).toBeInTheDocument();
    expect(screen.getByText('TA')).toBeInTheDocument();
    expect(screen.getByText('101 cm')).toBeInTheDocument();
    expect(screen.getByText('120/80')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /ver detalle/i }));
    expect(screen.getByText('Buen progreso')).toBeInTheDocument();
  });
});
