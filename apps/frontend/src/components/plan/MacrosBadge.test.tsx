import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';

import { MacrosBadge } from '@/components/plan/MacrosBadge';

describe('MacrosBadge', () => {
  it('muestra label "Cumple" con banda VERDE', () => {
    render(<MacrosBadge banda="VERDE" desvioPorcentaje={2.5} />);

    const badge = screen.getByTestId('macros-badge');
    expect(badge).toHaveAttribute('data-banda', 'VERDE');
    expect(badge).toHaveTextContent(/Cumple/i);
    expect(badge).toHaveTextContent(/\+2\.5%/);
    expect(badge).toHaveAttribute(
      'aria-label',
      expect.stringContaining('cumple'),
    );
  });

  it('muestra label "Desvío menor" con banda AMARILLO', () => {
    render(<MacrosBadge banda="AMARILLO" desvioPorcentaje={7} />);

    const badge = screen.getByTestId('macros-badge');
    expect(badge).toHaveAttribute('data-banda', 'AMARILLO');
    expect(badge).toHaveTextContent(/Desvío menor/i);
    expect(badge).toHaveTextContent(/\+7\.0%/);
  });

  it('muestra label "Fuera de rango" con banda ROJO', () => {
    render(<MacrosBadge banda="ROJO" desvioPorcentaje={-12.5} />);

    const badge = screen.getByTestId('macros-badge');
    expect(badge).toHaveAttribute('data-banda', 'ROJO');
    expect(badge).toHaveTextContent(/Fuera de rango/i);
    expect(badge).toHaveTextContent(/-12\.5%/);
  });

  it('muestra el detalle en el tooltip al hacer hover (con Radix)', async () => {
    const user = userEvent.setup();
    render(
      <MacrosBadge
        banda="VERDE"
        desvioPorcentaje={1}
        detalle={{ real: 1995, objetivo: 2000 }}
      />,
    );

    const badge = screen.getByTestId('macros-badge');
    await user.hover(badge);

    // El tooltip de Radix se monta en un portal con role="tooltip"
    const tooltip = await screen.findByRole('tooltip', {}, { timeout: 2000 });
    expect(tooltip).toBeInTheDocument();
    expect(tooltip).toHaveTextContent(/1995/);
    expect(tooltip).toHaveTextContent(/2000/);
  });
});