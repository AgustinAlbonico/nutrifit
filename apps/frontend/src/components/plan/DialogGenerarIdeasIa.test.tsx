import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import type { ComponentProps } from 'react';

import { server } from '@/mocks/server';
import { DialogGenerarIdeasIa } from './DialogGenerarIdeasIa';
import type { IdeaComidaIa } from '@/types/ia';

const IDEA_MOCK: IdeaComidaIa = {
  idTemp: 'idea-1',
  nombre: 'Avena con banana',
  alimentos: [
    {
      alimentoId: 1,
      cantidad: 50,
      unidad: 'g',
      nombre: 'Avena',
    },
  ],
  calorias: 330,
  proteinas: 11,
  carbohidratos: 58,
  grasas: 7,
  etiquetas: [],
  warnings: [],
};

describe('DialogGenerarIdeasIa', () => {
  it('genera la cantidad elegida para el slot contextual y agrega la idea a ese slot', async () => {
    let cuerpoRecibido: unknown;
    server.use(
      http.post('/planes-alimentacion/:id/ideas-comida', async ({ request }) => {
        cuerpoRecibido = await request.json();

        return HttpResponse.json({
          success: true,
          message: 'ok',
          data: {
            promptUsado: 'prompt de prueba',
            alternativas: [IDEA_MOCK],
          },
        });
      }),
    );

    const onAddIdea = vi.fn();
    const user = userEvent.setup();
    const props = {
      open: true,
      onOpenChange: vi.fn(),
      planId: 99,
      slot: { dia: 'MIERCOLES', tipoComida: 'DESAYUNO' },
      onAddIdea,
    } satisfies ComponentProps<typeof DialogGenerarIdeasIa>;

    render(<DialogGenerarIdeasIa {...props} />);

    expect(screen.getByText('MIERCOLES · DESAYUNO')).toBeInTheDocument();
    expect(screen.queryByText('Día')).not.toBeInTheDocument();
    expect(screen.queryByText('Comida')).not.toBeInTheDocument();

    await user.click(screen.getByRole('combobox', { name: /alternativas a generar/i }));
    await user.click(await screen.findByRole('option', { name: '5 alternativas' }));
    await user.click(screen.getByRole('button', { name: /generar/i }));

    await waitFor(() => {
      expect(cuerpoRecibido).toMatchObject({
        dia: 'MIERCOLES',
        tipoComida: 'DESAYUNO',
        cantidadAlternativas: 5,
      });
    });

    await user.click(await screen.findByRole('button', { name: /agregar a este slot/i }));

    expect(onAddIdea).toHaveBeenCalledWith('MIERCOLES', 'DESAYUNO', IDEA_MOCK);
  });
});
