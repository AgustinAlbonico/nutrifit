import { fireEvent, render, screen } from '@testing-library/react';

import { TimelineEvolucionClinica } from './TimelineEvolucionClinica';

describe('TimelineEvolucionClinica', () => {
  it('muestra eventos longitudinales ordenados', () => {
    render(
      <TimelineEvolucionClinica
        eventos={[
          {
            id: 'medicion-1',
            fecha: '10 abr 2026',
            titulo: 'Medicion registrada: 75 kg',
            descripcion: 'Buen progreso',
          },
        ]}
      />,
    );

    expect(screen.getByText('Timeline clinico')).toBeInTheDocument();
    expect(screen.getByText('Medicion registrada: 75 kg')).toBeInTheDocument();
    expect(screen.getByText('Buen progreso')).toBeInTheDocument();
  });

  it('permite seleccionar un evento para ver su detalle clinico', () => {
    render(
      <TimelineEvolucionClinica
        eventos={[
          {
            id: 'medicion-1',
            fecha: '10 abr 2026',
            titulo: 'Medicion registrada: 75 kg',
            descripcion: 'Buen progreso',
          },
          {
            id: 'objetivo-1',
            fecha: '12 abr 2026',
            titulo: 'Objetivo de peso creado',
            descripcion: 'Llegar a 72 kg',
          },
        ]}
      />,
    );

    expect(screen.getByText('Buen progreso')).toBeInTheDocument();
    expect(screen.queryByText('Llegar a 72 kg')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /objetivo de peso creado/i }));

    expect(screen.getByText('Llegar a 72 kg')).toBeInTheDocument();
    expect(screen.queryByText('Buen progreso')).not.toBeInTheDocument();
  });
});
