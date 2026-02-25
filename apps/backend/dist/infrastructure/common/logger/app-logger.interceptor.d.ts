import { NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { IAppLoggerService } from 'src/domain/services/logger.service';
export declare class LoggingInterceptor implements NestInterceptor {
    private readonly logger;
    constructor(logger: IAppLoggerService);
    intercept(context: ExecutionContext, next: CallHandler): Observable<any>;
    private getIP;
}
