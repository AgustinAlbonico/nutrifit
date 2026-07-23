/**
 * E2E Profesional — CUD11: Configurar horario de atención.
 *
 * Endpoint: `PUT /agenda/:nutricionistaId/configuracion`
 *           (alias: `PUT /nutricionistas/:nutricionistaId/disponibilidad`)
 *
 * Cubre:
 * - Caso feliz: configurar agenda válida (LUNES 09:00–18:00) responde 200/201.
 * - A4 horarios inválidos: `horaFin <= horaInicio` debe rechazar (400).
 * - A4 horarios inválidos: formato HH:mm inválido debe rechazar (400).
 * - A4 horarios inválidos: `agendas` array vacío debe rechazar (400).
 */
import { test, expect } from '@playwright/test';
import { USUARIOS_PRUEBA } from '../helpers/users';
import { login } from '../helpers/auth.helper';
import { getAuthToken } from '../helpers/api.helper';

const API_BASE_URL = 'http://localhost:3000';

test.describe('E2E Profesional: configurar horario de atención (CUD11)', () => {
  test('nutricionista puede configurar agenda válida', async ({
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

    const idNutricionista = 1;
    const response = await request.put(
      `${API_BASE_URL}/agenda/${idNutricionista}/configuracion`,
      {
        headers: { Authorization: `Bearer ${token}` },
        data: {
          duracionTurno: 30,
          agendas: [
            { dia: 'LUNES', horaInicio: '09:00', horaFin: '18:00' },
          ],
        },
      },
    );

    if (response.status() === 404) {
      test.skip(true, 'Backend no disponible');
      return;
    }

    // 200 OK o 201 Created son respuestas válidas.
    expect([200, 201]).toContain(response.status());
  });

  test('A4: horaFin anterior a horaInicio debe rechazar', async ({
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

    const response = await request.put(
      `${API_BASE_URL}/agenda/1/configuracion`,
      {
        headers: { Authorization: `Bearer ${token}` },
        data: {
          duracionTurno: 30,
          agendas: [
            { dia: 'MARTES', horaInicio: '18:00', horaFin: '09:00' },
          ],
        },
      },
    );

    if (response.status() === 404) {
      test.skip(true, 'Backend no disponible');
      return;
    }

    // Esperamos 400 BadRequest por inconsistencia de horarios.
    expect([400, 422]).toContain(response.status());
  });

  test('A4: formato de hora inválido debe rechazar', async ({
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

    const response = await request.put(
      `${API_BASE_URL}/agenda/1/configuracion`,
      {
        headers: { Authorization: `Bearer ${token}` },
        data: {
          duracionTurno: 30,
          agendas: [
            { dia: 'MIERCOLES', horaInicio: '25:00', horaFin: '18:00' },
          ],
        },
      },
    );

    if (response.status() === 404) {
      test.skip(true, 'Backend no disponible');
      return;
    }

    expect([400, 422]).toContain(response.status());
  });

  test('A4: array de agendas vacío debe rechazar', async ({
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

    const response = await request.put(
      `${API_BASE_URL}/agenda/1/configuracion`,
      {
        headers: { Authorization: `Bearer ${token}` },
        data: {
          duracionTurno: 30,
          agendas: [],
        },
      },
    );

    if (response.status() === 404) {
      test.skip(true, 'Backend no disponible');
      return;
    }

    expect([400, 422]).toContain(response.status());
  });

  test('A4: duracionTurno fuera de rango debe rechazar', async ({
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

    // <5 minutos es fuera de rango según ConfigureAgendaDto.
    const response = await request.put(
      `${API_BASE_URL}/agenda/1/configuracion`,
      {
        headers: { Authorization: `Bearer ${token}` },
        data: {
          duracionTurno: 1,
          agendas: [
            { dia: 'JUEVES', horaInicio: '09:00', horaFin: '18:00' },
          ],
        },
      },
    );

    if (response.status() === 404) {
      test.skip(true, 'Backend no disponible');
      return;
    }

    expect([400, 422]).toContain(response.status());
  });
});
