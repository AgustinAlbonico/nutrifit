/**
 * Tests de la página `FichaSaludSocio` — RB15, RB42, RB44, RB50.
 *
 * Cubre los flujos clave:
 *  - Modo creación (sin ficha): banner ámbar + checkbox consentimiento obligatorio.
 *  - Modo edición (con ficha): banner "Última edición" + modal de historial.
 *  - Validación Zod inline en español.
 *  - Modal de consentimiento RGPD.
 *  - Modal de historial de versiones.
 *  - Toast/mensaje de éxito al guardar.
 *
 * Stack: Vitest + @testing-library/react + MSW + React Query.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import React from 'react';

import { server } from '@/mocks/server';
import { FichaSaludSocio } from '@/pages/FichaSaludSocio';

// Polyfill de ResizeObserver (necesario para los Dialog de shadcn/radix).
// jsdom no lo provee y useSize() de radix-ui lo requiere al montar.
if (typeof globalThis.ResizeObserver === 'undefined') {
  class ResizeObserverPolyfill {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  }
  // @ts-expect-error — polyfill mínimo para entorno de tests
  globalThis.ResizeObserver = ResizeObserverPolyfill;
}

// ─────────────────────────────────────────────────────────────────────────────
// Mocks de AuthContext y TanStack Router
// ─────────────────────────────────────────────────────────────────────────────

const authConfig: {
  token: string | null;
  rol: string | null;
} = {
  token: 'test-token-socio',
  rol: 'SOCIO',
};

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    token: authConfig.token,
    rol: authConfig.rol,
    permissions: [],
    personaId: 99,
    email: 'socio@test.com',
    nombre: 'Juan',
    apellido: 'Pérez',
    fotoPerfilUrl: null,
    isAuthenticated: authConfig.token != null,
    login: vi.fn(),
    logout: vi.fn(),
    refreshPermissions: vi.fn(),
    hasPermission: () => false,
    hasAllPermissions: () => false,
  }),
}));

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, ...rest }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { children?: React.ReactNode }) => (
    <a {...rest}>{children}</a>
  ),
  useNavigate: () => vi.fn(),
}));

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function crearProveedorQuery(children: React.ReactNode) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Handlers MSW
// ─────────────────────────────────────────────────────────────────────────────

const fichaCompleta = {
  socioId: 99,
  fichaSaludId: 7,
  altura: 175,
  peso: 78,
  nivelActividadFisica: 'MODERADO',
  alergias: ['maní'],
  patologias: [],
  objetivoPersonal: 'Bajar grasa',
  medicacionActual: null,
  suplementosActuales: null,
  cirugiasPrevias: null,
  antecedentesFamiliares: null,
  frecuenciaComidas: '3 comidas',
  consumoAguaDiario: 2,
  restriccionesAlimentarias: null,
  consumoAlcohol: 'Ocasional',
  fumaTabaco: false,
  horasSueno: 7,
  contactoEmergenciaNombre: null,
  contactoEmergenciaTelefono: null,
  completada: true,
  completadaAt: '2026-05-01T18:00:00.000Z',
  actualizadaAt: '2026-05-20T14:30:00.000Z',
  consentAt: '2026-05-01T18:00:00.000Z',
  versionActual: 2,
};

const handlerFichaNull = http.get('*/turnos/socio/ficha-salud', () => {
  return HttpResponse.json({
    success: true,
    message: 'ok',
    data: null,
    timestamp: new Date().toISOString(),
  });
});

const handlerFichaCompleta = http.get('*/turnos/socio/ficha-salud', () => {
  return HttpResponse.json({
    success: true,
    message: 'ok',
    data: fichaCompleta,
    timestamp: new Date().toISOString(),
  });
});

const handlerUpsert = http.put('*/turnos/socio/ficha-salud', async () => {
  return HttpResponse.json({
    success: true,
    message: 'ok',
    data: { ...fichaCompleta, versionActual: fichaCompleta.versionActual + 1, actualizadaAt: new Date().toISOString() },
    timestamp: new Date().toISOString(),
  });
});

