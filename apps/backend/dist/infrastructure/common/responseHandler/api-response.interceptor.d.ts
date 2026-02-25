import { NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { IApiResponse } from 'src/common/interfaces/api-response.interface';
export declare class ApiResponse<T> implements NestInterceptor<T, IApiResponse<T>> {
    intercept(context: ExecutionContext, next: CallHandler<T>): Observable<IApiResponse<T>>;
    private getSuccessMessage;
}
