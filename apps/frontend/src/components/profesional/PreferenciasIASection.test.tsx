import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { describe, it, expect, beforeEach } from 'vitest';
import type { ReactNode } from 'react';

import { server } from '@/mocks/server';
import { PreferenciasIASection } from '@/components/profesional/PreferenciasIASection';

function crearWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('PreferenciasIASection', () => {
  beforeEach(() => {
    server.resetHandlers();
  });

  it('carga las preferencias existentes en el textarea', async () => {
    server.use(
      http.get('/profesional/mi-perfil/preferencias-ia', () =>
        HttpResponse.json({
          preferencias: 'Priorizar fibra, evitar ultraprocesados',
        }),
      ),
    );

    render(<PreferenciasIASection />, { wrapper: crearWrapper() });

    const textarea = await screen.findByLabelText(
      /Tus directrices para la IA/i,
    );
    expect(textarea).toHaveValue('Priorizar fibra, evitar ultraprocesados');
  });

  it('muestra el contador de caracteres en vivo', async () => {
    server.use(
      http.get('/profesional/mi-perfil/preferencias-ia', () =>
        HttpResponse.json({ preferencias: '' }),
      ),
    );

    const user = userEvent.setup();
    render(<PreferenciasIASection />, { wrapper: crearWrapper() });

    const textarea = await screen.findByLabelText(
      /Tus directrices para la IA/i,
    );
    await user.type(textarea, 'Hola mundo');

    expect(screen.getByText(/10 \/ 2000 caracteres/i)).toBeInTheDocument();
  });

  it('guarda con PUT al hacer click en Guardar y muestra confirmación', async () => {
    let bodyRecibido: unknown = null;

    server.use(
      http.get('/profesional/mi-perfil/preferencias-ia', () =>
        HttpResponse.json({ preferencias: '' }),
      ),
      http.put('/profesional/mi-perfil/preferencias-ia', async ({ request }) => {
        bodyRecibido = await request.json();
        return HttpResponse.json({
          preferencias: 'Nueva preferencia',
        });
      }),
    );

    const user = userEvent.setup();
    render(<PreferenciasIASection />, { wrapper: crearWrapper() });

    const textarea = await screen.findByLabelText(
      /Tus directrices para la IA/i,
    );
    await user.type(textarea, 'Nueva preferencia');

    const botonGuardar = screen.getByTestId('preferencias-guardar');
    await user.click(botonGuardar);

    await waitFor(() => {
      expect(screen.getByText(/Preferencias guardadas/i)).toBeInTheDocument();
    });
    expect(bodyRecibido).toEqual({ preferencias: 'Nueva preferencia' });
  });

  it('deshabilita Guardar cuando no hay cambios', async () => {
    server.use(
      http.get('/profesional/mi-perfil/preferencias-ia', () =>
        HttpResponse.json({ preferencias: 'Ya escrito' }),
      ),
    );

    render(<PreferenciasIASection />, { wrapper: crearWrapper() });

    const botonGuardar = await screen.findByTestId('preferencias-guardar');
    expect(botonGuardar).toBeDisabled();
  });

  it('muestra error si el guardado falla', async () => {
    server.use(
      http.get('/profesional/mi-perfil/preferencias-ia', () =>
        HttpResponse.json({ preferencias: '' }),
      ),
      http.put('/profesional/mi-perfil/preferencias-ia', () =>
        HttpResponse.json(
          { message: 'Error del servidor' },
          { status: 500 },
        ),
      ),
    );

    const user = userEvent.setup();
    render(<PreferenciasIASection />, { wrapper: crearWrapper() });

    const textarea = await screen.findByLabelText(
      /Tus directrices para la IA/i,
    );
    await user.type(textarea, 'Algo');

    await user.click(screen.getByTestId('preferencias-guardar'));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });
});