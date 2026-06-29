import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import { SugerenciasIaSlot } from './SugerenciasIaSlot';
import type { ItemComidaIaFE } from '@/types/ia';

const IDEA_MOCK_10: ItemComidaIaFE[] = Array.from({ length: 10 }, (_, i) => ({
  idTemp: `tmp-${i + 1}`,
  nombre: `Comida ${i + 1}`,
  alimentos: [
    {
      alimentoId: i + 1,
      cantidad: 100,
      unidad: 'g',
      nombre: `Alimento ${i + 1}`,
    },
  ],
  calorias: 300 + i * 10,
  proteinas: 20 + i,
  carbohidratos: 40 + i,
  grasas: 10 + i,
  etiquetas: i % 3 === 0 ? ['vegano'] : [],
  warnings: [],
}));

const IDEA_MOCK_1: ItemComidaIaFE[] = [
  {
    idTemp: 'tmp-single',
    nombre: 'Avena con frutas',
    alimentos: [
      { alimentoId: 1, cantidad: 50, unidad: 'g', nombre: 'Avena' },
    ],
    calorias: 350,
    proteinas: 12,
    carbohidratos: 50,
    grasas: 5,
    etiquetas: ['vegano'],
    warnings: [],
  },
];

describe('SugerenciasIaSlot', () => {
  beforeEach(() => {
    // Reset handlers between tests
  });

  it('llama al endpoint al abrir y muestra las ideas', async () => {
    server.use(
      http.post('/planes-alimentacion/:id/ideas-comida', () => {
        return HttpResponse.json({
          promptUsado: 'test prompt',
          alternativas: IDEA_MOCK_10,
        });
      }),
    );

    render(
      <SugerenciasIaSlot
        planId={1}
        dia="LUNES"
        tipoComida="DESAYUNO"
        onAdd={vi.fn()}
      />,
    );

    // Should show loading then ideas
    expect(await screen.findByText(/Comida 1/i)).toBeInTheDocument();
  });

  it('pagina 3 alternativas por página', async () => {
    server.use(
      http.post('/planes-alimentacion/:id/ideas-comida', () => {
        return HttpResponse.json({
          promptUsado: 'test prompt',
          alternativas: IDEA_MOCK_10,
        });
      }),
    );

    const user = userEvent.setup();
    render(
      <SugerenciasIaSlot
        planId={1}
        dia="LUNES"
        tipoComida="DESAYUNO"
        onAdd={vi.fn()}
      />,
    );

    // Wait for ideas to load
    await screen.findByText(/Comida 1/i);

    // Page 1: Comida 1, 2, 3 visible
    expect(screen.getByText(/Comida 1/i)).toBeInTheDocument();
    expect(screen.getByText(/Comida 2/i)).toBeInTheDocument();
    expect(screen.getByText(/Comida 3/i)).toBeInTheDocument();

    // Advance to page 2
    const nextBtn = screen.getByRole('button', { name: /página siguiente/i });
    await user.click(nextBtn);

    // Page 2: Comida 4, 5, 6 visible
    expect(await screen.findByText(/Comida 4/i)).toBeInTheDocument();
    expect(screen.getByText(/Comida 5/i)).toBeInTheDocument();
    expect(screen.getByText(/Comida 6/i)).toBeInTheDocument();

    // Comida 1 (page 1) should not be visible
    expect(screen.queryByText(/Comida 1/i)).not.toBeInTheDocument();
  });

  it('invoca onAdd al agregar una alternativa', async () => {
    server.use(
      http.post('/planes-alimentacion/:id/ideas-comida', () => {
        return HttpResponse.json({
          promptUsado: 'test prompt',
          alternativas: IDEA_MOCK_1,
        });
      }),
    );

    const onAdd = vi.fn();
    const user = userEvent.setup();
    render(
      <SugerenciasIaSlot
        planId={1}
        dia="LUNES"
        tipoComida="DESAYUNO"
        onAdd={onAdd}
      />,
    );

    // Wait for the idea to appear
    await screen.findByText(/Avena con frutas/i);

    // Click "Agregar al slot"
    const agregarBtn = screen.getByRole('button', { name: /agregar al slot/i });
    await user.click(agregarBtn);

    expect(onAdd).toHaveBeenCalledTimes(1);
    expect(onAdd).toHaveBeenCalledWith(IDEA_MOCK_1[0]);
  });
});
