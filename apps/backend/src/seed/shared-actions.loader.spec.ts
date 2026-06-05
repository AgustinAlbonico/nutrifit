import { execFileSync } from 'child_process';

describe('shared-actions.loader', () => {
  it('debe resolver @nutrifit/shared con ts-node + tsconfig-paths', () => {
    const tsNodeRegister = require.resolve('ts-node/register');
    const tsconfigPathsRegister = require.resolve('tsconfig-paths/register');

    const salida = execFileSync(
      process.execPath,
      [
        '-r',
        tsNodeRegister,
        '-r',
        tsconfigPathsRegister,
        '-e',
        "const { TODAS_LAS_ACCIONES } = require('@nutrifit/shared'); console.log(TODAS_LAS_ACCIONES.includes('socios.crear'), TODAS_LAS_ACCIONES.length);",
      ],
      {
        cwd: process.cwd(),
        encoding: 'utf8',
      },
    );

    expect(salida).toContain('true');
  });
});
