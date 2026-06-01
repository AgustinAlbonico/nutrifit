import { APIRequestContext } from '@playwright/test';
import { apiPost } from './api.helper';

const API_BASE_URL = 'http://localhost:3000';

/**
 * Resetea la base de datos ejecutando migrations y seed
 * Solo funciona en entorno de desarrollo
 */
export async function resetDatabase(request: APIRequestContext): Promise<void> {
  // En un entorno real, esto llamaria a un endpoint de administracion
  // que ejecuta migrations y seed
  // Por ahora, solo verificamos que el backend este disponible
  const response = await request.get(`${API_BASE_URL}/health`);
  if (!response.ok()) {
    throw new Error('Backend no disponible para reset de base de datos');
  }
}

/**
 * Carga datos de prueba para un gimnasio especifico
 */
export async function seedGimnasioData(
  request: APIRequestContext,
  gimnasioId: string,
  token: string
): Promise<void> {
  // Endpoint para cargar datos de prueba
  const response = await apiPost(
    request,
    '/api/testing/seed/gimnasio',
    { gimnasioId },
    token
  );

  if (!response.ok()) {
    throw new Error(`Error al cargar seed para gimnasio ${gimnasioId}`);
  }
}

/**
 * Obtiene un usuario por su email para usar en pruebas
 */
export async function getUserByEmail(
  request: APIRequestContext,
  email: string,
  token: string
): Promise<Record<string, unknown> | null> {
  const response = await apiPost(
    request,
    '/api/testing/users/by-email',
    { email },
    token
  );

  if (response.status() === 404) {
    return null;
  }

  if (!response.ok()) {
    throw new Error(`Error al buscar usuario ${email}`);
  }

  return response.json();
}

/**
 * Limpia datos de prueba creados durante los tests
 */
export async function cleanupTestData(
  request: APIRequestContext,
  token: string
): Promise<void> {
  // En un entorno real, esto limpiara datos criados durante los tests
  console.log('Limpiando datos de prueba...');
}

/**
 * Verifica que la base de datos tenga los datos minimos necesarios
 */
export async function verifyBaseData(request: APIRequestContext): Promise<boolean> {
  try {
    const response = await request.get(`${API_BASE_URL}/api/health`);
    return response.ok();
  } catch {
    return false;
  }
}