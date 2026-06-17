import { normalizarTexto } from './text.util';

describe('normalizarTexto', () => {
  it('convierte a minusculas', () => {
    expect(normalizarTexto('JOSE PEREZ')).toBe('jose perez');
  });

  it('remueve tildes en vocales', () => {
    expect(normalizarTexto('José')).toBe('jose');
    expect(normalizarTexto('María')).toBe('maria');
    expect(normalizarTexto('Ángel')).toBe('angel');
    expect(normalizarTexto('Müller')).toBe('muller');
  });

  it('mapea la enie a n', () => {
    expect(normalizarTexto('Nuñez')).toBe('nunez');
    expect(normalizarTexto('MUÑOZ')).toBe('munoz');
  });

  it('ignora acentos aunque el termino venga sin tildes (caso simetrico)', () => {
    expect(normalizarTexto('jose')).toBe('jose');
    expect(normalizarTexto('maría')).toBe('maria');
    expect(normalizarTexto('marIA')).toBe('maria');
  });

  it('recorta espacios al inicio y final', () => {
    expect(normalizarTexto('  jose perez  ')).toBe('jose perez');
  });

  it('retorna string vacio si el input es vacio o solo espacios', () => {
    expect(normalizarTexto('')).toBe('');
    expect(normalizarTexto('   ')).toBe('');
  });

  it('preserva la ñ si el input ya la tiene en su forma simple n (no convierte al reves)', () => {
    // n no se convierte en ñ, solo ñ -> n
    expect(normalizarTexto('nunca')).toBe('nunca');
    expect(normalizarTexto('ñandu')).toBe('nandu');
  });

  it('remueve multiples diacriticos en una sola cadena', () => {
    expect(normalizarTexto('ÁÉÍÓÚáéíóúñÑ')).toBe('aeiouaeiounn');
  });
});
