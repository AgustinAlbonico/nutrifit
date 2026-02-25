import { Module } from '@nestjs/common';
import { ControllersModule } from './presentation/http/controllers.module';
import { InfrastructureModule } from './infrastructure/infrastructure.module';
import { ConfigModule } from '@nestjs/config';
import { AppLoggerModule } from './infrastructure/common/logger/app-logger.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    InfrastructureModule,
    ControllersModule,
    AppLoggerModule,
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true, // Hace que esté disponible en toda la app
      envFilePath: ['.env'], // Podés cambiarlo por .env.dev, etc.
      cache: true,
    }),
  ],
})
export class AppModule {}
