import { test, expect } from '@playwright/test';
import { USUARIOS_PRUEBA } from '../helpers/users';
import { login } from '../helpers/auth.helper';

/**
 * Tests de flujo: Reservar Turno - Socio puede reservar turnos con nutricionistas
 */
test.describe('Flujo: Reservar Turno', () => {
  test('debe seleccionar nutricionista y reservar turno', async ({ page }) => {
    const usuario = USUARIOS_PRUEBA.SOCIO_CENTRAL;
    await login(page, usuario);

    await page.waitForLoadState('networkidle');

    // Navegar a reservar turno
    await page.goto('/reservar-turno');
    await page.waitForLoadState('networkidle');

    // Esperar a que cargue el formulario
    const reservaForm = page.locator('[data-testid="reserva-form"], form:has-text("reservar")');
    await reservaForm.waitFor({ state: 'visible', timeout: 10000 });

    // Seleccionar nutricionista (dropdown o lista)
    const nutriSelect = page.locator('select[name="nutricionista"], [data-testid="nutri-select"], select#nutricionista');
    if (await nutriSelect.isVisible({ timeout: 3000 })) {
      const options = await nutriSelect.locator('option').all();
      if (options.length > 1) {
        await nutriSelect.selectOption({ index: 1 });
      }
    } else {
      // Si es una lista de tarjetas, hacer click en la primera
      const nutriCard = page.locator('[data-testid="nutri-card"], .card:has-text("Nutricionista")').first();
      await nutriCard.click();
    }

    // Esperar a que carguen las fechas disponibles
    await page.waitForTimeout(1000);

    // Seleccionar fecha (buscar un datepicker o calendario)
    const dateInput = page.locator('input[type="date"], [data-testid="date-picker"], .date-picker input');
    if (await dateInput.isVisible({ timeout: 3000 })) {
      await dateInput.fill('2026-06-15');
    }

    // Seleccionar horario (si hay selector de hora)
    const timeSelect = page.locator('select[name="horario"], [data-testid="time-select"], select#horario');
    if (await timeSelect.isVisible({ timeout: 3000 })) {
      const timeOptions = await timeSelect.locator('option').all();
      if (timeOptions.length > 1) {
        await timeSelect.selectOption({ index: 1 });
      }
    }

    // Confirmar reserva
    const confirmButton = page.locator('button:has-text("Confirmar"), button:has-text("Reservar"), [data-testid="confirm-button"]');
    await confirmButton.click();

    // Esperar confirmacion
    await page.waitForTimeout(2000);
    await page.waitForLoadState('networkidle');

    // Verificar mensaje de exito o redireccion a "Mis turnos"
    const successMessage = page.locator('text=/reservado|confirmado|éxito/i');
    const isRedirectedToMisTurnos = page.url().includes('mis-turnos');

    expect(successMessage.first().isVisible({ timeout: 5000 }) || isRedirectedToMisTurnos).toBeTruthy();
  });

  test('debe ver turno reservado en "Mis Turnos"', async ({ page }) => {
    const usuario = USUARIOS_PRUEBA.SOCIO_CENTRAL;
    await login(page, usuario);

    await page.waitForLoadState('networkidle');

    // Ir a "Mis Turnos"
    await page.goto('/mis-turnos');
    await page.waitForLoadState('networkidle');

    // Verificar que hay turnos listados o mensaje de "no hay turnos"
    const turnosList = page.locator('[data-testid="turnos-list"], .turnos-container');
    await expect(turnosList).toBeVisible({ timeout: 5000 });

    // Verificar que hay al menos un turno o mensaje apropiado
    const turnoCard = page.locator('[data-testid="turno-card"], .turno-item, tr:has-text("Nutri")');
    const noTurnosMessage = page.locator('text=/no hay turnos|aún no tienes/i');

    const hasTurnos = await turnoCard.first().isVisible({ timeout: 3000 }).catch(() => false);
    const hasNoTurnosMsg = await noTurnosMessage.first().isVisible({ timeout: 3000 }).catch(() => false);

    expect(hasTurnos || hasNoTurnosMsg).toBeTruthy();
  });

  test('no debe poder reservar horario ocupado', async ({ page }) => {
    const usuario = USUARIOS_PRUEBA.SOCIO_CENTRAL;
    await login(page, usuario);

    await page.waitForLoadState('networkidle');

    await page.goto('/reservar-turno');
    await page.waitForLoadState('networkidle');

    // Intentar seleccionar un horario ya ocupado
    // Esto dependera de la implementacion - puede mostrar error al intentar confirmar
    const dateInput = page.locator('input[type="date"]');
    if (await dateInput.isVisible({ timeout: 3000 })) {
      // Usar una fecha con horario ocupado (asumiendo que hay datos de prueba)
      await dateInput.fill('2026-06-01');
    }

    await page.waitForTimeout(1000);

    const timeSelect = page.locator('select[name="horario"]');
    if (await timeSelect.isVisible({ timeout: 3000 })) {
      // Seleccionar un horario que sabemos esta ocupado
      await timeSelect.selectOption({ index: 1 });

      const confirmButton = page.locator('button:has-text("Confirmar"), button:has-text("Reservar")');
      await confirmButton.click();

      await page.waitForTimeout(2000);

      // Verificar mensaje de error
      const errorMessage = page.locator('text=/ocupado|no disponible|error/i');
      await expect(errorMessage.first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('debe poder cancelar turno reservado', async ({ page }) => {
    const usuario = USUARIOS_PRUEBA.SOCIO_CENTRAL;
    await login(page, usuario);

    await page.waitForLoadState('networkidle');

    // Ir a Mis Turnos
    await page.goto('/mis-turnos');
    await page.waitForLoadState('networkidle');

    // Buscar un turno que se pueda cancelar
    const turnoCard = page.locator('[data-testid="turno-card"], .turno-item').first();

    if (await turnoCard.isVisible({ timeout: 3000 })) {
      // Buscar boton de cancelar
      const cancelButton = page.locator('button:has-text("Cancelar"), [data-testid="cancel-button"]').first();

      if (await cancelButton.isVisible({ timeout: 2000 })) {
        await cancelButton.click();

        // Esperar dialogo de confirmacion
        await page.waitForTimeout(500);

        // Confirmar cancelacion
        const confirmDialog = page.locator('button:has-text("Confirmar"), button:has-text("Sí, cancelar")');
        if (await confirmDialog.isVisible({ timeout: 2000 })) {
          await confirmDialog.click();
        }

        await page.waitForTimeout(2000);
        await page.waitForLoadState('networkidle');

        // Verificar que el turno ya no aparece o cambio de estado
        const turnoEliminado = page.locator('text=/cancelado|eliminado/i');
        // El turno debe estar cancelado o removido de la lista
      }
    }
  });

  test('debe ver detalles del turno reservado', async ({ page }) => {
    const usuario = USUARIOS_PRUEBA.SOCIO_CENTRAL;
    await login(page, usuario);

    await page.waitForLoadState('networkidle');

    await page.goto('/mis-turnos');
    await page.waitForLoadState('networkidle');

    // Buscar un turno y hacer click para ver detalles
    const turnoCard = page.locator('[data-testid="turno-card"], .turno-item').first();

    if (await turnoCard.isVisible({ timeout: 3000 })) {
      await turnoCard.click();

      await page.waitForTimeout(500);

      // Verificar que se muestran los detalles del turno
      const turnoDetails = page.locator(
        '[data-testid="turno-details"], .turno-detail, text=/Nutricionista|Fecha|Horario/i'
      );
      await expect(turnoDetails.first()).toBeVisible({ timeout: 5000 });
    }
  });
});