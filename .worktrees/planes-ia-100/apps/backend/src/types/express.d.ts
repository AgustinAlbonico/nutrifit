import { Rol } from 'src/domain/entities/Usuario/Rol';

declare global {
  namespace Express {
    /**
     * Datos del usuario autenticado, poblados por `JwtAuthGuard`
     * con el contenido del JWT verificado.
     */
    interface AuthenticatedUserPayload {
      id: number;
      email: string;
      rol: Rol;
      acciones?: string[];
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
