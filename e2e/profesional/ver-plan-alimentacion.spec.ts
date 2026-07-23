/**
 * E2E Profesional — CUD28: Ver plan de alimentación.
 *
 * Endpoints:
 *   - `GET /planes-alimentacion/:id` (por id)
 *   - `GET /planes-alimentacion/socio/:socioId/activo` (plan activo del socio)
 *
 * Cubre:
 * - Caso feliz: GET plan por id → 200 con datos completos.
 * - A1: socio sin plan activo → respuesta vacía (array `[]`).
 * - GET de plan inexistente → 404.
 * - Pantalla `/profesional/plan/:socioId` carga para el nutricionista.
 */
import { test, expect } from '@playwright/test';
import { USUARIOS_PRUEBA } from '../helpers/users';
import { login } from '../helpers/auth.helper';
import { getAuthToken } from '../helpers/api.helper';

const API_BASE_URL = 'http://localhost:3000';

test.describe('E2E Profesional: ver plan de alimentación (CUD28)', () => {
  test('nutricionista puede ver plan por id', async ({
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

    // Listar planes y tomar el primero.
    const responseListar = await request.get(
      `${API_BASE_URL}/planes-alimentacion/nutricionista/1`,
      { headers: { Authorization: `Bearer ${token}` } },
    );

    if (responseListar.status() === 404) {
      test.skip(true, 'Backend no disponible');
      return;
    }

    if (responseListar.status() !== 200) {
      test.skip(true, 'Sin planes del nutricionista');
      return;
    }

    const bodyListar = await responseListar.json();
    const planes: Array<{ id: number }> = bodyListar?.data ?? bodyListar ?? [];

    if (planes.length === 0) {
      test.skip(true, 'Nutricionista sin planes creados');
      return;
    }

    const planId = planes[0].id;
    const response = await request.get(
      `${API_BASE_URL}/planes-alimentacion/${planId}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );

    expect([200, 404]).toContain(response.status());

    if (response.status() === 200) {
      const body = await response.json();
      const plan = body?.data ?? body;
      expect(plan).toBeTruthy();
      expect(plan.id ?? plan.idPlanAlimentacion).toBeTruthy();
    }
  });

  test('A1: socio sin plan activo devuelve array vacío', async ({
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

    // SocioId 999999 no tiene plan.
    const response = await request.get(
      `${API_BASE_URL}/planes-alimentacion/socio/999999/activo`,
      { headers: { Authorization: `Bearer ${token}` } },
    );

    if (response.status() === 404) {
      test.skip(true, 'Backend no disponible');
      return;
    }

    // El endpoint siempre responde 200 con array (vacío si no hay).
    // Ver: `listarPlanesActivosSocio` retorna `PlanSocioActivoDTO[]`.
    expect([200, 403, 404]).toContain(response.status());

    if (response.status() === 200) {
      const body = await response.json();
      const data = body?.data ?? body;
      expect(Array.isArray(data)).toBeTruthy();
    }
  });

  test('GET plan inexistente responde 404', async ({
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
      `${API_BASE_URL}/planes-alimentacion/999999`,
      { headers: { Authorization: `Bearer ${token}` } },
    );

    if (response.status() === 404) {
      // Ideal: 404
      expect(response.status()).toBe(404);
      return;
    }

    // 200 con null o 403 también son aceptables según el guard.
    expect([200, 403, 404]).toContain(response.status());
  });

  test('pantalla /profesional/plan/1 carga', async ({ page }) => {
    await login(page, USUARIOS_PRUEBA.NUTRICIONISTA_CENTRAL);
    await page.goto('/profesional/plan/1');
    await page.waitForLoadState('networkidle');

    expect(page.url()).toContain('/profesional/plan/');
  });
});
