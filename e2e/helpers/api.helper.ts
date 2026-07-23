import { Page, APIRequestContext } from '@playwright/test';

const API_BASE_URL = 'http://localhost:3000';

/**
 * Realiza una peticion GET a la API
 */
export async function apiGet(
  request: APIRequestContext,
  path: string,
  token?: string
): Promise<Response> {
  return request.get(`${API_BASE_URL}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

/**
 * Realiza una peticion POST a la API
 */
export async function apiPost(
  request: APIRequestContext,
  path: string,
  data: Record<string, unknown>,
  token?: string
): Promise<Response> {
  return request.post(`${API_BASE_URL}${path}`, {
    data,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

/**
 * Realiza una peticion PUT a la API
 */
export async function apiPut(
  request: APIRequestContext,
  path: string,
  data: Record<string, unknown>,
  token?: string
): Promise<Response> {
  return request.put(`${API_BASE_URL}${path}`, {
    data,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

/**
 * Realiza una peticion DELETE a la API
 */
export async function apiDelete(
  request: APIRequestContext,
  path: string,
  token?: string
): Promise<Response> {
  return request.delete(`${API_BASE_URL}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

/**
 * Obtiene el token de autenticacion de la sesion actual
 */
export async function getAuthToken(page: Page): Promise<string | null> {
  const token = await page.evaluate(() => {
    const raw = localStorage.getItem('nutrifit.auth');
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      return parsed?.token ?? null;
    } catch {
      return null;
    }
  });
  return token;
}

/**
 * Verifica que una respuesta de API sea exitosa (2xx)
 */
export async function expectApiSuccess(response: Response): Promise<void> {
  if (!response.ok()) {
    const body = await response.json().catch(() => ({}));
    throw new Error(`API Error ${response.status()}: ${JSON.stringify(body)}`);
  }
}

/**
 * Verifica que una respuesta de API sea un error (4xx o 5xx)
 */
export async function expectApiError(response: Response, expectedStatus?: number): Promise<void> {
  if (response.ok()) {
    throw new Error(`Expected API error but got success`);
  }
  if (expectedStatus && response.status() !== expectedStatus) {
    throw new Error(`Expected status ${expectedStatus} but got ${response.status()}`);
  }
}