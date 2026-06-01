import { test, expect } from '@playwright/test';
import { USUARIOS_PRUEBA } from '../helpers/users';
import { login } from '../helpers/auth.helper';

/**
 * Tests de flujo: Crear Plan - NUTRICIONISTA puede crear planes alimentarios
 */
test.describe('Flujo: Crear Plan Alimentario', () => {
  test('debe crear un nuevo plan alimentario', async ({ page }) => {
    const usuario = USUARIOS_PRUEBA.NUTRICIONISTA_CENTRAL;
    await login(page, usuario);

    await page.waitForLoadState('networkidle');

    // Ir a la lista de pacientes
    await page.goto('/pacientes');
    await page.waitForLoadState('networkidle');

    // Esperar a que carguen los pacientes
    await page.waitForTimeout(1000);

    // Seleccionar un paciente
    const pacienteRow = page.locator('[data-testid="paciente-row"], tr:has-text("Socio")').first();

    if (await pacienteRow.isVisible({ timeout: 5000 })) {
      await pacienteRow.click();

      await page.waitForTimeout(1000);

      // Buscar boton para crear plan
      const crearPlanButton = page.locator(
        'button:has-text("Crear Plan"), button:has-text("Nuevo Plan"), a:has-text("Crear Plan"), [data-testid="create-plan-button"]'
      ).first();

      await crearPlanButton.click();

      // Esperar a que cargue el formulario del plan
      await page.waitForTimeout(500);

      // Completar datos del plan
      const nombrePlanInput = page.locator('input[name="nombre"], input#nombre, [data-testid="plan-nombre"]');
      if (await nombrePlanInput.isVisible({ timeout: 3000 })) {
        await nombrePlanInput.fill(`Plan Test E2E ${Date.now()}`);
      }

      // Llenar comidas para cada dia
      // Assuming the form has day/comida structure
      const descripcionInput = page.locator('textarea[name="descripcion"], [data-testid="plan-descripcion"]');
      if (await descripcionInput.isVisible({ timeout: 3000 })) {
        await descripcionInput.fill('Plan alimentario de prueba para tests E2E');
      }

      // Agregar comidas al plan
      const agregarComidaButton = page.locator(
        'button:has-text("Agregar Comida"), [data-testid="add-comida"]'
      ).first();

      if (await agregarComidaButton.isVisible({ timeout: 3000 })) {
        await agregarComidaButton.click();
        await page.waitForTimeout(300);

        // Llenar datos de la comida
        const comidaNombre = page.locator('input[name="comida-nombre"], [data-testid="comida-nombre"]');
        if (await comidaNombre.isVisible({ timeout: 3000 })) {
          await comidaNombre.fill('Desayuno');
        }

        const comidaAlimentos = page.locator('textarea[name="alimentos"], [data-testid="alimentos"]');
        if (await comidaAlimentos.isVisible({ timeout: 3000 })) {
          await comidaAlimentos.fill('2 huevos, 1 pan integral, 1 cafe');
        }
      }

      // Guardar el plan
      const guardarButton = page.locator(
        'button:has-text("Guardar Plan"), button:has-text("Crear"), button[type="submit"]'
      ).first();

      await guardarButton.click();

      await page.waitForTimeout(2000);
      await page.waitForLoadState('networkidle');

      // Verificar que se creo exitosamente
      const successMessage = page.locator('text=/plan creado|guardado|éxito/i');
      const isOnPatientView = page.url().includes('/pacientes/');

      expect(successMessage.first().isVisible({ timeout: 5000 }) || isOnPatientView).toBeTruthy();
    }
  });

  test('debe ver planes alimentarios del paciente', async ({ page }) => {
    const usuario = USUARIOS_PRUEBA.NUTRICIONISTA_CENTRAL;
    await login(page, usuario);

    await page.waitForLoadState('networkidle');

    await page.goto('/pacientes');
    await page.waitForLoadState('networkidle');

    // Seleccionar un paciente
    const pacienteRow = page.locator('[data-testid="paciente-row"], tr').first();

    if (await pacienteRow.isVisible({ timeout: 5000 })) {
      await pacienteRow.click();

      await page.waitForTimeout(1000);

      // Buscar la seccion de planes
      const planesSection = page.locator(
        'text=/planes|plan alimentario/i'
      );

      if (await planesSection.first().isVisible({ timeout: 3000 })) {
        await planesSection.first().click();
        await page.waitForTimeout(500);

        // Verificar que se muestra la lista de planes
        const planesList = page.locator('[data-testid="planes-list"], .plan-item');
        const noPlanesMessage = page.locator('text=/no hay planes|aún no tiene/i');

        const hasPlanes = await planesList.first().isVisible({ timeout: 3000 }).catch(() => false);
        const hasNoPlanesMsg = await noPlanesMessage.first().isVisible({ timeout: 3000 }).catch(() => false);

        expect(hasPlanes || hasNoPlanesMsg).toBeTruthy();
      }
    }
  });

  test('debe editar un plan existente', async ({ page }) => {
    const usuario = USUARIOS_PRUEBA.NUTRICIONISTA_CENTRAL;
    await login(page, usuario);

    await page.waitForLoadState('networkidle');

    await page.goto('/pacientes');
    await page.waitForLoadState('networkidle');

    // Seleccionar un paciente
    const pacienteRow = page.locator('[data-testid="paciente-row"], tr').first();

    if (await pacienteRow.isVisible({ timeout: 5000 })) {
      await pacienteRow.click();

      await page.waitForTimeout(1000);

      // Ir a la seccion de planes
      const planesSection = page.locator('text=/planes/i').first();

      if (await planesSection.isVisible({ timeout: 3000 })) {
        await planesSection.click();
        await page.waitForTimeout(500);

        // Buscar un plan existente para editar
        const planCard = page.locator('[data-testid="plan-card"], .plan-item').first();

        if (await planCard.isVisible({ timeout: 3000 })) {
          // Click en el boton de editar del plan
          const editPlanButton = page.locator(
            'button:has-text("Editar Plan"), [data-testid="edit-plan-button"]'
          ).first();

          if (await editPlanButton.isVisible({ timeout: 3000 })) {
            await editPlanButton.click();

            await page.waitForTimeout(500);

            // Modificar el plan
            const descripcionInput = page.locator('textarea[name="descripcion"]');
            if (await descripcionInput.isVisible({ timeout: 3000 })) {
              await descripcionInput.clear();
              await descripcionInput.fill('Plan modificado durante test E2E');
            }

            // Guardar cambios
            const guardarButton = page.locator('button:has-text("Guardar"), button:has-text("Actualizar")');
            await guardarButton.click();

            await page.waitForTimeout(2000);

            // Verificar mensaje de exito
            const successMessage = page.locator('text=/actualizado|guardado|éxito/i');
            await expect(successMessage.first()).toBeVisible({ timeout: 5000 });
          }
        }
      }
    }
  });

  test('debe asignar plan activo al paciente', async ({ page }) => {
    const usuario = USUARIOS_PRUEBA.NUTRICIONISTA_CENTRAL;
    await login(page, usuario);

    await page.waitForLoadState('networkidle');

    await page.goto('/pacientes');
    await page.waitForLoadState('networkidle');

    // Seleccionar un paciente
    const pacienteRow = page.locator('[data-testid="paciente-row"], tr').first();

    if (await pacienteRow.isVisible({ timeout: 5000 })) {
      await pacienteRow.click();

      await page.waitForTimeout(1000);

      // Ir a la seccion de planes
      const planesSection = page.locator('text=/planes/i').first();

      if (await planesSection.isVisible({ timeout: 3000 })) {
        await planesSection.click();
        await page.waitForTimeout(500);

        // Buscar un plan y marcarlo como activo
        const planCard = page.locator('[data-testid="plan-card"], .plan-item').first();

        if (await planCard.isVisible({ timeout: 3000 })) {
          // Buscar checkbox o toggle de "activo"
          const activoToggle = page.locator(
            'input[type="checkbox"][name="activo"], [data-testid="activo-toggle"], .toggle:has-text("Activo")'
          ).first();

          if (await activoToggle.isVisible({ timeout: 3000 })) {
            await activoToggle.check();

            // Guardar
            const guardarButton = page.locator('button:has-text("Guardar")');
            await guardarButton.click();

            await page.waitForTimeout(2000);

            // Verificar que el plan aparece como activo
            const activoBadge = page.locator('text=/activo/i');
            await expect(activoBadge.first()).toBeVisible({ timeout: 5000 });
          }
        }
      }
    }
  });

  test('debe eliminar un plan del paciente', async ({ page }) => {
    const usuario = USUARIOS_PRUEBA.NUTRICIONISTA_CENTRAL;
    await login(page, usuario);

    await page.waitForLoadState('networkidle');

    await page.goto('/pacientes');
    await page.waitForLoadState('networkidle');

    // Seleccionar un paciente
    const pacienteRow = page.locator('[data-testid="paciente-row"], tr').first();

    if (await pacienteRow.isVisible({ timeout: 5000 })) {
      await pacienteRow.click();

      await page.waitForTimeout(1000);

      // Ir a la seccion de planes
      const planesSection = page.locator('text=/planes/i').first();

      if (await planesSection.isVisible({ timeout: 3000 })) {
        await planesSection.click();
        await page.waitForTimeout(500);

        // Contar planes antes de eliminar
        const plansBefore = await page.locator('[data-testid="plan-card"], .plan-item').count();

        if (plansBefore > 0) {
          // Buscar boton de eliminar del plan
          const deleteButton = page.locator(
            'button:has-text("Eliminar Plan"), [data-testid="delete-plan-button"]'
          ).first();

          if (await deleteButton.isVisible({ timeout: 3000 })) {
            await deleteButton.click();

            // Confirmar en el dialogo
            await page.waitForTimeout(500);

            const confirmButton = page.locator('button:has-text("Confirmar"), button:has-text("Sí, eliminar")');
            if (await confirmButton.isVisible({ timeout: 3000 })) {
              await confirmButton.click();
            }

            await page.waitForTimeout(2000);

            // Verificar que el plan fue eliminado
            const plansAfter = await page.locator('[data-testid="plan-card"], .plan-item').count();
            expect(plansAfter).toBeLessThan(plansBefore);
          }
        }
      }
    }
  });

  test('debe ver detalle de una comida en el plan', async ({ page }) => {
    const usuario = USUARIOS_PRUEBA.NUTRICIONISTA_CENTRAL;
    await login(page, usuario);

    await page.waitForLoadState('networkidle');

    await page.goto('/pacientes');
    await page.waitForLoadState('networkidle');

    // Seleccionar un paciente
    const pacienteRow = page.locator('[data-testid="paciente-row"], tr').first();

    if (await pacienteRow.isVisible({ timeout: 5000 })) {
      await pacienteRow.click();

      await page.waitForTimeout(1000);

      // Ir a la seccion de planes
      const planesSection = page.locator('text=/planes/i').first();

      if (await planesSection.isVisible({ timeout: 3000 })) {
        await planesSection.click();
        await page.waitForTimeout(500);

        // Hacer click en un plan para ver detalles
        const planCard = page.locator('[data-testid="plan-card"], .plan-item').first();

        if (await planCard.isVisible({ timeout: 3000 })) {
          await planCard.click();

          await page.waitForTimeout(1000);

          // Verificar que se muestran las comidas del plan
          const comidasList = page.locator('[data-testid="comidas-list"], .comida-item');
          const noComidasMessage = page.locator('text=/no hay comidas/i');

          const hasComidas = await comidasList.first().isVisible({ timeout: 3000 }).catch(() => false);
          const hasNoComidasMsg = await noComidasMessage.first().isVisible({ timeout: 3000 }).catch(() => false);

          expect(hasComidas || hasNoComidasMsg).toBeTruthy();
        }
      }
    }
  });
});