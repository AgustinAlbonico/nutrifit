import { Page } from '@playwright/test';
import { USUARIOS_PRUEBA, UsuarioPrueba } from './users';

/**
 * Realiza login con el usuario especificado
 */
export async function login(page: Page, usuario: UsuarioPrueba): Promise<void> {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');

  // Completar formulario de login
  await page.getByRole('textbox', { name: 'Email' }).fill(usuario.email);
  await page.getByRole('textbox', { name: 'Contraseña' }).fill(usuario.password);

  // Enviar formulario
  await page.getByRole('button', { name: 'Entrar' }).click();

  // Esperar a que termine la redireccion
  await page.waitForLoadState('networkidle');
}

/**
 * Realiza logout del usuario actual
 */
export async function logout(page: Page): Promise<void> {
  // Buscar boton de logout en el sidebar o menu
  const logoutButton = page.locator('button:has-text("Cerrar sesión"), button:has-text("Logout"), [data-testid="logout-button"]');

  if (await logoutButton.first().isVisible()) {
    await logoutButton.first().click();
  } else {
    // Intentar con menu de usuario
    const userMenu = page.locator('[data-testid="user-menu"], button:has-text("Usuario")').first();
    if (await userMenu.isVisible()) {
      await userMenu.click();
      await page.waitForTimeout(300);
      await logoutButton.first().click();
    }
  }

  await page.waitForLoadState('networkidle');
}

/**
 * Crea una pagina autenticada con el usuario especificado
 */
export async function createAuthenticatedPage(
  page: Page,
  usuario: UsuarioPrueba
): Promise<void> {
  await login(page, usuario);
}

/**
 * Verifica si el usuario esta autenticado
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  // Verificar si hay elementos de usuario logueado
  const userInfo = page.locator('[data-testid="user-info"], .user-name, [data-testid="user-menu"]');
  return await userInfo.first().isVisible({ timeout: 3000 }).catch(() => false);
}

/**
 * Obtiene el rol del usuario actual desde la UI
 */
export async function getCurrentUserRole(page: Page): Promise<string | null> {
  const roleElement = page.locator('[data-testid="user-role"], .user-role, [data-testid="role-badge"]');
  if (await roleElement.isVisible()) {
    return await roleElement.textContent();
  }
  return null;
}
