import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  Inject,
  Optional,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { TenantContextService } from './tenant-context.service';
import { Request } from 'express';

/**
 * Interceptor que extrae el tenant context del JWT ya validado por JwtAuthGuard
 * y lo inyecta en TenantContextService para que los repositories puedan accederlo.
 *
 * Este interceptor solo se activa en rutas protegidas (no marcadas con @Public).
 */
@Injectable()
export class TenantContextInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    @Inject(TenantContextService)
    @Optional()
    private readonly tenantContext?: TenantContextService,
  ) {}

  intercept(context: ExecutionContext, next: any): Observable<any> {
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);

    // En rutas publicas no intentamos establecer tenant context
    if (isPublic) {
      return next.handle();
    }

    // Solo establecer si el tenant context service esta disponible
    if (this.tenantContext) {
      this.tenantContext.setFromPayload();
    }

    return next.handle();
  }
}
