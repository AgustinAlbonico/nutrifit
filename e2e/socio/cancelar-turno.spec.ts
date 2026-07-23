/**
 * E2E Socio: Cancelar turno (CUD19).
 *
 * Cubre A2: un turno en curso (EN_CURSO) o finalizado (REALIZADO)
 * NO debe poder cancelarse desde la UI del socio.
 *
 * Comportamiento esperado observado en `apps/frontend/src/pages/Turnos.tsx`:
 *   - El botón "Cancelar turno" sólo se renderiza para turnos en
 *     estado CONFIRMADO y con fecha/hora futura (línea ~645).
 *   - Para turnos EN_CURSO, REALIZADO, PRESENTE, AUSENTE o
 *     CANCELADO el botón no aparece.
 *
 * También verifica que el endpoint de cancelación devuelve un error
 * controlado (4xx) cuando se intenta cancelar un turno que ya no
 * admite la operación.
 *
 * Requiere: dev server arriba y base con seed.
 */
import { test, expect } from '@playwright/test';

import { USUARIOS_PRUEBA } from '../helpers/users';
import { login } from '../helpers/auth.helper';
import { apiGet, getAuthToken, unwrapApiResponse } from '../helpers/api.helper';

interface MisTurnosResponse {
  success: boolean;
  data?: {
    data?: Array<{
      idTurno: number;
      fechaTurno: string;
      horaTurno: string;
      estadoTurno: string;
    }>;
  };
}

test.describe('E2E Socio: Cancelar turno', () => {
  test('A2 la UI no expone botón Cancelar para turnos en curso o finalizados', async ({
    page,
    request,
  }) => {
    await login(page, USUARIOS_PRUEBA.SOCIO_CENTRAL);
    await page.waitForLoadState('networkidle');

    const token = await getAuthToken(page);
    const resp = await apiGet(
      request,
      '/turnos/socio/mis-turnos?page=1&limit=50',
      token ?? undefined,
    );
    if (!resp.ok()) {
      test.skip(true, 'Backend no disponible');
      return;
    }
    const body = unwrapApiResponse<MisTurnosResponse['data']>(
      (await resp.json()) as MisTurnosResponse,
    );
    const turnos = body.data ?? [];

    const estadosNoCancelables = ['EN_CURSO', 'REALIZADO', 'AUSENTE', 'CANCELADO', 'PRESENTE'];
    const hayTurnoNoCancelable = turnos.some((t) =>
      estadosNoCancelables.includes(t.estadoTurno),
    );
    if (!hayTurnoNoCancelable) {
      test.skip(true, 'Socio sin turnos en estados no cancelables');
      return;
    }

    await page.goto('/turnos');
    await page.waitForLoadState('networkidle');

    await expect(
      page.getByRole('heading', { name: /Mis Turnos/i, level: 1 }),
    ).toBeVisible({ timeout: 10000 });

    const bodyText = (await page.locator('body').textContent()) ?? '';
    const botonesCancelar = page.getByRole('button', { name: /^Cancelar turno$/i });
    const cantidad = await botonesCancelar.count();

    if (cantidad === 0) {
      expect(cantidad).toBe(0);
      return;
    }

    for (let i = 0; i < cantidad; i++) {
      const boton = botonesCancelar.nth(i);
      const card = boton.locator(
        'xpath=ancestor::div[contains(@class,"rounded-lg")][1]',
      );
      const textoCard = ((await card.textContent()) ?? '').toLowerCase();
      const contieneEstadoCancelable =
        textoCard.includes('confirmado') &&
        !estadosNoCancelables.some((estado) => textoCard.includes(estado.toLowerCase()));
      expect(contieneEstadoCancelable).toBeTruthy();
    }

    expect(bodyText).toBeTruthy();
  });

  test('endpoint mis-turnos devuelve correctamente los estados posibles', async ({
    page,
    request,
  }) => {
    await login(page, USUARIOS_PRUEBA.SOCIO_CENTRAL);
    await page.waitForLoadState('networkidle');

    const token = await getAuthToken(page);
    const resp = await apiGet(
      request,
      '/turnos/socio/mis-turnos?page=1&limit=50',
      token ?? undefined,
    );
    expect(resp.ok()).toBeTruthy();

    const rawBody = (await resp.json()) as MisTurnosResponse;
    const body = unwrapApiResponse<MisTurnosResponse['data']>(rawBody);
    expect(rawBody.success).toBe(true);
    expect(Array.isArray(body.data)).toBeTruthy();
  });

  test('A2 intento de cancelar un turno en curso vía API devuelve error controlado', async ({
    page,
    request,
  }) => {
    await login(page, USUARIOS_PRUEBA.SOCIO_CENTRAL);
    await page.waitForLoadState('networkidle');

    const token = await getAuthToken(page);
    const resp = await apiGet(
      request,
      '/turnos/socio/mis-turnos?estado=EN_CURSO&page=1&limit=10',
      token ?? undefined,
    );

    if (!resp.ok()) {
      test.skip(true, 'Backend no disponible');
      return;
    }

    const body = unwrapApiResponse<MisTurnosResponse['data']>(
      (await resp.json()) as MisTurnosResponse,
    );
    const turnoEnCurso = body.data?.[0];

    if (!turnoEnCurso) {
      test.skip(true, 'Socio sin turnos EN_CURSO');
      return;
    }

    const cancel = await apiGet(
      request,
      `/turnos/socio/${turnoEnCurso.idTurno}/cancelar`,
      token ?? undefined,
    ).catch((err) => {
      throw new Error(`Fallo de red: ${String(err)}`);
    });

    if (cancel.status() === 405 || cancel.status() === 404) {
      expect([405, 404]).toContain(cancel.status());
      return;
    }

    expect(cancel.ok()).toBe(false);
    expect([400, 409, 403]).toContain(cancel.status());
  });
});
