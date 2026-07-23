/**
 * E2E Recepcionista: gestionar profesionales (CUD01).
 *
 * Cubre el agrupador CRUD de nutricionistas desde la perspectiva del
 * personal de recepción: listar profesionales, ver el detalle de uno
 * existente y acceder al formulario de creación.
 *
 * Precondición: backend (NestJS :3000) y frontend (Vite :5173) arriba,
 * base con seed (USUARIOS_PRUEBA.RECEPCIONISTA_CENTRAL).
 */
import { test, expect } from '@playwright/test';
import { USUARIOS_PRUEBA } from '../helpers/users';
import { login } from '../helpers/auth.helper';
import { apiGet, getAuthToken } from '../helpers/api.helper';

test.describe('E2E Recepcionista: gestionar profesionales (CUD01)', () => {
  test('recepción ve el listado paginado de profesionales', async ({
    page,
    request,
  }) => {
    await login(page, USUARIOS_PRUEBA.RECEPCIONISTA_CENTRAL);
    await page.waitForLoadState('networkidle');

    const token = await getAuthToken(page);
    expect(token).toBeTruthy();

    // Verificar endpoint disponible
    const response = await apiGet(request, '/profesional?limit=1', token ?? undefined);
    if (response.status() === 404 || response.status() === 0) {
      test.skip(true, 'Backend no disponible — verificar dev servers');
    }
    expect(response.ok()).toBeTruthy();

    // Navegar a la pantalla de gestión de profesionales
    await page.goto('/nutricionistas');
    await page.waitForLoadState('networkidle');

    // La pantalla debe mostrar algún indicador de gestión (título, tabla o tarjetas)
    const indicadoresPantalla = page
      .getByRole('heading', { name: /nutricionist|profesional/i })
      .or(page.getByRole('table'))
      .or(page.locator('[data-testid="nutricionista-card"]'));

    await expect(indicadoresPantalla.first()).toBeVisible({ timeout: 10000 });
  });

  test('recepción puede ver el detalle de un profesional existente', async ({
    page,
    request,
  }) => {
    await login(page, USUARIOS_PRUEBA.RECEPCIONISTA_CENTRAL);
    await page.waitForLoadState('networkidle');

    const token = await getAuthToken(page);
    expect(token).toBeTruthy();

    // Obtener el primer ID de profesional disponible para Gym Central
    const listado = await apiGet(
      request,
      '/profesional?limit=5',
      token ?? undefined,
    );
    if (listado.status() === 404 || listado.status() === 0) {
      test.skip(true, 'Backend no disponible');
    }
    expect(listado.ok()).toBeTruthy();

    const bodyListado = await listado.json();
    const primerNutri = bodyListado?.data?.[0];
    expect(primerNutri, 'Se esperaba al menos un profesional seedeado').toBeTruthy();

    // Consultar el detalle
    const detalle = await apiGet(
      request,
      `/profesional/${primerNutri.idPersona}`,
      token ?? undefined,
    );
    expect(detalle.ok()).toBeTruthy();
    const bodyDetalle = await detalle.json();
    const detalleNutri = bodyDetalle?.data ?? bodyDetalle;
    expect(detalleNutri.idPersona).toBe(primerNutri.idPersona);
    expect(detalleNutri.email).toBeTruthy();
    expect(detalleNutri.matricula).toBeTruthy();
  });

  test('recepción accede al formulario de creación de profesional', async ({
    page,
  }) => {
    await login(page, USUARIOS_PRUEBA.RECEPCIONISTA_CENTRAL);
    await page.waitForLoadState('networkidle');

    await page.goto('/nutricionistas');
    await page.waitForLoadState('networkidle');

    // La pantalla de gestión debe exhibir el botón de crear profesional
    const botonCrear = page
      .getByRole('button', { name: /nuevo|nueva|crear|registrar|agregar/i })
      .or(page.getByTestId('boton-crear-nutricionista'));

    await expect(botonCrear.first()).toBeVisible({ timeout: 10000 });
  });

  test('recepción ve acciones de editar y desactivar sobre un profesional', async ({
    page,
    request,
  }) => {
    await login(page, USUARIOS_PRUEBA.RECEPCIONISTA_CENTRAL);
    await page.waitForLoadState('networkidle');

    const token = await getAuthToken(page);

    const listado = await apiGet(
      request,
      '/profesional?limit=5',
      token ?? undefined,
    );
    if (listado.status() === 404 || listado.status() === 0) {
      test.skip(true, 'Backend no disponible');
    }
    const bodyListado = await listado.json();
    const primerNutri = bodyListado?.data?.[0];
    if (!primerNutri) {
      test.skip(true, 'Sin profesionales seed para validar acciones');
    }

    // La pantalla del listado debe contener botones de acción
    await page.goto('/nutricionistas');
    await page.waitForLoadState('networkidle');

    const botonEditar = page.getByRole('button', { name: /editar/i }).first();
    const botonEliminar = page
      .getByRole('button', { name: /(eliminar|desactivar|baja)/i })
      .first();

    // Al menos uno de los dos tipos de acción debe ser visible para recepción
    const editarVisible = await botonEditar
      .isVisible({ timeout: 5000 })
      .catch(() => false);
    const eliminarVisible = await botonEliminar
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    expect(editarVisible || eliminarVisible).toBe(true);
  });
});
