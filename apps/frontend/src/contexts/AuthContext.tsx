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
import type { LoginResponse, Rol } from '@/types/auth';
import type { Gimnasio } from '@/types/gimnasio';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

const AUTH_STORAGE_KEY = 'nutrifit.auth';

interface AuthState {
  token: string;
  rol: Rol;
  permissions: string[];
  personaId: number | null;
  email: string | null;
  nombre: string | null;
  apellido: string | null;
  fotoPerfilUrl: string | null;
  // Multi-tenant
  gimnasioId: number | null;
  impersonatedBy: number | null;
  gimnasioActual: Gimnasio | null;
}

interface AuthContextValue {
  token: string | null;
  rol: Rol | null;
  permissions: string[];
  personaId: number | null;
  email: string | null;
  nombre: string | null;
  apellido: string | null;
  fotoPerfilUrl: string | null;
  isAuthenticated: boolean;
  // Multi-tenant
  gimnasioId: number | null;
  impersonatedBy: number | null;
  gimnasioActual: Gimnasio | null;
  listaGimnasios: Gimnasio[];
  esSuperadmin: boolean;
  estaImpersonando: boolean;
  login: (email: string, contrasenia: string) => Promise<void>;
  logout: () => void;
  refreshPermissions: () => Promise<void>;
  hasPermission: (action: string) => boolean;
  hasAllPermissions: (actions: string[]) => boolean;
  impersonarGimnasio: (gimnasioId: number) => Promise<void>;
  salirDeImpersonacion: () => Promise<void>;
  cargarGimnasios: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

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
      email: typeof parsed.email === 'string' ? parsed.email : null,
      nombre: typeof parsed.nombre === 'string' ? parsed.nombre : null,
      apellido: typeof parsed.apellido === 'string' ? parsed.apellido : null,
      fotoPerfilUrl:
        typeof parsed.fotoPerfilUrl === 'string'
          ? parsed.fotoPerfilUrl
          : null,
      gimnasioId:
        typeof parsed.gimnasioId === 'number' ? parsed.gimnasioId : null,
      impersonatedBy:
        typeof parsed.impersonatedBy === 'number'
          ? parsed.impersonatedBy
          : null,
      gimnasioActual: parsed.gimnasioActual ?? null,
    };
  } catch {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthState | null>(() => readStoredAuth());
  const [listaGimnasios, setListaGimnasios] = useState<Gimnasio[]>([]);

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

  const cargarGimnasios = useCallback(async () => {
    if (!auth || auth.rol !== 'SUPERADMIN') {
      return;
    }

    try {
      const response = await apiRequest<
        ApiResponse<Gimnasio[]>
      >('/gimnasios', {
        token: auth.token,
      });
      setListaGimnasios(response.data);
    } catch {
      // Error al cargar gimnasios - se maneja silenciosamente
      setListaGimnasios([]);
    }
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
        email: profile.data.email,
        nombre: profile.data.nombre,
        apellido: profile.data.apellido,
        fotoPerfilUrl: profile.data.fotoPerfilUrl,
        gimnasioId: response.data.gimnasioId ?? null,
        impersonatedBy: response.data.impersonatedBy ?? null,
        gimnasioActual: null,
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
      email,
      nombre: null,
      apellido: null,
      fotoPerfilUrl: null,
      gimnasioId: response.data.gimnasioId ?? null,
      impersonatedBy: response.data.impersonatedBy ?? null,
      gimnasioActual: null,
    };

    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextAuth));
    setAuth(nextAuth);
  }, []);

  const impersonarGimnasio = useCallback(
    async (gimnasioId: number) => {
      if (!auth || auth.rol !== 'SUPERADMIN') {
        throw new Error('Solo SUPERADMIN puede impersonar gimnasios');
      }

      const response = await apiRequest<
        ApiResponse<{ token: string; gimnasio: Gimnasio }>
      >(`/gimnasios/${gimnasioId}/impersonar`, {
        method: 'POST',
        token: auth.token,
      });

      // Actualizar estado con el nuevo token y contexto de gimnasio
      const nextAuth: AuthState = {
        token: response.data.token,
        rol: auth.rol,
        permissions: auth.permissions,
        personaId: auth.personaId,
        email: auth.email,
        nombre: auth.nombre,
        apellido: auth.apellido,
        fotoPerfilUrl: auth.fotoPerfilUrl,
        gimnasioId,
        impersonatedBy: auth.personaId, // El SUPERADMIN que impersona
        gimnasioActual: response.data.gimnasio,
      };

      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextAuth));
      setAuth(nextAuth);
    },
    [auth],
  );

  const salirDeImpersonacion = useCallback(async () => {
    if (!auth || !auth.impersonatedBy) {
      return; // No está impersonando
    }

    // Recargar perfil para obtener el token original de SUPERADMIN
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
        token: auth.token,
      });

      // Restaurar contexto original de SUPERADMIN
      const nextAuth: AuthState = {
        token: auth.token,
        rol: auth.rol,
        permissions: auth.permissions,
        personaId: profile.data.idPersona,
        email: profile.data.email,
        nombre: profile.data.nombre,
        apellido: profile.data.apellido,
        fotoPerfilUrl: profile.data.fotoPerfilUrl,
        gimnasioId: null, // SUPERADMIN sin impersonar tiene gimnasioId null
        impersonatedBy: null,
        gimnasioActual: null,
      };

      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextAuth));
      setAuth(nextAuth);
    } catch {
      // Error al salir de impersonacion - forzar logout
      throw new Error('No se pudo salir de la impersonación');
    }
  }, [auth]);

  const logout = useCallback(() => {
    setAuth(null);
    setListaGimnasios([]);
    // Limpiar localStorage para asegurar que no quede rastro
    localStorage.removeItem(AUTH_STORAGE_KEY);
    // Redirigir a login
    window.location.href = '/login';
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    const esAdmin = auth?.rol === 'ADMIN';
    const esSuperadmin = auth?.rol === 'SUPERADMIN';
    const estaImpersonando = Boolean(auth?.impersonatedBy);
    const permissionsSet = new Set(auth?.permissions ?? []);

    return {
      token: auth?.token ?? null,
      rol: auth?.rol ?? null,
      permissions: auth?.permissions ?? [],
      personaId: auth?.personaId ?? null,
      email: auth?.email ?? null,
      nombre: auth?.nombre ?? null,
      apellido: auth?.apellido ?? null,
      fotoPerfilUrl: auth?.fotoPerfilUrl ?? null,
      isAuthenticated: Boolean(auth?.token),
      // Multi-tenant
      gimnasioId: auth?.gimnasioId ?? null,
      impersonatedBy: auth?.impersonatedBy ?? null,
      gimnasioActual: auth?.gimnasioActual ?? null,
      listaGimnasios,
      esSuperadmin,
      estaImpersonando,
      login,
      logout,
      refreshPermissions,
      hasPermission: (action: string) => esAdmin || esSuperadmin || permissionsSet.has(action),
      hasAllPermissions: (actions: string[]) =>
        esAdmin || esSuperadmin || actions.every((action) => permissionsSet.has(action)),
      impersonarGimnasio,
      salirDeImpersonacion,
      cargarGimnasios,
    };
  }, [auth, listaGimnasios, login, logout, refreshPermissions, impersonarGimnasio, salirDeImpersonacion, cargarGimnasios]);

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