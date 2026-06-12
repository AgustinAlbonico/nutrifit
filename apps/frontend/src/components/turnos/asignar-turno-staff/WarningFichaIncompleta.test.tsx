/**
 * Tests del componente `WarningFichaIncompleta`:
 *  - NO renderiza si el socio tiene ficha completa
 *  - renderiza el banner ambar con role=status y aria-live=polite
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WarningFichaIncompleta } from './WarningFichaIncompleta';
import type { SocioConFicha } from '@/types/asignar-turno';

const socioConFicha: SocioConFicha = {
  idPersona: 1,
  nombre: 'Ana',
  apellido: 'Gomez',
  dni: '40123456',
  tieneFichaSalud: true,
  nombreCompleto: 'Ana Gomez',
};

const socioSinFicha: SocioConFicha = {
  idPersona: 2,
  nombre: 'Luis',
  apellido: 'Perez',
  dni: '42567890',
  tieneFichaSalud: false,
  nombreCompleto: 'Luis Perez',
};

describe('WarningFichaIncompleta', () => {
  it('NO renderiza si el socio tiene ficha completa', () => {
    const { container } = render(
      <WarningFichaIncompleta socio={socioConFicha} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renderiza el banner ambar con role=status y aria-live=polite', () => {
    render(<WarningFichaIncompleta socio={socioSinFicha} />);

    const banner = screen.getByTestId('warning-ficha-incompleta');
    expect(banner).toBeInTheDocument();
    expect(banner).toHaveAttribute('role', 'status');
    expect(banner).toHaveAttribute('aria-live', 'polite');

    expect(
      screen.getByText(/no tiene su ficha medica completa/i),
    ).toBeInTheDocument();
  });

  it('incluye el nombre del socio en el mensaje', () => {
    render(<WarningFichaIncompleta socio={socioSinFicha} />);

    expect(screen.getByText(/Luis Perez/)).toBeInTheDocument();
  });
});
