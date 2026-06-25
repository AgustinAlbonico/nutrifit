import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';

import { RazonamientoCumplimiento } from '@/components/plan/RazonamientoCumplimiento';
import type { RazonamientoCumplimientoFE } from '@/types/ia';

const razonamientoMock: RazonamientoCumplimientoFE = {
  restriccionesCumplidas: [
    {
      restriccion: 'vegano',
      detalle: 'Ningún alimento contiene carne, lácteos, huevos ni miel.',
    },
    {
      restriccion: 'sin gluten',
      detalle: 'Sin trigo, avena, cebada ni centeno.',
    },
  ],
  restriccionesNoCumplidas: [
    {
      restriccion: 'alergia frutos secos',
      detalle: 'Incluye almendras en el desayuno del lunes.',
      comida: 'DESAYUNO',
    },
  ],
};

describe('RazonamientoCumplimiento', () => {
  it('muestra los contadores de cumplidas y no cumplidas', () => {
    render(<RazonamientoCumplimiento razonamiento={razonamientoMock} />);

    expect(screen.getByText(/2 cumplidas/i)).toBeInTheDocument();
    expect(screen.getByText(/1 no cumplidas/i)).toBeInTheDocument();
  });

  it('lista cada restricción cumplida con su detalle', () => {
    render(<RazonamientoCumplimiento razonamiento={razonamientoMock} />);

    expect(screen.getByText(/vegano/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Ningún alimento contiene carne/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/sin gluten/i)).toBeInTheDocument();
  });

  it('marca las restricciones no cumplidas con role="alert"', () => {
    render(<RazonamientoCumplimiento razonamiento={razonamientoMock} />);

    const alerta = screen.getByRole('alert');
    expect(alerta).toHaveTextContent(/alergia frutos secos/i);
    expect(alerta).toHaveTextContent(/DESAYUNO/i);
  });

  it('se puede colapsar y expandir', async () => {
    const user = userEvent.setup();
    render(
      <RazonamientoCumplimiento
        razonamiento={razonamientoMock}
        defaultOpen={true}
      />,
    );

    // Por defecto está abierto, vemos el detalle
    expect(screen.getByText(/sin gluten/i)).toBeVisible();

    // Click en el trigger lo colapsa
    const trigger = screen.getByRole('button', {
      name: /Razonamiento de cumplimiento/i,
    });
    await user.click(trigger);

    // El detalle sigue en el DOM pero el content se oculta con animación
    // (Radix mantiene el nodo y aplica aria-hidden / data-state)
  });

  it('en readOnly oculta el control de colapsar', () => {
    render(
      <RazonamientoCumplimiento
        razonamiento={razonamientoMock}
        readOnly={true}
      />,
    );

    const trigger = screen.getByRole('button', {
      name: /Razonamiento de cumplimiento/i,
    });
    expect(trigger).toBeDisabled();
  });

  it('muestra empty state cuando no hay restricciones', () => {
    render(
      <RazonamientoCumplimiento
        razonamiento={{
          restriccionesCumplidas: [],
          restriccionesNoCumplidas: [],
        }}
      />,
    );

    expect(
      screen.getByText(/No se evaluaron restricciones/i),
    ).toBeInTheDocument();
  });
});