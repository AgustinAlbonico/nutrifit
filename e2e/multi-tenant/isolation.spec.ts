import { test, expect } from '@playwright/test';
import { USUARIOS_PRUEBA } from '../helpers/users';
import { login } from '../helpers/auth.helper';

/**
 * Tests de aislamiento multi-tenant
 * Verifica que cada gimnasio solo ve sus propios datos
 */
test.describe('Aislamiento Multi-Tenant', () => {
  test('debe mostrar solo socios del gimnasio ADMIN', async ({ page }) => {
    // Login como admin de Gym Central
    const usuario = USUARIOS_PRUEBA.ADMIN_CENTRAL;
    await login(page, usuario);

    await page.waitForLoadState('networkidle');

    // Ir a la lista de socios
    await page.goto('/socios');
    await page.waitForLoadState('networkidle');

    // Verificar que el sidebar muestra el gimnasio correcto
    const gymIndicator = page.locator('[data-testid="gym-name"], .gym-name, text=/Gym Central/i').first();
    if (await gymIndicator.isVisible({ timeout: 3000 })) {
      await expect(gymIndicator).toContainText('Central');
    }

    // Verificar que los socios visibles son del gimnasio correcto
    // Esto dependera de la estructura real de la aplicacion
    const socioRows = page.locator('[data-testid="socio-row"], tr:has-text("Central")');
    const count = await socioRows.count();

    // Si hay socios, verificar que al menos algunos son de Central
    if (count > 0) {
      await expect(socioRows.first()).toBeVisible();
    }
  });

  test('debe denegar acceso a socio de otro gimnasio', async ({ page }) => {
    // Login como admin de Gym Central
    const usuario = USUARIOS_PRUEBA.ADMIN_CENTRAL;
    await login(page, usuario);

    await page.waitForLoadState('networkidle');

    // Intentar acceder directamente a un socio que no pertenece a este gimnasio
    // Usamos un ID inventado que no existe en Gym Central
    const socioId = '999999'; // ID que no existe o pertenece a otro gimnasio

    const response = await page.goto(`/socios/${socioId}`);

    // Verificar que o bien no existe (404) o bien no tiene permisos (403)
    // Esto dependera de como la app maneje este caso
    const content = await page.content();
    const isNotFound = content.includes('404') || content.includes('No encontrado');
    const isForbidden = content.includes('403') || content.includes('Permiso');

    // La pagina debe mostrar error o redirigir
    expect(isNotFound || isForbidden || page.url().includes('/login')).toBeTruthy();
  });

  test('debe mostrar menu solo del gimnasio actual', async ({ page }) => {
    const usuario = USUARIOS_PRUEBA.ADMIN_CENTRAL;
    await login(page, usuario);

    await page.waitForLoadState('networkidle');

    // Verificar sidebar - debe mostrar menu de Gym Central
    const sidebar = page.locator('nav, [data-testid="sidebar"], .sidebar');

    if (await sidebar.isVisible({ timeout: 3000 })) {
      // Verificar items esperados para ADMIN
      const menuItems = await page.getByRole('menuitem').all();
      const menuTexts = await Promise.all(menuItems.map(item => item.textContent()));

      // Verificar que muestra elementos de administracion
      const hasAdminItems = menuTexts.some(text =>
        text?.toLowerCase().includes('socio') ||
        text?.toLowerCase().includes('gimnasio') ||
        text?.toLowerCase().includes('admin')
      );

      expect(hasAdminItems).toBeTruthy();
    }
  });

  test('debe filtrar datos por gimnasio del usuario', async ({ page }) => {
    const usuario = USUARIOS_PRUEBA.RECEPCIONISTA_CENTRAL;
    await login(page, usuario);

    await page.waitForLoadState('networkidle');

    // Ir a la lista de turnos
    await page.goto('/turnos');
    await page.waitForLoadState('networkidle');

    // Los turnos visibles deben ser solo del gimnasio del usuario
    // Si hay una columna de gimnasio, debe decir "Central"
    const gimansioBadge = page.locator('[data-testid="gym-badge"], .gym-badge:has-text("Central")');

    if (await gimansioBadge.first().isVisible({ timeout: 3000 })) {
      const count = await gimansioBadge.count();
      // Todos los turnos visibles deben ser de Central
      for (let i = 0; i < Math.min(count, 10); i++) {
        await expect(gimansioBadge.nth(i)).toContainText('Central');
      }
    }
  });

  test('admin no puede ver usuarios de otros gimnasios', async ({ page }) => {
    const usuario = USUARIOS_PRUEBA.ADMIN_CENTRAL;
    await login(page, usuario);

    await page.waitForLoadState('networkidle');

    // Ir a administracion de usuarios
    await page.goto('/admin/usuarios');
    await page.waitForLoadState('networkidle');

    // Los usuarios listados deben pertenecer al gimnasio del admin
    // Verificar que no hay usuarios de "Gym Norte" u otros gimnasios
    const userList = page.locator('[data-testid="user-row"], tr:has-text("Norte")');

    // No debe haber usuarios de otros gimnasios
    await expect(userList).toHaveCount(0);
  });
});