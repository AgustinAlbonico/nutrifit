import { test, expect, Page } from '@playwright/test';
import { USUARIOS_PRUEBA } from '../helpers/users';
import { login } from '../helpers/auth.helper';

/**
 * Tests de permisos denied - Usuario sin permisos
 * Asume que el RECEPCIONISTA_CENTRAL no tiene permisos de delete
 */
test.describe('Permisos: Usuario sin permisos', () => {
  test('no debe mostrar botones de editar en socios', async ({ page }) => {
    // Login como recepcionista sin permisos elevados (asumiendo config)
    const usuario = USUARIOS_PRUEBA.RECEPCIONISTA_CENTRAL;
    await login(page, usuario);

    await page.waitForLoadState('networkidle');

    // Ir a la lista de socios
    await page.goto('/socios');
    await page.waitForLoadState('networkidle');

    // Los botones de editar no deberian ser visibles
    const editButtons = page.locator('button:has-text("Editar"), [data-testid="edit-button"], .btn-edit');

    // Verificar que no hay botones de editar visibles
    await expect(editButtons).toHaveCount(0, { timeout: 5000 });
  });

  test('no debe mostrar botones de eliminar en socios', async ({ page }) => {
    const usuario = USUARIOS_PRUEBA.RECEPCIONISTA_CENTRAL;
    await login(page, usuario);

    await page.waitForLoadState('networkidle');

    await page.goto('/socios');
    await page.waitForLoadState('networkidle');

    // Los botones de eliminar no deberian ser visibles
    const deleteButtons = page.locator('button:has-text("Eliminar"), [data-testid="delete-button"], .btn-delete');

    await expect(deleteButtons).toHaveCount(0, { timeout: 5000 });
  });

  test('debe denegar acceso a pagina de permisos de usuario', async ({ page }) => {
    const usuario = USUARIOS_PRUEBA.RECEPCIONISTA_CENTRAL;
    await login(page, usuario);

    await page.waitForLoadState('networkidle');

    // Intentar acceder directamente a la pagina de permisos
    await page.goto('/admin/usuarios/2/permisos');
    await page.waitForLoadState('networkidle');

    // Verificar que fue redirigido (403, 404, o login)
    const url = page.url();
    const isDenied = url.includes('/login') || url.includes('403') || url.includes('404');

    if (!isDenied) {
      // Si no redirigio, debe mostrar mensaje de acceso denegado
      const accessDenied = page.locator('text=/acceso denegado|permiso|no autorizado|403/i');
      await expect(accessDenied.first()).toBeVisible({ timeout: 3000 });
    }
  });

  test('debe denegar acceso a crear usuarios', async ({ page }) => {
    const usuario = USUARIOS_PRUEBA.RECEPCIONISTA_CENTRAL;
    await login(page, usuario);

    await page.waitForLoadState('networkidle');

    // Intentar acceder a crear usuario
    await page.goto('/admin/usuarios/nuevo');
    await page.waitForLoadState('networkidle');

    // Verificar que fue redirigido o mostro error
    const url = page.url();
    const isDenied = url.includes('/login') || url.includes('403') || url.includes('404');

    if (!isDenied) {
      const accessDenied = page.locator('text=/acceso denegado|permiso|no autorizado|403/i');
      await expect(accessDenied.first()).toBeVisible({ timeout: 3000 });
    }
  });

  test('debe denegar acceso a eliminar socios via API', async ({ page, request }) => {
    const usuario = USUARIOS_PRUEBA.RECEPCIONISTA_CENTRAL;
    await login(page, usuario);

    // Obtener token de autenticacion
    const token = await page.evaluate(() => {
      return localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
    });

    // Intentar hacer peticion DELETE a API de socios (endpoint protegido)
    const response = await request.delete('http://localhost:3000/api/socios/1', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    // Debe retornar 403 Forbidden
    expect(response.status()).toBe(403);
  });

  test('debe denegar acceso a paginas de administracion del sistema', async ({ page }) => {
    const usuario = USUARIOS_PRUEBA.SOCIO_CENTRAL;
    await login(page, usuario);

    await page.waitForLoadState('networkidle');

    // Intentar acceder a administracion de gyms
    await page.goto('/admin/gimnasios');
    await page.waitForLoadState('networkidle');

    // Verificar que no tiene acceso
    const url = page.url();
    const isDenied = url.includes('/login') || url.includes('403') || url.includes('404');

    if (!isDenied) {
      const accessDenied = page.locator('text=/acceso denegado|permiso|no autorizado/i');
      await expect(accessDenied.first()).toBeVisible({ timeout: 3000 });
    }
  });

  test('debe denegar acceso a cambiar permisos de usuarios', async ({ page }) => {
    const usuario = USUARIOS_PRUEBA.RECEPCIONISTA_CENTRAL;
    await login(page, usuario);

    await page.waitForLoadState('networkidle');

    // Intentar acceder a la edicion de permisos
    await page.goto('/admin/usuarios/1/permisos');
    await page.waitForLoadState('networkidle');

    // Verificar que no puede ver el formulario de permisos
    const permisosForm = page.locator('[data-testid="permisos-form"], form:has-text("permiso")');
    await expect(permisosForm).toHaveCount(0, { timeout: 3000 });

    // Debe mostrar mensaje de acceso denegado o redirigir
    const url = page.url();
    expect(url.includes('/login') || url.includes('403') || url.includes('404')).toBeTruthy();
  });

  test('SOCIO no debe ver menu de administracion', async ({ page }) => {
    const usuario = USUARIOS_PRUEBA.SOCIO_CENTRAL;
    await login(page, usuario);

    await page.waitForLoadState('networkidle');

    // El menu de administracion no debe ser visible
    const adminMenu = page.locator('text=/admin|administración/i');
    await expect(adminMenu).toHaveCount(0, { timeout: 3000 });
  });
});