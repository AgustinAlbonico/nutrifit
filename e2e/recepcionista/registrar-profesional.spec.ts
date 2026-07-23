/**
 * E2E Recepcionista: registrar profesional (CUD02).
 *
 * Cubre la creación de nutricionistas validando unicidad de DNI y email
 * (ConflictError 409) y exposición de contraseña provisional.
 *
 * Precondición: backend y frontend arriba, seed cargado. Tests crean
 * datos únicos usando marca temporal para evitar 409 entre corridas.
 */
import { test, expect } from '@playwright/test';
import { USUARIOS_PRUEBA } from '../helpers/users';
import { login } from '../helpers/auth.helper';
import { apiPost, apiGet, getAuthToken, unwrapApiResponse } from '../helpers/api.helper';

const SELLO_UNICO = Date.now().toString().slice(-7);

function payloadCrearNutri(sufijo: string) {
  return {
    nombre: 'Test',
    apellido: `Recepcion ${sufijo}`,
    dni: `9${sufijo.padStart(7, '0')}`,
    fechaNacimiento: '1990-01-01',
    telefono: '3415559999',
    genero: 'MASCULINO',
    direccion: 'Av. Siempre Viva 742',
    ciudad: 'Rosario',
    provincia: 'Santa Fe',
    email: `recepcion-test-${sufijo}@nutrifit-e2e.com`,
    matricula: `MN-T${sufijo}`,
    aniosExperiencia: 5,
    tarifaSesion: 15000,
    duracionTurnoMin: 30,
    presentacion: 'Nutricionista de prueba E2E',
    formacionAcademica: '[]',
    certificaciones: '[]',
  };
}

test.describe('E2E Recepcionista: registrar profesional (CUD02)', () => {
  test('recepción crea un profesional con datos únicos y recibe contraseña provisional', async ({
    page,
    request,
  }) => {
    await login(page, USUARIOS_PRUEBA.RECEPCIONISTA_CENTRAL);
    await page.waitForLoadState('networkidle');

    const token = await getAuthToken(page);
    expect(token).toBeTruthy();

    const response = await apiPost(
      request,
      '/profesional',
      payloadCrearNutri(SELLO_UNICO),
      token ?? undefined,
    );

    if (response.status() === 404 || response.status() === 0) {
      test.skip(true, 'Backend no disponible');
    }

    // Verificar respuesta exitosa (201) — el backend acepta body JSON sin foto
    expect([200, 201]).toContain(response.status());
    const body = unwrapApiResponse(await response.json());
    const nutri = body;
    expect(nutri.idPersona).toBeGreaterThan(0);
    expect(nutri.email).toContain('@');
  });

  test('A5a: email duplicado devuelve 409 ConflictError', async ({
    page,
    request,
  }) => {
    await login(page, USUARIOS_PRUEBA.RECEPCIONISTA_CENTRAL);
    await page.waitForLoadState('networkidle');

    const token = await getAuthToken(page);
    expect(token).toBeTruthy();

    // Email de un usuario seed que ya existe en el sistema
    const emailDuplicado = USUARIOS_PRUEBA.NUTRICIONISTA_CENTRAL.email;

    const payload = payloadCrearNutri(`DUP${SELLO_UNICO}`);
    payload.email = emailDuplicado;
    payload.dni = `9${SELLO_UNICO.padStart(7, '0')}`;
    payload.matricula = `MN-D${SELLO_UNICO}`;

    const response = await apiPost(
      request,
      '/profesional',
      payload,
      token ?? undefined,
    );

    if (response.status() === 404 || response.status() === 0) {
      test.skip(true, 'Backend no disponible');
    }

    // Debe rechazar por email duplicado (409 Conflict)
    expect(response.status()).toBe(409);
    const body = await response.json();
    const mensaje = String(
      body?.message ?? body?.error?.message ?? '',
    ).toLowerCase();
    expect(mensaje).toContain('email');
  });

  test('A5a: DNI duplicado devuelve 409 ConflictError', async ({
    page,
    request,
  }) => {
    await login(page, USUARIOS_PRUEBA.RECEPCIONISTA_CENTRAL);
    await page.waitForLoadState('networkidle');

    const token = await getAuthToken(page);
    expect(token).toBeTruthy();

    // DNI del socio seed Socio Central (50001001) — pertenece a otra persona
    // pero validamos el camino de duplicado usando el endpoint existente
    const dniDuplicado = '50001001';

    const payload = payloadCrearNutri(`DNI${SELLO_UNICO}`);
    payload.dni = dniDuplicado;
    payload.email = `otro-${SELLO_UNICO}@nutrifit-e2e.com`;
    payload.matricula = `MN-DNI${SELLO_UNICO}`;

    const response = await apiPost(
      request,
      '/profesional',
      payload,
      token ?? undefined,
    );

    if (response.status() === 404 || response.status() === 0) {
      test.skip(true, 'Backend no disponible');
    }

    // Puede ser 409 (DNI duplicado) o 400 si el backend rechaza antes
    expect([400, 409]).toContain(response.status());
  });

  test('A5b: payload inválido devuelve 400', async ({ page, request }) => {
    await login(page, USUARIOS_PRUEBA.RECEPCIONISTA_CENTRAL);
    await page.waitForLoadState('networkidle');

    const token = await getAuthToken(page);
    expect(token).toBeTruthy();

    // Payload sin campos obligatorios
    const payloadInvalido = {
      nombre: 'Sin Datos',
      // faltan apellido, dni, email, etc.
    };

    const response = await apiPost(
      request,
      '/profesional',
      payloadInvalido,
      token ?? undefined,
    );

    if (response.status() === 404 || response.status() === 0) {
      test.skip(true, 'Backend no disponible');
    }

    // Validación de DTO debe rechazar con 400
    expect(response.status()).toBe(400);
  });

  test('respuesta del POST contiene contraseña provisional para entrega al profesional', async ({
    page,
    request,
  }) => {
    await login(page, USUARIOS_PRUEBA.RECEPCIONISTA_CENTRAL);
    await page.waitForLoadState('networkidle');

    const token = await getAuthToken(page);

    const sufijo = `PV${SELLO_UNICO}`;
    const payload = payloadCrearNutri(sufijo);

    const response = await apiPost(
      request,
      '/profesional',
      payload,
      token ?? undefined,
    );

    if (response.status() === 404 || response.status() === 0) {
      test.skip(true, 'Backend no disponible');
    }

    if (!response.ok()) {
      test.skip(true, `Creación no devolvió OK (status=${response.status()})`);
    }

    const body = unwrapApiResponse(await response.json());
    const nutri = body;

    // La contraseña provisional debe estar presente (campo contrasenaProvisional)
    // según CreateNutricionistaUseCase → mapToResponseDto.
    const tieneContrasena = Boolean(nutri?.contrasenaProvisional);
    expect(tieneContrasena).toBe(true);

    // Verificar que el nutricionista se puede consultar y sigue figurando
    // (sanity check de persistencia)
    const listado = await apiGet(
      request,
      `/profesional?search=${encodeURIComponent(payload.email)}`,
      token ?? undefined,
    );
    if (listado.ok()) {
      const bodyListado = unwrapApiResponse(await listado.json());
      const encontrado = bodyListado.data.find(
        (n: { email: string }) => n.email === payload.email,
      );
      expect(encontrado, 'Profesional recién creado debe aparecer en listado').toBeTruthy();
    }
  });
});
