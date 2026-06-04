/**
 * Tests del modal bloqueante de ficha requerida para Mis Turnos.
 *
 * Cubre:
 * - Renderiza título, body y CTA cuando `abierto={true}`.
 * - No renderiza el modal cuando `abierto={false}`.
 * - El CTA apunta a `/turnos/ficha-salud`.
 * - El modal no muestra botón de cerrar (X).
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';

import { ModalFichaRequeridaSocio } from './ModalFichaRequeridaSocio';

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

// Mock de TanStack Router: Link → <a> nativo + useRouter/useLinkProps
// (necesarios porque Link internamente usa useLinkProps → useRouter).
// El mock transforma `to` en `href` para que testing-library lo reconozca
// como link accesible.
vi.mock('@tanstack/react-router', () => ({
  Link: ({
    children,
    to,
    ...rest
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & {
    children?: React.ReactNode;
    to?: string;
  }) => (
    <a href={to} {...rest}>
      {children}
    </a>
  ),
  useRouter: () => ({
    subscribe: () => () => {},
    state: { location: { pathname: '/' } },
    isServer: false,
  }),
  useNavigate: () => () => {},
  useLinkProps: () => ({ type: 'a' as const }),
}));

describe('ModalFichaRequeridaSocio', () => {
  it('renderiza título, body y CTA cuando abierto=true', () => {
    render(<ModalFichaRequeridaSocio abierto={true} />);

    const dialog = screen.getByRole('dialog');
    expect(
      screen.getByText('Necesitamos tu ficha de salud'),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByText(/No tenés la ficha de salud cargada/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /Ir a cargar mi ficha/i }),
    ).toBeInTheDocument();
  });

  it('no renderiza el dialog cuando abierto=false', () => {
    render(<ModalFichaRequeridaSocio abierto={false} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('el CTA apunta a /turnos/ficha-salud', () => {
    render(<ModalFichaRequeridaSocio abierto={true} />);
    const cta = screen.getByRole('link', { name: /Ir a cargar mi ficha/i });
    expect(cta).toHaveAttribute('href', '/turnos/ficha-salud');
  });

  it('no muestra botón de cerrar (X) — modal bloqueante', () => {
    render(<ModalFichaRequeridaSocio abierto={true} />);
    // DialogContent renderiza un botón Close con sr-only "Close" cuando
    // showCloseButton es true. Con showCloseButton=false, no debe existir.
    expect(
      screen.queryByRole('button', { name: /close/i }),
    ).not.toBeInTheDocument();
  });
});
