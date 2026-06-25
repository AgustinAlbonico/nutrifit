/**
 * Tests del componente WeeklyPlanGrid V2 (Packet 5b).
 *
 * Cubre:
 * - Render del plan V2 (estructura con alternativas)
 * - Render del plan V1 (legacy, con comidas + alimentos)
 * - MacrosBadge por día con banda y desvío
 * - Botones regen por scope (PLAN / DIA / ALTERNATIVA)
 * - Confirm modal cuando se regenera comida editada manualmente
 */

import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { WeeklyPlanGrid } from '@/components/plan/WeeklyPlanGrid';
import type {
  EstructuraDiaFE,
  ItemComidaSnapshotFE,
  MacrosPorDiaFE,
  PlanAlimentacionDatosJsonFE,
  ResumenMacrosDiaFE,
} from '@/types/ia';

function crearAlternativa(
  nombre: string,
  calorias: number,
  override: Partial<ItemComidaSnapshotFE> = {},
): ItemComidaSnapshotFE {
  return {
    nombre,
    alimentos: [
      { alimentoId: 1, cantidad: 100, unidad: 'g' },
      { alimentoId: 2, cantidad: 50, unidad: 'g' },
    ],
    calorias,
    proteinas: 20,
    carbohidratos: 30,
    grasas: 10,
    ...override,
  };
}

function crearResumenMacros(
  banda: 'VERDE' | 'AMARILLO' | 'ROJO',
  desvio: number,
  calorias: number,
): ResumenMacrosDiaFE {
  return {
    calorias,
    proteinas: 100,
    carbohidratos: 200,
    grasas: 50,
    desvioPorcentaje: desvio,
    banda,
    detallePorMacro: {
      calorias: { real: calorias, objetivo: 2000, desvio, banda },
      proteinas: { real: 100, objetivo: 120, desvio, banda },
      carbohidratos: { real: 200, objetivo: 250, desvio, banda },
      grasas: { real: 50, objetivo: 60, desvio, banda },
    },
  };
}

function crearPlanV2Mock(): PlanAlimentacionDatosJsonFE {
  const estructura: EstructuraDiaFE[] = [
    {
      dia: 'LUNES',
      comidas: [
        {
          tipo: 'DESAYUNO',
          alternativas: [
            crearAlternativa('Avena con frutas', 350),
            crearAlternativa('Tostadas con palta', 380),
          ],
        },
        {
          tipo: 'ALMUERZO',
          alternativas: [
            crearAlternativa('Pollo grillado con quinoa', 650),
            crearAlternativa('Salmón con batata', 700),
          ],
        },
      ],
    },
    {
      dia: 'MIERCOLES',
      comidas: [
        {
          tipo: 'DESAYUNO',
          alternativas: [crearAlternativa('Yogurt con granola', 320)],
        },
      ],
    },
  ];

  const macrosPorDia: MacrosPorDiaFE = {
    LUNES: crearResumenMacros('VERDE', 2.5, 2050),
    MIERCOLES: crearResumenMacros('ROJO', 12, 1740),
  };

  return {
    estructura,
    macrosPorDia,
    razonamientoCumplimiento: {
      restriccionesCumplidas: [],
      restriccionesNoCumplidas: [],
    },
  };
}

