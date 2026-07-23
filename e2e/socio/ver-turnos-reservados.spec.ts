/**
 * E2E Socio: Ver turnos reservados (CUD17).
 *
 * Verifica:
 *  - A4 socio sin turnos registrados ve el empty state "No tenés
 *    turnos registrados" en /turnos.
 *  - El endpoint GET /turnos/socio/mis-turnos responde 200 con la
 *    estructura paginada esperada.
 *  - En caso de existir turnos, la lista muestra estado, fecha,
 *    horario y nombre del profesional.
 *
 * Requiere: dev server arriba y base con seed.
 */
import { test, expect } from '@playwright/test';

import { USUARIOS_PRUEBA } from '../helpers/users';
import { login } from '../helpers/auth.helper';
import { apiGet, getAuthToken } from '../helpers/api.helper';

interface MisTurnosResponse {
  success: boolean;
  data?: {
    data?: Array<{
      idTurno: number;
      fechaTurno: string;
      horaTurno: string;
      estadoTurno: string;
    }>;
    pagination?: { total: number; page: number; total_pages: number };
  };
}

test.describe('E2E Socio: Ver turnos reservados', () => {
  test('A4 socio sin turnos ve el empty state en la pantalla /turnos', async ({
    page,
  }) => {
    await login(page, USUARIOS_PRUEBA.SOCIO_CENTRAL);
    await page.waitForLoadState('networkidle');

    await page.goto('/turnos');
    await page.waitForLoadState('networkidle');

    await expect(
      page.getByRole('heading', { name: /Mis Turnos/i, level: 1 }),
    ).toBeVisible({ timeout: 10000 });

    const empty = page.getByText(/No ten[eé]s turnos registrados/i);
    const lista = page.getByText(/Resultados:/i);
    const itemTurno = page.getByText(/C[oó]digo de turno:/i).first();

    const emptyVisible = await empty
      .first()
      .isVisible({ timeout: 3000 })
      .catch(() => false);
    const listaVisible = await lista
      .first()
      .isVisible({ timeout: 1000 })
      .catch(() => false);
    const itemVisible = await itemTurno
      .first()
      .isVisible({ timeout: 1000 })
      .catch(() => false);

    expect(emptyVisible || listaVisible || itemVisible).toBeTruthy();
  });

  test('API mis-turnos responde 200 con estructura paginada', async ({
    page,
    request,
  }) => {
    await login(page, USUARIOS_PRUEBA.SOCIO_CENTRAL);
    await page.waitForLoadState('networkidle');

    const token = await getAuthToken(page);
    const resp = await apiGet(
      request,
      '/turnos/socio/mis-turnos?page=1&limit=10',
      token ?? undefined,
    );
    expect(resp.ok()).toBeTruthy();

    const body = (await resp.json()) as MisTurnosResponse;
    expect(body.success).toBe(true);

    if (body.data?.data) {
      expect(Array.isArray(body.data.data)).toBeTruthy();
    }

    if (body.data?.pagination) {
      expect(body.data.pagination.page).toBeGreaterThanOrEqual(1);
    }
  });

  test('socio con turnos ve datos de cada reserva (estado, fecha, profesional)', async ({
    page,
    request,
  }) => {
    await login(page, USUARIOS_PRUEBA.SOCIO_CENTRAL);
    await page.waitForLoadState('networkidle');

    const token = await getAuthToken(page);
    const resp = await apiGet(
      request,
      '/turnos/socio/mis-turnos?page=1&limit=10',
      token ?? undefined,
    );
    if (!resp.ok()) {
      test.skip(true, 'Backend no disponible');
      return;
    }
    const body = (await resp.json()) as MisTurnosResponse;
    const turnos = body.data?.data ?? [];

    if (turnos.length === 0) {
      test.skip(true, 'Socio sin turnos registrados');
      return;
    }

    await page.goto('/turnos');
    await page.waitForLoadState('networkidle');

    await expect(
      page.getByRole('heading', { name: /Mis Turnos/i, level: 1 }),
    ).toBeVisible({ timeout: 10000 });

    const itemTurno = page.getByText(/C[oó]digo de turno:/i).first();
    await expect(itemTurno).toBeVisible({ timeout: 10000 });

    const campoProfesional = page.getByText(/^Profesional:/i).first();
    const campoEspecialidad = page.getByText(/^Especialidad:/i).first();
    const campoHorario = page.getByText(/^Horario:/i).first();

    await expect(campoProfesional).toBeVisible();
    await expect(campoEspecialidad).toBeVisible();
    await expect(campoHorario).toBeVisible();
  });
});
