export const API_BASE_URL =
  import.meta.env.VITE_API_URL?.trim() || 'http://localhost:3000';

/**
 * Obtiene la URL completa de la foto de perfil.
 * Si la URL es relativa (empieza con /), le agrega la base URL del API.
 */
export function obtenerUrlFoto(url: string | null): string | null {
  if (!url) return null;
  if (url.startsWith('http')) return url;

  // Compatibilidad con URLs antiguas guardadas como /api/...
  const rutaNormalizada = url.startsWith('/api/')
    ? url.replace('/api/', '/')
    : url;

  return `${API_BASE_URL}${rutaNormalizada}`;
}

type Method = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

interface RequestOptions {
  method?: Method;
  token?: string | null;
  body?: unknown;
  formData?: FormData;
}

interface ErrorResponse {
  success?: boolean;
  message?: string;
  error?: {
    code?: string;
    path?: string;
    timestamp?: string;
    details?: string[];
  };
}

function obtenerMensajeLegible(
  response: Response,
  errorBody: ErrorResponse | null,
  isAuthEndpoint: boolean,
): string {
  const status = response.status;

  if (status === 401) {
    if (isAuthEndpoint) {
      return errorBody?.message || 'Email o contraseña incorrectos.';
    }
    return 'Tu sesión venció. Volvé a iniciar sesión.';
  }

  if (status === 403) {
    return 'No tenés permisos para realizar esta acción.';
  }

  if (status === 404) {
    return 'No se encontró el recurso solicitado.';
  }

  if (status === 400) {
    if (errorBody?.error?.details?.length) {
      return errorBody.error.details[0];
    }
    return errorBody?.message || 'Revisá los datos ingresados.';
  }

  if (status >= 500) {
    return 'Ocurrió un error del servidor. Intentá nuevamente en unos minutos.';
  }

  return errorBody?.message || 'No se pudo completar la operación.';
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  // No enviar header de autorización para endpoints de autenticación
  const isAuthEndpoint = path === '/auth/login' || path === '/auth/register';

  const headers: Record<string, string> = {};

  // Solo establecer Content-Type para JSON, no para FormData
  if (!options.formData) {
    headers['Content-Type'] = 'application/json';
  }

  if (!isAuthEndpoint && options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  let body: BodyInit | undefined;
  if (options.formData) {
    body = options.formData;
  } else if (options.body !== undefined) {
    body = JSON.stringify(options.body);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? 'GET',
    headers,
    body,
  });

  if (!response.ok) {
    let errorBody: ErrorResponse | null = null;

    try {
      errorBody = (await response.json()) as ErrorResponse;
    } catch {
      errorBody = null;
    }

    if (response.status === 401 && !isAuthEndpoint) {
      localStorage.removeItem('nutrifit.auth');
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.assign('/login');
      }
    }

    throw new Error(obtenerMensajeLegible(response, errorBody, isAuthEndpoint));
  }

  return (await response.json()) as T;
}