describe('WeeklyPlanGrid V2', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza el plan V2 con estructura + alternativas', () => {
    const plan = crearPlanV2Mock();

    render(
      <WeeklyPlanGrid
        planV2={plan}
        regen={{
          alRegenerarPlan: vi.fn(),
          alRegenerarDia: vi.fn(),
          alRegenerarAlternativa: vi.fn(),
        }}
      />,
    );

    // El contenedor V2 está presente
    expect(screen.getByTestId('weekly-plan-grid-v2')).toBeInTheDocument();

    // Los días se renderizan como headers
    expect(screen.getByTestId('dia-header-LUNES')).toBeInTheDocument();
    expect(screen.getByTestId('dia-header-MIERCOLES')).toBeInTheDocument();

    // Los slots por día/comida se renderizan
    expect(screen.getByTestId('slot-LUNES-DESAYUNO')).toBeInTheDocument();
    expect(screen.getByTestId('slot-LUNES-ALMUERZO')).toBeInTheDocument();
    expect(screen.getByTestId('slot-MIERCOLES-DESAYUNO')).toBeInTheDocument();
  });

  it('muestra MacrosBadge con la banda correcta por día', () => {
    const plan = crearPlanV2Mock();

    render(<WeeklyPlanGrid planV2={plan} />);

    // Hay 2 badges (uno por día con macros)
    const badges = screen.getAllByTestId('macros-badge');
    expect(badges.length).toBeGreaterThanOrEqual(2);

    // El badge de LUNES (VERDE)
    expect(within(screen.getByTestId('dia-header-LUNES')).getByTestId('macros-badge'))
      .toHaveAttribute('data-banda', 'VERDE');

    // El badge de MIERCOLES (ROJO)
    expect(within(screen.getByTestId('dia-header-MIERCOLES')).getByTestId('macros-badge'))
      .toHaveAttribute('data-banda', 'ROJO');
  });

  it('muestra el botón "Regenerar plan completo"', () => {
    const plan = crearPlanV2Mock();
    const alRegenerarPlan = vi.fn();

    render(
      <WeeklyPlanGrid
        planV2={plan}
        regen={{ alRegenerarPlan }}
      />,
    );

    const boton = screen.getByTestId('regen-plan-button');
    expect(boton).toBeInTheDocument();

    boton.click();
    expect(alRegenerarPlan).toHaveBeenCalledTimes(1);
  });

  it('muestra botón "Regenerar día" por cada día', () => {
    const plan = crearPlanV2Mock();
    const alRegenerarDia = vi.fn();

    render(
      <WeeklyPlanGrid
        planV2={plan}
        regen={{ alRegenerarDia }}
      />,
    );

    const botonLunes = screen.getByTestId('regen-dia-LUNES');
    const botonMiercoles = screen.getByTestId('regen-dia-MIERCOLES');

    expect(botonLunes).toBeInTheDocument();
    expect(botonMiercoles).toBeInTheDocument();

    botonMiercoles.click();
    expect(alRegenerarDia).toHaveBeenCalledWith('MIERCOLES');
  });

  it('muestra botón "Regenerar alternativa" por slot con alternativas', () => {
    const plan = crearPlanV2Mock();
    const alRegenerarAlternativa = vi.fn();

    render(
      <WeeklyPlanGrid
        planV2={plan}
        regen={{ alRegenerarAlternativa }}
      />,
    );

    const slot = screen.getByTestId('slot-LUNES-DESAYUNO');
    const botonRegenAlt = within(slot).getByTestId('regen-alt-0');

    expect(botonRegenAlt).toBeInTheDocument();

    botonRegenAlt.click();
    expect(alRegenerarAlternativa).toHaveBeenCalledWith({
      dia: 'LUNES',
      comidaSlot: 'DESAYUNO',
      alternativaIndex: 0,
    });
  });

  it('abre modal de confirmación cuando el slot fue editado manualmente', async () => {
    const plan = crearPlanV2Mock();
    const alRegenerarAlternativa = vi.fn();

    const slotsEditados = new Set<string>(['LUNES-DESAYUNO']);

    render(
      <WeeklyPlanGrid
        planV2={plan}
        regen={{
          alRegenerarAlternativa,
          slotsEditadosManualmente: slotsEditados,
        }}
      />,
    );

    const slot = screen.getByTestId('slot-LUNES-DESAYUNO');
    const botonRegenAlt = within(slot).getByTestId('regen-alt-0');

    const user = userEvent.setup();
    await user.click(botonRegenAlt);

    // El modal de confirmación debe estar abierto
    await waitFor(() => {
      expect(
        screen.getByText(/Esta comida fue editada manualmente/i),
      ).toBeInTheDocument();
    });

    // La mutation NO debe haberse llamado todavía
    expect(alRegenerarAlternativa).not.toHaveBeenCalled();

    // Click en "Regenerar igual" ejecuta la mutation
    await user.click(screen.getByTestId('confirm-regen-perder-cambios'));

    await waitFor(() => {
      expect(alRegenerarAlternativa).toHaveBeenCalledWith({
        dia: 'LUNES',
        comidaSlot: 'DESAYUNO',
        alternativaIndex: 0,
      });
    });
  });

  it('permite seleccionar alternativa activa vía tabs', async () => {
    const plan = crearPlanV2Mock();

    render(<WeeklyPlanGrid planV2={plan} />);

    const slot = screen.getByTestId('slot-LUNES-DESAYUNO');
    const tab1 = within(slot).getByTestId('alt-tab-0');
    const tab2 = within(slot).getByTestId('alt-tab-1');

    expect(tab1).toHaveAttribute('data-state', 'active');
    expect(tab2).toHaveAttribute('data-state', 'inactive');

    const user = userEvent.setup();
    await user.click(tab2);

    expect(tab2).toHaveAttribute('data-state', 'active');
    expect(tab1).toHaveAttribute('data-state', 'inactive');
  });
});

describe('WeeklyPlanGrid V1 (legacy)', () => {
  it('renderiza el editor V1 con comidas + alimentos cuando no se pasa planV2', () => {
    const alAgregar = vi.fn();
    const alEditar = vi.fn();
    const alEliminar = vi.fn();

    render(
      <WeeklyPlanGrid
        comidas={[]}
        alAgregarAlimento={alAgregar}
        alEditarCantidad={alEditar}
        alEliminarAlimento={alEliminar}
      />,
    );

    expect(screen.getByTestId('weekly-plan-grid-v1')).toBeInTheDocument();
    expect(screen.queryByTestId('weekly-plan-grid-v2')).not.toBeInTheDocument();
  });
});
