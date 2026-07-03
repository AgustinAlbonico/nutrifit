import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AlertasClinicasProgreso } from './AlertasClinicasProgreso';
import type { AlertaClinicaProgreso } from './types';

const alertas: AlertaClinicaProgreso[] = [
  {
    severidad: 'critica',
    titulo: 'Tension arterial elevada',
    mensaje: 'La ultima medicion registra 142/94 mmHg.',
    metrica: 'tension_arterial',
    valor: 142,
  },
  {
    severidad: 'informativa',
    titulo: 'Cambio de peso acelerado',
    mensaje: 'El peso cambio 5.2 kg respecto de la medicion anterior.',
    metrica: 'peso',
    valor: -5.2,
  },
];

describe('AlertasClinicasProgreso', () => {
  it('renderiza alertas clinicas ordenadas por severidad', () => {
    render(<AlertasClinicasProgreso alertas={alertas} />);

    expect(screen.getByText('Alertas clinicas')).toBeInTheDocument();
    expect(screen.getByText('Tension arterial elevada')).toBeInTheDocument();
    expect(screen.getByText('Cambio de peso acelerado')).toBeInTheDocument();
    expect(screen.getByText('Critica')).toBeInTheDocument();
    expect(screen.getByText('Informativa')).toBeInTheDocument();
  });

  it('no renderiza contenido cuando no hay alertas', () => {
    const { container } = render(<AlertasClinicasProgreso alertas={[]} />);

    expect(container).toBeEmptyDOMElement();
  });
});
