import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SlotComidaManual } from './SlotComidaManual';

// Mock SugerenciasIaSlot so we don't depend on its async fetch in this test
vi.mock('./SugerenciasIaSlot', () => ({
  SugerenciasIaSlot: vi.fn(() => (
    <div data-testid="sugerencias-ia-slot-mock">SugerenciasIaSlot mock</div>
  )),
}));

describe('SlotComidaManual', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza slot vacío con SugerenciasIaSlot y texto instructivo', async () => {
    const onChange = vi.fn();
    render(
      <SlotComidaManual
        slotKey="LUNES-DESAYUNO"
        dia="LUNES"
        tipoComida="DESAYUNO"
        planId={1}
        alternativas={[]}
        onChange={onChange}
      />,
    );

    expect(screen.getByTestId('slot-comida-LUNES-DESAYUNO')).toBeInTheDocument();
    // Text shown when empty
    expect(screen.getByText(/arrastrá ideas/i)).toBeInTheDocument();
    // SugerenciasIaSlot mock renders
    expect(screen.getByTestId('sugerencias-ia-slot-mock')).toBeInTheDocument();
  });

  it('renderiza alternativas con toolbar cuando slot tiene contenido', async () => {
    const onChange = vi.fn();
    const alternativasIniciales = [
      {
        id: 'alt-1',
        nombre: 'Tostadas con palta',
        alimentos: [{ alimentoId: 3, cantidad: 2, unidad: 'unidades', nombre: 'Tostada' }],
        calorias: 300,
        proteinas: 8,
        carbohidratos: 30,
        grasas: 15,
      },
    ];

    render(
      <SlotComidaManual
        slotKey="LUNES-DESAYUNO"
        dia="LUNES"
        tipoComida="DESAYUNO"
        planId={1}
        alternativas={alternativasIniciales}
        onChange={onChange}
      />,
    );

    expect(screen.getByText('Tostadas con palta')).toBeInTheDocument();
    expect(screen.getByTestId('btn-editar')).toBeInTheDocument();
    expect(screen.getByTestId('btn-duplicar')).toBeInTheDocument();
    expect(screen.getByTestId('btn-eliminar')).toBeInTheDocument();
  });

  it('eliminar alternativa invoca onChange sin ese item', async () => {
    const onChange = vi.fn();
    const alternativasIniciales = [
      {
        id: 'alt-1',
        nombre: 'Tostadas con palta',
        alimentos: [{ alimentoId: 3, cantidad: 2, unidad: 'unidades', nombre: 'Tostada' }],
        calorias: 300,
        proteinas: 8,
        carbohidratos: 30,
        grasas: 15,
      },
    ];

    const user = userEvent.setup();
    render(
      <SlotComidaManual
        slotKey="LUNES-DESAYUNO"
        dia="LUNES"
        tipoComida="DESAYUNO"
        planId={1}
        alternativas={alternativasIniciales}
        onChange={onChange}
      />,
    );

    await user.click(screen.getByTestId('btn-eliminar'));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it('duplicar alternativa agrega una copia con nombre modificado', async () => {
    const onChange = vi.fn();
    const alternativasIniciales = [
      {
        id: 'alt-1',
        nombre: 'Tostadas con palta',
        alimentos: [{ alimentoId: 3, cantidad: 2, unidad: 'unidades', nombre: 'Tostada' }],
        calorias: 300,
        proteinas: 8,
        carbohidratos: 30,
        grasas: 15,
      },
    ];

    const user = userEvent.setup();
    render(
      <SlotComidaManual
        slotKey="LUNES-DESAYUNO"
        dia="LUNES"
        tipoComida="DESAYUNO"
        planId={1}
        alternativas={alternativasIniciales}
        onChange={onChange}
      />,
    );

    await user.click(screen.getByTestId('btn-duplicar'));

    expect(onChange).toHaveBeenCalledTimes(1);
    const resultado = onChange.mock.calls[0][0];
    expect(resultado).toHaveLength(2);
    expect(resultado[1].nombre).toBe('Tostadas con palta (copia)');
  });

  it('editar alternativa habilita input y guarda al confirmar', async () => {
    const onChange = vi.fn();
    const alternativasIniciales = [
      {
        id: 'alt-1',
        nombre: 'Tostadas con palta',
        alimentos: [{ alimentoId: 3, cantidad: 2, unidad: 'unidades', nombre: 'Tostada' }],
        calorias: 300,
        proteinas: 8,
        carbohidratos: 30,
        grasas: 15,
      },
    ];

    const user = userEvent.setup();
    render(
      <SlotComidaManual
        slotKey="LUNES-DESAYUNO"
        dia="LUNES"
        tipoComida="DESAYUNO"
        planId={1}
        alternativas={alternativasIniciales}
        onChange={onChange}
      />,
    );

    // Click edit button
    await user.click(screen.getByTestId('btn-editar'));

    // Input should be visible
    const input = screen.getByTestId('input-editar-nombre') as HTMLInputElement;
    expect(input).toBeInTheDocument();

    // Change name
    await user.clear(input);
    await user.type(input, 'Tostadas con queso');

    // Save
    await user.click(screen.getByTestId('btn-guardar-nombre'));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith([
      expect.objectContaining({ nombre: 'Tostadas con queso' }),
    ]);
  });

  it('cancelar edicion restaura nombre original', async () => {
    const onChange = vi.fn();
    const alternativasIniciales = [
      {
        id: 'alt-1',
        nombre: 'Tostadas con palta',
        alimentos: [{ alimentoId: 3, cantidad: 2, unidad: 'unidades', nombre: 'Tostada' }],
        calorias: 300,
        proteinas: 8,
        carbohidratos: 30,
        grasas: 15,
      },
    ];

    const user = userEvent.setup();
    render(
      <SlotComidaManual
        slotKey="LUNES-DESAYUNO"
        dia="LUNES"
        tipoComida="DESAYUNO"
        planId={1}
        alternativas={alternativasIniciales}
        onChange={onChange}
      />,
    );

    await user.click(screen.getByTestId('btn-editar'));

    const input = screen.getByTestId('input-editar-nombre') as HTMLInputElement;
    await user.clear(input);
    await user.type(input, 'Nombre nuevo');

    await user.click(screen.getByTestId('btn-cancelar-edicion'));

    // onChange should NOT have been called
    expect(onChange).not.toHaveBeenCalled();
    // Original name should be displayed
    expect(screen.getByText('Tostadas con palta')).toBeInTheDocument();
  });
});
