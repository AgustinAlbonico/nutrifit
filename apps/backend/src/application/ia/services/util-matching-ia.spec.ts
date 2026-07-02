import {
  normalizarTexto,
  obtenerClavesBusquedaAlimento,
  coincidenciaFuzzy,
} from './util-matching-ia';

describe('util-matching-ia', () => {
  describe('normalizarTexto', () => {
    it('debe remover acentos y pasar a minúsculas', () => {
      expect(normalizarTexto('Café')).toBe('cafe');
      expect(normalizarTexto('Árbol')).toBe('arbol');
      expect(normalizarTexto('Pecho')).toBe('pecho');
    });

    it('debe trimspaces', () => {
      expect(normalizarTexto('  Hola  ')).toBe('hola');
    });

    it('debe manejar texto plano', () => {
      expect(normalizarTexto('POLLO')).toBe('pollo');
      expect(normalizarTexto('arroz blanco')).toBe('arroz blanco');
    });
  });

  describe('obtenerClavesBusquedaAlimento', () => {
    it('debe retornar clave singularizada sin s', () => {
      const claves = obtenerClavesBusquedaAlimento('Papas');
      expect(claves).toContain('papas');
      expect(claves).toContain('papa');
    });

    it('debe manejar sinónimos', () => {
      const clavesPlatanos = obtenerClavesBusquedaAlimento('Platanos');
      expect(clavesPlatanos).toContain('platano');
      expect(clavesPlatanos).toContain('banana');
    });

    it('debe manejar plural en es', () => {
      const claves = obtenerClavesBusquedaAlimento('Naranjas');
      expect(claves).toContain('naranja');
      expect(claves).toContain('naranjas');
    });

    it('debe retornar array vacío para string vacío', () => {
      expect(obtenerClavesBusquedaAlimento('')).toEqual([]);
    });
  });

  describe('coincidenciaFuzzy', () => {
    it('debe retornar 1 para strings idénticos', () => {
      expect(coincidenciaFuzzy('pollo', 'pollo')).toBe(1);
      expect(coincidenciaFuzzy('POLLO', 'pollo')).toBe(1);
    });

    it('debe retornar 1 para mismo texto con mayúsculas distintas', () => {
      expect(coincidenciaFuzzy('Pechuga de Pollo', 'pechuga de pollo')).toBe(1);
    });

    it('debe retornar 0 para strings sin tokens compartidos', () => {
      expect(coincidenciaFuzzy('pollo', 'arroz')).toBe(0);
    });

    it('debe manejar palabras parciales', () => {
      const score = coincidenciaFuzzy('pechuga de pollo', 'pechuga pollo');
      expect(score).toBeGreaterThan(0.5);
    });

    it('debe ser simétrico', () => {
      const score1 = coincidenciaFuzzy('pan integral', 'pan blanco');
      const score2 = coincidenciaFuzzy('pan blanco', 'pan integral');
      expect(score1).toBe(score2);
    });

    it('debe retornar 0 para strings vacíos', () => {
      expect(coincidenciaFuzzy('', '')).toBe(0);
    });
  });
});
