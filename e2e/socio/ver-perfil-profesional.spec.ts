/**
 * E2E Socio: Ver perfil del profesional (CUD15).
 *
 * Verifica que la página /nutricionistas/$id/perfil muestre:
 *   - Especialidad, años de experiencia, presentación
 *   - Horarios de atención
 *   - Botón "Reservar turno"
 *
 * NOTA IMPORTANTE (GAP documentado):
 *   El caso de uso CUD15 menciona reseñas/opiniones, pero la vista
 *   actual NO las implementa. El test "CUD15 GAP" valida esa ausencia
 *   y debe fallar para dejar registrada la brecha funcional.
 *   Ver memoria `validacion/use-cases-gaps`.
 *
 * Requiere: dev server arriba y base con seed.
 */
import { test, expect } from '@playwright/test';

import { USUARIOS_PRUEBA } from '../helpers/users';
import { login } from '../helpers/auth.helper';
import { apiGet, getAuthToken, unwrapApiResponse } from '../helpers/api.helper';

interface PerfilProfesional {
  idPersona: number;
  nombre: string;
  apellido: string;
  especialidad: string;
  aniosExperiencia: number;
  matricula: string;
  presentacion: string | null;
  horarios: Array<{ dia: string; horaInicio: string; horaFin: string }>;
}

interface CatalogoResponse {
  success: boolean;
  data: Array<{ idPersona: number; nombre: string; apellido: string }>;
}

async function obtenerPrimerProfesional(
  token: string | null,
  request: import('@playwright/test').APIRequestContext,
): Promise<number | null> {
  const resp = await apiGet(
    request,
    '/profesional/publico/disponibles?limit=5',
    token ?? undefined,
  );
  if (!resp.ok()) return null;
  const body = unwrapApiResponse<CatalogoResponse['data']>(
    (await resp.json()) as CatalogoResponse,
  );
  return body?.[0]?.idPersona ?? null;
}

test.describe('E2E Socio: Ver perfil del profesional', () => {
  test('socio puede ver especialidad, experiencia y horarios del nutricionista', async ({
    page,
    request,
  }) => {
    await login(page, USUARIOS_PRUEBA.SOCIO_CENTRAL);
    await page.waitForLoadState('networkidle');

    const token = await getAuthToken(page);
    const idProfesional = await obtenerPrimerProfesional(token, request);
    if (!idProfesional) {
      test.skip(true, 'Backend sin profesionales disponibles');
      return;
    }

    await page.goto(`/nutricionistas/${idProfesional}/perfil`);
    await page.waitForLoadState('networkidle');

    await expect(
      page.getByRole('heading', { name: /Perfil del Nutricionista/i, level: 1 }),
    ).toBeVisible({ timeout: 10000 });

    await expect(page.getByText(/Mat\./)).toBeVisible();
    await expect(page.getByText(/a[ñn]os de experiencia/i)).toBeVisible();

    const seccionHorarios = page.getByText(/Horarios de atenci[oó]n/i);
    const seccionCalendario = page.getByText(/Disponibilidad/i);
    const cualquieraVisible = await Promise.all([
      seccionHorarios.first().isVisible({ timeout: 3000 }).catch(() => false),
      seccionCalendario.first().isVisible({ timeout: 1000 }).catch(() => false),
    ]);
    expect(cualquieraVisible.some((v) => v)).toBeTruthy();

    const linkReservar = page.getByRole('link', { name: /Reservar turno/i });
    const botonSinAgenda = page.getByRole('button', { name: /Sin agenda/i });
    const hayReservar = await linkReservar.isVisible({ timeout: 2000 }).catch(() => false);
    const haySinAgenda = await botonSinAgenda
      .isVisible({ timeout: 1000 })
      .catch(() => false);
    expect(hayReservar || haySinAgenda).toBeTruthy();
  });

  test('API pública devuelve la estructura esperada del perfil', async ({
    page,
    request,
  }) => {
    await login(page, USUARIOS_PRUEBA.SOCIO_CENTRAL);
    await page.waitForLoadState('networkidle');

    const token = await getAuthToken(page);
    const idProfesional = await obtenerPrimerProfesional(token, request);
    if (!idProfesional) {
      test.skip(true, 'Backend sin profesionales');
      return;
    }

    const resp = await apiGet(
      request,
      `/profesional/publico/${idProfesional}/perfil`,
      token ?? undefined,
    );
    expect(resp.ok()).toBeTruthy();

    const body = unwrapApiResponse(await resp.json()) as PerfilProfesional;
    const data = body;
    expect(data.idPersona).toBe(idProfesional);
    expect(typeof data.nombre).toBe('string');
    expect(typeof data.especialidad).toBe('string');
    expect(typeof data.aniosExperiencia).toBe('number');
    expect(Array.isArray(data.horarios)).toBeTruthy();
  });

  test('CUD15 GAP: la vista de perfil NO muestra reseñas ni opiniones del profesional', async ({
    page,
    request,
  }) => {
    // GAP: reseñas NO implementadas (ver memoria validación/use-cases-gaps).
    // El caso de uso CUD15 espera que el perfil muestre reseñas/opiniones
    // de otros socios, pero la implementación actual de
    // `apps/frontend/src/pages/PerfilNutricionista.tsx` no renderiza
    // ninguna sección de "Reseñas" ni "Opiniones". Este test documenta
    // esa ausencia para que figure como falla esperada hasta que se
    // implemente el feature.
    await login(page, USUARIOS_PRUEBA.SOCIO_CENTRAL);
    await page.waitForLoadState('networkidle');

    const token = await getAuthToken(page);
    const idProfesional = await obtenerPrimerProfesional(token, request);
    if (!idProfesional) {
      test.skip(true, 'Backend sin profesionales');
      return;
    }

    await page.goto(`/nutricionistas/${idProfesional}/perfil`);
    await page.waitForLoadState('networkidle');

    const headingPrincipal = page.getByRole('heading', {
      name: /Perfil del Nutricionista/i,
      level: 1,
    });
    await expect(headingPrincipal).toBeVisible({ timeout: 10000 });

    const seccionResenas = page.getByText(/^Rese[ñn]as$/i);
    const seccionOpiniones = page.getByText(/^Opiniones$/i);
    const seccionCalificaciones = page.getByText(/^Calificaciones$/i);

    const hayResenas = await seccionResenas
      .first()
      .isVisible({ timeout: 2000 })
      .catch(() => false);
    const hayOpiniones = await seccionOpiniones
      .first()
      .isVisible({ timeout: 1000 })
      .catch(() => false);
    const hayCalificaciones = await seccionCalificaciones
      .first()
      .isVisible({ timeout: 1000 })
      .catch(() => false);

    expect(hayResenas || hayOpiniones || hayCalificaciones).toBe(true);
  });
});
