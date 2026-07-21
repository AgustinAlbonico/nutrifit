import { stripAccentsLowerSql } from './sql-text.util';

describe('stripAccentsLowerSql', () => {
  it('envuelve la columna en una cadena de REPLACE para los acentos del espanol', () => {
    const sql = stripAccentsLowerSql('LOWER(col)');
    expect(sql).toContain('LOWER(col)');
    expect(sql).toContain('REPLACE(');
    expect(sql).toContain("'á', 'a'");
    expect(sql).toContain("'é', 'e'");
    expect(sql).toContain("'í', 'i'");
    expect(sql).toContain("'ó', 'o'");
    expect(sql).toContain("'ú', 'u'");
    expect(sql).toContain("'ñ', 'n'");
  });

  it('anida los REPLACE en orden (cada llamada envuelve a la anterior)', () => {
    const sql = stripAccentsLowerSql('LOWER(socio.nombre)');
    // Debe haber 7 REPLACE anidados (á, é, í, ó, ú, ü, ñ)
    const matches = sql.match(/REPLACE\(/g) ?? [];
    expect(matches).toHaveLength(7);
  });

  it('preserva la expresion de la columna como punto de partida', () => {
    const sql = stripAccentsLowerSql('LOWER(persona.apellido)');
    // La columna original debe quedar embebida en el primer REPLACE
    // y no debe haber sido alterada: tiene que aparecer literal
    // entre la primera REPLACE y la primera coma.
    expect(sql).toMatch(/^REPLACE\([^,]*LOWER\(persona\.apellido\)[^,]*,/);
  });

  it('funciona con cualquier expresion SQL que devuelva un string', () => {
    const sql = stripAccentsLowerSql('LOWER(COALESCE(alimento.nombre, ""))');
    expect(sql).toContain('LOWER(COALESCE(alimento.nombre, ""))');
    expect(sql).toContain("'á', 'a'");
  });
});
