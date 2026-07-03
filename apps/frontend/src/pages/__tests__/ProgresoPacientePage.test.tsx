import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ProgresoPacientePage } from '../ProgresoPacientePage';

const params = { socioId: '9' };

vi.mock('@tanstack/react-router', () => ({
  useParams: () => params,
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ personaId: 5 }),
}));

vi.mock('@/components/progreso/DashboardProgreso', () => ({
  DashboardProgreso: ({ socioId, nutricionistaId, esVistaNutricionista }: {
    socioId: number;
    nutricionistaId?: number;
    esVistaNutricionista?: boolean;
  }) => (
    <div>
      Dashboard socio {socioId} nutri {nutricionistaId} vista {String(esVistaNutricionista)}
    </div>
  ),
}));

describe('ProgresoPacientePage', () => {
  it('obtiene el socioId desde useParams', () => {
    render(<ProgresoPacientePage />);

    expect(screen.getByText('Dashboard socio 9 nutri 5 vista true')).toBeInTheDocument();
  });

  it('muestra error cuando el parametro no es valido', () => {
    params.socioId = 'no-valido';

    render(<ProgresoPacientePage />);

    expect(screen.getByText(/No se pudo identificar al paciente/i)).toBeInTheDocument();

    params.socioId = '9';
  });
});
