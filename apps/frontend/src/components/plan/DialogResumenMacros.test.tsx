import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { DialogResumenMacros } from '@/components/plan/DialogResumenMacros';
import type { EstructuraDiaFE } from '@/types/ia';

describe('DialogResumenMacros', () => {
  const estructuraVacia: EstructuraDiaFE[] = [
    {
      dia: 'LUNES',
      comidas: [
        {
          tipo: 'DESAYUNO',
          alternativas: [],
        },
      ],
    },
  ];

  it('muestra kcal/p/c/g totales en cero cuando estructura está vacía', () => {
    render(<DialogResumenMacros estructura={estructuraVacia} />);

    const card = screen.getByTestId('resumen-macros-sticky');
    expect(card).toBeInTheDocument();
    expect(card).toHaveTextContent(/0\s+kcal/);
    expect(card).toHaveTextContent(/P 0g · C 0g · G 0g/);
  });

  it('suma correctamente macros con una alternativa', () => {
    const estructura: EstructuraDiaFE[] = [
      {
        dia: 'LUNES',
        comidas: [
          {
            tipo: 'DESAYUNO',
            alternativas: [
              {
                nombre: 'Tostadas con huevo',
                alimentos: [{ alimentoId: 1, cantidad: 100, unidad: 'g' }],
                calorias: 350,
                proteinas: 20,
                carbohidratos: 30,
                grasas: 15,
              },
            ],
          },
        ],
      },
    ];

    render(<DialogResumenMacros estructura={estructura} />);

    const card = screen.getByTestId('resumen-macros-sticky');
    expect(card).toHaveTextContent(/350\s+kcal/);
    expect(card).toHaveTextContent(/P 20g · C 30g · G 15g/);
  });

  it('suma correctamente macros con varias alternativas de varios días', () => {
    const estructura: EstructuraDiaFE[] = [
      {
        dia: 'LUNES',
        comidas: [
          {
            tipo: 'DESAYUNO',
            alternativas: [
              {
                nombre: 'Tostadas',
                alimentos: [{ alimentoId: 1, cantidad: 100, unidad: 'g' }],
                calorias: 300,
                proteinas: 10,
                carbohidratos: 40,
                grasas: 8,
              },
            ],
          },
          {
            tipo: 'ALMUERZO',
            alternativas: [
              {
                nombre: 'Pollo con arroz',
                alimentos: [{ alimentoId: 2, cantidad: 200, unidad: 'g' }],
                calorias: 600,
                proteinas: 50,
                carbohidratos: 60,
                grasas: 20,
              },
            ],
          },
        ],
      },
      {
        dia: 'MARTES',
        comidas: [
          {
            tipo: 'CENA',
            alternativas: [
              {
                nombre: 'Pescado',
                alimentos: [{ alimentoId: 3, cantidad: 150, unidad: 'g' }],
                calorias: 250,
                proteinas: 35,
                carbohidratos: 10,
                grasas: 12,
              },
            ],
          },
        ],
      },
    ];

    render(<DialogResumenMacros estructura={estructura} />);

    // 300 + 600 + 250 = 1150 kcal
    // 10 + 50 + 35 = 95 proteinas
    // 40 + 60 + 10 = 110 carbohidratos
    // 8 + 20 + 12 = 40 grasas
    const card = screen.getByTestId('resumen-macros-sticky');
    expect(card).toHaveTextContent(/1150\s+kcal/);
    expect(card).toHaveTextContent(/P 95g · C 110g · G 40g/);
  });

  it('muestra banda VERDE cuando las kcal están dentro del ±5% del objetivo', () => {
    const estructura: EstructuraDiaFE[] = [
      {
        dia: 'LUNES',
        comidas: [
          {
            tipo: 'DESAYUNO',
            alternativas: [
              {
                nombre: 'Test',
                alimentos: [{ alimentoId: 1, cantidad: 100, unidad: 'g' }],
                calorias: 1950,
                proteinas: 100,
                carbohidratos: 200,
                grasas: 80,
              },
            ],
          },
        ],
      },
    ];

    render(<DialogResumenMacros estructura={estructura} objetivoKcal={2000} />);

    const badge = screen.getByTestId('macros-badge');
    expect(badge).toHaveAttribute('data-banda', 'VERDE');
  });

  it('muestra banda AMARILLO cuando el desvío está entre 5% y 10%', () => {
    const estructura: EstructuraDiaFE[] = [
      {
        dia: 'LUNES',
        comidas: [
          {
            tipo: 'DESAYUNO',
            alternativas: [
              {
                nombre: 'Test',
                alimentos: [{ alimentoId: 1, cantidad: 100, unidad: 'g' }],
                calorias: 2200,
                proteinas: 100,
                carbohidratos: 200,
                grasas: 80,
              },
            ],
          },
        ],
      },
    ];

    render(<DialogResumenMacros estructura={estructura} objetivoKcal={2000} />);

    const badge = screen.getByTestId('macros-badge');
    expect(badge).toHaveAttribute('data-banda', 'AMARILLO');
  });

  it('muestra banda ROJO cuando el desvío supera el 10%', () => {
    const estructura: EstructuraDiaFE[] = [
      {
        dia: 'LUNES',
        comidas: [
          {
            tipo: 'DESAYUNO',
            alternativas: [
              {
                nombre: 'Test',
                alimentos: [{ alimentoId: 1, cantidad: 100, unidad: 'g' }],
                calorias: 2500,
                proteinas: 100,
                carbohidratos: 200,
                grasas: 80,
              },
            ],
          },
        ],
      },
    ];

    render(<DialogResumenMacros estructura={estructura} objetivoKcal={2000} />);

    const badge = screen.getByTestId('macros-badge');
    expect(badge).toHaveAttribute('data-banda', 'ROJO');
  });
});
