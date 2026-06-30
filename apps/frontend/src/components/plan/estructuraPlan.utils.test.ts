import { describe, expect, it } from 'vitest';
import { estructuraTieneContenido } from './estructuraPlan.utils';
import type { EstructuraDiaFE } from '@/types/ia';

describe('estructuraTieneContenido', () => {
  it('devuelve false cuando todos los slots estan vacios', () => {
    const estructura = [
      {
        dia: 'LUNES',
        comidas: [
          { tipo: 'DESAYUNO', alternativas: [] },
          { tipo: 'ALMUERZO', alternativas: [] },
        ],
      },
    ] as EstructuraDiaFE[];

    expect(estructuraTieneContenido(estructura)).toBe(false);
  });

  it('devuelve true cuando el payload que se va a persistir tiene una alternativa', () => {
    const estructura = [
      {
        dia: 'MIERCOLES',
        comidas: [
          {
            tipo: 'DESAYUNO',
            alternativas: [
              {
                nombre: 'Avena con banana',
                alimentos: [{ alimentoId: 1, cantidad: 50, unidad: 'g' }],
                calorias: 250,
                proteinas: 10,
                carbohidratos: 35,
                grasas: 5,
              },
            ],
          },
        ],
      },
    ] as EstructuraDiaFE[];

    expect(estructuraTieneContenido(estructura)).toBe(true);
  });
});
