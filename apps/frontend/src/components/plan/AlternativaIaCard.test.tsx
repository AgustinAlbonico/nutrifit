import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { AlternativaIaCard } from './AlternativaIaCard';

const ideaMock = {
  idTemp: 'tmp1',
  nombre: 'Avena con frutas',
  alimentos: [{ alimentoId: 1, cantidad: 50, unidad: 'g', nombre: 'Avena' }],
  calorias: 350,
  proteinas: 12,
  carbohidratos: 50,
  grasas: 5,
  etiquetas: ['vegano'],
  warnings: [] as string[],
};

describe('AlternativaIaCard', () => {
  it('muestra nombre, kcal y botón Agregar', () => {
    render(<AlternativaIaCard idea={ideaMock} onAdd={vi.fn()} />);
    expect(screen.getByText(/Avena con frutas/i)).toBeInTheDocument();
    expect(screen.getByText(/350 kcal/i)).toBeInTheDocument();
  });

  it('invoca onAdd al click en Agregar al slot', async () => {
    const onAdd = vi.fn();
    const user = userEvent.setup();
    render(<AlternativaIaCard idea={ideaMock} onAdd={onAdd} />);
    await user.click(screen.getByRole('button', { name: /agregar al slot/i }));
    expect(onAdd).toHaveBeenCalledWith(ideaMock);
  });

  it('muestra badge de warning cuando hay warnings', () => {
    render(
      <AlternativaIaCard
        idea={{ ...ideaMock, warnings: ['Alto en sodio'] }}
        onAdd={vi.fn()}
      />,
    );
    expect(screen.getByText(/alto en sodio/i)).toBeInTheDocument();
  });
});
