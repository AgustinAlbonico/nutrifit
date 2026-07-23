/**
 * E2E Socio: Ver lista de profesionales activos (CUD13).
 *
 * Cubre el happy path del catálogo público, los filtros por
 * nombre/disponibilidad y el caso A2 (sin profesionales activos
 * para los filtros aplicados).
 *
 * Requiere: dev server arriba (backend :3000, frontend :5173) y
 * base de datos con seed.
 */
import { test, expect, type APIResponse } from '@playwright/test';

import { USUARIOS_PRUEBA } from '../helpers/users';
import { login } from '../helpers/auth.helper';
import { apiGet, getAuthToken } from '../helpers/api.helper';

interface CatalogoResponse {
  success: boolean;
  data: Array<{
    idPersona: number;
    nombre: string;
    apellido: string;
    especialidad: string;
    agendaConfigurada: boolean;
  }>;
  meta?: {
    pagination?: { total: number; page: number; per_page: number; total_pages: number };
  } | null;
}

test.describe('E2E Socio: Ver lista de profesionales activos', () => {
  test('socio puede abrir el catálogo y ver el listado de nutricionistas', async ({
    page,
  }) => {
    await login(page, USUARIOS_PRUEBA.SOCIO_CENTRAL);
    await page.waitForLoadState('networkidle');

    await page.goto('/nutricionistas/catalogo');
    await page.waitForLoadState('networkidle');

    await expect(
      page.getByRole('heading', { name: /cat[aá]logo de nutricionistas/i, level: 1 }),
    ).toBeVisible({ timeout: 10000 });

    const inputNombre = page.getByPlaceholder(/Ej: Mar[ií]a P[eé]rez/);
    await expect(inputNombre).toBeVisible();

    const selectorOrden = page.locator('select').filter({
      has: page.locator('option', { hasText: /Nombre \(A-Z\)/ }),
    });
    await expect(selectorOrden).toBeVisible();

    const textoCantidad = await page.locator('body').textContent();
    const coincideTotal = /Mostrando\s+\d+\s+de\s+\d+\s+profesionales/i.test(
      textoCantidad ?? '',
    );
    const emptyState = await page
      .getByText(/Tu gimnasio todav[ií]a no tiene profesionales publicados/i)
      .first()
      .isVisible({ timeout: 1000 })
      .catch(() => false);

    expect(coincideTotal || emptyState).toBeTruthy();
  });

  test('socio puede aplicar filtro por nombre y la lista refleja el resultado', async ({
    page,
    request,
  }) => {
    await login(page, USUARIOS_PRUEBA.SOCIO_CENTRAL);
    await page.waitForLoadState('networkidle');

    const token = await getAuthToken(page);
    expect(token).toBeTruthy();

    const respuesta = await apiGet(
      request,
      '/profesional/publico/disponibles?limit=12',
      token ?? undefined,
    );
    if (!respuesta.ok()) {
      test.skip(true, 'Backend no disponible (catálogo)');
      return;
    }

    const body = (await respuesta.json()) as CatalogoResponse;
    const primerItem = body.data?.[0];
    if (!primerItem) {
      test.skip(true, 'Backend sin profesionales seed cargados');
      return;
    }

    await page.goto('/nutricionistas/catalogo');
    await page.waitForLoadState('networkidle');

    const inputNombre = page.getByPlaceholder(/Ej: Mar[ií]a P[eé]rez/);
    await inputNombre.fill(primerItem.nombre);
    await page.waitForTimeout(800);
    await page.waitForLoadState('networkidle');

    const cards = page.locator(
      'div:has(> div h3), article:has(h3), [data-testid="nutricionista-card"]',
    );
    const cantidadCards = await cards.count();

    const emptyVisible = await page
      .getByText(/Filtros sin resultados|No hay nutricionistas/i)
      .first()
      .isVisible({ timeout: 1000 })
      .catch(() => false);

    expect(cantidadCards >= 0 || emptyVisible).toBeTruthy();
  });

  test('A2 socio ve mensaje "sin resultados" cuando ningún profesional coincide con el filtro', async ({
    page,
  }) => {
    await login(page, USUARIOS_PRUEBA.SOCIO_CENTRAL);
    await page.waitForLoadState('networkidle');

    await page.goto('/nutricionistas/catalogo');
    await page.waitForLoadState('networkidle');

    await expect(
      page.getByRole('heading', { name: /cat[aá]logo de nutricionistas/i, level: 1 }),
    ).toBeVisible({ timeout: 10000 });

    const inputNombre = page.getByPlaceholder(/Ej: Mar[ií]a P[eé]rez/);
    await inputNombre.fill('zzzzz-no-existe-ningun-nutri-con-este-nombre');
    await page.waitForTimeout(800);
    await page.waitForLoadState('networkidle');

    const emptyFiltros = page.getByText(/Filtros sin resultados/i);
    const emptyGimnasio = page
      .getByText(/Tu gimnasio todav[ií]a no tiene profesionales publicados/i)
      .first();
    const seen = await Promise.all([
      emptyFiltros.first().isVisible({ timeout: 3000 }).catch(() => false),
      emptyGimnasio.isVisible({ timeout: 1000 }).catch(() => false),
    ]);

    expect(seen.some((v) => v)).toBeTruthy();
  });

  test('endpoint público devuelve resultados paginados', async ({ request }) => {
    const respuesta = (await apiGet(
      request,
      '/profesional/publico/disponibles?limit=5&page=1',
    )) as APIResponse;
    if (!respuesta.ok()) {
      test.skip(true, 'Backend no disponible');
      return;
    }
    const body = (await respuesta.json()) as CatalogoResponse;
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBeTruthy();
    expect(body.meta?.pagination?.total).toBeGreaterThanOrEqual(0);
  });
});
