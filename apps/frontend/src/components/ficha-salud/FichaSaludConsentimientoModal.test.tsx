/**
 * Tests del modal de consentimiento RGPD.
 *
 * Cubre:
 * - Renderiza el texto RGPD en lenguaje claro.
 * - El botón "Aceptar" llama a `onAceptar` y cierra el modal.
 * - `aria-labelledby` apunta al título.
 * - El modal muestra la fecha de consentimiento cuando se pasa.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { FichaSaludConsentimientoModal } from './FichaSaludConsentimientoModal';

// Polyfill de ResizeObserver (jsdom no lo provee; lo necesita el Dialog).
if (typeof globalThis.ResizeObserver === 'undefined') {
  class ResizeObserverPolyfill {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  }
  // @ts-expect-error — polyfill mínimo
  globalThis.ResizeObserver = ResizeObserverPolyfill;
}

describe('FichaSaludConsentimientoModal', () => {
  it('RGPD-1: renderiza el texto RGPD en lenguaje claro', () => {
    render(
      <FichaSaludConsentimientoModal
        open
        onClose={vi.fn()}
        onAceptar={vi.fn()}
      />,
    );

    const dialog = screen.getByRole('dialog');
    // El texto RGPD habla sobre qué se almacena
    expect(
      within(dialog).getByText(/datos que cargás en tu ficha de salud/i),
    ).toBeInTheDocument();
    // Habla de nutricionistas con turnos previos
    expect(
      within(dialog).getByText(/nutricionistas con quienes tengas turnos previos/i),
    ).toBeInTheDocument();
    // Menciona derechos ARCO
    expect(
      within(dialog).getByText(/acceso, rectificación, cancelación y oposición/i),
    ).toBeInTheDocument();
  });

  it('RGPD-2: el botón "Aceptar" llama a onAceptar y luego cierra el modal', async () => {
    const onAceptar = vi.fn();
    const onClose = vi.fn();

    const user = userEvent.setup();
    render(
      <FichaSaludConsentimientoModal
        open
        onClose={onClose}
        onAceptar={onAceptar}
      />,
    );

    const botonAceptar = screen.getByTestId('boton-aceptar-consentimiento');
    await user.click(botonAceptar);

    expect(onAceptar).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('RGPD-3: aria-labelledby apunta al título del modal', () => {
    render(
      <FichaSaludConsentimientoModal
        open
        onClose={vi.fn()}
        onAceptar={vi.fn()}
      />,
    );

    const dialog = screen.getByRole('dialog', { name: /Consentimiento para almacenar tu ficha de salud/i });
    expect(dialog).toBeInTheDocument();
  });

  it('RGPD-4: cuando se pasa fechaConsentimiento, muestra la fecha', () => {
    render(
      <FichaSaludConsentimientoModal
        open
        onClose={vi.fn()}
        onAceptar={vi.fn()}
        fechaConsentimiento={new Date('2026-05-01T18:00:00.000Z')}
      />,
    );

    const dialog = screen.getByRole('dialog');
    expect(
      within(dialog).getByText(/Expresaste tu consentimiento el/i),
    ).toBeInTheDocument();
  });
});
