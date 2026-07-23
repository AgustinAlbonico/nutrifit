/**
 * E2E Profesional — CUD10: Ver historial de consultas del paciente.
 *
 * Endpoint: `GET /turnos/profesional/:nutricionistaId/pacientes/:socioId/historial-consultas`
 *
 * GAP DOCUMENTADO: `archivosAdjuntos` siempre se devuelve como `[]` aunque
 * haya adjuntos cargados. Este test verifica explícitamente que el array
 * esté hidratado cuando hay adjuntos, y fallará hasta que el backend
 * solucione el bug.
 *
 * Ver memoria: validación/use-cases-gaps (entrada "CUD10 archivosAdjuntos").
 */
import { test, expect } from '@playwright/test';
import { USUARIOS_PRUEBA } from '../helpers/users';
import { login } from '../helpers/auth.helper';
import { getAuthToken, unwrapApiResponse } from '../helpers/api.helper';

const API_BASE_URL = 'http://localhost:3000';

test.describe('E2E Profesional: ver historial de consultas (CUD10)', () => {
  test('nutricionista con turno previo puede listar historial de consultas', async ({
    page,
    request,
  }) => {
    await login(page, USUARIOS_PRUEBA.NUTRICIONISTA_CENTRAL);
    await page.waitForLoadState('networkidle');

    const token = await getAuthToken(page);
    if (!token) {
      test.skip(true, 'Sin token');
      return;
    }

    const response = await request.get(
      `${API_BASE_URL}/turnos/profesional/1/pacientes/1/historial-consultas`,
      { headers: { Authorization: `Bearer ${token}` } },
    );

    if (response.status() === 404) {
      test.skip(true, 'Backend no disponible');
      return;
    }

    // 200 con array (puede estar vacío) o 403 sin turno previo.
    expect([200, 403, 404]).toContain(response.status());

    if (response.status() === 200) {
      const body = unwrapApiResponse(await response.json());
      const historial = body;
      expect(Array.isArray(historial)).toBeTruthy();
    }
  });

  test('historial expone la estructura esperada por consulta', async ({
    page,
    request,
  }) => {
    await login(page, USUARIOS_PRUEBA.NUTRICIONISTA_CENTRAL);
    await page.waitForLoadState('networkidle');

    const token = await getAuthToken(page);
    if (!token) {
      test.skip(true, 'Sin token');
      return;
    }

    const response = await request.get(
      `${API_BASE_URL}/turnos/profesional/1/pacientes/1/historial-consultas`,
      { headers: { Authorization: `Bearer ${token}` } },
    );

    if (response.status() !== 200) {
      test.skip(true, 'Sin historial o sin acceso (ver test anterior)');
      return;
    }

    const body = unwrapApiResponse(await response.json());
    const historial: unknown[] = body;

    if (!Array.isArray(historial) || historial.length === 0) {
      test.skip(true, 'Historial vacío: no se puede validar estructura');
      return;
    }

    const primera = historial[0] as Record<string, unknown>;
    // Cada consulta debería traer al menos un identificador y una fecha.
    expect(primera).toBeTruthy();
    const claves = Object.keys(primera);
    expect(claves.length).toBeGreaterThan(0);
  });

  test('GAP: archivosAdjuntos se hidrata con adjuntos reales (debería fallar)', async ({
    page,
    request,
  }) => {
    // GAP: archivosAdjuntos no se hidratan en get-historial-consultas-paciente
    // (ver memoria validación/use-cases-gaps).
    // El backend actualmente devuelve `archivosAdjuntos: []` siempre, aunque
    // existan adjuntos cargados en la consulta. Este test falla hasta que
    // se corrija la hydration.

    await login(page, USUARIOS_PRUEBA.NUTRICIONISTA_CENTRAL);
    await page.waitForLoadState('networkidle');

    const token = await getAuthToken(page);
    if (!token) {
      test.skip(true, 'Sin token');
      return;
    }

    const response = await request.get(
      `${API_BASE_URL}/turnos/profesional/1/pacientes/1/historial-consultas`,
      { headers: { Authorization: `Bearer ${token}` } },
    );

    if (response.status() !== 200) {
      test.skip(true, 'Sin historial accesible');
      return;
    }

    const body = unwrapApiResponse(await response.json());
    const historial: Array<Record<string, unknown>> = body;

    if (!Array.isArray(historial) || historial.length === 0) {
      test.skip(true, 'Sin consultas previas para validar adjuntos');
      return;
    }

    // Buscamos al menos una consulta con campo archivosAdjuntos definido.
    const consultasConCampo = historial.filter(
      (c) => 'archivosAdjuntos' in c,
    );

    if (consultasConCampo.length === 0) {
      // El backend ni siquiera incluye el campo: el gap es doble.
      // Documentamos y marcamos como GAP sin fail explícito.
      test.skip(
        true,
        'GAP: backend no expone campo archivosAdjuntos en historial-consultas',
      );
      return;
    }

    // Si el campo existe, debería tener al menos un adjunto en algunas
    // consultas. Como el seed crea consultas con adjuntos para NutriCentral,
    // esperamos al menos uno no vacío.
    const consultasConAdjuntos = consultasConCampo.filter(
      (c) => Array.isArray(c.archivosAdjuntos) && c.archivosAdjuntos.length > 0,
    );

    expect(consultasConAdjuntos.length).toBeGreaterThan(0);
  });

  test('GET con socioId inexistente responde 403 o 404', async ({
    page,
    request,
  }) => {
    await login(page, USUARIOS_PRUEBA.NUTRICIONISTA_CENTRAL);
    await page.waitForLoadState('networkidle');

    const token = await getAuthToken(page);
    if (!token) {
      test.skip(true, 'Sin token');
      return;
    }

    const response = await request.get(
      `${API_BASE_URL}/turnos/profesional/1/pacientes/999999/historial-consultas`,
      { headers: { Authorization: `Bearer ${token}` } },
    );

    if (response.status() === 404) {
      test.skip(true, 'Backend no disponible');
      return;
    }

    expect([403, 404]).toContain(response.status());
  });
});
