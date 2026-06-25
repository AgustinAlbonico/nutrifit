/**
 * Tests de EmptyStatePlanEnPreparacion (Packet 6).
 *
 * Cubre:
 * - Render estándar: muestra mensaje principal + secundario
 * - Render con `diasDesdeAsignacion > 7`: muestra sugerencia de contacto
 * - Render con `diasDesdeAsignacion <= 7`: NO muestra sugerencia
 * - Nombre del nutricionista se incluye en el copy (calidez)
 * - region role="status" para lectores de pantalla
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { EmptyStatePlanEnPreparacion } from '@/components/plan/EmptyStatePlanEnPreparacion';

describe('EmptyStatePlanEnPreparacion', () => {
  it('muestra el mensaje principal y el subtítulo', () => {
    render(<EmptyStatePlanEnPreparacion />);

    expect(
      screen.getByText(/Tu nutricionista está preparando tu plan/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Te avisaremos cuando esté listo/i),
    ).toBeInTheDocument();
  });

  it('usa role="status" para que los lectores de pantalla anuncien el contexto', () => {
    render(<EmptyStatePlanEnPreparacion />);

    const region = screen.getByRole('status');
    expect(region).toHaveAttribute(
      'data-testid',
      'empty-state-plan-en-preparacion',
    );
  });

  it('incluye el nombre del nutricionista en el copy cuando se pasa', () => {
    render(
      <EmptyStatePlanEnPreparacion nombreNutricionista="Lic. Pérez" />,
    );

    expect(
      screen.getByText(/Lic\. Pérez está diseñando un plan personalizado/i),
    ).toBeInTheDocument();
  });

  it('NO muestra sugerencia de contacto con diasDesdeAsignacion <= 7', () => {
    render(<EmptyStatePlanEnPreparacion diasDesdeAsignacion={3} />);

    expect(
      screen.queryByTestId('sugerencia-contacto-nutricionista'),
    ).not.toBeInTheDocument();
  });

  it('NO muestra sugerencia de contacto con diasDesdeAsignacion = 7 (umbral estricto)', () => {
    render(<EmptyStatePlanEnPreparacion diasDesdeAsignacion={7} />);

    expect(
      screen.queryByTestId('sugerencia-contacto-nutricionista'),
    ).not.toBeInTheDocument();
  });

  it('muestra sugerencia de contacto cuando diasDesdeAsignacion > 7', () => {
    render(<EmptyStatePlanEnPreparacion diasDesdeAsignacion={10} />);

    const sugerencia = screen.getByTestId('sugerencia-contacto-nutricionista');
    expect(sugerencia).toBeInTheDocument();
    expect(sugerencia).toHaveTextContent(/Hablale a tu nutricionista/i);
    expect(sugerencia).toHaveTextContent(/más de 7 días/i);
  });
});