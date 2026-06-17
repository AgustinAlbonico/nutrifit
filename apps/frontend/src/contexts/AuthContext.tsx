/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { apiRequest } from '@/lib/api';
import { listarGimnasios } from '@/services/gimnasio.service';
import { tienePermiso, tieneTodosLosPermisos } from '@/lib/permissions';
import type { LoginResponse, Rol } from '@/types/auth';
import type { Gimnasio } from '@/types/gimnasio';
import type { ApiResponse } from '@/types/api';



const AUTH_STORAGE_KEY = 'nutrifit.auth';

interface AuthState {
  token: string;
  rol: Rol;
  permissions: string[];
  personaId: number | null;
  gimnasioId: number | null;
  impersonatedBy: number | null;
  gimnasioActual: { id: number; nombre: string } | null;
  email: string | null;
  nombre: string | null;
  apellido: string | null;
  fotoPerfilUrl: string | null;
  debeCambiarPassword: boolean;
}

interface AuthContextValue {
  token: string | null;
  rol: Rol | null;
  permissions: string[];
  personaId: number | null;
  gimnasioId: number | null;
  impersonatedBy: number | null;
  gimnasioActual: { id: number; nombre: string } | null;
  listaGimnasios: Gimnasio[];
  email: string | null;
  nombre: string | null;
  apellido: string | null;
  fotoPerfilUrl: string | null;
  debeCambiarPassword: boolean;
  isAuthenticated: boolean;
  esSuperadmin: boolean;
  estaImpersonando: boolean;
  login: (email: string, contrasenia: string) => Promise<void>;
  logout: () => void;
  marcarContrasenaEstablecida: () => void;
  impersonarGimnasio: (gimnasioId: number) => Promise<void>;
  salirDeImpersonacion: () => void;
  cargarGimnasios: () => Promise<void>;
  refreshPermissions: () => Promise<void>;
  hasPermission: (action: string) => boolean;
  hasAllPermissions: (actions: string[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const AUTH_BACKUP_STORAGE_KEY = 'nutrifit.auth.superadmin';

interface JwtPayloadCliente {
  acciones?: string[];
  personaId?: number | null;
  gimnasioId?: number | null;
  impersonatedBy?: number | null;
}

function decodificarPayloadJwt(token: string): JwtPayloadCliente {
  const payload = token.split('.')[1];
  if (!payload) return {};

  try {
    const normalizado = payload.replace(/-/g, '+').replace(/_/g, '/');
    const relleno = normalizado.padEnd(
      Math.ceil(normalizado.length / 4) * 4,
      '=',
    );
    return JSON.parse(atob(relleno)) as JwtPayloadCliente;
  } catch {
    return {};
  }
}

function readStoredAuth(): AuthState | null {
  const raw = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<AuthState>;

    if (!parsed.token || !parsed.rol) {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      return null;
    }

    return {
      token: parsed.token,
      rol: parsed.rol,
      permissions: parsed.permissions ?? [],
      personaId:
        typeof parsed.personaId === 'number' ? parsed.personaId : null,
      gimnasioId:
        typeof parsed.gimnasioId === 'number' ? parsed.gimnasioId : null,
      impersonatedBy:
        typeof parsed.impersonatedBy === 'number' ? parsed.impersonatedBy : null,
      gimnasioActual: parsed.gimnasioActual ?? null,
      email: typeof parsed.email === 'string' ? parsed.email : null,
      nombre: typeof parsed.nombre === 'string' ? parsed.nombre : null,
      apellido: typeof parsed.apellido === 'string' ? parsed.apellido : null,
      fotoPerfilUrl: typeof parsed.fotoPerfilUrl === 'string' ? parsed.fotoPerfilUrl : null,
      debeCambiarPassword: typeof parsed.debeCambiarPassword === 'boolean' ? parsed.debeCambiarPassword : false,
    };
  } catch {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthState | null>(() => readStoredAuth());
  const [listaGimnasios, establecerListaGimnasios] = useState<Gimnasio[]>([]);

  useEffect(() => {
    if (!auth) {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      return;
    }

    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
  }, [auth]);

  const refreshPermissions = useCallback(async () => {
    if (!auth) {
      return;
    }

    const permissions = await apiRequest<string[]>('/auth/permissions', {
      token: auth.token,
    });

    setAuth((prev) =>
      prev
        ? {
            ...prev,
            permissions,
          }
        : prev,
    );
  }, [auth]);

  const login = useCallback(async (email: string, contrasenia: string) => {
    const response = await apiRequest<ApiResponse<LoginResponse>>('/auth/login', {
      method: 'POST',
      body: { email, contrasena: contrasenia },
    });

    let personaId: number | null = null;

    try {
      const profile = await apiRequest<
        ApiResponse<{
          idUsuario: number | null;
          idPersona: number | null;
          email: string | null;
          rol: Rol | null;
          nombre: string | null;
          apellido: string | null;
          fotoPerfilUrl: string | null;
        }>
      >('/auth/perfil', {
        token: response.data.token,
      });

      personaId = profile.data.idPersona;

      const nextAuth: AuthState = {
        token: response.data.token,
        rol: response.data.rol,
        permissions: response.data.acciones ?? [],
        personaId,
        gimnasioId: null,
        impersonatedBy: null,
        gimnasioActual: null,
        email: profile.data.email,
        nombre: profile.data.nombre,
        apellido: profile.data.apellido,
        fotoPerfilUrl: profile.data.fotoPerfilUrl,
        debeCambiarPassword: response.data.debeCambiarPassword ?? false,
      };

      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextAuth));
      setAuth(nextAuth);
      return;
    } catch {
      personaId = null;
    }

    const nextAuth: AuthState = {
      token: response.data.token,
      rol: response.data.rol,
      permissions: response.data.acciones ?? [],
      personaId,
      gimnasioId: null,
      impersonatedBy: null,
      gimnasioActual: null,
      email,
      nombre: null,
      apellido: null,
      fotoPerfilUrl: null,
      debeCambiarPassword: response.data.debeCambiarPassword ?? false,
    };

    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextAuth));
    setAuth(nextAuth);
  }, []);

  const logout = useCallback(() => {
    setAuth(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(AUTH_BACKUP_STORAGE_KEY);
    window.location.href = '/login';
  }, []);

  const marcarContrasenaEstablecida = useCallback(() => {
    setAuth((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, debeCambiarPassword: false };
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const impersonarGimnasio = useCallback(
    async (gimnasioId: number) => {
      if (!auth || auth.rol !== 'SUPERADMIN') {
        throw new Error('Solo SUPERADMIN puede impersonar gimnasios');
      }

      const response = await apiRequest<
        ApiResponse<{
          token: string;
          usuario: { id: number; email: string; rol: Rol };
          gimnasio: { id: number; nombre: string };
          impersonatedBy: number;
        }>
      >(`/gimnasios/${gimnasioId}/impersonar`, {
        method: 'POST',
        token: auth.token,
        body: {},
      });

      const payload = decodificarPayloadJwt(response.data.token);
      localStorage.setItem(AUTH_BACKUP_STORAGE_KEY, JSON.stringify(auth));

      const siguienteAuth: AuthState = {
        token: response.data.token,
        rol: response.data.usuario.rol,
        permissions: payload.acciones ?? [],
        personaId: payload.personaId ?? null,
        gimnasioId: response.data.gimnasio.id,
        impersonatedBy: response.data.impersonatedBy,
        gimnasioActual: response.data.gimnasio,
        email: response.data.usuario.email,
        nombre: null,
        apellido: null,
        fotoPerfilUrl: null,
        debeCambiarPassword: false,
      };

      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(siguienteAuth));
      setAuth(siguienteAuth);
    },
    [auth],
  );

  const salirDeImpersonacion = useCallback(() => {
    const backup = localStorage.getItem(AUTH_BACKUP_STORAGE_KEY);
    if (!backup) {
      logout();
      return;
    }

    try {
      const authOriginal = JSON.parse(backup) as AuthState;
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authOriginal));
      localStorage.removeItem(AUTH_BACKUP_STORAGE_KEY);
      setAuth(authOriginal);
    } catch {
      logout();
    }
  }, [logout]);

  const cargarGimnasios = useCallback(async () => {
    if (!auth?.token || auth.rol !== 'SUPERADMIN') {
      establecerListaGimnasios([]);
      return;
    }

    const gimnasios = await listarGimnasios(auth.token);
    establecerListaGimnasios(gimnasios);
  }, [auth?.rol, auth?.token]);

  const value = useMemo<AuthContextValue>(() => {
    const esAdmin = auth?.rol === 'ADMIN' || auth?.rol === 'SUPERADMIN';
    const permisos = auth?.permissions ?? [];

    return {
      token: auth?.token ?? null,
      rol: auth?.rol ?? null,
      permissions: permisos,
      personaId: auth?.personaId ?? null,
      gimnasioId: auth?.gimnasioId ?? null,
      impersonatedBy: auth?.impersonatedBy ?? null,
      gimnasioActual: auth?.gimnasioActual ?? null,
      listaGimnasios,
      email: auth?.email ?? null,
      nombre: auth?.nombre ?? null,
      apellido: auth?.apellido ?? null,
      fotoPerfilUrl: auth?.fotoPerfilUrl ?? null,
      debeCambiarPassword: auth?.debeCambiarPassword ?? false,
      isAuthenticated: Boolean(auth?.token),
      esSuperadmin: auth?.rol === 'SUPERADMIN',
      estaImpersonando: Boolean(auth?.impersonatedBy),
      login,
      logout,
      marcarContrasenaEstablecida,
      impersonarGimnasio,
      salirDeImpersonacion,
      cargarGimnasios,
      refreshPermissions,
      hasPermission: (action: string) => esAdmin || tienePermiso(action, permisos),
      hasAllPermissions: (actions: string[]) =>
        esAdmin || tieneTodosLosPermisos(actions, permisos),
    };
  }, [
    auth,
    cargarGimnasios,
    impersonarGimnasio,
    listaGimnasios,
    login,
    logout,
    marcarContrasenaEstablecida,
    refreshPermissions,
    salirDeImpersonacion,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/* @refresh skip */
export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }

  return context;
}
