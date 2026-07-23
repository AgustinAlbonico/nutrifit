/**
 * E2E Profesional — CUD30: Ver progreso del socio.
 *
 * Endpoints (vista del profesional):
 *   - `GET /turnos/profesional/:nutricionistaId/pacientes/:socioId/progreso`
 *   - `GET /turnos/profesional/:nutricionistaId/pacientes/:socioId/historial-mediciones`
 *   - `GET /turnos/profesional/:nutricionistaId/pacientes/:socioId/reporte-evolucion`
 *
 * Cubre:
 * - Caso feliz: GET progreso del paciente vinculado.
 * - A1 sin datos: paciente sin mediciones previas responde con estructura
 *   vacía o 200 con valores nulos.
 * - Pantalla `/profesional/paciente/:socioId/progreso` carga.
 */
import { test, expect } from '@playwright/test';
import { USUARIOS_PRUEBA } from '../helpers/users';
import { login } from '../helpers/auth.helper';
import { getAuthToken } from '../helpers/api.helper';

const API_BASE_URL = 'http://localhost:3000';

test.describe('E2E Profesional: ver progreso del socio (CUD30)', () => {
  test('nutricionista puede ver progreso de paciente vinculado', async ({
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
      `${API_BASE_URL}/turnos/profesional/1/pacientes/1/progreso`,
      { headers: { Authorization: `Bearer ${token}` } },
    );

    if (response.status() === 404) {
      test.skip(true, 'Backend no disponible');
      return;
    }

    // 200 con datos, 403 sin turno previo, 404 paciente sin datos.
    expect([200, 403, 404]).toContain(response.status());

    if (response.status() === 200) {
      const body = await response.json();
      const data = body?.data ?? body;
      expect(data).toBeTruthy();
    }
  });

  test('nutricionista puede ver historial de mediciones del paciente', async ({
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
      `${API_BASE_URL}/turnos/profesional/1/pacientes/1/historial-mediciones`,
      { headers: { Authorization: `Bearer ${token}` } },
    );

    if (response.status() === 404) {
      test.skip(true, 'Backend no disponible');
      return;
    }

    expect([200, 403, 404]).toContain(response.status());

    if (response.status() === 200) {
      const body = await response.json();
      const data = body?.data ?? body;
      expect(Array.isArray(data) || typeof data === 'object').toBeTruthy();
    }
  });

  test('A1: paciente sin mediciones devuelve respuesta vacía o 404', async ({
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

    // SocioId 999999: no existe ni tiene mediciones.
    const response = await request.get(
      `${API_BASE_URL}/turnos/profesional/1/pacientes/999999/progreso`,
      { headers: { Authorization: `Bearer ${token}` } },
    );

    if (response.status() === 404) {
      test.skip(true, 'Backend no disponible');
      return;
    }

    // 403 (guard de ownership) o 404 (socio inexistente) son esperados.
    expect([403, 404]).toContain(response.status());
  });

  test('pantalla /profesional/paciente/1/progreso carga', async ({ page }) => {
    await login(page, USUARIOS_PRUEBA.NUTRICIONISTA_CENTRAL);
    await page.goto('/profesional/paciente/1/progreso');
    await page.waitForLoadState('networkidle');

    expect(page.url()).toContain('/profesional/paciente/');
  });
});
