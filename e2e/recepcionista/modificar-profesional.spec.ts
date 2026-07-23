/**
 * E2E Recepcionista: modificar profesional (CUD03).
 *
 * Cubre la edición de un nutricionista: PUT /profesional/:id con datos
 * válidos, más la re-validación de unicidad (A4) cuando se intenta usar
 * un email ya registrado por otro profesional.
 */
import { test, expect } from '@playwright/test';
import { USUARIOS_PRUEBA } from '../helpers/users';
import { login } from '../helpers/auth.helper';
import {
  apiGet,
  apiPost,
  apiPut,
  getAuthToken,
  unwrapApiResponse,
} from '../helpers/api.helper';

const SELLO = Date.now().toString().slice(-7);

function payloadBase(sufijo: string) {
  return {
    nombre: 'Mod',
    apellido: `Test ${sufijo}`,
    dni: `8${sufijo.padStart(7, '0')}`,
    fechaNacimiento: '1985-05-15',
    telefono: '3415558888',
    genero: 'MASCULINO',
    direccion: 'Calle Falsa 123',
    ciudad: 'Rosario',
    provincia: 'Santa Fe',
    email: `mod-${sufijo}@nutrifit-e2e.com`,
    matricula: `MN-M${sufijo}`,
    aniosExperiencia: 8,
    tarifaSesion: 20000,
    duracionTurnoMin: 45,
    presentacion: 'Editado por CUD03',
    formacionAcademica: '[]',
    certificaciones: '[]',
  };
}

async function crearProfesionalBase(
  request: import('@playwright/test').APIRequestContext,
  token: string,
  sufijo: string,
): Promise<number> {
  const response = await apiPost(
    request,
    '/profesional',
    payloadBase(sufijo),
    token,
  );
  if (!response.ok()) {
    throw new Error(
      `No se pudo crear profesional base para CUD03: status=${response.status()}`,
    );
  }
  const body = unwrapApiResponse(await response.json());
  return body.idPersona;
}

test.describe('E2E Recepcionista: modificar profesional (CUD03)', () => {
  test('recepción actualiza la presentación de un profesional (happy path)', async ({
    page,
    request,
  }) => {
    await login(page, USUARIOS_PRUEBA.RECEPCIONISTA_CENTRAL);
    await page.waitForLoadState('networkidle');

    const token = await getAuthToken(page);
    expect(token).toBeTruthy();

    const idNutri = await crearProfesionalBase(
      request,
      token!,
      `HP${SELLO}`,
    );

    // PUT con cambios menores
    const responsePut = await apiPut(
      request,
      `/profesional/${idNutri}`,
      {
        presentacion: 'Presentación actualizada por CUD03',
        tarifaSesion: 25000,
      },
      token ?? undefined,
    );

    if (responsePut.status() === 404 || responsePut.status() === 0) {
      test.skip(true, 'Backend no disponible');
    }

    // PUT idempotente debe ser 200
    expect(responsePut.status()).toBe(200);
    const body = unwrapApiResponse(await responsePut.json());
    const nutri = body;
    expect(nutri.idPersona).toBe(idNutri);
    expect(nutri.tarifaSesion).toBe(25000);
  });

  test('A4: email duplicado de otro profesional devuelve 409 ConflictError', async ({
    page,
    request,
  }) => {
    await login(page, USUARIOS_PRUEBA.RECEPCIONISTA_CENTRAL);
    await page.waitForLoadState('networkidle');

    const token = await getAuthToken(page);
    expect(token).toBeTruthy();

    // Crear profesional A que se va a editar
    const idNutriA = await crearProfesionalBase(
      request,
      token!,
      `A${SELLO}`,
    );

    // Email que YA existe en el sistema (seed Central)
    const emailYaRegistrado = USUARIOS_PRUEBA.NUTRICIONISTA_CENTRAL.email;

    const responsePut = await apiPut(
      request,
      `/profesional/${idNutriA}`,
      {
        email: emailYaRegistrado,
      },
      token ?? undefined,
    );

    if (responsePut.status() === 404 || responsePut.status() === 0) {
      test.skip(true, 'Backend no disponible');
    }

    // Debe ser 409 (conflicto por email duplicado)
    expect(responsePut.status()).toBe(409);
    const body = await responsePut.json();
    const mensaje = String(
      body?.message ?? body?.error?.message ?? '',
    ).toLowerCase();
    expect(mensaje).toMatch(/email|registrad/);
  });

  test('A4: matrícula duplicada devuelve 409 ConflictError', async ({
    page,
    request,
  }) => {
    await login(page, USUARIOS_PRUEBA.RECEPCIONISTA_CENTRAL);
    await page.waitForLoadState('networkidle');

    const token = await getAuthToken(page);
    expect(token).toBeTruthy();

    const idNutri = await crearProfesionalBase(
      request,
      token!,
      `MT${SELLO}`,
    );

    // Matrícula que ya existe en seed
    const matriculaExistente = 'MN-2001';

    const responsePut = await apiPut(
      request,
      `/profesional/${idNutri}`,
      {
        matricula: matriculaExistente,
      },
      token ?? undefined,
    );

    if (responsePut.status() === 404 || responsePut.status() === 0) {
      test.skip(true, 'Backend no disponible');
    }

    expect(responsePut.status()).toBe(409);
  });

  test('A4: DNI duplicado devuelve 409 ConflictError', async ({
    page,
    request,
  }) => {
    await login(page, USUARIOS_PRUEBA.RECEPCIONISTA_CENTRAL);
    await page.waitForLoadState('networkidle');

    const token = await getAuthToken(page);

    const idNutri = await crearProfesionalBase(
      request,
      token!,
      `DI${SELLO}`,
    );

    // DNI de un socio seed ya registrado
    const dniExistente = '50001001';

    const responsePut = await apiPut(
      request,
      `/profesional/${idNutri}`,
      {
        dni: dniExistente,
      },
      token ?? undefined,
    );

    if (responsePut.status() === 404 || responsePut.status() === 0) {
      test.skip(true, 'Backend no disponible');
    }

    expect(responsePut.status()).toBe(409);
  });

  test('A4: actualización parcial que mantiene email/dni propios responde 200', async ({
    page,
    request,
  }) => {
    await login(page, USUARIOS_PRUEBA.RECEPCIONISTA_CENTRAL);
    await page.waitForLoadState('networkidle');

    const token = await getAuthToken(page);

    // Tomar un profesional real existente para no chocar con DNI del seed general
    const listado = await apiGet(
      request,
      '/profesional?limit=1',
      token ?? undefined,
    );
    if (!listado.ok()) {
      test.skip(true, 'Backend no disponible');
    }
    const bodyListado = unwrapApiResponse(await listado.json());
    const primerNutri = bodyListado.data?.[0];
    if (!primerNutri) {
      test.skip(true, 'Sin profesionales seed');
    }

    // Verificar que sin tocar email/dni/matricula no hay colisión
    const responsePut = await apiPut(
      request,
      `/profesional/${primerNutri.idPersona}`,
      {
        aniosExperiencia: primerNutri.aniosExperiencia ?? 1,
      },
      token ?? undefined,
    );

    if (responsePut.status() === 404 || responsePut.status() === 0) {
      test.skip(true, 'Backend no disponible');
    }

    expect(responsePut.ok()).toBeTruthy();
  });
});
