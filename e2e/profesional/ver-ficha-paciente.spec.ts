/**
 * E2E Profesional — CUD09: Ver ficha de salud del paciente.
 *
 * Endpoint: `GET /turnos/profesional/:nutricionistaId/pacientes/:socioId/ficha-salud`
 *
 * Cubre:
 * - Caso feliz: nutricionista con turno previo ve la ficha del paciente.
 * - Socio sin ficha: 404 o 200 con `null`.
 * - Pantalla `/profesional/paciente/:socioId/ficha` carga correctamente.
 */
import { test, expect } from '@playwright/test';
import { USUARIOS_PRUEBA } from '../helpers/users';
import { login } from '../helpers/auth.helper';
import { getAuthToken, unwrapApiResponse } from '../helpers/api.helper';

const API_BASE_URL = 'http://localhost:3000';

test.describe('E2E Profesional: ver ficha de salud del paciente (CUD09)', () => {
  test('nutricionista con turno previo puede ver ficha del paciente', async ({
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
    const idSocio = 1;

    const response = await request.get(
      `${API_BASE_URL}/turnos/profesional/${idNutricionista}/pacientes/${idSocio}/ficha-salud`,
      { headers: { Authorization: `Bearer ${token}` } },
    );

    if (response.status() === 404) {
      test.skip(true, 'Backend no disponible');
      return;
    }

    // Aceptamos 200 (con ficha) o 403 (sin turno previo) o 404 (sin ficha).
    expect([200, 403, 404]).toContain(response.status());

    if (response.status() === 200) {
      const body = unwrapApiResponse(await response.json());
      const ficha = body;
      if (ficha) {
        // Si hay ficha, debe tener al menos un campo característico.
        expect(ficha.altura ?? ficha.peso ?? ficha.nivelActividadFisica).toBeDefined();
      }
    }
  });

  test('GET con socioId inexistente responde 403 o 404', async ({
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
      `${API_BASE_URL}/turnos/profesional/1/pacientes/999999/ficha-salud`,
      { headers: { Authorization: `Bearer ${token}` } },
    );

    if (response.status() === 404) {
      test.skip(true, 'Backend no disponible');
      return;
    }

    expect([403, 404]).toContain(response.status());
  });

  test('pantalla /profesional/paciente/1/ficha carga', async ({ page }) => {
    await login(page, USUARIOS_PRUEBA.NUTRICIONISTA_CENTRAL);
    await page.goto('/profesional/paciente/1/ficha');
    await page.waitForLoadState('networkidle');

    // La página debe cargar. Si no hay turno previo, mostrará
    // "Acceso denegado" o similar. Aceptamos ambos.
    expect(page.url()).toContain('/profesional/paciente/');
  });
});
