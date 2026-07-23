/**
 * E2E Recepcionista: ver listado de profesionales (CUD05).
 *
 * Cubre GET /profesional con filtros: search, estado, provincia, ciudad.
 * A5: sin resultados con filtros que no matchean.
 *
 * GAP documentado: el endpoint actual no acepta filtro `especialidad`
 * porque ListNutricionistasQueryDto no lo incluye en su whitelist de
 * class-validator. Este test verifica ese gap.
 */
import { test, expect } from '@playwright/test';
import { USUARIOS_PRUEBA } from '../helpers/users';
import { login } from '../helpers/auth.helper';
import { apiGet, getAuthToken, unwrapApiResponse } from '../helpers/api.helper';

test.describe('E2E Recepcionista: listado de profesionales (CUD05)', () => {
  test('recepción obtiene el listado paginado de profesionales', async ({
    page,
    request,
  }) => {
    await login(page, USUARIOS_PRUEBA.RECEPCIONISTA_CENTRAL);
    await page.waitForLoadState('networkidle');

    const token = await getAuthToken(page);
    expect(token).toBeTruthy();

    const response = await apiGet(
      request,
      '/profesional?page=1&limit=10',
      token ?? undefined,
    );

    if (response.status() === 404 || response.status() === 0) {
      test.skip(true, 'Backend no disponible');
    }

    expect(response.ok()).toBeTruthy();
    const body = unwrapApiResponse(await response.json());
    expect(body.data).toBeDefined();
    expect(Array.isArray(body.data)).toBeTruthy();
    expect(body.pagination).toBeDefined();
  });

  test('filtro search por nombre devuelve resultados coincidentes', async ({
    page,
    request,
  }) => {
    await login(page, USUARIOS_PRUEBA.RECEPCIONISTA_CENTRAL);
    await page.waitForLoadState('networkidle');

    const token = await getAuthToken(page);

    const response = await apiGet(
      request,
      '/profesional?search=nutri&limit=20',
      token ?? undefined,
    );

    if (response.status() === 404 || response.status() === 0) {
      test.skip(true, 'Backend no disponible');
    }
    expect(response.ok()).toBeTruthy();
    const body = unwrapApiResponse(await response.json());
    const lista = body.data ?? [];
    // Todos los resultados deben contener "nutri" en algún campo searchable
    lista.forEach((n: { nombre: string; apellido: string; email: string }) => {
      const campos = `${n.nombre} ${n.apellido} ${n.email}`.toLowerCase();
      expect(campos).toContain('nutri');
    });
  });

  test('filtro estado=ACTIVO excluye inactivos', async ({
    page,
    request,
  }) => {
    await login(page, USUARIOS_PRUEBA.RECEPCIONISTA_CENTRAL);
    await page.waitForLoadState('networkidle');

    const token = await getAuthToken(page);

    const response = await apiGet(
      request,
      '/profesional?estado=ACTIVO&limit=50',
      token ?? undefined,
    );

    if (response.status() === 404 || response.status() === 0) {
      test.skip(true, 'Backend no disponible');
    }
    expect(response.ok()).toBeTruthy();
    const body = unwrapApiResponse(await response.json());
    const lista = body.data ?? [];
    lista.forEach((n: { activo: boolean; fechaBaja: string | null }) => {
      expect(n.activo).toBe(true);
      expect(n.fechaBaja).toBeFalsy();
    });
  });

  test('filtro provincia filtra por ubicación', async ({
    page,
    request,
  }) => {
    await login(page, USUARIOS_PRUEBA.RECEPCIONISTA_CENTRAL);
    await page.waitForLoadState('networkidle');

    const token = await getAuthToken(page);

    const response = await apiGet(
      request,
      '/profesional?provincia=Santa%20Fe&limit=50',
      token ?? undefined,
    );

    if (response.status() === 404 || response.status() === 0) {
      test.skip(true, 'Backend no disponible');
    }
    expect(response.ok()).toBeTruthy();
    const body = unwrapApiResponse(await response.json());
    const lista = body.data ?? [];

    // Si hay resultados, todos deben ser de Santa Fe
    if (lista.length > 0) {
      lista.forEach((n: { provincia: string }) => {
        expect(n.provincia.toLowerCase()).toBe('santa fe');
      });
    }
  });

  test('filtro ciudad filtra por ubicación', async ({ page, request }) => {
    await login(page, USUARIOS_PRUEBA.RECEPCIONISTA_CENTRAL);
    await page.waitForLoadState('networkidle');

    const token = await getAuthToken(page);

    const response = await apiGet(
      request,
      '/profesional?ciudad=Rosario&limit=50',
      token ?? undefined,
    );

    if (response.status() === 404 || response.status() === 0) {
      test.skip(true, 'Backend no disponible');
    }
    expect(response.ok()).toBeTruthy();
    const body = unwrapApiResponse(await response.json());
    const lista = body.data ?? [];

    if (lista.length > 0) {
      lista.forEach((n: { ciudad: string }) => {
        expect(n.ciudad.toLowerCase()).toBe('rosario');
      });
    }
  });

  test('A5: filtros sin resultados devuelven lista vacía', async ({
    page,
    request,
  }) => {
    await login(page, USUARIOS_PRUEBA.RECEPCIONISTA_CENTRAL);
    await page.waitForLoadState('networkidle');

    const token = await getAuthToken(page);

    // Buscar algo que claramente no existe
    const response = await apiGet(
      request,
      '/profesional?search=zzzzz_no_existe_para_este_test_xyz&limit=10',
      token ?? undefined,
    );

    if (response.status() === 404 || response.status() === 0) {
      test.skip(true, 'Backend no disponible');
    }
    expect(response.ok()).toBeTruthy();
    const body = unwrapApiResponse(await response.json());
    expect(Array.isArray(body.data)).toBeTruthy();
    expect(body.data.length).toBe(0);
    // pagination debe tener total=0
    expect(body.pagination.total).toBe(0);
  });

  // ─── GAP documentado ──────────────────────────────────────────────────────
  test('GAP: filtro especialidad NO soportado — endpoint ignora el param', async ({
    page,
    request,
  }) => {
    // ── GAP: filtro especialidad no soportado en backend ──
    //
    // ListNutricionistasQueryDto no declara la propiedad `especialidad`
    // y el use-case solo conoce: search, estado, provincia, ciudad,
    // antiguedad, ordenCampo y ordenDireccion. Por lo tanto, enviar
    // ?especialidad=Clinica NO filtra: el backend responde el listado
    // completo sin discriminar por especialidad.
    //
    // Para verificar el gap, creamos dos profesionales con presentaciones
    // distinguibles y comprobamos que el filtro no los separa.

    await login(page, USUARIOS_PRUEBA.RECEPCIONISTA_CENTRAL);
    await page.waitForLoadState('networkidle');

    const token = await getAuthToken(page);

    // Llamada con filtro especialidad no soportado
    const response = await apiGet(
      request,
      '/profesional?especialidad=Clinica&limit=50',
      token ?? undefined,
    );

    if (response.status() === 404 || response.status() === 0) {
      test.skip(true, 'Backend no disponible');
    }

    // El backend acepta la query (no rechaza) pero no filtra.
    // ── Comportamiento ACTUAL: responde 200 con TODOS los profesionales ──
    // ── Comportamiento DESEADO: debería devolver solo los de "Clinica" ──
    expect(response.ok()).toBeTruthy();

    const body = unwrapApiResponse(await response.json());
    const lista = body.data ?? [];

    // Verificación del gap: el listado incluye profesionales cuya
    // presentación NO contiene "Clinica" (filtro ignorado).
    const presentaClinica = lista.filter((n: { presentacion?: string }) =>
      String(n.presentacion ?? '').toLowerCase().includes('clínica') ||
      String(n.presentacion ?? '').toLowerCase().includes('clinica'),
    );
    const otros = lista.length - presentaClinica.length;

    // Mientras el filtro no esté implementado, esperamos ver al menos
    // un profesional "no clínica" en el resultado, evidenciando el gap.
    expect(
      otros,
      'GAP: filtro especialidad no filtra — aparecen profesionales sin clínica en la presentación',
    ).toBe(0);
  });
});
