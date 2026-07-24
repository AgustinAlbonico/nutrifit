import { test, expect, type Page, type APIRequestContext } from '@playwright/test';
import { USUARIOS_PRUEBA } from '../helpers/users';

const API = 'http://localhost:3000';
const PASSWORD_DEFINITIVA = 'E2e-Test-2026!';

interface CredencialesUsuario {
  email: string;
  password: string;
}

function sufixUnico(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
}

function emailUnico(prefijo: string): string {
  return `${prefijo}-${sufixUnico()}@e2e-test.com`;
}

function dniUnico(): string {
  const base = Date.now().toString().slice(-8);
  return base.padStart(8, '0');
}

const DIAS_SEMANA_ES = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
];

function diaSemanaHoy(): string {
  return DIAS_SEMANA_ES[new Date().getDay()];
}

async function loginApi(
  request: APIRequestContext,
  email: string,
  password: string,
): Promise<{ token: string; rol: string; debeCambiarPassword: boolean }> {
  const res = await request.post(`${API}/auth/login`, {
    data: { email, password },
  });
  if (!res.ok()) {
    throw new Error(`Login API falló para ${email}: ${res.status()} ${await res.text()}`);
  }
  const body = await res.json();
  const data = body.data ?? body;
  return {
    token: data.token,
    rol: data.rol,
    debeCambiarPassword: data.debeCambiarPassword ?? false,
  };
}

async function establecerContrasenaApi(
  request: APIRequestContext,
  email: string,
  contrasenaProvisional: string,
): Promise<void> {
  const auth = await loginApi(request, email, contrasenaProvisional);
  if (!auth.debeCambiarPassword) return;
  const res = await request.put(`${API}/auth/establecer-contrasena`, {
    data: { nuevaContrasena: PASSWORD_DEFINITIVA },
    headers: { Authorization: `Bearer ${auth.token}` },
  });
  if (!res.ok()) {
    throw new Error(`establecer-contrasena falló para ${email}: ${res.status()}`);
  }
}

async function loginUi(page: Page, email: string, password: string): Promise<void> {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  await page.getByPlaceholder('Email').fill(email);
  await page.getByPlaceholder('Contraseña').fill(password);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await page.waitForURL(/\/(dashboard|inicio|home|admin|cambiar-contrasena)/, { timeout: 15000 });
  await page.waitForLoadState('networkidle');
}

async function logoutUi(page: Page): Promise<void> {
  await page.evaluate(() => {
    localStorage.removeItem('nutrifit.auth');
  });
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
}

async function extraerContrasenaProvisional(page: Page): Promise<string> {
  const modal = page.getByTestId('contrasena-provisional');
  await expect(modal).toBeVisible({ timeout: 10000 });
  const contrasena = (await modal.textContent())?.trim() ?? '';
  if (!contrasena) throw new Error('No se pudo extraer la contraseña provisional del modal');
  return contrasena;
}

async function cerrarModalContrasena(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Entendido' }).click();
  await expect(page.getByTestId('contrasena-provisional')).toHaveCount(0, { timeout: 5000 });
}

async function seleccionarFechaNacimiento(page: Page): Promise<void> {
  const trigger = page.getByRole('button', { name: /Seleccionar fecha/ }).last();
  await trigger.click();
  const grilla = page.locator('[role="grid"], table').last();
  await expect(grilla).toBeVisible({ timeout: 5000 });
  const celdaDia = page
    .locator('[role="gridcell"] button, [role="gridcell"]')
    .filter({ hasText: /^12$/ })
    .last();
  await celdaDia.click();
  await page.waitForTimeout(300);
}

