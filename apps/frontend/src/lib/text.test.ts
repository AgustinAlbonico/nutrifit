import { describe, it, expect } from 'vitest';
import { normalizarTexto } from './text';

describe('normalizarTexto', () => {
  it('convierte a minusculas', () => {
    expect(normalizarTexto('JOSE PEREZ')).toBe('jose perez');
  });

  it('remueve tildes en vocales', () => {
    expect(normalizarTexto('José')).toBe('jose');
    expect(normalizarTexto('María')).toBe('maria');
    expect(normalizarTexto('Ángel')).toBe('angel');
  });

  it('mapea la enie a n', () => {
    expect(normalizarTexto('Nuñez')).toBe('nunez');
    expect(normalizarTexto('MUÑOZ')).toBe('munoz');
  });

  it('recorta espacios al inicio y final', () => {
    expect(normalizarTexto('  jose perez  ')).toBe('jose perez');
  });

  it('retorna string vacio si el input es vacio o solo espacios', () => {
    expect(normalizarTexto('')).toBe('');
    expect(normalizarTexto('   ')).toBe('');
  });

  it('remueve diacriticos y mayusculas en una sola pasada', () => {
    expect(normalizarTexto('ÁÉÍÓÚáéíóúñÑ')).toBe('aeiouaeiounn');
  });

  it('busca con y sin tildes indistintamente (caso de uso principal)', () => {
    const termino = normalizarTexto('Jose');
    const nombre = normalizarTexto('José Pérez');
    expect(nombre.includes(termino)).toBe(true);
  });
});
