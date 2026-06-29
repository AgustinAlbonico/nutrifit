import { describe, it, expect } from 'vitest';

import { traducirErrorApi } from './error-messages';

describe('traducirErrorApi', () => {
  it('devuelve un mensaje neutro cuando el error es null o undefined', () => {
    expect(traducirErrorApi(null).titulo).toBe('Algo salió mal');
    expect(traducirErrorApi(undefined).titulo).toBe('Algo salió mal');
  });

  it('reconoce timeout / groq_timeout y devuelve mensaje de IA sobrecargada', () => {
    expect(traducirErrorApi(new Error('groq_timeout')).titulo).toBe(
      'La IA está sobrecargada',
    );
    expect(traducirErrorApi(new Error('request timeout')).titulo).toBe(
      'La IA está sobrecargada',
    );
  });

  it('reconoce error interno del servidor', () => {
    expect(
      traducirErrorApi(new Error('Error interno del servidor')).titulo,
    ).toBe('No pudimos generar el plan');
  });

  it('reconoce forbidden / 403', () => {
    expect(traducirErrorApi(new Error('forbidden')).titulo).toBe(
      'No tenés permisos para esto',
    );
    expect(traducirErrorApi(new Error('403')).titulo).toBe(
      'No tenés permisos para esto',
    );
  });

  it('reconoce 404 / not_found', () => {
    expect(
      traducirErrorApi(new Error('Socio no encontrado')).titulo,
    ).toBe('No se encontró el recurso');
  });

  it('reconoce JSON inválido de IA', () => {
    expect(
      traducirErrorApi(new Error('groq_invalid_json')).titulo,
    ).toBe('La IA devolvió un formato inesperado');
  });

  it('reconoce error de estructura de plan', () => {
    expect(
      traducirErrorApi(
        new Error('PLAN_ESTRUCTURA_INVALIDA: faltan comidas'),
      ).titulo,
    ).toBe('La IA no respetó la estructura solicitada');
  });

  it('si no matchea ningún patrón, devuelve mensaje del backend como descripción', () => {
    const mensaje = traducirErrorApi(
      new Error('Detalle técnico raro del servidor'),
    );
    expect(mensaje.titulo).toBe('Algo salió mal');
    expect(mensaje.descripcion).toBe('Detalle técnico raro del servidor');
  });

  it('acepta strings directamente', () => {
    expect(traducirErrorApi('timeout').titulo).toBe('La IA está sobrecargada');
  });
});
