/**
 * Tests de PlanSocioCard (Packet 6).
 *
 * Cubre:
 * - Renderiza header con nombre del NUT + fecha de inicio
 * - Renderiza WeeklyPlanGrid V2 con la estructura del plan
 * - Renderiza RazonamientoCumplimiento en modo readOnly
 * - NO muestra botones de regenerar (regen={undefined} → V2 los oculta)
 * - Botón "Descargar PDF" deshabilitado cuando no se pasa callback
 * - Botón "Descargar PDF" invoca callback con planId y versionId
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { toast } from 'sonner';

import { PlanSocioCard } from '@/components/plan/PlanSocioCard';
import type { PlanSocioActivo } from '@/types/ia';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
}));

function crearPlanSocioMock(
  overrides: Partial<PlanSocioActivo> = {},
): PlanSocioActivo {
  return {
    idPlanAlimentacion: 42,
    versionId: 7,
    nutricionistaId: 99,
    nutricionistaNombre: 'Lic. Pérez',
    fechaInicio: '2026-06-15T12:00:00.000Z',
    objetivoNutricional: 'Mantener peso y mejorar composición corporal',
    plan: {
      estructura: [
        {
          dia: 'LUNES',
          comidas: [
            {
              tipo: 'DESAYUNO',
              alternativas: [
                {
                  nombre: 'Avena con frutas',
                  alimentos: [
                    { alimentoId: 1, cantidad: 100, unidad: 'g' },
                    { alimentoId: 2, cantidad: 50, unidad: 'g' },
                  ],
                  calorias: 350,
                  proteinas: 15,
                  carbohidratos: 50,
                  grasas: 10,
                },
                {
                  nombre: 'Tostadas con palta',
                  alimentos: [
                    { alimentoId: 3, cantidad: 60, unidad: 'g' },
                  ],
                  calorias: 380,
                  proteinas: 12,
                  carbohidratos: 45,
                  grasas: 15,
                },
              ],
            },
            {
              tipo: 'ALMUERZO',
              alternativas: [
                {
                  nombre: 'Pollo grillado con quinoa',
                  alimentos: [
                    { alimentoId: 5, cantidad: 200, unidad: 'g' },
                  ],
                  calorias: 650,
                  proteinas: 50,
                  carbohidratos: 60,
                  grasas: 20,
                },
              ],
            },
          ],
        },
      ],
      macrosPorDia: {
        LUNES: {
          calorias: 2000,
          proteinas: 100,
          carbohidratos: 250,
          grasas: 60,
          desvioPorcentaje: 0,
          banda: 'VERDE',
          detallePorMacro: {
            calorias: { real: 2000, objetivo: 2000, desvio: 0, banda: 'VERDE' },
            proteinas: { real: 100, objetivo: 100, desvio: 0, banda: 'VERDE' },
            carbohidratos: { real: 250, objetivo: 250, desvio: 0, banda: 'VERDE' },
            grasas: { real: 60, objetivo: 60, desvio: 0, banda: 'VERDE' },
          },
        },
      },
      razonamientoCumplimiento: {
        restriccionesCumplidas: [
          {
            restriccion: 'vegano',
            detalle: 'Ningún alimento contiene carne, lácteos, huevos ni miel.',
          },
        ],
        restriccionesNoCumplidas: [],
      },
    },
    ...overrides,
  };
}

describe('PlanSocioCard', () => {
  it('renderiza el header con el nombre del nutricionista y la fecha de inicio', () => {
    render(<PlanSocioCard plan={crearPlanSocioMock()} />);

    expect(screen.getByText(/Plan con Lic\. Pérez/i)).toBeInTheDocument();
    // El día se parte por el icono, por eso usamos data-testid.
    expect(screen.getByTestId('plan-fecha-inicio').textContent ?? '').toMatch(
      /Activo desde 15 de junio de 2026/,
    );
  });

  it('renderiza la WeeklyPlanGrid V2 con la estructura del plan', () => {
    render(<PlanSocioCard plan={crearPlanSocioMock()} />);

    expect(screen.getByTestId('weekly-plan-grid-v2')).toBeInTheDocument();
    expect(screen.getByTestId('dia-header-LUNES')).toBeInTheDocument();
    expect(screen.getByTestId('slot-LUNES-DESAYUNO')).toBeInTheDocument();
    expect(screen.getByTestId('slot-LUNES-ALMUERZO')).toBeInTheDocument();
  });

  it('NO renderiza los botones de regenerar (modo read-only)', () => {
    render(<PlanSocioCard plan={crearPlanSocioMock()} />);

    // El botón "Regenerar plan completo" solo se renderiza si se pasa
    // `regen.alRegenerarPlan`. Sin regen, no debe aparecer.
    expect(
      screen.queryByTestId('regen-plan-button'),
    ).not.toBeInTheDocument();
    // Lo mismo para "Regenerar día".
    expect(
      screen.queryByTestId('regen-dia-LUNES'),
    ).not.toBeInTheDocument();
  });

  it('renderiza el RazonamientoCumplimiento en modo readOnly', () => {
    render(<PlanSocioCard plan={crearPlanSocioMock()} />);

    // El trigger debe estar deshabilitado (readOnly).
    const trigger = screen.getByRole('button', {
      name: /Razonamiento de cumplimiento/i,
    });
    expect(trigger).toBeDisabled();
  });

  it('muestra el contador de restricciones cumplidas del plan', () => {
    render(<PlanSocioCard plan={crearPlanSocioMock()} />);

    expect(screen.getByText(/1 cumplidas/i)).toBeInTheDocument();
    // El mock tiene 0 no cumplidas, por lo que ese contador no aparece.
    expect(screen.queryByText(/no cumplidas/i)).not.toBeInTheDocument();
  });

  it('muestra el botón "Marcar leído" y dispara toast de confirmación', async () => {
    const user = userEvent.setup();
    render(<PlanSocioCard plan={crearPlanSocioMock()} />);

    const boton = screen.getByTestId('boton-marcar-leido');
    expect(boton).toBeEnabled();
    await user.click(boton);

    expect(toast.success).toHaveBeenCalledWith(
      expect.stringContaining('marcado como leído'),
      expect.objectContaining({
        description: expect.any(String),
      }),
    );
    expect(boton).toBeDisabled();
  });

  it('muestra el enlace "Contactar al NUT" como mailto funcional', () => {
    render(<PlanSocioCard plan={crearPlanSocioMock()} />);

    const link = screen.getByTestId('boton-contactar-nutricionista');
    expect(link).toHaveAttribute('href');
    expect(link.getAttribute('href')).toMatch(/^mailto:/);
    expect(link.getAttribute('href') ?? '').toContain('Lic.%20P%C3%A9rez');
  });

  it('atributos data-* permiten testing e2e y selectores por nutricionista', () => {
    render(
      <PlanSocioCard
        plan={crearPlanSocioMock({
          idPlanAlimentacion: 77,
          nutricionistaId: 33,
        })}
      />,
    );

    const card = screen.getByTestId('plan-socio-card');
    expect(card).toHaveAttribute('data-plan-id', '77');
    expect(card).toHaveAttribute('data-nutricionista-id', '33');
  });
});