const handlerHistorial = http.get('*/turnos/socio/ficha-salud/historial', () => {
  return HttpResponse.json({
    success: true,
    message: 'ok',
    data: [
      { version: 2, versionId: 20, createdAt: '2026-05-20T14:30:00.000Z', createdBy: 99 },
      { version: 1, versionId: 10, createdAt: '2026-05-01T18:00:00.000Z', createdBy: 99 },
    ],
    timestamp: new Date().toISOString(),
  });
});

const handlerVersion = http.get('*/turnos/socio/ficha-salud/version/:n', () => {
  return HttpResponse.json({
    success: true,
    message: 'ok',
    data: {
      version: 1,
      createdAt: '2026-05-01T18:00:00.000Z',
      datos: {
        altura: 175,
        peso: 80,
        nivelActividadFisica: 'MODERADO',
        objetivoPersonal: 'Bajar grasa',
        alergias: [],
        patologias: [],
        fumaTabaco: false,
      },
    },
    timestamp: new Date().toISOString(),
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('FichaSaludSocio - página de socio', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authConfig.token = 'test-token-socio';
    authConfig.rol = 'SOCIO';
    server.resetHandlers();
  });

  afterEach(() => {
    server.resetHandlers();
  });

  it('T2-1: renderiza en modo creación cuando el backend devuelve null', async () => {
    server.use(handlerFichaNull);
    render(crearProveedorQuery(<FichaSaludSocio />));

    await waitFor(() => {
      expect(
        screen.getByText(/Todavía no tenés ficha cargada/i),
      ).toBeInTheDocument();
    });

    // El botón "Ver historial" NO debe estar visible en modo creación
    expect(screen.queryByTestId('boton-ver-historial')).not.toBeInTheDocument();

    // El banner "Última edición" NO debe estar visible en modo creación
    expect(screen.queryByTestId('fecha-ultima-edicion')).not.toBeInTheDocument();
  });

  it('T2-2: renderiza en modo edición cuando el backend devuelve una ficha', async () => {
    server.use(handlerFichaCompleta);
    render(crearProveedorQuery(<FichaSaludSocio />));

    await waitFor(() => {
      expect(screen.getByTestId('boton-ver-historial')).toBeInTheDocument();
    });

    // El banner "Última edición" debe estar visible
    expect(screen.getByTestId('fecha-ultima-edicion')).toBeInTheDocument();
  });

  it('T2-3: el botón "Ver historial" abre el modal de historial con la lista de versiones', async () => {
    const user = userEvent.setup();
    server.use(handlerFichaCompleta, handlerHistorial, handlerVersion);
    render(crearProveedorQuery(<FichaSaludSocio />));

    const botonHistorial = await screen.findByTestId('boton-ver-historial');
    await user.click(botonHistorial);

    // El modal abre
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText(/Historial de versiones/i)).toBeInTheDocument();

    // Las versiones se listan
    await waitFor(() => {
      expect(within(dialog).getByText(/v2/)).toBeInTheDocument();
      expect(within(dialog).getByText(/v1/)).toBeInTheDocument();
    });
  });

  it('T2-4: el checkbox de consentimiento bloquea el submit en modo creación', async () => {
    const user = userEvent.setup();
    server.use(handlerFichaNull, handlerUpsert);
    render(crearProveedorQuery(<FichaSaludSocio />));

    await screen.findByText(/Todavía no tenés ficha cargada/i);

    // Completar campos requeridos
    await user.type(screen.getByLabelText(/Altura \(cm\)/i), '175');
    await user.type(screen.getByLabelText(/Peso \(kg\)/i), '78');
    await user.type(screen.getByLabelText(/Objetivo personal/i), 'Bajar grasa');

    const botonGuardar = screen.getByTestId('boton-guardar-ficha');
    // Sin consentimiento: deshabilitado
    expect(botonGuardar).toBeDisabled();

    // Tildar consentimiento
    const checkbox = screen.getByRole('checkbox');
    await user.click(checkbox);

    await waitFor(() => {
      expect(botonGuardar).not.toBeDisabled();
    });
  });

  it('T2-5: en modo edición el checkbox de consentimiento está deshabilitado con la fecha', async () => {
    server.use(handlerFichaCompleta);
    render(crearProveedorQuery(<FichaSaludSocio />));

    await screen.findByTestId('boton-ver-historial');

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeDisabled();
    // Radix Checkbox expone el estado via aria-checked
    expect(checkbox.getAttribute('aria-checked')).toBe('true');
    expect(checkbox.getAttribute('data-state')).toBe('checked');

    // El label debe incluir "Consentimiento expresado el"
    expect(
      screen.getByText(/Consentimiento expresado el/i),
    ).toBeInTheDocument();
  });

  it('T2-6: validación cliente: altura fuera de rango no habilita el submit', async () => {
    const user = userEvent.setup();
    server.use(handlerFichaNull, handlerUpsert);
    render(crearProveedorQuery(<FichaSaludSocio />));

    await screen.findByText(/Todavía no tenés ficha cargada/i);

    await user.type(screen.getByLabelText(/Altura \(cm\)/i), '50');
    await user.type(screen.getByLabelText(/Peso \(kg\)/i), '78');
    await user.type(screen.getByLabelText(/Objetivo personal/i), 'Bajar grasa');

    // Tildar consentimiento para descartar ese bloqueo
    const checkbox = screen.getByRole('checkbox');
    await user.click(checkbox);

    const botonGuardar = screen.getByTestId('boton-guardar-ficha');
    expect(botonGuardar).toBeDisabled();
  });

  it('T2-7: validación cliente: peso fuera de rango no habilita el submit', async () => {
    const user = userEvent.setup();
    server.use(handlerFichaNull, handlerUpsert);
    render(crearProveedorQuery(<FichaSaludSocio />));

    await screen.findByText(/Todavía no tenés ficha cargada/i);

    await user.type(screen.getByLabelText(/Altura \(cm\)/i), '175');
    await user.type(screen.getByLabelText(/Peso \(kg\)/i), '400');
    await user.type(screen.getByLabelText(/Objetivo personal/i), 'Bajar grasa');

    const checkbox = screen.getByRole('checkbox');
    await user.click(checkbox);

    const botonGuardar = screen.getByTestId('boton-guardar-ficha');
    expect(botonGuardar).toBeDisabled();
  });

  it('T2-8: el botón "Ver detalle" del consentimiento abre el modal RGPD', async () => {
    const user = userEvent.setup();
    server.use(handlerFichaNull);
    render(crearProveedorQuery(<FichaSaludSocio />));

    await screen.findByText(/Todavía no tenés ficha cargada/i);

    await user.click(screen.getByRole('button', { name: /Ver detalle/i }));

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText(/Consentimiento para almacenar tu ficha de salud/i)).toBeInTheDocument();
    expect(within(dialog).getByText(/derechos de acceso/i)).toBeInTheDocument();
  });

  it('T2-9: al guardar exitosamente aparece el mensaje de éxito', async () => {
    const user = userEvent.setup();
    server.use(handlerFichaNull, handlerUpsert);
    render(crearProveedorQuery(<FichaSaludSocio />));

    await screen.findByText(/Todavía no tenés ficha cargada/i);

    await user.type(screen.getByLabelText(/Altura \(cm\)/i), '175');
    await user.type(screen.getByLabelText(/Peso \(kg\)/i), '78');
    await user.type(screen.getByLabelText(/Objetivo personal/i), 'Bajar grasa');
    await user.click(screen.getByRole('checkbox'));

    const botonGuardar = screen.getByTestId('boton-guardar-ficha');
    await waitFor(() => expect(botonGuardar).not.toBeDisabled());
    await user.click(botonGuardar);

    await waitFor(() => {
      expect(
        screen.getByText(/Ficha de salud completada. Ya podés reservar turnos\./i),
      ).toBeInTheDocument();
    });
  });

  it('T2-10: muestra el banner "Última edición" con la fecha de la ficha', async () => {
    server.use(handlerFichaCompleta);
    render(crearProveedorQuery(<FichaSaludSocio />));

    await screen.findByTestId('boton-ver-historial');

    const banner = screen.getByTestId('fecha-ultima-edicion');
    expect(banner).toBeInTheDocument();
    // El banner muestra una fecha con formato DD/MM/YYYY HH:mm
    expect(banner.textContent).toMatch(/\d{2}\/\d{2}\/\d{4}/);
  });
});
