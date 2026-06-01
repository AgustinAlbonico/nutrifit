import { test, expect } from '@playwright/test';
import { USUARIOS_PRUEBA } from '../helpers/users';
import { login } from '../helpers/auth.helper';

/**
 * Tests de permisos granted - Usuario con permisos completos
 */
test.describe('Permisos: Usuario con permisos completos', () => {
  test('debe mostrar botones de editar en socios', async ({ page }) => {
    const usuario = USUARIOS_PRUEBA.RECEPCIONISTA_CENTRAL;
    await login(page, usuario);

    await page.waitForLoadState('networkidle');

    // Ir a la lista de socios
    await page.goto('/socios');
    await page.waitForLoadState('networkidle');

    // Verificar que el boton de editar es visible
    const editButtons = page.locator('button:has-text("Editar"), [data-testid="edit-button"], .btn-edit');
    await expect(editButtons.first()).toBeVisible({ timeout: 5000 });
  });

  test('debe mostrar botones de eliminar en socios', async ({ page }) => {
    const usuario = USUARIOS_PRUEBA.RECEPCIONISTA_CENTRAL;
    await login(page, usuario);

    await page.waitForLoadState('networkidle');

    await page.goto('/socios');
    await page.waitForLoadState('networkidle');

    // Verificar que el boton de eliminar es visible
    const deleteButtons = page.locator('button:has-text("Eliminar"), [data-testid="delete-button"], .btn-delete');
    await expect(deleteButtons.first()).toBeVisible({ timeout: 5000 });
  });

  test('debe poder acceder a la pagina de permisos de un usuario', async ({ page }) => {
    const usuario = USUARIOS_PRUEBA.ADMIN_CENTRAL;
    await login(page, usuario);

    await page.waitForLoadState('networkidle');

    // Ir a administracion de usuarios
    await page.goto('/admin/usuarios');
    await page.waitForLoadState('networkidle');

    // Buscar un usuario especifico y hacer click en permisos
    const userRow = page.locator('[data-testid="user-row"]').first();
    await userRow.waitFor({ state: 'visible', timeout: 5000 });

    // Click en el boton de permisos del usuario
    const permisosButton = page.locator('button:has-text("Permisos"), [data-testid="permissions-button"]').first();
    await permisosButton.click();

    // Verificar que la URL cambio a la de permisos
    await page.waitForURL(/\/permisos|\/usuarios\/\d+\/permisos/);
    await page.waitForLoadState('networkidle');

    // Verificar que se muestran opciones de permisos
    const permisosForm = page.locator('[data-testid="permisos-form"], form:has-text("permiso")');
    await expect(permisosForm.first()).toBeVisible({ timeout: 5000 });
  });

  test('debe poder asignar grupo a un usuario', async ({ page }) => {
    const usuario = USUARIOS_PRUEBA.ADMIN_CENTRAL;
    await login(page, usuario);

    await page.waitForLoadState('networkidle');

    // Ir a la pagina de permisos de un usuario especifico
    // Asumimos que existe el usuario con ID 1 para el test
    await page.goto('/admin/usuarios/1/permisos');
    await page.waitForLoadState('networkidle');

    // Buscar el selector de grupo
    const grupoSelect = page.locator('select[name="grupo"], [data-testid="grupo-select"], select#grupo');
    await grupoSelect.waitFor({ state: 'visible', timeout: 5000 });

    // Seleccionar un grupo
    const options = await grupoSelect.locator('option').all();
    if (options.length > 1) {
      await grupoSelect.selectOption({ index: 1 });

      // Guardar cambios
      const guardarButton = page.locator('button:has-text("Guardar"), [data-testid="save-button"]');
      await guardarButton.click();

      // Verificar mensaje de exito
      const successMessage = page.locator('text=/guardado|éxito|actualizado/i');
      await expect(successMessage.first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('debe poder crear nuevos socios', async ({ page }) => {
    const usuario = USUARIOS_PRUEBA.RECEPCIONISTA_CENTRAL;
    await login(page, usuario);

    await page.waitForLoadState('networkidle');

    // Ir a la lista de socios
    await page.goto('/socios');
    await page.waitForLoadState('networkidle');

    // Verificar boton "Nuevo Socio" o similar
    const nuevoButton = page.locator('button:has-text("Nuevo"), [data-testid="new-socio-button"], a:has-text("Agregar Socio")');
    await expect(nuevoButton.first()).toBeVisible({ timeout: 5000 });

    // Click en el boton
    await nuevoButton.first().click();

    // Verificar que se abre un formulario o modal
    const form = page.locator('form:has-text("socio"), [data-testid="socio-form"], .modal');
    await expect(form.first()).toBeVisible({ timeout: 5000 });
  });

  test('debe tener acceso a funciones de administracion', async ({ page }) => {
    const usuario = USUARIOS_PRUEBA.ADMIN_CENTRAL;
    await login(page, usuario);

    await page.waitForLoadState('networkidle');

    // Verificar que existe menu de administracion
    const adminMenu = page.locator('text=/admin|administración/i');
    await expect(adminMenu.first()).toBeVisible({ timeout: 5000 });

    // Acceder a la seccion de administracion
    await adminMenu.first().click();
    await page.waitForLoadState('networkidle');

    // Verificar que muestra opciones de admin
    const adminOptions = page.locator('[data-testid="admin-panel"], nav:has-text("Usuarios")');
    await expect(adminOptions.first()).toBeVisible({ timeout: 5000 });
  });
});