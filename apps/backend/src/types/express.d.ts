import type { Rol } from '../domain/entities/Usuario/Rol';

declare global {
  namespace Express {
    /**
     * Datos del usuario autenticado, poblados por `JwtAuthGuard`
     * con el contenido del JWT verificado.
     * Incluye campos de tenant para aislamiento multi-gimnasio.
     */
    interface AuthenticatedUserPayload {
      id: number;
      email: string;
      rol: Rol;
      acciones?: string[];
      /** ID del gimnasio al que pertenece el usuario (null para SUPERADMIN cross-tenant) */
      gimnasioId: number | null;
      /** ID de la persona asociada (puede ser null para admins) */
      personaId: number | null;
      /** Identificador único del token (para revocación) */
      jti: string;
    }

    /**
     * Contexto de acceso a recursos de socio, poblado por
     * `SocioResourceAccessGuard` antes de los handlers.
     */
    interface ResourceAccessContext {
      actorPersonaId?: number | null;
      socioId?: number | null;
      turnoId?: number;
    }

    interface Request {
      user?: AuthenticatedUserPayload;
      resourceAccess?: ResourceAccessContext;
    }
  }
}

export {};
