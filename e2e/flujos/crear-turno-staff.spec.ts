import { expect, test, type Page } from '@playwright/test';

import { login } from '../helpers/auth.helper';
import { USUARIOS_PRUEBA } from '../helpers/users';

async function seleccionarPrimerSlotDisponible(page: Page): Promise<string> {
  const botonFecha = page.getByRole('button', {
    name: /Seleccionar fecha|\d{1,2} de .+ de \d{4}/,
  });

  await botonFecha.first().click();

  const botonesCalendario = await page.locator('button').evaluateAll((els) => {
    return els
      .map((el, indice) => ({
        indice,
        aria: el.getAttribute('aria-label') ?? '',
      }))
      .filter((item) =>
        /lunes|martes|miércoles|jueves|viernes|sábado|domingo/i.test(
          item.aria,
        ),
      );
  });

  for (const boton of botonesCalendario) {
    await page.locator('button').nth(boton.indice).click();
    await page.waitForTimeout(700);

    const slotsLibres = await page.locator('[data-testid^="slot-"]:not([disabled])').evaluateAll(
      (els) => els.map((el) => el.getAttribute('data-testid')).filter(Boolean) as string[],
    );

    if (slotsLibres.length > 0) {
      await page.getByTestId(slotsLibres[0]!).click();
      return slotsLibres[0]!;
    }

    await botonFecha.first().click();
  }

  throw new Error('No se encontró ningún slot libre para el flujo E2E de staff.');
}

test.describe('Flujo: Crear turno por staff', () => {
  test('recepción puede crear turno para socio sin ficha y ve warning + confirmación', async ({
    page,
  }) => {
    await login(page, USUARIOS_PRUEBA.RECEPCIONISTA_CENTRAL);

    await page.goto('/turnos/nuevo');
    await expect(
      page.getByRole('heading', { name: /Asignar turno a un socio/i }),
    ).toBeVisible();

    await page.getByTestId('input-buscar-socio').fill('TestE2E');
    await expect(page.getByText(/Ficha medica incompleta/i)).toBeVisible();
    await page.getByTestId('socio-item-18').click();

    await page.getByTestId('select-nutricionista').selectOption('5');
    await seleccionarPrimerSlotDisponible(page);

    await expect(page.getByRole('dialog')).toContainText('Confirmar turno');
    await page.getByTestId('boton-confirmar-modal').click();

    await expect(page.getByTestId('resumen-turno-creado')).toBeVisible();
    await expect(page.getByTestId('resumen-turno-creado')).toContainText(
      /Turno creado correctamente/i,
    );
    await expect(page.getByTestId('resumen-turno-creado')).toContainText(
      /El socio no tiene ficha completa/i,
    );
  });

  test('nutricionista no puede seleccionar un socio sin ficha', async ({
    page,
  }) => {
    await login(page, USUARIOS_PRUEBA.NUTRICIONISTA_CENTRAL);

    await page.goto('/turnos/nuevo');
    await page.getByTestId('input-buscar-socio').fill('TestE2E');

    const socioBloqueado = page.getByTestId('socio-item-18');
    await expect(socioBloqueado).toBeDisabled();
    await expect(page.getByText(/Ficha incompleta: no se puede asignar/i)).toBeVisible();
  });

  test('admin puede acceder a /turnos/nuevo', async ({ page }) => {
    await login(page, USUARIOS_PRUEBA.ADMIN_CENTRAL);

    await page.goto('/turnos/nuevo');

    await expect(
      page.getByRole('heading', { name: /Asignar turno a un socio/i }),
    ).toBeVisible();
  });

  test('socio ve acceso denegado en /turnos/nuevo', async ({ page }) => {
    await login(page, USUARIOS_PRUEBA.SOCIO_CENTRAL);

    await page.goto('/turnos/nuevo');

    await expect(page.getByText(/Acceso denegado/i)).toBeVisible();
  });
});
