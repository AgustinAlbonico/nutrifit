import * as fs from 'node:fs';
import * as path from 'node:path';

/**
 * Regression test: el controller de planes NO debe enviar `user.personaId`
 * (id_persona) a use cases que validan ownership comparando contra
 * `plan.nutricionista.usuario.idUsuario` (id_usuario).
 *
 * Bug original: el controller enviaba `user.personaId ?? 0` y
 * `user.personaId ?? null` a los use cases de `GuardarVersionPlanUseCase`,
 * `ActivarPlanAlimentacionUseCase`, `FinalizarPlanAlimentacionUseCase` y
 * `PersistirPlanManualUseCase`, lo que causaba que la validacion
 * "Solo el nutricionista responsable del plan puede..." fallara SIEMPRE
 * para el dueno legitimo del plan porque id_persona != id_usuario.
 *
 * Si este test falla, el bug regreso.
 */
describe('PlanAlimentacionController — uso de user.id vs user.personaId', () => {
  const rutaController = path.resolve(
    __dirname,
    './planes-alimentacion.controller.ts',
  );

  function leerController(): string {
    return fs.readFileSync(rutaController, 'utf8');
  }

  it('el controller NO contiene `user.personaId ?? 0` (patron del bug)', () => {
    const fuente = leerController();
    expect(fuente).not.toMatch(/user\.personaId\s*\?\?\s*0/);
  });

  it('el controller NO contiene `user.personaId ?? null` (patron del bug)', () => {
    const fuente = leerController();
    expect(fuente).not.toMatch(/user\.personaId\s*\?\?\s*null/);
  });

  it('los logs de los endpoints NO usan `${user.personaId}` (deben usar user.id)', () => {
    const fuente = leerController();
    const logConPersonaId = /\$\{user\.personaId\}/g;
    const matches = fuente.match(logConPersonaId);
    expect(matches).toBeNull();
  });

  it('los endpoints de activar/finalizar pasan nutricionistaUserId: user.id', () => {
    const fuente = leerController();

    expect(fuente).toMatch(/activarPlanAlimentacionUseCase\.execute\(\{[\s\S]*?nutricionistaUserId:\s*user\.id/);
    expect(fuente).toMatch(/finalizarPlanAlimentacionUseCase\.execute\(\{[\s\S]*?nutricionistaUserId:\s*user\.id/);
    expect(fuente).toMatch(/guardarVersionPlanUseCase\.execute\(\{[\s\S]*?nutricionistaUserId:\s*user\.id/);
  });

  it('persistirManual usa user.id como primer argumento del use case', () => {
    const fuente = leerController();

    const regexMetodo = /async\s+persistirManual\b[\s\S]*?\n  \}/m;
    const bloque = fuente.match(regexMetodo);
    if (!bloque) {
      throw new Error('No se encontro el metodo persistirManual.');
    }
    const texto = bloque[0];

    expect(texto).toMatch(/persistirPlanManualUseCase\.execute\(\s*\n\s*user\.id/);
    expect(texto).not.toMatch(/persistirPlanManualUseCase\.execute\(\s*\n\s*user\.personaId/);
  });

  it('endpoints NO afectados siguen usando @CurrentUserId (regresion de patron)', () => {
    const fuente = leerController();

    const endpointsInalterados = [
      'crearPlan',
      'crearPlanManual',
      'editarPlan',
      'eliminarPlan',
      'vaciarContenidoPlan',
    ];

    endpointsInalterados.forEach((nombreMetodo) => {
      const regexMetodo = new RegExp(
        `async\\s+${nombreMetodo}\\b[\\s\\S]*?\\n  \\}`,
        'm',
      );
      const bloque = fuente.match(regexMetodo);
      if (!bloque) {
        throw new Error(`No se encontro el metodo ${nombreMetodo}.`);
      }
      expect(bloque[0]).toMatch(/@CurrentUserId\(\)/);
    });
  });
});
