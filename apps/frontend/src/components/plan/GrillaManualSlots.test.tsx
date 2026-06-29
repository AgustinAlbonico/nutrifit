import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { GrillaManualSlots } from './GrillaManualSlots';

// Mock SugerenciasIaSlot so 35 concurrent API calls don't cause issues in tests
vi.mock('./SugerenciasIaSlot', () => ({
  SugerenciasIaSlot: vi.fn(() => (
    <div data-testid="sugerencias-ia-slot-mock">SugerenciasIaSlot mock</div>
  )),
}));

const ESTRUCTURA_VACIA = [
  { dia: 'LUNES' as const, comidas: [{ tipo: 'DESAYUNO' as const, alternativas: [] }, { tipo: 'ALMUERZO' as const, alternativas: [] }, { tipo: 'MERIENDA' as const, alternativas: [] }, { tipo: 'CENA' as const, alternativas: [] }, { tipo: 'COLACION' as const, alternativas: [] }] },
  { dia: 'MARTES' as const, comidas: [{ tipo: 'DESAYUNO' as const, alternativas: [] }, { tipo: 'ALMUERZO' as const, alternativas: [] }, { tipo: 'MERIENDA' as const, alternativas: [] }, { tipo: 'CENA' as const, alternativas: [] }, { tipo: 'COLACION' as const, alternativas: [] }] },
  { dia: 'MIERCOLES' as const, comidas: [{ tipo: 'DESAYUNO' as const, alternativas: [] }, { tipo: 'ALMUERZO' as const, alternativas: [] }, { tipo: 'MERIENDA' as const, alternativas: [] }, { tipo: 'CENA' as const, alternativas: [] }, { tipo: 'COLACION' as const, alternativas: [] }] },
  { dia: 'JUEVES' as const, comidas: [{ tipo: 'DESAYUNO' as const, alternativas: [] }, { tipo: 'ALMUERZO' as const, alternativas: [] }, { tipo: 'MERIENDA' as const, alternativas: [] }, { tipo: 'CENA' as const, alternativas: [] }, { tipo: 'COLACION' as const, alternativas: [] }] },
  { dia: 'VIERNES' as const, comidas: [{ tipo: 'DESAYUNO' as const, alternativas: [] }, { tipo: 'ALMUERZO' as const, alternativas: [] }, { tipo: 'MERIENDA' as const, alternativas: [] }, { tipo: 'CENA' as const, alternativas: [] }, { tipo: 'COLACION' as const, alternativas: [] }] },
  { dia: 'SABADO' as const, comidas: [{ tipo: 'DESAYUNO' as const, alternativas: [] }, { tipo: 'ALMUERZO' as const, alternativas: [] }, { tipo: 'MERIENDA' as const, alternativas: [] }, { tipo: 'CENA' as const, alternativas: [] }, { tipo: 'COLACION' as const, alternativas: [] }] },
  { dia: 'DOMINGO' as const, comidas: [{ tipo: 'DESAYUNO' as const, alternativas: [] }, { tipo: 'ALMUERZO' as const, alternativas: [] }, { tipo: 'MERIENDA' as const, alternativas: [] }, { tipo: 'CENA' as const, alternativas: [] }, { tipo: 'COLACION' as const, alternativas: [] }] },
];

describe('GrillaManualSlots', () => {
  it('renderiza grilla 7×5 con headers correctos', () => {
    const onChange = vi.fn();
    render(
      <GrillaManualSlots
        planId={1}
        estructura={ESTRUCTURA_VACIA}
        onChange={onChange}
      />,
    );

    // Header row with meal types
    expect(screen.getByText('DESAYUNO')).toBeInTheDocument();
    expect(screen.getByText('ALMUERZO')).toBeInTheDocument();
    expect(screen.getByText('MERIENDA')).toBeInTheDocument();
    expect(screen.getByText('CENA')).toBeInTheDocument();
    expect(screen.getByText('COLACION')).toBeInTheDocument();

    // Day labels
    expect(screen.getByText('LUNES')).toBeInTheDocument();
    expect(screen.getByText('MARTES')).toBeInTheDocument();
    expect(screen.getByText('MIERCOLES')).toBeInTheDocument();
    expect(screen.getByText('JUEVES')).toBeInTheDocument();
    expect(screen.getByText('VIERNES')).toBeInTheDocument();
    expect(screen.getByText('SABADO')).toBeInTheDocument();
    expect(screen.getByText('DOMINGO')).toBeInTheDocument();

    // 35 slots (7 days × 5 meal types)
    expect(screen.getByTestId('slot-comida-LUNES-DESAYUNO')).toBeInTheDocument();
    expect(screen.getByTestId('slot-comida-DOMINGO-COLACION')).toBeInTheDocument();
  });

  it('renderiza estructura con alternativas existentes en los slots correctos', () => {
    const onChange = vi.fn();
    const estructuraConDatos = [
      {
        dia: 'LUNES' as const,
        comidas: [
          { tipo: 'DESAYUNO' as const, alternativas: [{ nombre: 'Avena', alimentos: [{ alimentoId: 1, cantidad: 50, unidad: 'g' }], calorias: 300, proteinas: 10, carbohidratos: 40, grasas: 5 }] },
          { tipo: 'ALMUERZO' as const, alternativas: [] },
          { tipo: 'MERIENDA' as const, alternativas: [] },
          { tipo: 'CENA' as const, alternativas: [] },
          { tipo: 'COLACION' as const, alternativas: [] },
        ],
      },
      ...ESTRUCTURA_VACIA.slice(1),
    ];

    render(
      <GrillaManualSlots
        planId={1}
        estructura={estructuraConDatos}
        onChange={onChange}
      />,
    );

    // Slot with data shows the alternative
    expect(screen.getByText('Avena')).toBeInTheDocument();
  });

  it('al eliminar alternativa en un slot invoca onChange con estructura actualizada', async () => {
    const onChange = vi.fn();
    const estructuraConDatos = [
      {
        dia: 'LUNES' as const,
        comidas: [
          { tipo: 'DESAYUNO' as const, alternativas: [{ nombre: 'Avena', alimentos: [{ alimentoId: 1, cantidad: 50, unidad: 'g' }], calorias: 300, proteinas: 10, carbohidratos: 40, grasas: 5 }] },
          { tipo: 'ALMUERZO' as const, alternativas: [] },
          { tipo: 'MERIENDA' as const, alternativas: [] },
          { tipo: 'CENA' as const, alternativas: [] },
          { tipo: 'COLACION' as const, alternativas: [] },
        ],
      },
      ...ESTRUCTURA_VACIA.slice(1),
    ];

    const user = userEvent.setup();
    render(
      <GrillaManualSlots
        planId={1}
        estructura={estructuraConDatos}
        onChange={onChange}
      />,
    );

    // Delete button is in the slot
    await user.click(screen.getByTestId('btn-eliminar'));

    expect(onChange).toHaveBeenCalledTimes(1);
    // The LUNES DESAYUNO alternativas should now be empty
    const resultado = onChange.mock.calls[0][0] as { comidas: Array<{ tipo: string; alternativas: unknown[] }> };
    const lunesDesayuno = resultado[0].comidas.find((c) => c.tipo === 'DESAYUNO');
    expect(lunesDesayuno?.alternativas).toHaveLength(0);
  });
});
