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
        (data: any): IApiResponse<any> => {
          const isPaginated =
            data &&
            typeof data === 'object' &&
            'items' in data &&
            'pagination' in data;

          if (isPaginated) {
            return {
              success: true,
              data: data.items,
              error: null,
              meta: {
                timestamp: new Date().toISOString(),
                pagination: data.pagination,
              },
            };
          }

          return {
            success: true,
            message: this.getSuccessMessage(request.method),
            data: data ?? null,
            meta: null,
            errors: [],
          };
        },
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
