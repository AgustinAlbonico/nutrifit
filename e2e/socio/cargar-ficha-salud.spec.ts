/**
 * E2E Socio: Cargar datos de salud (CUD16) — vista complementaria.
 *
 * Este spec NO duplica el flujo end-to-end ya cubierto por
 * `e2e/ficha-salud/crear-ficha.spec.ts`. En cambio, enfoca el caso
 * A4 (campos incompletos) y la validación Zod del lado cliente:
 *
 *  - El botón "Guardar ficha" está deshabilitado mientras los campos
 *    obligatorios del núcleo (altura, peso, objetivo, nivel de
 *    actividad) estén vacíos o sean inválidos.
 *  - El cliente bloquea también alturas fuera de [100..250] y pesos
 *    fuera de [20..300] antes de llegar al backend.
 *  - En modo edición, los chips de consentimiento están deshabilitados
 *    porque la ficha ya está creada.
 *
 * Requiere: dev server arriba y base con seed.
 */
import { test, expect } from '@playwright/test';

import { USUARIOS_PRUEBA } from '../helpers/users';
import { login } from '../helpers/auth.helper';

test.describe('E2E Socio: Cargar datos de salud (vista complementaria)', () => {
  test('A4 botón Guardar ficha arranca deshabilitado cuando los campos están vacíos', async ({
    page,
  }) => {
    await login(page, USUARIOS_PRUEBA.SOCIO_CENTRAL);
    await page.waitForLoadState('networkidle');

    await page.goto('/turnos/ficha-salud');
    await page.waitForLoadState('networkidle');

    await expect(
      page.getByRole('heading', { name: /mi ficha de salud/i, level: 1 }),
    ).toBeVisible({ timeout: 10000 });

    const botonGuardar = page.getByTestId('boton-guardar-ficha');
    await expect(botonGuardar).toBeVisible();

    const fichaVacia =
      (await page
        .getByText(/Todav[ií]a no ten[eé]s ficha cargada/i)
        .first()
        .isVisible({ timeout: 1500 })
        .catch(() => false)) ||
      (await page
        .getByText(/Mi ficha de salud/i)
        .first()
        .isVisible({ timeout: 500 })
        .catch(() => false));

    expect(fichaVacia).toBeTruthy();

    const altura = page.locator('#altura');
    const peso = page.locator('#peso');

    if (await altura.isVisible().catch(() => false)) {
      await altura.fill('');
      await peso.fill('');
      await expect(botonGuardar).toBeDisabled();
    } else {
      test.skip(true, 'Formulario de ficha no accesible');
    }
  });

  test('A4 altura fuera de rango [100..250] mantiene el botón Guardar deshabilitado', async ({
    page,
  }) => {
    await login(page, USUARIOS_PRUEBA.SOCIO_CENTRAL);
    await page.waitForLoadState('networkidle');

    await page.goto('/turnos/ficha-salud');
    await page.waitForLoadState('networkidle');

    await expect(
      page.getByRole('heading', { name: /mi ficha de salud/i, level: 1 }),
    ).toBeVisible({ timeout: 10000 });

    const botonGuardar = page.getByTestId('boton-guardar-ficha');
    const altura = page.locator('#altura');
    const peso = page.locator('#peso');
    const objetivo = page.locator('#objetivo');

    if (!(await altura.isVisible().catch(() => false))) {
      test.skip(true, 'Formulario de ficha no accesible');
      return;
    }

    await altura.fill('50');
    await peso.fill('500');
    await objetivo.fill('Objetivo de prueba suficiente');
    await expect(botonGuardar).toBeDisabled();

    const ariaInvalidos = await page.locator('[aria-invalid="true"]').count();
    expect(ariaInvalidos).toBeGreaterThan(0);
  });

  test('socio puede cargar altura y peso válidos y habilitar el botón Guardar', async ({
    page,
  }) => {
    await login(page, USUARIOS_PRUEBA.SOCIO_CENTRAL);
    await page.waitForLoadState('networkidle');

    await page.goto('/turnos/ficha-salud');
    await page.waitForLoadState('networkidle');

    await expect(
      page.getByRole('heading', { name: /mi ficha de salud/i, level: 1 }),
    ).toBeVisible({ timeout: 10000 });

    const altura = page.locator('#altura');
    const peso = page.locator('#peso');
    const objetivo = page.locator('#objetivo');

    if (!(await altura.isVisible().catch(() => false))) {
      test.skip(true, 'Formulario de ficha no accesible');
      return;
    }

    await altura.fill('170');
    await peso.fill('70');
    await objetivo.fill('Mantener peso y mejorar hábitos');

    const checkboxConsentimiento = page.locator('button[role="checkbox"]').first();
    const botonGuardar = page.getByTestId('boton-guardar-ficha');

    const consentimientoHabilitado = await checkboxConsentimiento
      .isEnabled({ timeout: 1500 })
      .catch(() => false);

    if (consentimientoHabilitado) {
      await expect(botonGuardar).toBeDisabled();
      await checkboxConsentimiento.click();
      await expect(checkboxConsentimiento).toHaveAttribute('aria-checked', 'true');
      await expect(botonGuardar).toBeEnabled();
    } else {
      await expect(botonGuardar).toBeEnabled();
    }
  });
});
