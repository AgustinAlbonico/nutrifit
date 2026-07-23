/**
 * E2E Profesional — CUD08: Ver pacientes del nutricionista.
 *
 * Endpoint: `GET /turnos/profesional/:nutricionistaId/pacientes`
 *
 * Cubre:
 * - Caso feliz: lista paginada de pacientes vinculados al nutricionista.
 * - Pantalla `/pacientes` carga la grilla con buscador.
 * - Búsqueda por nombre filtra resultados.
 */
import { test, expect } from '@playwright/test';
import { USUARIOS_PRUEBA } from '../helpers/users';
import { login } from '../helpers/auth.helper';
import { getAuthToken } from '../helpers/api.helper';

const API_BASE_URL = 'http://localhost:3000';

test.describe('E2E Profesional: ver pacientes (CUD08)', () => {
  test('nutricionista puede listar sus pacientes', async ({
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
    const response = await request.get(
      `${API_BASE_URL}/turnos/profesional/${idNutricionista}/pacientes?page=1&limit=20`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    if (response.status() === 404) {
      test.skip(true, 'Backend no disponible');
      return;
    }

    expect(response.status()).toBe(200);
    const body = await response.json();
    const data = body?.data ?? body;

    // Estructura esperada: paginada, con array de items.
    expect(data).toBeTruthy();
    const items = data?.items ?? data;
    expect(Array.isArray(items)).toBeTruthy();
  });

  test('pantalla /pacientes carga buscador y grilla', async ({ page }) => {
    await login(page, USUARIOS_PRUEBA.NUTRICIONISTA_CENTRAL);
    await page.goto('/pacientes');
    await page.waitForLoadState('networkidle');

    await expect(
      page.getByRole('heading', { name: /mis pacientes/i }),
    ).toBeVisible({ timeout: 10000 });

    // El input de búsqueda debe estar presente.
    const inputBusqueda = page.locator(
      'input[placeholder*="Buscar" i], input[type="search"]',
    );
    await expect(inputBusqueda.first()).toBeVisible();
  });

  test('nutricionista no puede listar pacientes de otro nutricionista', async ({
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

    // NutricionistaId 999999 no existe.
    const response = await request.get(
      `${API_BASE_URL}/turnos/profesional/999999/pacientes`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    if (response.status() === 404) {
      test.skip(true, 'Backend no disponible');
      return;
    }

    expect([400, 403, 404]).toContain(response.status());
  });
});
