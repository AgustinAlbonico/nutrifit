import { test, expect } from '@playwright/test';
import { USUARIOS_PRUEBA } from '../helpers/users';
import { login, logout } from '../helpers/auth.helper';

/**
 * Tests de autenticacion - Login y Logout
 */
test.describe('Autenticación', () => {
  test.beforeEach(async ({ page }) => {
    // Navegar a login antes de cada test
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
  });

  test('debe iniciar sesion como SUPERADMIN', async ({ page }) => {
    const usuario = USUARIOS_PRUEBA.SUPERADMIN;

    // Completar formulario
    await page.fill('input[name="email"]', usuario.email);
    await page.fill('input[name="password"]', usuario.password);

    // Enviar
    await page.click('button[type="submit"]');

    // Verificar redireccion a dashboard
    await page.waitForURL(/\/(dashboard|inicio|home)/);
    await page.waitForLoadState('networkidle');

    // Verificar que elementos del dashboard estan visibles
    await expect(page.locator('text=/bienvenido|dashboard/i').first()).toBeVisible({ timeout: 10000 });
  });

  test('debe iniciar sesion como ADMIN', async ({ page }) => {
    const usuario = USUARIOS_PRUEBA.ADMIN_CENTRAL;

    await page.fill('input[name="email"]', usuario.email);
    await page.fill('input[name="password"]', usuario.password);
    await page.click('button[type="submit"]');

    await page.waitForURL(/\/(dashboard|inicio|home|admin)/);
    await page.waitForLoadState('networkidle');

    // Verificar rol en la UI
    const roleBadge = page.locator('[data-testid="role-badge"], .role-badge');
    if (await roleBadge.isVisible()) {
      await expect(roleBadge).toContainText('ADMIN');
    }
  });

  test('debe iniciar sesion como RECEPCIONISTA', async ({ page }) => {
    const usuario = USUARIOS_PRUEBA.RECEPCIONISTA_CENTRAL;

    await page.fill('input[name="email"]', usuario.email);
    await page.fill('input[name="password"]', usuario.password);
    await page.click('button[type="submit"]');

    await page.waitForURL(/\/(dashboard|inicio|home)/);
    await page.waitForLoadState('networkidle');

    // Verificar que el menu de socios este disponible
    await expect(page.locator('text=/socios/i').first()).toBeVisible({ timeout: 5000 });
  });

  test('debe fallar login con contrasena incorrecta', async ({ page }) => {
    const usuario = USUARIOS_PRUEBA.SOCIO_CENTRAL;

    await page.fill('input[name="email"]', usuario.email);
    await page.fill('input[name="password"]', 'contrasena-incorrecta');
    await page.click('button[type="submit"]');

    // Verificar mensaje de error
    const errorMessage = page.locator('text=/credenciales|incorrectas|inválidas|error/i');
    await expect(errorMessage.first()).toBeVisible({ timeout: 5000 });

    // Verificar que sigue en la pagina de login
    await expect(page).toHaveURL(/\/login/);
  });

  test('debe fallar login con usuario inexistente', async ({ page }) => {
    await page.fill('input[name="email"]', 'usuario-inexistente@test.com');
    await page.fill('input[name="password"]', '123456');
    await page.click('button[type="submit"]');

    // Verificar mensaje de error
    const errorMessage = page.locator('text=/credenciales|incorrectas|inválidas|error|no encontrado/i');
    await expect(errorMessage.first()).toBeVisible({ timeout: 5000 });

    await expect(page).toHaveURL(/\/login/);
  });

  test('debe cerrar sesion correctamente', async ({ page }) => {
    // Login primero
    const usuario = USUARIOS_PRUEBA.SUPERADMIN;
    await login(page, usuario);

    // Verificar que esta logueado
    await page.waitForURL(/\/(dashboard|inicio|home)/);
    await expect(page.locator('text=/bienvenido/i').first()).toBeVisible({ timeout: 5000 });

    // Logout
    await logout(page);

    // Verificar que fue redirigido al login
    await page.waitForURL(/\/login/);

    // Verificar que no puede acceder a paginas protegidas
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });
});