import { execFileSync } from 'child_process';
import { join } from 'path';

describe('grupos-permisos.data', () => {
  it('PROFESIONAL incluye NUTRICIONISTAS_EDITAR y NUTRICIONISTAS_VER', () => {
    const tsNodeRegister = require.resolve('ts-node/register');
    const tsconfigPathsRegister = require.resolve('tsconfig-paths/register');

    const dataSource = join(__dirname, 'grupos-permisos.data.ts');

    const salida = execFileSync(
      process.execPath,
      [
        '-r',
        tsNodeRegister,
        '-r',
        tsconfigPathsRegister,
        '-e',
        `const { GRUPOS_PERMISOS } = require(${JSON.stringify(dataSource)});
         const p = GRUPOS_PERMISOS.PROFESIONAL;
         if (!p) process.exit(2);
         process.stdout.write(JSON.stringify(p.acciones));`,
      ],
      {
        cwd: process.cwd(),
        encoding: 'utf8',
      },
    );

    const acciones = JSON.parse(salida.trim());
    expect(acciones).toEqual(
      expect.arrayContaining(['nutricionistas.editar', 'nutricionistas.ver']),
    );
  });
});
