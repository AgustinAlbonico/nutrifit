/**
 * Tests del componente `ModalConfirmacion`:
 *  - abre/cierra correctamente
 *  - muestra el resumen del turno
 *  - muestra el alert ambar cuando hay warning
 *  - muestra el alert rojo bloqueante cuando hay errorFichaIncompleta
 *  - ejecuta onConfirm al click en "Confirmar turno"
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

import { ModalConfirmacion } from './ModalConfirmacion';
import type { SocioConFicha, NutricionistaActivo } from '@/types/asignar-turno';

// Polyfill de ResizeObserver (necesario para Dialog de shadcn/radix).
if (typeof globalThis.ResizeObserver === 'undefined') {
  class ResizeObserverPolyfill {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  }
  globalThis.ResizeObserver =
    ResizeObserverPolyfill as unknown as typeof ResizeObserver;
}

const socio: SocioConFicha = {
  idPersona: 1,
  nombre: 'Ana',
  apellido: 'Gomez',
  dni: '40123456',
  tieneFichaSalud: true,
  nombreCompleto: 'Ana Gomez',
};

const nutri: NutricionistaActivo = {
  idPersona: 10,
  nombre: 'Lucia',
  apellido: 'Martinez',
  nombreCompleto: 'Lucia Martinez',
  matricula: 'MN1234',
};

const propsBase = {
  open: true,
  onClose: vi.fn(),
  onConfirm: vi.fn(),
  socio,
  nutricionista: nutri,
  fechaTurno: '2027-02-15',
  horaTurno: '10:00',
  warning: null as 'socio_sin_ficha' | null,
  errorFichaIncompleta: null as string | null,
  enviando: false,
};

describe('ModalConfirmacion', () => {
  it('muestra el resumen del turno en el modal', () => {
    render(<ModalConfirmacion {...propsBase} />);

    const dialog = screen.getByRole('dialog');
    const dentro = within(dialog);

    expect(dentro.getByText('Ana Gomez')).toBeInTheDocument();
    expect(dentro.getByText('40123456')).toBeInTheDocument();
    expect(dentro.getByText('Lucia Martinez')).toBeInTheDocument();
    expect(dentro.getByText('10:00 hs')).toBeInTheDocument();
  });

  it('muestra el alert ambar cuando warning=socio_sin_ficha', () => {
    render(
      <ModalConfirmacion {...propsBase} warning="socio_sin_ficha" />,
    );

    const alerta = screen.getByTestId('modal-warning-ficha');
    expect(alerta).toBeInTheDocument();
    expect(alerta).toHaveAttribute('role', 'status');
  });

  it('muestra el alert rojo bloqueante cuando hay errorFichaIncompleta', () => {
    render(
      <ModalConfirmacion
        {...propsBase}
        errorFichaIncompleta="El paciente no completo la ficha"
      />,
    );

    const alerta = screen.getByTestId('modal-error-ficha');
    expect(alerta).toBeInTheDocument();
    expect(alerta).toHaveTextContent(/no completo la ficha/i);
    // El boton confirmar debe estar deshabilitado
    expect(screen.getByTestId('boton-confirmar-modal')).toBeDisabled();
  });

  it('ejecuta onConfirm al hacer click en Confirmar turno', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(
      <ModalConfirmacion {...propsBase} onConfirm={onConfirm} />,
    );

    await user.click(screen.getByTestId('boton-confirmar-modal'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('ejecuta onClose al hacer click en Cancelar', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <ModalConfirmacion {...propsBase} onClose={onClose} />,
    );

    await user.click(screen.getByTestId('boton-cancelar-modal'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('muestra el spinner cuando enviando=true', () => {
    render(<ModalConfirmacion {...propsBase} enviando={true} />);

    expect(
      screen.getByRole('button', { name: /confirmando/i }),
    ).toBeInTheDocument();
  });
});
