import { sanitizarTextoPlano } from './sanitizador-texto-plano';

describe('sanitizarTextoPlano', () => {
  describe('casos básicos', () => {
    it('retorna texto vacío para string vacío', () => {
      const resultado = sanitizarTextoPlano('');
      expect(resultado.texto).toBe('');
      expect(resultado.huboCambios).toBe(false);
    });

    it('no modifica texto limpio sin caracteres especiales', () => {
      const texto = 'Pollo a la plancha con verduras';
      const resultado = sanitizarTextoPlano(texto);
      expect(resultado.texto).toBe(texto);
      expect(resultado.huboCambios).toBe(false);
    });

    it('trim de espacios al inicio y al final', () => {
      const resultado = sanitizarTextoPlano('   texto con espacios   ');
      expect(resultado.texto).toBe('texto con espacios');
      expect(resultado.huboCambios).toBe(true);
    });

    it('preserva saltos de línea simples', () => {
      const texto = 'línea 1\nlínea 2';
      const resultado = sanitizarTextoPlano(texto);
      expect(resultado.texto).toBe(texto);
    });

    it('preserva exactamente 2 saltos de línea consecutivos', () => {
      const texto = 'párrafo 1\n\npárrafo 2';
      const resultado = sanitizarTextoPlano(texto);
      expect(resultado.texto).toBe(texto);
    });
  });

  describe('colapso de saltos de línea múltiples', () => {
    it('colapsa 3+ saltos de línea a exactamente 2', () => {
      const texto = 'línea 1\n\n\n\nlínea 2';
      const resultado = sanitizarTextoPlano(texto);
      expect(resultado.texto).toBe('línea 1\n\nlínea 2');
      expect(resultado.huboCambios).toBe(true);
    });

    it('colapsa muchos saltos consecutivos', () => {
      const texto = 'a\n\n\n\n\n\n\nb';
      const resultado = sanitizarTextoPlano(texto);
      expect(resultado.texto).toBe('a\n\nb');
    });

    it('mantiene múltiples bloques de 2 saltos como separadores', () => {
      const texto = 'a\n\nb\n\n\n\nc\n\nd';
      const resultado = sanitizarTextoPlano(texto);
      expect(resultado.texto).toBe('a\n\nb\n\nc\n\nd');
    });
  });

  describe('remoción de HTML/scripts (XSS)', () => {
    it('remueve tags <script>', () => {
      const texto = "<script>alert('xss')</script>Pollo";
      const resultado = sanitizarTextoPlano(texto);
      expect(resultado.texto).toBe("alert('xss')Pollo");
      expect(resultado.huboCambios).toBe(true);
    });

    it('remueve tags con atributos', () => {
      const texto = '<img src="x" onerror="alert(1)">Imagen';
      const resultado = sanitizarTextoPlano(texto);
      expect(resultado.texto).toBe('Imagen');
    });

    it('remueve tags anidados', () => {
      const texto = '<div><p>Hola <strong>mundo</strong></p></div>';
      const resultado = sanitizarTextoPlano(texto);
      expect(resultado.texto).toBe('Hola mundo');
    });

    it('remueve tags sin cierre válido', () => {
      const texto = '<br>salto';
      const resultado = sanitizarTextoPlano(texto);
      expect(resultado.texto).toBe('salto');
    });
  });

  describe('remoción de markdown inyectable', () => {
    it('remueve code inline (backticks)', () => {
      const texto = 'Usar `console.log` para debug';
      const resultado = sanitizarTextoPlano(texto);
      expect(resultado.texto).toBe('Usar console.log para debug');
    });

    it('remueve bold (**)', () => {
      const texto = 'Texto **importante**';
      const resultado = sanitizarTextoPlano(texto);
      expect(resultado.texto).toBe('Texto importante');
    });

    it('remueve strikethrough (~~)', () => {
      const texto = 'Texto ~~tachado~~';
      const resultado = sanitizarTextoPlano(texto);
      expect(resultado.texto).toBe('Texto tachado');
    });
  });

  describe('casos combinados', () => {
    it('aplica todas las reglas en orden', () => {
      const texto =
        '   <script>alert(1)</script>Priorizar **proteínas** de alto valor\n\n\n\nbiológico   ';
      const resultado = sanitizarTextoPlano(texto);
      expect(resultado.texto).toBe(
        'alert(1)Priorizar proteínas de alto valor\n\nbiológico',
      );
    });

    it('maneja texto con HTML, markdown y saltos múltiples', () => {
      const texto = '<div>**Nota:**</div>\n\n\n\nUsar `console.log`\n\n\n\nFin';
      const resultado = sanitizarTextoPlano(texto);
      expect(resultado.texto).toBe('Nota:\n\nUsar console.log\n\nFin');
    });
  });
});
