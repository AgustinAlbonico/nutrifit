# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: flujos\crear-turno-staff.spec.ts >> Flujo: Crear turno por staff >> nutricionista no puede seleccionar un socio sin ficha
- Location: e2e\flujos\crear-turno-staff.spec.ts:75:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.fill: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByTestId('input-buscar-socio')

```

# Page snapshot

```yaml
- generic [ref=e2]:
  - main [ref=e3]:
    - generic [ref=e4]:
      - generic [ref=e5]:
        - generic [ref=e6]: Iniciar sesión
        - paragraph [ref=e7]: Nutrifit Supervisor
      - generic [ref=e9]:
        - textbox "Email" [ref=e11]
        - textbox "Contraseña" [ref=e13]
        - button "Entrar" [ref=e14]
  - region "Notifications alt+T"
```

# Test source

```ts
  1   | import { expect, test, type Page } from '@playwright/test';
  2   | 
  3   | import { login } from '../helpers/auth.helper';
  4   | import { USUARIOS_PRUEBA } from '../helpers/users';
  5   | 
  6   | async function seleccionarPrimerSlotDisponible(page: Page): Promise<string> {
  7   |   const botonFecha = page.getByRole('button', {
  8   |     name: /Seleccionar fecha|\d{1,2} de .+ de \d{4}/,
  9   |   });
  10  | 
  11  |   await botonFecha.first().click();
  12  | 
  13  |   const botonesCalendario = await page.locator('button').evaluateAll((els) => {
  14  |     return els
  15  |       .map((el, indice) => ({
  16  |         indice,
  17  |         aria: el.getAttribute('aria-label') ?? '',
  18  |       }))
  19  |       .filter((item) =>
  20  |         /lunes|martes|miércoles|jueves|viernes|sábado|domingo/i.test(
  21  |           item.aria,
  22  |         ),
  23  |       );
  24  |   });
  25  | 
  26  |   for (const boton of botonesCalendario) {
  27  |     await page.locator('button').nth(boton.indice).click();
  28  |     await page.waitForTimeout(700);
  29  | 
  30  |     const slotsLibres = await page.locator('[data-testid^="slot-"]:not([disabled])').evaluateAll(
  31  |       (els) => els.map((el) => el.getAttribute('data-testid')).filter(Boolean) as string[],
  32  |     );
  33  | 
  34  |     if (slotsLibres.length > 0) {
  35  |       await page.getByTestId(slotsLibres[0]!).click();
  36  |       return slotsLibres[0]!;
  37  |     }
  38  | 
  39  |     await botonFecha.first().click();
  40  |   }
  41  | 
  42  |   throw new Error('No se encontró ningún slot libre para el flujo E2E de staff.');
  43  | }
  44  | 
  45  | test.describe('Flujo: Crear turno por staff', () => {
  46  |   test('recepción puede crear turno para socio sin ficha y ve warning + confirmación', async ({
  47  |     page,
  48  |   }) => {
  49  |     await login(page, USUARIOS_PRUEBA.RECEPCIONISTA_CENTRAL);
  50  | 
  51  |     await page.goto('/turnos/nuevo');
  52  |     await expect(
  53  |       page.getByRole('heading', { name: /Asignar turno a un socio/i }),
  54  |     ).toBeVisible();
  55  | 
  56  |     await page.getByTestId('input-buscar-socio').fill('TestE2E');
  57  |     await expect(page.getByText(/Ficha medica incompleta/i)).toBeVisible();
  58  |     await page.getByTestId('socio-item-18').click();
  59  | 
  60  |     await page.getByTestId('select-nutricionista').selectOption('5');
  61  |     await seleccionarPrimerSlotDisponible(page);
  62  | 
  63  |     await expect(page.getByRole('dialog')).toContainText('Confirmar turno');
  64  |     await page.getByTestId('boton-confirmar-modal').click();
  65  | 
  66  |     await expect(page.getByTestId('resumen-turno-creado')).toBeVisible();
  67  |     await expect(page.getByTestId('resumen-turno-creado')).toContainText(
  68  |       /Turno creado correctamente/i,
  69  |     );
  70  |     await expect(page.getByTestId('resumen-turno-creado')).toContainText(
  71  |       /El socio no tiene ficha completa/i,
  72  |     );
  73  |   });
  74  | 
  75  |   test('nutricionista no puede seleccionar un socio sin ficha', async ({
  76  |     page,
  77  |   }) => {
  78  |     await login(page, USUARIOS_PRUEBA.NUTRICIONISTA_CENTRAL);
  79  | 
  80  |     await page.goto('/turnos/nuevo');
> 81  |     await page.getByTestId('input-buscar-socio').fill('TestE2E');
      |                                                  ^ Error: locator.fill: Test timeout of 30000ms exceeded.
  82  | 
  83  |     const socioBloqueado = page.getByTestId('socio-item-18');
  84  |     await expect(socioBloqueado).toBeDisabled();
  85  |     await expect(page.getByText(/Ficha incompleta: no se puede asignar/i)).toBeVisible();
  86  |   });
  87  | 
  88  |   test('admin puede acceder a /turnos/nuevo', async ({ page }) => {
  89  |     await login(page, USUARIOS_PRUEBA.ADMIN_CENTRAL);
  90  | 
  91  |     await page.goto('/turnos/nuevo');
  92  | 
  93  |     await expect(
  94  |       page.getByRole('heading', { name: /Asignar turno a un socio/i }),
  95  |     ).toBeVisible();
  96  |   });
  97  | 
  98  |   test('socio ve acceso denegado en /turnos/nuevo', async ({ page }) => {
  99  |     await login(page, USUARIOS_PRUEBA.SOCIO_CENTRAL);
  100 | 
  101 |     await page.goto('/turnos/nuevo');
  102 | 
  103 |     await expect(page.getByText(/Acceso denegado/i)).toBeVisible();
  104 |   });
  105 | });
  106 | 
```