/**
 * E2E: RECEPCIONISTA NO tiene acceso a datos clínicos de ficha de salud (RB16).
 *
 * Verifica que los endpoints de ficha-salud devuelven 403 Forbidden
 * cuando se accede con un token de RECEPCIONISTA. Como RECEPCIONISTA no
 * tiene UI para acceder a estas pantallas, se valida por API directa.
 *
 * Endpoints verificados:
 * - GET /turnos/socio/ficha-salud
 * - GET /turnos/socio/ficha-salud/historial
 * - GET /turnos/socio/ficha-salud/version/1
 * - GET /turnos/profesional/:nutricionistaId/pacientes/:socioId/ficha-salud
 * - GET /turnos/profesional/:nutricionistaId/pacientes/:socioId/ficha-salud/historial
 *
 * Cubre RB16 end-to-end.
 */
import { test, expect } from '@playwright/test';
import { USUARIOS_PRUEBA } from '../helpers/users';
import { login } from '../helpers/auth.helper';
import { getAuthToken } from '../helpers/api.helper';

const API_BASE_URL = 'http://localhost:3000';

test.describe('E2E ficha-salud: RB16 RECEPCIONISTA sin acceso (403)', () => {
  test('RECEPCIONISTA recibe 403 en todos los endpoints de ficha-salud de socio', async ({
    page,
    request,
  }) => {
    const usuario = USUARIOS_PRUEBA.RECEPCIONISTA_CENTRAL;
    await login(page, usuario);
    await page.waitForLoadState('networkidle');

    const token = await getAuthToken(page);
    expect(token).toBeTruthy();

    // GET /turnos/socio/ficha-salud → debe ser 403
    const responseFicha = await request.get(
      `${API_BASE_URL}/turnos/socio/ficha-salud`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    expect(responseFicha.status()).toBe(403);

    // GET /turnos/socio/ficha-salud/historial → debe ser 403
    const responseHistorial = await request.get(
      `${API_BASE_URL}/turnos/socio/ficha-salud/historial`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    expect(responseHistorial.status()).toBe(403);

    // GET /turnos/socio/ficha-salud/version/1 → debe ser 403
    const responseVersion = await request.get(
      `${API_BASE_URL}/turnos/socio/ficha-salud/version/1`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    expect(responseVersion.status()).toBe(403);
  });

  test('RECEPCIONISTA recibe 403 en endpoint de ficha de paciente (nutricionista)', async ({
    page,
    request,
  }) => {
    const usuario = USUARIOS_PRUEBA.RECEPCIONISTA_CENTRAL;
    await login(page, usuario);
    await page.waitForLoadState('networkidle');

    const token = await getAuthToken(page);
    expect(token).toBeTruthy();

    // Asumimos IDs 1 y 1 para nutricionista y socio en el seed. Si el seed
    // usa otros IDs, el test igualmente valida 403 (RolesGuard chequea rol
    // antes de validar la propiedad del recurso).
    const endpointsNutri = [
      '/turnos/profesional/1/pacientes/1/ficha-salud',
      '/turnos/profesional/1/pacientes/1/ficha-salud/historial',
      '/turnos/profesional/1/pacientes/1/ficha-salud/version/1',
    ];

    for (const endpoint of endpointsNutri) {
      const response = await request.get(`${API_BASE_URL}${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(
        response.status(),
        `Endpoint ${endpoint} debería rechazar RECEPCIONISTA con 403 (recibió ${response.status()})`,
      ).toBe(403);
    }
  });

  test('RECEPCIONISTA recibe 403 al intentar PUT de ficha de socio', async ({
    page,
    request,
  }) => {
    const usuario = USUARIOS_PRUEBA.RECEPCIONISTA_CENTRAL;
    await login(page, usuario);
    await page.waitForLoadState('networkidle');

    const token = await getAuthToken(page);
    expect(token).toBeTruthy();

    const response = await request.put(
      `${API_BASE_URL}/turnos/socio/ficha-salud`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        data: {
          altura: 175,
          peso: 75,
          nivelActividadFisica: 'MODERADO',
          objetivoPersonal: 'test',
        },
      },
    );
    expect(response.status()).toBe(403);
  });

  test('RECEPCIONISTA no ve ruta de ficha-salud en sidebar', async ({ page }) => {
    const usuario = USUARIOS_PRUEBA.RECEPCIONISTA_CENTRAL;
    await login(page, usuario);
    await page.waitForLoadState('networkidle');

    // El sidebar no debe tener un link directo a "Mi ficha de salud"
    // (porque esa pantalla es exclusiva del rol SOCIO).
    const sidebar = page.locator('aside, nav, [data-testid="sidebar"]').first();
    if (await sidebar.isVisible({ timeout: 3000 }).catch(() => false)) {
      const linkFicha = sidebar.locator(
        'a:has-text("Mi ficha de salud"), a:has-text("Ficha de salud")',
      );
      await expect(linkFicha).toHaveCount(0);
    }
  });
});