function construirPlanIaMock(socioId: number) {
  const dias = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO'];
  const comidas = ['DESAYUNO', 'ALMUERZO', 'MERIENDA', 'CENA'];
  const caloriasObjetivo = 2000;

  const estructura = dias.map((dia) => ({
    dia,
    comidas: comidas.map((tipo) => ({
      tipo,
      alternativas: [
        {
          nombre: `${tipo} — ${dia}`,
          alimentos: [{ alimentoId: 1, cantidad: 150, unidad: 'g' }],
          calorias: Math.round(caloriasObjetivo / 4),
          proteinas: 30,
          carbohidratos: 60,
          grasas: 15,
        },
      ],
    })),
  }));

  const macrosPorDia = Object.fromEntries(
    dias.map((dia) => [
      dia,
      {
        calorias: caloriasObjetivo,
        proteinas: 120,
        carbohidratos: 250,
        grasas: 65,
        desvioPorcentaje: 1,
        banda: 'VERDE',
        detallePorMacro: {
          calorias: { real: caloriasObjetivo, objetivo: caloriasObjetivo, desvio: 1, banda: 'VERDE' },
          proteinas: { real: 120, objetivo: 120, desvio: 1, banda: 'VERDE' },
          carbohidratos: { real: 250, objetivo: 250, desvio: 1, banda: 'VERDE' },
          grasas: { real: 65, objetivo: 65, desvio: 1, banda: 'VERDE' },
        },
      },
    ]),
  );

  return {
    planAlimentacionId: 0,
    versionId: 0,
    numeroVersion: 1,
    socioId,
    plan: {
      estructura,
      macrosPorDia,
      razonamientoCumplimiento: {
        restriccionesCumplidas: [],
        restriccionesNoCumplidas: [],
      },
    },
    macros: {
      cumpleEstructura: true,
      diasFaltantes: [],
      macrosPorDia,
      bandaGlobal: 'VERDE',
      puedeAceptar: true,
    },
    validacion: {
      restriccionesCumplidas: [],
      restriccionesNoCumplidas: [],
      advertencias: [],
    },
    advertencias: [],
  };
}

