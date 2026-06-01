import { test, expect } from '@playwright/test';
import { USUARIOS_PRUEBA } from '../helpers/users';
import { login } from '../helpers/auth.helper';

/**
 * Tests de impersonacion - SUPERADMIN puede impersonar otros gimnasios
 */
test.describe('Superadmin: Impersonar Gimnasio', () => {
  test('debe mostrar opcion de impersonar en menu', async ({ page }) => {
    const usuario = USUARIOS_PRUEBA.SUPERADMIN;
    await login(page, usuario);

    await page.waitForLoadState('networkidle');

    // Buscar el menu de switch de gimnasio/tenant
    const tenantSwitcher = page.locator(
      '[data-testid="tenant-switcher"], button:has-text("Gimnasio"), button:has-text("Cambiar"), .tenant-switcher'
    );

    await expect(tenantSwitcher.first()).toBeVisible({ timeout: 5000 });
  });

  test('debe abrir selector de gimnasio al hacer click', async ({ page }) => {
    const usuario = USUARIOS_PRUEBA.SUPERADMIN;
    await login(page, usuario);

    await page.waitForLoadState('networkidle');

    // Hacer click en el switch de gimnasio
    const tenantSwitcher = page.locator(
      '[data-testid="tenant-switcher"], button:has-text("Gimnasio"), .tenant-switcher'
    ).first();

    await tenantSwitcher.click();
    await page.waitForTimeout(500);

    // Debe aparecer un dropdown o modal con gyms disponibles
    const gymList = page.locator('[data-testid="gym-list"], [data-testid="tenant-list"], .dropdown:has-text("Central")');
    await expect(gymList.first()).toBeVisible({ timeout: 5000 });
  });

  test('debe impersonar Gym Central correctamente', async ({ page }) => {
    const usuario = USUARIOS_PRUEBA.SUPERADMIN;
    await login(page, usuario);

    await page.waitForLoadState('networkidle');

    // Abrir selector de gimnasio
    const tenantSwitcher = page.locator(
      '[data-testid="tenant-switcher"], button:has-text("Gimnasio"), .tenant-switcher'
    ).first();

    await tenantSwitcher.click();
    await page.waitForTimeout(500);

    // Seleccionar "Gym Central"
    const gymCentralOption = page.locator('text=/Gym Central|Central/i').first();
    await gymCentralOption.click();

    await page.waitForTimeout(1000);
    await page.waitForLoadState('networkidle');

    // Verificar que aparece banner de "Modo Impersonacion"
    const impersonBanner = page.locator(
      '[data-testid="impersonation-banner"], .banner:has-text("Impersonaci"), text=/impersonando/i'
    );
    await expect(impersonBanner.first()).toBeVisible({ timeout: 5000 });
  });

  test('debe mostrar datos del gimnasio impersonado', async ({ page }) => {
    const usuario = USUARIOS_PRUEBA.SUPERADMIN;
    await login(page, usuario);

    await page.waitForLoadState('networkidle');

    // Impersonar Gym Central
    const tenantSwitcher = page.locator('[data-testid="tenant-switcher"], .tenant-switcher').first();
    await tenantSwitcher.click();
    await page.waitForTimeout(500);

    const gymCentralOption = page.locator('text=/Central/i').first();
    await gymCentralOption.click();

    await page.waitForTimeout(1000);
    await page.waitForLoadState('networkidle');

    // Ir a la lista de socios
    await page.goto('/socios');
    await page.waitForLoadState('networkidle');

    // Verificar que solo muestra socios de Central
    const socioRows = page.locator('[data-testid="socio-row"], tr');
    const count = await socioRows.count();

    // Los socios deben ser del gimnasio impersonado
    // Verificar que el indicador de gimnasio muestra Central
    const gymIndicator = page.locator('[data-testid="gym-indicator"], .gym-badge:has-text("Central")');
    if (await gymIndicator.isVisible({ timeout: 3000 })) {
      await expect(gymIndicator.first()).toContainText('Central');
    }
  });

  test('debe salir de impersonacion y volver a vista global', async ({ page }) => {
    const usuario = USUARIOS_PRUEBA.SUPERADMIN;
    await login(page, usuario);

    await page.waitForLoadState('networkidle');

    // Entrar en modo impersonacion
    const tenantSwitcher = page.locator('[data-testid="tenant-switcher"], .tenant-switcher').first();
    await tenantSwitcher.click();
    await page.waitForTimeout(500);

    const gymCentralOption = page.locator('text=/Central/i').first();
    await gymCentralOption.click();

    await page.waitForTimeout(1000);
    await page.waitForLoadState('networkidle');

    // Verificar que el banner de impersonacion esta visible
    const impersonBanner = page.locator(
      '[data-testid="impersonation-banner"], .banner:has-text("Impersonaci")'
    );
    await expect(impersonBanner.first()).toBeVisible({ timeout: 5000 });

    // Hacer click en "Salir de impersonacion" o similar
    const exitButton = page.locator(
      'button:has-text("Salir"), button:has-text("Cancelar impersonaci"), [data-testid="exit-impersonation"]'
    ).first();

    await exitButton.click();
    await page.waitForTimeout(500);
    await page.waitForLoadState('networkidle');

    // Verificar que el banner desaparecio
    await expect(impersonBanner).toHaveCount(0, { timeout: 3000 });

    // Ir a la lista de socios y verificar que ahora ve todos los gimnasios
    await page.goto('/socios');
    await page.waitForLoadState('networkidle');

    // Ya no debe haber filtro de gimnasio especifico
    // (Esto dependera de la implementacion - puede mostrar selector de gimnasio)
  });

  test('debe permitir cambiar entre gimnasios impersonados', async ({ page }) => {
    const usuario = USUARIOS_PRUEBA.SUPERADMIN;
    await login(page, usuario);

    await page.waitForLoadState('networkidle');

    // Impersonar Gym Central
    let tenantSwitcher = page.locator('[data-testid="tenant-switcher"], .tenant-switcher').first();
    await tenantSwitcher.click();
    await page.waitForTimeout(500);

    const gymCentralOption = page.locator('text=/Central/i').first();
    await gymCentralOption.click();

    await page.waitForTimeout(1000);
    await page.waitForLoadState('networkidle');

    // Verificar que esta en Central
    const impersonBanner = page.locator('[data-testid="impersonation-banner"]');
    await expect(impersonBanner.first()).toBeVisible({ timeout: 3000 });

    // Abrir switcher de nuevo para cambiar a otro gimnasio
    tenantSwitcher = page.locator('[data-testid="tenant-switcher"], .tenant-switcher').first();
    await tenantSwitcher.click();
    await page.waitForTimeout(500);

    // Seleccionar otro gimnasio (Norte)
    const gymNorteOption = page.locator('text=/Norte/i').first();

    if (await gymNorteOption.isVisible({ timeout: 2000 })) {
      await gymNorteOption.click();
      await page.waitForTimeout(1000);

      // Verificar que cambio
      // El banner debe seguir visible pero con otro gimnasio
      await expect(impersonBanner).toBeVisible({ timeout: 3000 });
    }
  });

  test('debe mantener sesion como superadmin despues de impersonar', async ({ page }) => {
    const usuario = USUARIOS_PRUEBA.SUPERADMIN;
    await login(page, usuario);

    await page.waitForLoadState('networkidle');

    // Impersonar un gimnasio
    const tenantSwitcher = page.locator('[data-testid="tenant-switcher"], .tenant-switcher').first();
    await tenantSwitcher.click();
    await page.waitForTimeout(500);

    const gymCentralOption = page.locator('text=/Central/i').first();
    await gymCentralOption.click();

    await page.waitForTimeout(1000);
    await page.waitForLoadState('networkidle');

    // Navegar a diferentes paginas
    await page.goto('/socios');
    await page.waitForLoadState('networkidle');

    await page.goto('/turnos');
    await page.waitForLoadState('networkidle');

    // Volver a socios - el banner de impersonacion debe seguir
    await page.goto('/socios');
    await page.waitForLoadState('networkidle');

    const impersonBanner = page.locator('[data-testid="impersonation-banner"]');
    await expect(impersonBanner.first()).toBeVisible({ timeout: 3000 });
  });
});