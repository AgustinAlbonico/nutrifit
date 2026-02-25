import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Request } from 'express';
import { IApiResponse } from 'src/common/interfaces/api-response.interface';

@Injectable()
export class ApiResponse<T> implements NestInterceptor<T, IApiResponse<T>> {
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<IApiResponse<T>> {
    const request = context.switchToHttp().getRequest<Request>();

    return next.handle().pipe(
      map(
        (data: T): IApiResponse<T> => ({
          success: true,
          message: this.getSuccessMessage(request.method),
          data,
          timestamp: new Date().toISOString(),
        }),
      ),
    );
  }

  private getSuccessMessage(method: string): string {
    const messages: Record<string, string> = {
      GET: 'Datos obtenidos correctamente',
      POST: 'Creado correctamente',
      PUT: 'Actualizado correctamente',
      PATCH: 'Actualizado correctamente',
      DELETE: 'Eliminado correctamente',
    };
    return messages[method] || 'Operación exitosa';
  }
}
