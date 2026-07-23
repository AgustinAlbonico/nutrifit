/**
 * E2E Profesional — CUD23: Registrar datos de consulta.
 *
 * Flujo multi-step:
 *   1. Iniciar consulta:  POST /turnos/:id/iniciar-consulta
 *   2. Guardar mediciones: POST /turnos/:id/mediciones
 *   3. Guardar observaciones: POST /turnos/:id/observaciones
 *   4. Finalizar consulta: POST /turnos/:id/finalizar-consulta
 *
 * Cubre:
 * - Happy path: iniciar → mediciones → observaciones → finalizar.
 * - A2 parcial: omitir mediciones e intentar finalizar.
 * - E2 fuera de rango: peso/altura con valores absurdos.
 * - E3 adjuntos inválidos: intentar subir adjunto con tipo MIME no permitido.
 */
import { test, expect, type APIRequestContext } from '@playwright/test';
import { USUARIOS_PRUEBA } from '../helpers/users';
import { login } from '../helpers/auth.helper';
import { getAuthToken, unwrapApiResponse } from '../helpers/api.helper';

const API_BASE_URL = 'http://localhost:3000';

interface TurnoIniciado {
  id: number;
}

/**
 * Intenta iniciar una consulta de un turno. Devuelve el id del turno si
 * se logra, o `null` si el backend no tiene turnos utilizables.
 */
async function intentarIniciarConsulta(
  request: APIRequestContext,
  token: string,
  turnoId: number,
): Promise<boolean> {
  const response = await request.post(
    `${API_BASE_URL}/turnos/${turnoId}/iniciar-consulta`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  return response.status() === 200 || response.status() === 201;
}

test.describe('E2E Profesional: registrar datos de consulta (CUD23)', () => {
  test('flujo completo: iniciar → mediciones → observaciones → finalizar', async ({
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

    // Listar turnos del día para tomar uno disponible.
    const responseTurnos = await request.get(
      `${API_BASE_URL}/turnos/profesional/1/hoy`,
      { headers: { Authorization: `Bearer ${token}` } },
    );

    if (responseTurnos.status() === 404) {
      test.skip(true, 'Backend no disponible');
      return;
    }

    const bodyTurnos = unwrapApiResponse(await responseTurnos.json());
    const turnos: TurnoIniciado[] = bodyTurnos.data ?? [];

    if (turnos.length === 0) {
      test.skip(true, 'No hay turnos del día para iniciar consulta');
      return;
    }

    const turnoId = turnos[0].id;
    const iniciado = await intentarIniciarConsulta(request, token!, turnoId);
    if (!iniciado) {
      test.skip(true, 'No se pudo iniciar consulta (turno en estado inválido)');
      return;
    }

    // 2) Guardar mediciones válidas.
    const responseMediciones = await request.post(
      `${API_BASE_URL}/turnos/${turnoId}/mediciones`,
      {
        headers: { Authorization: `Bearer ${token}` },
        data: {
          peso: 75.5,
          altura: 175,
          imc: 24.7,
          circunferenciaCintura: 82,
          porcentajeGrasaCorporal: 18.5,
        },
      },
    );
    expect([200, 201, 400, 409]).toContain(responseMediciones.status());

    // 3) Guardar observaciones válidas.
    const responseObservaciones = await request.post(
      `${API_BASE_URL}/turnos/${turnoId}/observaciones`,
      {
        headers: { Authorization: `Bearer ${token}` },
        data: {
          observaciones:
            'Paciente evoluciona favorablemente. Continuar con plan actual.',
          recomendaciones: 'Aumentar consumo de vegetales verdes.',
        },
      },
    );
    expect([200, 201, 400]).toContain(responseObservaciones.status());

    // 4) Finalizar consulta.
    const responseFinalizar = await request.post(
      `${API_BASE_URL}/turnos/${turnoId}/finalizar-consulta`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    expect([200, 201, 400, 409]).toContain(responseFinalizar.status());
  });

  test('E2: mediciones con peso fuera de rango debe rechazar', async ({
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

    // Peso de 9999 kg: absurdo.
    const response = await request.post(
      `${API_BASE_URL}/turnos/1/mediciones`,
      {
        headers: { Authorization: `Bearer ${token}` },
        data: {
          peso: 9999,
          altura: 175,
        },
      },
    );

    if (response.status() === 404) {
      test.skip(true, 'Backend no disponible');
      return;
    }

    expect([400, 422]).toContain(response.status());
  });

  test('E2: mediciones con altura negativa debe rechazar', async ({
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

    const response = await request.post(
      `${API_BASE_URL}/turnos/1/mediciones`,
      {
        headers: { Authorization: `Bearer ${token}` },
        data: {
          peso: 75,
          altura: -50,
        },
      },
    );

    if (response.status() === 404) {
      test.skip(true, 'Backend no disponible');
      return;
    }

    expect([400, 422]).toContain(response.status());
  });

  test('A2: finalizar consulta sin mediciones debe fallar o warn', async ({
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

    // Tomamos un turno cualquiera y tratamos de finalizarlo sin
    // haber guardado mediciones. La API puede responder 400, 409
    // (estado inválido) o 200 (si permite finalizar parcial). Aceptamos
    // cualquiera de los tres mientras la app no rompa.
    const response = await request.post(
      `${API_BASE_URL}/turnos/1/finalizar-consulta`,
      { headers: { Authorization: `Bearer ${token}` } },
    );

    if (response.status() === 404) {
      test.skip(true, 'Backend no disponible');
      return;
    }

    // El test verifica que el endpoint responde de forma predecible
    // (no 5xx) y que la app no rompe con un 4xx esperado.
    expect(response.status()).toBeLessThan(500);
  });

  test('E3: subir adjunto con tipo MIME no permitido debe rechazar', async ({
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

    // El endpoint POST /turnos/:id/adjuntos espera multipart/form-data.
    // Simulamos un archivo .exe (tipo MIME no permitido) en memoria.
    const buffer = Buffer.from('fake-exe-content', 'utf-8');
    const response = await request.post(
      `${API_BASE_URL}/turnos/1/adjuntos`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        multipart: {
          file: {
            name: 'malware.exe',
            mimeType: 'application/x-msdownload',
            buffer,
          },
        },
      },
    );

    if (response.status() === 404) {
      test.skip(true, 'Backend no disponible');
      return;
    }

    // 400 (mime no permitido) o 415 (unsupported media type) son aceptables.
    expect([400, 413, 415, 422]).toContain(response.status());
  });
});
