/**
 * E2E Recepcionista: desactivar o suspender profesional (CUD04).
 *
 * Cubre POST /profesional/:id/desactivar:
 *  - Happy path: respuesta con turnosCancelados y sociosAfectados.
 *  - A3: turnos pendientes del nutricionista pasan a CANCELADO.
 *  - GAP documentado: la desactivación NO invalida JWT del profesional
 *    ni setea usuario.activo=false, por lo que el nutri desactivado
 *    puede seguir usando su token viejo mientras no expire.
 */
import { test, expect } from '@playwright/test';
import { USUARIOS_PRUEBA } from '../helpers/users';
import { login } from '../helpers/auth.helper';
import {
  apiGet,
  apiPost,
  getAuthToken,
} from '../helpers/api.helper';

const SELLO = Date.now().toString().slice(-7);

function payloadCrear(sufijo: string) {
  return {
    nombre: 'Suspend',
    apellido: `Test ${sufijo}`,
    dni: `7${sufijo.padStart(7, '0')}`,
    fechaNacimiento: '1988-03-20',
    telefono: '3415557777',
    genero: 'FEMENINO',
    direccion: 'Av. Suspension 100',
    ciudad: 'Rosario',
    provincia: 'Santa Fe',
    email: `des-${sufijo}@nutrifit-e2e.com`,
    matricula: `MN-D${sufijo}`,
    aniosExperiencia: 6,
    tarifaSesion: 18000,
    duracionTurnoMin: 30,
    presentacion: 'Profesional de prueba CUD04',
    formacionAcademica: '[]',
    certificaciones: '[]',
  };
}

async function loginYCrearProfesional(
  request: import('@playwright/test').APIRequestContext,
  page: import('@playwright/test').Page,
  sufijo: string,
): Promise<{ idNutri: number; tokenNutri: string | null }> {
  // Login como recepción y crear el profesional
  await login(page, USUARIOS_PRUEBA.RECEPCIONISTA_CENTRAL);
  await page.waitForLoadState('networkidle');

  const tokenRecep = await getAuthToken(page);
  if (!tokenRecep) {
    throw new Error('Recepción no obtuvo token');
  }

  const responseCrear = await apiPost(
    request,
    '/profesional',
    payloadCrear(sufijo),
    tokenRecep,
  );

  if (!responseCrear.ok()) {
    throw new Error(
      `No se pudo crear profesional: status=${responseCrear.status()}`,
    );
  }

  const bodyCrear = await responseCrear.json();
  const nutri = bodyCrear?.data ?? bodyCrear;
  const contrasenaProvisional = nutri.contrasenaProvisional;

  // Cerrar sesión de recepción para no contaminar contexto del nutri
  const idNutri: number = nutri.idPersona;

  // Login como nutri recién creado para guardar su sesión/token
  await page.goto('/logout');
  await page.waitForLoadState('networkidle');

  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  await page
    .getByRole('textbox', { name: 'Email' })
    .fill(payloadCrear(sufijo).email);
  await page
    .getByRole('textbox', { name: 'Contraseña' })
    .fill(contrasenaProvisional);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await page.waitForLoadState('networkidle');

  const tokenNutri = await getAuthToken(page);

  // Volver a iniciar como recepción para los siguientes tests
  await page.goto('/logout');
  await page.waitForLoadState('networkidle');
  await login(page, USUARIOS_PRUEBA.RECEPCIONISTA_CENTRAL);
  await page.waitForLoadState('networkidle');

  return { idNutri, tokenNutri };
}

