/**
 * Tests del modal de historial de versiones de la ficha.
 *
 * Cubre:
 * - Lista las versiones mockeadas.
 * - Click en una versión llama a `onSeleccionarVersion`.
 * - Renderiza `FichaSaludVersionDetalle` con los datos read-only.
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { FichaSaludHistorialModal } from './FichaSaludHistorialModal';
import type { DatosVersion, HistorialItem } from '@/types/ficha-salud';

// Polyfill de ResizeObserver.
if (typeof globalThis.ResizeObserver === 'undefined') {
  class ResizeObserverPolyfill {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  }
  globalThis.ResizeObserver =
    ResizeObserverPolyfill as unknown as typeof ResizeObserver;
}

const versionesMock: HistorialItem[] = [
  { version: 2, versionId: 20, createdAt: new Date('2026-05-20T14:30:00.000Z'), createdBy: 99 },
  { version: 1, versionId: 10, createdAt: new Date('2026-05-01T18:00:00.000Z'), createdBy: 99 },
];

const datosVersionMock: DatosVersion = {
  version: 1,
  createdAt: new Date('2026-05-01T18:00:00.000Z'),
  datos: {
    altura: 175,
    peso: 80,
    nivelActividadFisica: 'MODERADO',
    objetivoPersonal: 'Bajar grasa',
    alergias: ['maní'],
    patologias: [],
    fumaTabaco: false,
    horasSueno: 7,
  },
};

describe('FichaSaludHistorialModal', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('HIST-1: lista las versiones mockeadas', () => {
    render(
      <FichaSaludHistorialModal
        open
        onClose={vi.fn()}
        versiones={versionesMock}
        cargando={false}
        versionSeleccionada={null}
        datosVersion={undefined}
        cargandoVersion={false}
        onSeleccionarVersion={vi.fn()}
      />,
    );

    const dialog = screen.getByRole('dialog');
    // Cada versión aparece como "v{N}"
    expect(within(dialog).getByText(/^v2$/)).toBeInTheDocument();
    expect(within(dialog).getByText(/^v1$/)).toBeInTheDocument();
  });

  it('HIST-2: click en una versión llama a onSeleccionarVersion con la versión correcta', async () => {
    const onSeleccionar = vi.fn();
    const user = userEvent.setup();

    render(
      <FichaSaludHistorialModal
        open
        onClose={vi.fn()}
        versiones={versionesMock}
        cargando={false}
        versionSeleccionada={null}
        datosVersion={undefined}
        cargandoVersion={false}
        onSeleccionarVersion={onSeleccionar}
      />,
    );

    // Esperar a que el useEffect interno setee la selección inicial a la primera
    await waitFor(() => {
      expect(onSeleccionar).toHaveBeenCalled();
    });

    // Click en la versión 1
    onSeleccionar.mockClear();
    const itemV1 = screen.getByRole('option', { name: /v1/i });
    await user.click(itemV1);

    expect(onSeleccionar).toHaveBeenCalledWith(1);
  });

  it('HIST-3: muestra estado de carga de la versión seleccionada', () => {
    render(
      <FichaSaludHistorialModal
        open
        onClose={vi.fn()}
        versiones={versionesMock}
        cargando={false}
        versionSeleccionada={1}
        datosVersion={undefined}
        cargandoVersion
        onSeleccionarVersion={vi.fn()}
      />,
    );

    expect(screen.getByText(/Cargando versión 1…/i)).toBeInTheDocument();
  });

  it('HIST-4: renderiza FichaSaludVersionDetalle con datos read-only', () => {
    render(
      <FichaSaludHistorialModal
        open
        onClose={vi.fn()}
        versiones={versionesMock}
        cargando={false}
        versionSeleccionada={1}
        datosVersion={datosVersionMock}
        cargandoVersion={false}
        onSeleccionarVersion={vi.fn()}
      />,
    );

    // El banner de versión muestra "Versión 1"
    expect(screen.getByText(/^Versión 1$/)).toBeInTheDocument();

    // El fieldset está deshabilitado
    const fieldset = screen
      .getByText(/^Versión 1$/)
      .closest('div')!
      .parentElement!
      .querySelector('fieldset');
    expect(fieldset).toBeDisabled();
  });

  it('HIST-5: abre sin warnings de accesibilidad del Dialog', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <FichaSaludHistorialModal
        open
        onClose={vi.fn()}
        versiones={versionesMock}
        cargando={false}
        versionSeleccionada={1}
        datosVersion={datosVersionMock}
        cargandoVersion={false}
        onSeleccionarVersion={vi.fn()}
      />,
    );

    expect(
      errorSpy.mock.calls.some(([mensaje]) =>
        String(mensaje).includes('DialogContent') ||
        String(mensaje).includes('aria-describedby'),
      ),
    ).toBe(false);
  });
});
