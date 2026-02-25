import { Logger } from '@nestjs/common';
import { IAppLoggerService } from 'src/domain/services/logger.service';
export declare class AppLoggerService extends Logger implements IAppLoggerService {
    log(message: string): void;
    error(message: string, trace?: string): void;
    warn(message: string): void;
    debug(message: string): void;
    verbose(message: string): void;
}