test.describe.serial('Flujo E2E completo: alta de gimnasio hasta plan IA', () => {
  test('recorre el ciclo de vida multi-rol de punta a punta', async ({ page, request }) => {
    test.setTimeout(300000);

    const admin: CredencialesUsuario = { email: '', password: PASSWORD_DEFINITIVA };
    const nutricionista: CredencialesUsuario = { email: '', password: PASSWORD_DEFINITIVA };
    const recepcionista: CredencialesUsuario = { email: '', password: PASSWORD_DEFINITIVA };
    const socio: CredencialesUsuario = { email: '', password: PASSWORD_DEFINITIVA };

    let nutricionistaId = 0;
    let socioId = 0;
    let turnoId = 0;
    const nombreGimnasio = `Gym E2E ${sufixUnico()}`;

    await test.step('1. SUPERADMIN da de alta gimnasio + admin', async () => {
      await loginUi(page, USUARIOS_PRUEBA.SUPERADMIN.email, USUARIOS_PRUEBA.SUPERADMIN.password);
      await page.goto('/admin/gimnasios/nuevo');
      await page.waitForLoadState('networkidle');

      await page.getByLabel(/Nombre del gimnasio/).fill(nombreGimnasio);
      await page.getByLabel(/Dirección/).first().fill('Av. Test 1234');
      await page.getByLabel(/Teléfono/).first().fill('+54 11 1234-5678');
      await page.getByLabel(/Email de contacto/).fill(`contacto-${sufixUnico()}@e2e-test.com`);
      await page.getByRole('button', { name: 'Siguiente' }).first().click();

      admin.email = emailUnico('admin');
      await page.getByLabel(/Nombre del administrador/).fill('Admin E2E');
      await page.getByLabel(/Email del administrador/).fill(admin.email);
      await page.getByRole('button', { name: 'Siguiente' }).first().click();

      await expect(page.getByText('Confirmar creación')).toBeVisible({ timeout: 5000 });
      await page.getByRole('button', { name: 'Crear Gimnasio' }).click();

      admin.password = await extraerContrasenaProvisional(page);
      await cerrarModalContrasena(page);
      await logoutUi(page);
    });

    await test.step('2. ADMIN crea nutricionista y recepcionista', async () => {
      await establecerContrasenaApi(request, admin.email, admin.password);
      await loginUi(page, admin.email, PASSWORD_DEFINITIVA);

      nutricionista.email = emailUnico('nutri');
      await page.goto('/nutricionistas');
      await page.waitForLoadState('networkidle');
      await page.getByRole('button', { name: 'Nuevo nutricionista' }).click();
      await expect(page.getByRole('dialog').getByText('Nuevo nutricionista')).toBeVisible({
        timeout: 5000,
      });

      await page.locator('#crear-nombre').fill('Nutri E2E');
      await page.locator('#crear-apellido').fill('Test');
      await page.locator('#crear-dni').fill(dniUnico());
      await seleccionarFechaNacimiento(page);
      await page.locator('#crear-telefono').fill('+5491112345678');
      await page.locator('#crear-direccion').fill('Calle Test 100');
      await page.locator('#crear-ciudad').fill('Rosario');
      await page.locator('#crear-provincia').fill('Santa Fe');
      await page.locator('#crear-email').fill(nutricionista.email);
      await page.locator('#crear-matricula').fill(`MN-${sufixUnico().slice(0, 6).toUpperCase()}`);
      await page.locator('#crear-anios').fill('5');
      await page.locator('#crear-tarifa').fill('5000');

      await page.getByRole('button', { name: 'Crear nutricionista' }).click();
      nutricionista.password = await extraerContrasenaProvisional(page);
      await cerrarModalContrasena(page);

      recepcionista.email = emailUnico('recep');
      await page.goto('/recepcionistas');
      await page.waitForLoadState('networkidle');
      await page.getByRole('button', { name: 'Nuevo recepcionista' }).click();
      await expect(page.getByRole('dialog').getByText('Nuevo recepcionista')).toBeVisible({
        timeout: 5000,
      });

      await page.locator('#crear-nombre').fill('Recep E2E');
      await page.locator('#crear-apellido').fill('Test');
      await page.locator('#crear-dni').fill(dniUnico());
      await seleccionarFechaNacimiento(page);
      await page.locator('#crear-telefono').fill('+5491187654321');
      await page.locator('#crear-direccion').fill('Calle Recep 200');
      await page.locator('#crear-ciudad').fill('Rosario');
      await page.locator('#crear-provincia').fill('Santa Fe');
      await page.locator('#crear-email').fill(recepcionista.email);

      await page.getByRole('button', { name: 'Crear recepcionista' }).click();
      recepcionista.password = await extraerContrasenaProvisional(page);
      await cerrarModalContrasena(page);
      await logoutUi(page);
    });

    await test.step('3. NUTRICIONISTA configura agenda semanal', async () => {
      await establecerContrasenaApi(request, nutricionista.email, nutricionista.password);
      await loginUi(page, nutricionista.email, PASSWORD_DEFINITIVA);

      const authNutri = await loginApi(request, nutricionista.email, PASSWORD_DEFINITIVA);
      const perfilRes = await request.get(`${API}/profesional/mi-perfil`, {
        headers: { Authorization: `Bearer ${authNutri.token}` },
      });
      const perfilBody = await perfilRes.json();
      nutricionistaId = (perfilBody.data ?? perfilBody).idPersona;

      await page.goto('/agenda');
      await page.waitForLoadState('networkidle');
      await expect(page.getByText('Configuración Semanal')).toBeVisible({ timeout: 8000 });

      const bloqueInicial = page.locator('[id^="agenda-dia-"]').first();
      const idBloque = await bloqueInicial.getAttribute('id');
      const sufijoBloque = idBloque?.replace('agenda-dia-', '') ?? '';

      await page.locator(`#agenda-dia-${sufijoBloque}`).selectOption({ label: diaSemanaHoy() });
      await page.locator(`#agenda-inicio-${sufijoBloque}`).fill('08:00');
      await page.locator(`#agenda-fin-${sufijoBloque}`).fill('20:00');
      await page.locator('#agenda-duracion-global').fill('30');

      await page.getByRole('button', { name: 'Guardar horarios' }).click();

      await expect(page.getByText(/Disponibilidad configurada/i).or(page.getByText(/slots disponibles/i))).toBeVisible({
        timeout: 10000,
      });
      await logoutUi(page);
    });

    await test.step('4. RECEPCIONISTA da de alta socio', async () => {
      await establecerContrasenaApi(request, recepcionista.email, recepcionista.password);
      await loginUi(page, recepcionista.email, PASSWORD_DEFINITIVA);

      socio.email = emailUnico('socio');
      await page.goto('/socios/nuevo');
      await page.waitForLoadState('networkidle');
      await expect(page.getByText('Registrar socio')).toBeVisible({ timeout: 5000 });

      await page.locator('#crear-nombre').fill('Socio E2E');
      await page.locator('#crear-apellido').fill('Test');
      await page.locator('#crear-dni').fill(dniUnico());
      await seleccionarFechaNacimiento(page);
      await page.locator('#crear-telefono').fill('+5491111111111');
      await page.locator('#crear-direccion').fill('Calle Socio 300');
      await page.locator('#crear-ciudad').fill('Rosario');
      await page.locator('#crear-provincia').fill('Santa Fe');
      await page.locator('#crear-email').fill(socio.email);

      await page.getByRole('button', { name: 'Crear socio' }).click();
      socio.password = await extraerContrasenaProvisional(page);
      await cerrarModalContrasena(page);
      await logoutUi(page);
    });

    await test.step('5. SOCIO carga ficha de salud (API) y saca turno', async () => {
      await establecerContrasenaApi(request, socio.email, socio.password);
      const authSocio = await loginApi(request, socio.email, PASSWORD_DEFINITIVA);

      const fichaRes = await request.put(`${API}/turnos/socio/ficha-salud`, {
        data: {
          altura: 175,
          peso: 78,
          nivelActividadFisica: 'MODERADO',
          objetivoPersonal: 'Bajar de peso y mejorar composición corporal',
          alergias: [],
          patologias: [],
          consentimiento: true,
        },
        headers: { Authorization: `Bearer ${authSocio.token}` },
      });
      if (!fichaRes.ok()) {
        throw new Error(`Ficha de salud falló: ${fichaRes.status()} ${await fichaRes.text()}`);
      }

      const socioRes = await request.get(`${API}/auth/perfil`, {
        headers: { Authorization: `Bearer ${authSocio.token}` },
      });
      const socioBody = await socioRes.json();
      socioId = (socioBody.data ?? socioBody).personaId ?? (socioBody.data ?? socioBody).idPersona;

      await loginUi(page, socio.email, PASSWORD_DEFINITIVA);
      await page.goto('/turnos/agendar');
      await page.waitForLoadState('networkidle');
      await expect(page.getByText('Agendar turno')).toBeVisible({ timeout: 8000 });

      const botonNutri = page.getByRole('button', { name: /Nutri E2E Test/ }).first();
      await expect(botonNutri).toBeVisible({ timeout: 10000 });
      await botonNutri.click();

      await page.waitForTimeout(1000);
      const primerSlot = page
        .getByRole('button', { name: /\d{2}:\d{2} - \d{2}:\d{2}/ })
        .filter({ hasText: /Disponible/ })
        .first();

      if (await primerSlot.isVisible({ timeout: 5000 }).catch(() => false)) {
        await primerSlot.click();
      } else {
        const manana = new Date();
        manana.setDate(manana.getDate() + 1);
        const triggerFecha = page.locator('button:has-text("Seleccionar fecha"), [class*="datepicker"] button').first();
        if (await triggerFecha.isVisible({ timeout: 3000 }).catch(() => false)) {
          await triggerFecha.click();
          await page.waitForTimeout(500);
        }
        const slotAlt = page
          .getByRole('button', { name: /\d{2}:\d{2} - \d{2}:\d{2}/ })
          .first();
        await expect(slotAlt).toBeVisible({ timeout: 5000 });
        await slotAlt.click();
      }

      await page.getByRole('button', { name: 'Reservar turno' }).click();

      await page.waitForURL(/\/turnos\/\d+\/confirmado/, { timeout: 15000 });
      const urlMatch = page.url().match(/\/turnos\/(\d+)\/confirmado/);
      expect(urlMatch).toBeTruthy();
      turnoId = Number(urlMatch![1]);
      await logoutUi(page);
    });

    await test.step('6. Check-in del turno (API) como nutricionista', async () => {
      const authNutri = await loginApi(request, nutricionista.email, PASSWORD_DEFINITIVA);
      const checkinRes = await request.post(`${API}/turnos/${turnoId}/check-in`, {
        headers: { Authorization: `Bearer ${authNutri.token}` },
      });
      if (!checkinRes.ok()) {
        throw new Error(`Check-in falló: ${checkinRes.status()} ${await checkinRes.text()}`);
      }
    });

    await test.step('7. NUTRICIONISTA completa mediciones y crea plan IA', async () => {
      await loginUi(page, nutricionista.email, PASSWORD_DEFINITIVA);

      await page.goto(`/profesional/consulta/${turnoId}`);
      await page.waitForLoadState('networkidle');
      await expect(page.getByText('Consulta Profesional')).toBeVisible({ timeout: 10000 });

      const inputPeso = page.locator('#peso').or(page.getByLabel(/peso/i).locator('input')).first();
      await expect(inputPeso).toBeVisible({ timeout: 10000 });
      await inputPeso.fill('76.5');

      const inputAltura = page.locator('#altura').or(page.getByLabel(/altura/i).locator('input')).first();
      if (await inputAltura.isVisible({ timeout: 3000 }).catch(() => false)) {
        await inputAltura.fill('175');
      }

      const botonGuardarMed = page.getByRole('button', { name: /Guardar mediciones/i }).first();
      if (await botonGuardarMed.isVisible({ timeout: 3000 }).catch(() => false)) {
        await botonGuardarMed.click();
        await expect(page.getByText(/Mediciones guardadas/i)).toBeVisible({ timeout: 10000 });
      }

      const authNutri = await loginApi(request, nutricionista.email, PASSWORD_DEFINITIVA);
      await request.post(`${API}/planes-alimentacion/crear-manual/${socioId}`, {
        headers: { Authorization: `Bearer ${authNutri.token}` },
      });

      await page.route('**/ia/plan-semanal*', async (route) => {
        if (route.request().method() !== 'POST') {
          return route.continue();
        }
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify(construirPlanIaMock(socioId)),
        });
      });

      await page.goto(`/profesional/plan/${socioId}/editar`);
      await page.waitForLoadState('networkidle');

      const botonGenerar = page.getByTestId('generar-plan-button').or(
        page.getByRole('button', { name: /Generar plan/i }),
      );
      if (await botonGenerar.isVisible({ timeout: 8000 }).catch(() => false)) {
        await botonGenerar.click();
        await expect(page.getByText(/LUNES|lunes|Desayuno|DESAYUNO/i)).toBeVisible({
          timeout: 15000,
        });
      }

      await logoutUi(page);
    });

    expect(admin.email).toBeTruthy();
    expect(nutricionista.email).toBeTruthy();
    expect(recepcionista.email).toBeTruthy();
    expect(socio.email).toBeTruthy();
    expect(nutricionistaId).toBeGreaterThan(0);
    expect(socioId).toBeGreaterThan(0);
    expect(turnoId).toBeGreaterThan(0);
  });
});
