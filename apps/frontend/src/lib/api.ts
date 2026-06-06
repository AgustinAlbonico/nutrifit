export const API_BASE_URL =
  import.meta.env.VITE_API_URL?.trim() || 'http://localhost:3000';

// Claves de storage
const AUTH_STORAGE_KEY = 'nutrifit.auth';

interface StoredAuth {
  token: string;
  gimnasioId: number | null;
  impersonatedBy: number | null;
}

function obtenerAuthAlmacenado(): StoredAuth | null {
  const raw = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    if (!parsed.token) return null;
    return {
      token: parsed.token,
      gimnasioId: parsed.gimnasioId ?? null,
      impersonatedBy: parsed.impersonatedBy ?? null,
    };
  } catch {
    return null;
  }
}

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
  gimnasioId?: number | null;
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
): { mensaje: string; detalles: string[] | null } {
  const status = response.status;
  const detalles = errorBody?.error?.details ?? null;

  if (status === 401) {
    if (isAuthEndpoint) {
      return {
        mensaje: errorBody?.message || 'Email o contraseña incorrectos.',
        detalles,
      };
    }
    return {
      mensaje: 'Tu sesión venció. Volvé a iniciar sesión.',
      detalles,
    };
  }

  if (status === 403) {
    // Error de tenant - el usuario no tiene acceso a este gimnasio
    return {
      mensaje:
        errorBody?.message ||
        'No tenés permisos para este espacio de trabajo.',
      detalles,
    };
  }

  if (status === 404) {
    return {
      mensaje: 'No se encontró el recurso solicitado.',
      detalles,
    };
  }

  if (status === 400) {
    if (detalles && detalles.length > 0) {
      return { mensaje: detalles.join(' • '), detalles };
    }
    return {
      mensaje: errorBody?.message || 'Revisá los datos ingresados.',
      detalles,
    };
  }

  if (status >= 500) {
    return {
      mensaje:
        'Ocurrió un error del servidor. Intentá nuevamente en unos minutos.',
      detalles,
    };
  }

  return {
    mensaje: errorBody?.message || 'No se pudo completar la operación.',
    detalles,
  };
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

  // Obtener token y contexto de tenant
  let token = options.token;
  let gimnasioId = options.gimnasioId;

  // Si no se pasó token, obtener del storage
  if (!token) {
    const auth = obtenerAuthAlmacenado();
    if (auth) {
      token = auth.token;
      // Usar el gimnasioId solo si no se pasó explícitamente
      if (gimnasioId === undefined) {
        gimnasioId = auth.gimnasioId;
      }
    }
  }

  // Agregar header de autorización si hay token y no es endpoint de auth
  if (!isAuthEndpoint && token) {
    headers.Authorization = `Bearer ${token}`;
  }

  // Agregar header de contexto de tenant si estamos impersonando
  if (gimnasioId && !isAuthEndpoint) {
    headers['X-Gimnasio-Id'] = String(gimnasioId);
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
      localStorage.removeItem(AUTH_STORAGE_KEY);
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.assign('/login');
      }
    }

    if (response.status === 403 && !isAuthEndpoint) {
      // Error de tenant - redirigir a dashboard con mensaje
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        const { mensaje } = obtenerMensajeLegible(
          response,
          errorBody,
          isAuthEndpoint,
        );
        const mensajeCodificado = encodeURIComponent(mensaje);
        window.location.assign(`/login?error=${mensajeCodificado}`);
      }
    }

    const { mensaje, detalles } = obtenerMensajeLegible(
      response,
      errorBody,
      isAuthEndpoint,
    );
    const error = new Error(mensaje) as Error & { details?: string[] | null };
    if (detalles && detalles.length > 0) {
      error.details = detalles;
    }
    throw error;
  }

  return (await response.json()) as T;
}
