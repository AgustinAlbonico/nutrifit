import * as fs from 'node:fs';
import * as path from 'node:path';

const ACCION_PLANES_VER = 'ACCIONES.PLANES_VER';
const ACCION_ANTIGUA_INEXISTENTE = "'PLANES_IA_VERSIONES'";

/**
 * Regression test: los endpoints de versiones de plan deben exigir
 * `ACCIONES.PLANES_VER` (acción real en seed NUTRICIONISTA) y NO
 * strings literales inexistentes como `PLANES_IA_VERSIONES`.
 *
 * Lo verificamos leyendo el código fuente del controller porque algunos
 * barrels de `@nutrifit/shared` requieren compilación previa para Jest y
 * eso hace frágil importar transitivamente el controller entero.
 */
describe('PlanAlimentacionController RBAC — endpoints de versiones', () => {
  const rutaController = path.resolve(
    __dirname,
    './planes-alimentacion.controller.ts',
  );

  function leerController(): string {
    return fs.readFileSync(rutaController, 'utf8');
  }

  function extraerBloqueMetodo(fuente: string, nombreMetodo: string): string {
    const regex = new RegExp(
      `@Actions\\(([^)]*)\\)[\\s\\S]*?async\\s+${nombreMetodo}\\b`,
      'm',
    );
    const match = fuente.match(regex);
    if (!match || match[1] === undefined) {
      throw new Error(
        `No se pudo ubicar la acción @Actions del handler ${nombreMetodo}.`,
      );
    }
    return match[1];
  }

  it('listarVersiones exige ACCIONES.PLANES_VER (planes.ver)', () => {
    const fuente = leerController();
    const argumento = extraerBloqueMetodo(fuente, 'listarVersiones');

    expect(argumento).not.toContain(ACCION_ANTIGUA_INEXISTENTE);
    expect(argumento).toContain(ACCION_PLANES_VER);
  });

  it('obtenerVersion exige ACCIONES.PLANES_VER (planes.ver)', () => {
    const fuente = leerController();
    const argumento = extraerBloqueMetodo(fuente, 'obtenerVersion');

    expect(argumento).not.toContain(ACCION_ANTIGUA_INEXISTENTE);
    expect(argumento).toContain(ACCION_PLANES_VER);
  });
});
