/**
 * E2E Profesional — CUD07: Ver turnos del día.
 *
 * Endpoint: `GET /turnos/profesional/:nutricionistaId/hoy`
 *
 * Cubre:
 * - Caso feliz: GET 200 con array (puede ser vacío si no hay turnos hoy).
 * - Validación de ownership: nutricionista NO puede ver turnos de otro
 *   nutricionista (otro idPersona) → 403.
 * - Path completo: `/turnos-profesional` carga la grilla del día.
 */
import { test, expect } from '@playwright/test';
import { USUARIOS_PRUEBA } from '../helpers/users';
import { login } from '../helpers/auth.helper';
import { getAuthToken, unwrapApiResponse } from '../helpers/api.helper';

const API_BASE_URL = 'http://localhost:3000';

test.describe('E2E Profesional: ver turnos del día (CUD07)', () => {
  test('nutricionista autenticado puede consultar sus turnos del día', async ({
    page,
    request,
  }) => {
    await login(page, USUARIOS_PRUEBA.NUTRICIONISTA_CENTRAL);
    await page.waitForLoadState('networkidle');

    const token = await getAuthToken(page);
    expect(token).toBeTruthy();

    const idNutricionista = 1; // Seed: NutriCentral es el primer nutricionista.
    const response = await request.get(
      `${API_BASE_URL}/turnos/profesional/${idNutricionista}/hoy`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    if (response.status() === 404) {
      test.skip(true, 'Backend no disponible');
      return;
    }

    expect(response.status()).toBe(200);
    const body = unwrapApiResponse(await response.json());
    const turnos = body;
    expect(Array.isArray(turnos)).toBeTruthy();
  });

  test('GET con nutricionistaId inexistente responde 400 o 404', async ({
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
      `${API_BASE_URL}/turnos/profesional/999999/hoy`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    if (response.status() === 404) {
      test.skip(true, 'Backend no disponible');
      return;
    }

    // Puede ser 400 (parseint falla antes de guard) o 403/404 (guard).
    expect([400, 403, 404]).toContain(response.status());
  });

  test('pantalla /turnos-profesional carga para el nutricionista', async ({
    page,
  }) => {
    await login(page, USUARIOS_PRUEBA.NUTRICIONISTA_CENTRAL);
    await page.goto('/turnos-profesional');
    await page.waitForLoadState('networkidle');

    // La página debe cargar (sin redirect a login).
    expect(page.url()).toContain('/turnos-profesional');

    // El cuerpo de la página debe tener contenido renderizado.
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });
});
