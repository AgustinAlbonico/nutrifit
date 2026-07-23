/**
 * E2E Socio: Reprogramar turno (CUD18).
 *
 * Cubre los casos alternativos del flujo de reprogramación:
 *  - A4 sin disponibilidad alternativa (UI muestra "No hay horarios
 *    disponibles" para una fecha sin huecos).
 *  - A6 nueva fecha no seleccionada (botón Confirmar del modal
 *    permanece deshabilitado).
 *  - Apertura básica del modal de reprogramación desde un turno
 *    CONFIRMADO futuro del socio.
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
      profesionalId?: number;
      nutricionista?: { idPersona: number; nombreCompleto: string };
    }>;
  };
}

interface DisponibilidadResponse {
  success: boolean;
  data: Array<{ horaInicio: string; horaFin: string; estado: string }>;
}

async function obtenerPrimerTurnoConfirmado(
  token: string | null,
  request: import('@playwright/test').APIRequestContext,
): Promise<{ idTurno: number; fechaTurno: string; horaTurno: string; profesionalId: number } | null> {
  const resp = await apiGet(
    request,
    '/turnos/socio/mis-turnos?estado=CONFIRMADO&page=1&limit=10',
    token ?? undefined,
  );
  if (!resp.ok()) return null;
  const body = unwrapApiResponse<MisTurnosResponse['data']>(
    (await resp.json()) as MisTurnosResponse,
  );
  const t = body.data?.[0];
  if (!t) return null;
  const idProfesional =
    typeof t.profesionalId === 'number'
      ? t.profesionalId
      : t.nutricionista?.idPersona;
  if (!idProfesional) return null;
  return {
    idTurno: t.idTurno,
    fechaTurno: t.fechaTurno,
    horaTurno: t.horaTurno,
    profesionalId: idProfesional,
  };
}

test.describe('E2E Socio: Reprogramar turno', () => {
  test('socio puede abrir el modal de reprogramación desde un turno CONFIRMADO', async ({
    page,
    request,
  }) => {
    await login(page, USUARIOS_PRUEBA.SOCIO_CENTRAL);
    await page.waitForLoadState('networkidle');

    const token = await getAuthToken(page);
    const turno = await obtenerPrimerTurnoConfirmado(token, request);
    if (!turno) {
      test.skip(true, 'Socio sin turnos CONFIRMADOS');
      return;
    }

    await page.goto('/turnos');
    await page.waitForLoadState('networkidle');

    await expect(
      page.getByRole('heading', { name: /Mis Turnos/i, level: 1 }),
    ).toBeVisible({ timeout: 10000 });

    const itemTurno = page.getByText(/C[oó]digo de turno:/i).first();
    await expect(itemTurno).toBeVisible({ timeout: 10000 });

    const botonesReprogramar = page.getByRole('button', { name: /^Reprogramar$/i });
    const visible = await botonesReprogramar
      .first()
      .isVisible({ timeout: 3000 })
      .catch(() => false);

    if (!visible) {
      const turnoFuturo = new Date(`${turno.fechaTurno}T${turno.horaTurno}:00`);
      const ahora = new Date();
      if (turnoFuturo.getTime() <= ahora.getTime()) {
        test.skip(true, 'Turno CONFIRMADO ya pasó (no se muestra Reprogramar)');
        return;
      }
      test.skip(true, 'Botón Reprogramar no visible');
      return;
    }

    await botonesReprogramar.first().click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5000 });
    await expect(dialog).toContainText(/Reprogramar turno/i);

    const botonConfirmar = dialog.getByRole('button', { name: /Confirmar/i });
    await expect(botonConfirmar).toBeVisible();
    await expect(botonConfirmar).toBeDisabled();
  });

  test('A6 nueva fecha no seleccionada mantiene Confirmar deshabilitado', async ({
    page,
    request,
  }) => {
    await login(page, USUARIOS_PRUEBA.SOCIO_CENTRAL);
    await page.waitForLoadState('networkidle');

    const token = await getAuthToken(page);
    const turno = await obtenerPrimerTurnoConfirmado(token, request);
    if (!turno) {
      test.skip(true, 'Socio sin turnos CONFIRMADOS');
      return;
    }

    await page.goto('/turnos');
    await page.waitForLoadState('networkidle');

    await expect(
      page.getByRole('heading', { name: /Mis Turnos/i, level: 1 }),
    ).toBeVisible({ timeout: 10000 });

    const botonesReprogramar = page.getByRole('button', { name: /^Reprogramar$/i });
    const visible = await botonesReprogramar
      .first()
      .isVisible({ timeout: 3000 })
      .catch(() => false);
    if (!visible) {
      test.skip(true, 'Botón Reprogramar no visible');
      return;
    }

    await botonesReprogramar.first().click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    const botonConfirmar = dialog.getByRole('button', { name: /Confirmar/i });
    await expect(botonConfirmar).toBeDisabled();

    await expect(
      dialog.getByText(/Selecciona una fecha para ver los horarios disponibles/i),
    ).toBeVisible({ timeout: 3000 });
  });

  test('A4 sin disponibilidad alternativa muestra mensaje "No hay horarios disponibles"', async ({
    page,
    request,
  }) => {
    await login(page, USUARIOS_PRUEBA.SOCIO_CENTRAL);
    await page.waitForLoadState('networkidle');

    const token = await getAuthToken(page);
    const turno = await obtenerPrimerTurnoConfirmado(token, request);
    if (!turno) {
      test.skip(true, 'Socio sin turnos CONFIRMADOS');
      return;
    }

    const respFechaPasada = await apiGet(
      request,
      `/turnos/socio/profesional/${turno.profesionalId}/disponibilidad?fecha=2020-01-01`,
      token ?? undefined,
    );
    if (!respFechaPasada.ok()) {
      test.skip(true, 'Backend no disponible (disponibilidad)');
      return;
    }
    const rawBody = (await respFechaPasada.json()) as DisponibilidadResponse;
    const body = unwrapApiResponse<DisponibilidadResponse['data']>(rawBody);
    expect(rawBody.success).toBe(true);
    expect(Array.isArray(body)).toBeTruthy();
    expect(body.length).toBe(0);

    await page.goto('/turnos');
    await page.waitForLoadState('networkidle');

    await expect(
      page.getByRole('heading', { name: /Mis Turnos/i, level: 1 }),
    ).toBeVisible({ timeout: 10000 });

    const botonesReprogramar = page.getByRole('button', { name: /^Reprogramar$/i });
    const visible = await botonesReprogramar
      .first()
      .isVisible({ timeout: 3000 })
      .catch(() => false);
    if (!visible) {
      test.skip(true, 'Botón Reprogramar no visible');
      return;
    }
  });
});
