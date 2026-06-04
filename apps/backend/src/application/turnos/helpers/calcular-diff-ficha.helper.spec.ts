import { calcularDiffFicha } from './calcular-diff-ficha.helper';

/**
 * Spec del helper puro `calcularDiffFicha`. Cubre los 4 casos del
 * design §6 / Task 1.19.
 */
describe('calcularDiffFicha', () => {
  it('retorna array vacío si antes y después son iguales', () => {
    const snapshot = { altura: 175, peso: 80, nivel: 'MODERADO' };
    expect(calcularDiffFicha(snapshot, { ...snapshot })).toEqual([]);
  });

  it('detecta un cambio simple en peso', () => {
    const antes = { altura: 175, peso: 80 };
    const despues = { altura: 175, peso: 78 };
    expect(calcularDiffFicha(antes, despues)).toEqual(['peso']);
  });

  it('detecta cambios múltiples (peso y altura)', () => {
    const antes = { altura: 175, peso: 80, nivel: 'MODERADO' };
    const despues = { altura: 176, peso: 78, nivel: 'MODERADO' };
    expect(calcularDiffFicha(antes, despues)).toEqual(['altura', 'peso']);
  });

  it('retorna vacío si antes es null', () => {
    expect(calcularDiffFicha(null, { altura: 175 })).toEqual([]);
  });

  it('retorna vacío si después es null', () => {
    expect(calcularDiffFicha({ altura: 175 }, null)).toEqual([]);
  });

  it('no reporta campos vacíos en después (null/undefined/empty string)', () => {
    const antes = { altura: 175, peso: 80, objetivo: 'X' };
    const despues = { altura: 175, peso: 80, objetivo: '' };
    expect(calcularDiffFicha(antes, despues)).toEqual([]);
  });

  it('detecta cambio en arrays de strings (referencia distinta)', () => {
    const antes = { alergias: ['polvo'] };
    const despues = { alergias: ['polvo', 'maní'] };
    expect(calcularDiffFicha(antes, despues)).toEqual(['alergias']);
  });

  it('no detecta cambio si los arrays tienen mismos elementos', () => {
    const antes = { alergias: ['polvo', 'maní'] };
    const despues = { alergias: ['polvo', 'maní'] };
    expect(calcularDiffFicha(antes, despues)).toEqual([]);
  });

  it('helper es 100% puro (sin imports de NestJS o TypeORM)', () => {
    // Verificación estática: el archivo no debe tener imports de frameworks
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const fs = require('fs');
    const path = require('path');
    const filePath = path.join(__dirname, 'calcular-diff-ficha.helper.ts');
    const contenido = fs.readFileSync(filePath, 'utf8');
    expect(contenido).not.toMatch(/from\s+['"]@nestjs/);
    expect(contenido).not.toMatch(/from\s+['"]typeorm/);
  });
});
