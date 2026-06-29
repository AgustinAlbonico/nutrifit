import { describe, it, expect } from 'vitest';

import { derivarEstadoPlan } from './estado-plan.types';

describe('derivarEstadoPlan', () => {
  it('devuelve BORRADOR cuando el plan no está activo', () => {
    expect(
      derivarEstadoPlan({ activo: false, finalizadoAt: null }),
    ).toBe('BORRADOR');
  });

  it('devuelve BORRADOR aunque finalizadoAt venga seteado y activo=false', () => {
    expect(
      derivarEstadoPlan({
        activo: false,
        finalizadoAt: '2026-06-15T10:00:00.000Z',
      }),
    ).toBe('BORRADOR');
  });

  it('devuelve ACTIVO cuando el plan está activo y nunca finalizado', () => {
    expect(
      derivarEstadoPlan({ activo: true, finalizadoAt: null }),
    ).toBe('ACTIVO');
  });

  it('devuelve FINALIZADO cuando el plan está activo y tiene finalizadoAt', () => {
    expect(
      derivarEstadoPlan({
        activo: true,
        finalizadoAt: '2026-06-15T10:00:00.000Z',
      }),
    ).toBe('FINALIZADO');
  });

  it('acepta finalizadoAt como Date o string', () => {
    expect(
      derivarEstadoPlan({
        activo: true,
        finalizadoAt: new Date('2026-06-15T10:00:00Z'),
      }),
    ).toBe('FINALIZADO');
  });
});