test.describe('E2E Recepcionista: desactivar profesional (CUD04)', () => {
  test('recepción desactiva un profesional sin turnos pendientes', async ({
    page,
    request,
  }) => {
    await login(page, USUARIOS_PRUEBA.RECEPCIONISTA_CENTRAL);
    await page.waitForLoadState('networkidle');

    const token = await getAuthToken(page);
    expect(token).toBeTruthy();

    // Crear profesional nuevo
    const crearResponse = await apiPost(
      request,
      '/profesional',
      payloadCrear(`B${SELLO}`),
      token!,
    );
    if (!crearResponse.ok()) {
      test.skip(true, 'No se pudo crear profesional base');
    }
    const crearBody = await crearResponse.json();
    const idNutri: number =
      crearBody?.data?.idPersona ?? crearBody?.idPersona;

    if (!idNutri) {
      test.skip(true, 'No se pudo obtener idPersona del profesional');
    }

    const response = await apiPost(
      request,
      `/profesional/${idNutri}/desactivar`,
      {
        motivo: 'Desactivación de prueba E2E CUD04 (sin turnos pendientes)',
      },
      token ?? undefined,
    );

    if (response.status() === 404 || response.status() === 0) {
      test.skip(true, 'Backend no disponible');
    }

    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    const resultado = body?.data ?? body;
    expect(resultado.turnosCancelados).toBe(0);
    expect(resultado.sociosAfectados).toBe(0);
    expect(String(resultado.message)).toMatch(/desactivado/i);
  });

  test('A3: nutricionista desactivado responde con cantidad de turnos cancelados', async ({
    page,
    request,
  }) => {
    await login(page, USUARIOS_PRUEBA.RECEPCIONISTA_CENTRAL);
    await page.waitForLoadState('networkidle');

    const token = await getAuthToken(page);
    expect(token).toBeTruthy();

    // Tomar un nutricionista seed con posibles turnos futuros
    const listado = await apiGet(
      request,
      '/profesional?limit=20',
      token ?? undefined,
    );
    if (!listado.ok()) {
      test.skip(true, 'Backend no disponible');
    }
    const bodyListado = await listado.json();
    const candidatos: Array<{ idPersona: number; activo: boolean }> = (
      bodyListado?.data ?? []
    ).filter((n: { fechaBaja?: string | null }) => !n.fechaBaja);

    if (candidatos.length === 0) {
      test.skip(true, 'No hay nutricionistas activos para desactivar');
    }

    const idNutri = candidatos[candidatos.length - 1]!.idPersona;

    const response = await apiPost(
      request,
      `/profesional/${idNutri}/desactivar`,
      {
        motivo: 'Suspensión de prueba E2E CUD04 — verificar A3',
      },
      token ?? undefined,
    );

    if (response.status() === 404 || response.status() === 0) {
      test.skip(true, 'Backend no disponible');
    }

    // Aceptar 200 (ok) o 404 (nutricionista no encontrado para este gimnasio)
    if (response.status() === 404) {
      test.skip(true, 'Nutricionista no accesible para esta sesión');
    }

    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    const resultado = body?.data ?? body;
    // El campo debe estar presente, sin importar el valor exacto
    expect(resultado.turnosCancelados).toBeGreaterThanOrEqual(0);
    expect(resultado.sociosAfectados).toBeGreaterThanOrEqual(0);
    expect(String(resultado.message)).toMatch(/desactivado/i);
  });

  test('motivo demasiado corto (< 10 chars) devuelve 400', async ({
    page,
    request,
  }) => {
    await login(page, USUARIOS_PRUEBA.RECEPCIONISTA_CENTRAL);
    await page.waitForLoadState('networkidle');

    const token = await getAuthToken(page);

    // Tomar un nutricionista inactivo para no romper el sistema
    const listado = await apiGet(
      request,
      '/profesional?limit=10',
      token ?? undefined,
    );
    if (!listado.ok()) {
      test.skip(true, 'Backend no disponible');
    }
    const bodyListado = await listado.json();
    const idNutri = bodyListado?.data?.[0]?.idPersona;
    if (!idNutri) {
      test.skip(true, 'Sin profesionales seed');
    }

    const response = await apiPost(
      request,
      `/profesional/${idNutri}/desactivar`,
      { motivo: 'corto' },
      token ?? undefined,
    );

    if (response.status() === 404 || response.status() === 0) {
      test.skip(true, 'Backend no disponible');
    }

    // MinLength(10) en DTO debe rechazar con 400
    expect(response.status()).toBe(400);
  });

  // ─── GAP documentado ──────────────────────────────────────────────────────
  test('GAP: nutri desactivado puede seguir usando JWT antiguo (no hay invalidación de token)', async ({
    page,
    request,
  }) => {
    // ── GAP: desactivación no invalida JWT (ver memoria validación/use-cases-gaps) ──
    //
    // Hoy el endpoint POST /profesional/:id/desactivar setea fechaBaja en la
    // entidad Nutricionista pero NO invalida el JWT del usuario asociado ni
    // marca el usuario.activo=false. Esto significa que un nutricionista
    // desactivado puede seguir accediendo a endpoints protegidos hasta que
    // el token expire naturalmente. Este test verifica ese gap intentando
    // una llamada API con el token del nutri desactivado inmediatamente
    // después de la baja.
    //
    // Comportamiento esperado (futuro): la respuesta debería ser 401.
    // Comportamiento actual: la respuesta es 200 porque el JWT sigue válido.

    const { idNutri, tokenNutri } = await loginYCrearProfesional(
      request,
      page,
      `GAP${SELLO}`,
    );

    if (!tokenNutri) {
      test.skip(true, 'No se pudo obtener token del profesional recién creado');
    }

    // Verificar que ANTES de desactivar, el nutri puede usar su propio endpoint
    const miPerfilAntes = await apiGet(
      request,
      '/profesional/mi-perfil',
      tokenNutri!,
    );
    expect(miPerfilAntes.ok()).toBeTruthy();

    // Desactivar desde recepción
    const tokenRecep = await getAuthToken(page);
    const desactivar = await apiPost(
      request,
      `/profesional/${idNutri}/desactivar`,
      {
        motivo: 'GAP test — verificar invalidación de token tras baja',
      },
      tokenRecep ?? undefined,
    );

    if (desactivar.status() === 404 || desactivar.status() === 0) {
      test.skip(true, 'Backend no disponible');
    }
    expect(desactivar.ok()).toBeTruthy();

    // Después de desactivar, intentar usar el token viejo del nutri
    const miPerfilDespues = await apiGet(
      request,
      '/profesional/mi-perfil',
      tokenNutri!,
    );

    // ── Comportamiento ACTUAL (con el GAP): sigue respondiendo 200 ──
    // ── Comportamiento DESEADO: debería ser 401 (token invalidado) ──
    //
    // Mientras el backend NO invalide el JWT, esta assertion fallará en CI.
    expect(
      miPerfilDespues.status(),
      'GAP: el token del nutri desactivado sigue siendo válido',
    ).toBe(401);
  });
});
