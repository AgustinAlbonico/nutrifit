import { Module } from '@nestjs/common';
import { AppLoggerService } from './app-logger.service';
import { APP_LOGGER_SERVICE } from 'src/domain/services/logger.service';

@Module({
  providers: [
    {
      provide: APP_LOGGER_SERVICE,
      useClass: AppLoggerService,
    },
  ],
  exports: [APP_LOGGER_SERVICE],
})
export class AppLoggerModule {}
