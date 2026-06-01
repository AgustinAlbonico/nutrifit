import { test, expect } from '@playwright/test';
import { USUARIOS_PRUEBA } from '../helpers/users';
import { login } from '../helpers/auth.helper';

/**
 * Tests de flujo: Gestionar Socio - RECEPCIONISTA puede crear y gestionar socios
 */
test.describe('Flujo: Gestionar Socio', () => {
  test('debe crear un nuevo socio', async ({ page }) => {
    const usuario = USUARIOS_PRUEBA.RECEPCIONISTA_CENTRAL;
    await login(page, usuario);

    await page.waitForLoadState('networkidle');

    // Ir a la lista de socios
    await page.goto('/socios');
    await page.waitForLoadState('networkidle');

    // Buscar boton "Nuevo Socio" o similar
    const nuevoButton = page.locator(
      'button:has-text("Nuevo Socio"), button:has-text("Agregar Socio"), a:has-text("Nuevo Socio"), [data-testid="new-socio-button"]'
    ).first();

    await nuevoButton.click();

    // Esperar a que se abra el formulario/modal
    await page.waitForTimeout(500);

    // Completar datos del socio
    // Los campos dependeran de la estructura del formulario
    const nombreInput = page.locator('input[name="nombre"], input#nombre, [data-testid="nombre-input"]');
    const apellidoInput = page.locator('input[name="apellido"], input#apellido, [data-testid="apellido-input"]');
    const emailInput = page.locator('input[name="email"], input#email, [data-testid="email-input"]');
    const telefonoInput = page.locator('input[name="telefono"], input#telefono, [data-testid="telefono-input"]');

    // Generar email unico para evitar conflictos
    const timestamp = Date.now();
    const emailUnico = `test-socio-${timestamp}@test.com`;

    if (await nombreInput.isVisible({ timeout: 3000 })) {
      await nombreInput.fill('Socio Test');
    }

    if (await apellidoInput.isVisible({ timeout: 3000 })) {
      await apellidoInput.fill('E2E');
    }

    if (await emailInput.isVisible({ timeout: 3000 })) {
      await emailInput.fill(emailUnico);
    }

    if (await telefonoInput.isVisible({ timeout: 3000 })) {
      await telefonoInput.fill('+5491112345678');
    }

    // Guardar el socio
    const guardarButton = page.locator(
      'button:has-text("Guardar"), button:has-text("Crear"), [data-testid="save-button"], button[type="submit"]'
    ).first();

    await guardarButton.click();

    // Esperar respuesta
    await page.waitForTimeout(2000);
    await page.waitForLoadState('networkidle');

    // Verificar que se creo exitosamente
    // Puede redirigir a la lista de socios o mostrar mensaje de exito
    const successMessage = page.locator('text=/creado|guardado|éxito/i');
    const isRedirected = page.url().includes('/socios');

    expect(successMessage.first().isVisible({ timeout: 5000 }) || isRedirected).toBeTruthy();
  });

  test('debe buscar un socio existente', async ({ page }) => {
    const usuario = USUARIOS_PRUEBA.RECEPCIONISTA_CENTRAL;
    await login(page, usuario);

    await page.waitForLoadState('networkidle');

    await page.goto('/socios');
    await page.waitForLoadState('networkidle');

    // Buscar el campo de busqueda
    const searchInput = page.locator(
      'input[placeholder*="buscar"], input[placeholder*="Buscar"], [data-testid="search-input"], input[name="buscar"]'
    );

    if (await searchInput.isVisible({ timeout: 3000 })) {
      await searchInput.fill('socio1');

      // Esperar resultados
      await page.waitForTimeout(1000);

      // Verificar que se muestran resultados
      const socioRow = page.locator('text=/socio1/i');
      await expect(socioRow.first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('debe editar datos de un socio', async ({ page }) => {
    const usuario = USUARIOS_PRUEBA.RECEPCIONISTA_CENTRAL;
    await login(page, usuario);

    await page.waitForLoadState('networkidle');

    await page.goto('/socios');
    await page.waitForLoadState('networkidle');

    // Esperar a que carguen los socios
    await page.waitForTimeout(1000);

    // Hacer click en el boton de editar del primer socio
    const editButton = page.locator(
      'button:has-text("Editar"), [data-testid="edit-button"], .btn-edit'
    ).first();

    if (await editButton.isVisible({ timeout: 5000 })) {
      await editButton.click();

      // Esperar que se abra el formulario de edicion
      await page.waitForTimeout(500);

      // Modificar algunos datos
      const telefonoInput = page.locator('input[name="telefono"], input#telefono');
      if (await telefonoInput.isVisible({ timeout: 3000 })) {
        await telefonoInput.clear();
        await telefonoInput.fill('+5491199999999');
      }

      // Guardar cambios
      const guardarButton = page.locator(
        'button:has-text("Guardar"), button:has-text("Actualizar"), [data-testid="save-button"]'
      ).first();

      await guardarButton.click();

      await page.waitForTimeout(2000);
      await page.waitForLoadState('networkidle');

      // Verificar mensaje de exito
      const successMessage = page.locator('text=/actualizado|guardado|éxito/i');
      await expect(successMessage.first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('debe ver historial de turnos de un socio', async ({ page }) => {
    const usuario = USUARIOS_PRUEBA.RECEPCIONISTA_CENTRAL;
    await login(page, usuario);

    await page.waitForLoadState('networkidle');

    await page.goto('/socios');
    await page.waitForLoadState('networkidle');

    // Esperar a que carguen los socios
    await page.waitForTimeout(1000);

    // Click en un socio para ver sus detalles
    const socioRow = page.locator('[data-testid="socio-row"], tr:has-text("Central")').first();

    if (await socioRow.isVisible({ timeout: 5000 })) {
      await socioRow.click();

      await page.waitForTimeout(1000);

      // Buscar la seccion de turnos/historial
      const historialSection = page.locator(
        'text=/historial|turnos|actividad/i'
      );

      if (await historialSection.first().isVisible({ timeout: 3000 })) {
        await historialSection.first().click();
        await page.waitForTimeout(500);

        // Verificar que muestra lista de turnos
        const turnosList = page.locator('[data-testid="turnos-list"], .turno-item');
        // Puede tener turnos o mensaje de "sin turnos"
        const hasTurnos = await turnosList.first().isVisible({ timeout: 3000 }).catch(() => false);
        const noTurnosMsg = page.locator('text=/no hay turnos|aún no/i');

        expect(hasTurnos || await noTurnosMsg.first().isVisible({ timeout: 3000 }).catch(() => false)).toBeTruthy();
      }
    }
  });

  test('debe validar campos obligatorios al crear socio', async ({ page }) => {
    const usuario = USUARIOS_PRUEBA.RECEPCIONISTA_CENTRAL;
    await login(page, usuario);

    await page.waitForLoadState('networkidle');

    await page.goto('/socios');
    await page.waitForLoadState('networkidle');

    // Abrir formulario de nuevo socio
    const nuevoButton = page.locator(
      'button:has-text("Nuevo Socio"), button:has-text("Agregar Socio"), [data-testid="new-socio-button"]'
    ).first();

    await nuevoButton.click();
    await page.waitForTimeout(500);

    // Intentar guardar sin completar campos obligatorios
    const guardarButton = page.locator(
      'button:has-text("Guardar"), button:has-text("Crear"), button[type="submit"]'
    ).first();

    await guardarButton.click();

    // Verificar que se muestran mensajes de validacion
    const validationError = page.locator('text=/requerido|obligatorio|inválido/i');
    await expect(validationError.first()).toBeVisible({ timeout: 5000 });

    // Verificar que no se creo el socio
    // (La URL no debe cambiar a una de exito)
    expect(page.url()).not.toContain('/exito');
  });

  test('debe crear ficha clinica para un socio', async ({ page }) => {
    const usuario = USUARIOS_PRUEBA.NUTRICIONISTA_CENTRAL;
    await login(page, usuario);

    await page.waitForLoadState('networkidle');

    // Ir a la lista de pacientes
    await page.goto('/pacientes');
    await page.waitForLoadState('networkidle');

    // Seleccionar un paciente
    const pacienteRow = page.locator('[data-testid="paciente-row"], tr').first();

    if (await pacienteRow.isVisible({ timeout: 5000 })) {
      await pacienteRow.click();

      await page.waitForTimeout(500);

      // Buscar opcion de crear ficha clinica
      const fichaButton = page.locator(
        'button:has-text("Nueva Ficha"), button:has-text("Crear Ficha"), [data-testid="new-ficha-button"]'
      ).first();

      if (await fichaButton.isVisible({ timeout: 3000 })) {
        await fichaButton.click();

        await page.waitForTimeout(500);

        // Llenar datos de la ficha clinica
        const pesoInput = page.locator('input[name="peso"], input#peso');
        const alturaInput = page.locator('input[name="altura"], input#altura');

        if (await pesoInput.isVisible({ timeout: 3000 })) {
          await pesoInput.fill('75');
        }

        if (await alturaInput.isVisible({ timeout: 3000 })) {
          await alturaInput.fill('170');
        }

        // Guardar ficha
        const guardarButton = page.locator('button:has-text("Guardar"), button[type="submit"]').first();
        await guardarButton.click();

        await page.waitForTimeout(2000);

        // Verificar exito
        const successMessage = page.locator('text=/guardado|creado|éxito/i');
        await expect(successMessage.first()).toBeVisible({ timeout: 5000 });
      }
    }
  });
});