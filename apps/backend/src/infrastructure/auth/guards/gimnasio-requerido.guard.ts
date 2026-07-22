import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Request } from 'express';
import { BadRequestError } from 'src/domain/exceptions/custom-exceptions';
import { Rol } from 'src/domain/entities/Usuario/Rol';

interface RequestWithUser extends Request {
  user: {
    id: number;
    email: string;
    rol: Rol;
    gimnasioId: number | null;
    personaId: number | null;
    jti: string;
    impersonatedBy?: number | null;
  };
}

/**
 * Bloquea el acceso si el request no tiene un gimnasio resuelto en el JWT.
 *
 * Regla de producto: el módulo de reportes (admin/estadisticas + admin/reportes)
 * muestra datos por gimnasio. Si SUPERADMIN no impersonó un gimnasio, su
 * `gimnasioId` viene null y no hay un tenant sobre el cual reportar — devolver
 * cross-tenant mezclaría datos de gimnasios distintos.
 *
 * ADMIN siempre tiene gimnasioId seteado; si por algún motivo no lo tiene,
 * también se bloquea para no filtrar data de toda la red.
 */
@Injectable()
export class GimnasioRequeridoGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const user = context
      .switchToHttp()
      .getRequest<RequestWithUser>().user;

    if (!user?.gimnasioId) {
      const esSuperadmin = user?.rol === Rol.SUPERADMIN;
      throw new BadRequestError(
        esSuperadmin
          ? 'Debe impersonar un gimnasio para acceder a reportes.'
          : 'No se pudo resolver el gimnasio asociado al usuario.',
      );
    }

    return true;
  }
}
