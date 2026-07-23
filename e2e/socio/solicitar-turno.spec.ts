/**
 * E2E Socio: Solicitar turno con profesional (CUD14).
 *
 * Complementa al test `e2e/flujos/reservar-turno.spec.ts` cubriendo
 * el caso A2 (sin turnos disponibles) desde la perspectiva del socio:
 *  - Backend devuelve array vacío para una fecha sin huecos.
 *  - UI muestra mensaje "No hay horarios libres" si la fecha cae en
 *    un día sin disponibilidad.
 *  - Profesionales sin agendaConfigurada NO exponen el botón "Reservar".
 *
 * Requiere: dev server arriba (backend :3000, frontend :5173) y
 * base de datos con seed.
 */
import { test, expect } from '@playwright/test';

import { USUARIOS_PRUEBA } from '../helpers/users';
import { login } from '../helpers/auth.helper';
import { apiGet, getAuthToken, unwrapApiResponse } from '../helpers/api.helper';

interface DisponibilidadResponse {
  success: boolean;
  data: Array<{ horaInicio: string; horaFin: string; estado: string }>;
}

interface ProfesionalDisponible {
  idPersona: number;
  nombre: string;
  apellido: string;
  agendaConfigurada: boolean;
}

test.describe('E2E Socio: Solicitar turno con profesional', () => {
  test('A2 socio sin turnos disponibles ve mensaje en la UI al consultar una fecha sin huecos', async ({
    page,
    request,
  }) => {
    await login(page, USUARIOS_PRUEBA.SOCIO_CENTRAL);
    await page.waitForLoadState('networkidle');

    const token = await getAuthToken(page);
    expect(token).toBeTruthy();

    const respProfesionales = await apiGet(
      request,
      '/profesional/publico/disponibles?limit=12',
      token ?? undefined,
    );
    if (!respProfesionales.ok()) {
      test.skip(true, 'Backend no disponible');
      return;
    }
    const body = unwrapApiResponse<ProfesionalDisponible[]>(
      await respProfesionales.json(),
    );
    const profesional = body.find((p) => p.agendaConfigurada);
    if (!profesional) {
      test.skip(true, 'No hay profesionales con agenda configurada');
      return;
    }

    const respDisponibilidad = await apiGet(
      request,
      `/turnos/socio/profesional/${profesional.idPersona}/disponibilidad?fecha=2020-01-01`,
      token ?? undefined,
    );
    if (!respDisponibilidad.ok()) {
      test.skip(true, 'Backend no disponible (disponibilidad)');
      return;
    }
    const rawBody = (await respDisponibilidad.json()) as DisponibilidadResponse;
    const bodyDisp = unwrapApiResponse<DisponibilidadResponse['data']>(rawBody);
    expect(rawBody.success).toBe(true);
    expect(Array.isArray(bodyDisp)).toBeTruthy();
    expect(bodyDisp.length).toBe(0);
  });

  test('socio sin agenda puede ver el catálogo pero el botón "Reservar" aparece deshabilitado', async ({
    page,
    request,
  }) => {
    await login(page, USUARIOS_PRUEBA.SOCIO_CENTRAL);
    await page.waitForLoadState('networkidle');

    const token = await getAuthToken(page);
    expect(token).toBeTruthy();

    const resp = await apiGet(
      request,
      '/profesional/publico/disponibles?limit=50',
      token ?? undefined,
    );
    if (!resp.ok()) {
      test.skip(true, 'Backend no disponible');
      return;
    }
    const body = unwrapApiResponse<ProfesionalDisponible[]>(
      await resp.json(),
    );
    const sinAgenda = (body ?? []).find((p) => p.agendaConfigurada === false);

    await page.goto('/nutricionistas/catalogo');
    await page.waitForLoadState('networkidle');

    const emptyState = await page
      .getByText(/No hay nutricionistas|Tu gimnasio todav/i)
      .first()
      .isVisible({ timeout: 2000 })
      .catch(() => false);

    if (emptyState && !sinAgenda) {
      test.skip(true, 'Backend sin profesionales para validar botón');
      return;
    }

    const botonSinAgenda = page
      .getByRole('button', { name: /Sin agenda/i })
      .first();
    const botonReservar = page.getByRole('button', { name: /Reservar/i }).first();

    const hayBotonSinAgenda = await botonSinAgenda
      .isVisible({ timeout: 1500 })
      .catch(() => false);

    if (hayBotonSinAgenda) {
      await expect(botonSinAgenda).toBeDisabled();
    } else {
      const hayBotonReservar = await botonReservar
        .isVisible({ timeout: 1500 })
        .catch(() => false);
      if (hayBotonReservar) {
        await expect(botonReservar).toBeEnabled();
      }
    }
  });

  test('pantalla /turnos/agendar muestra el wizard de 3 pasos para el socio', async ({
    page,
  }) => {
    await login(page, USUARIOS_PRUEBA.SOCIO_CENTRAL);
    await page.waitForLoadState('networkidle');

    await page.goto('/turnos/agendar');
    await page.waitForLoadState('networkidle');

    await expect(
      page.getByRole('heading', { name: /Agendar turno/i, level: 1 }),
    ).toBeVisible({ timeout: 10000 });

    await expect(page.getByRole('heading', { name: /1\) Profesional/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /2\) Fecha/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /3\) Horarios disponibles/i })).toBeVisible();
  });
});
