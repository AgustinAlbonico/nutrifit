import 'reflect-metadata';
process.env.TZ = 'America/Argentina/Buenos_Aires';
import { NestFactory } from '@nestjs/core';
import type { NextFunction, Request, Response } from 'express';
import { AppModule } from './app.module';
import { EnvironmentConfigService } from './infrastructure/config/environment-config/environment-config.service';
import helmet from 'helmet';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { LoggingInterceptor } from './infrastructure/common/logger/app-logger.interceptor';
import { AppErrorFilter } from './infrastructure/common/filter/exception.filter';
import { ValidationPipe } from '@nestjs/common';
import { ApiResponse } from './infrastructure/common/responseHandler/api-response.interceptor';
import {
  APP_LOGGER_SERVICE,
  IAppLoggerService,
} from './domain/services/logger.service';
import { createCorsOptions } from './infrastructure/config/cors/cors.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const mainConfig = app.get(EnvironmentConfigService);
  const logger = app.get<IAppLoggerService>(APP_LOGGER_SERVICE);

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: false,
      forbidUnknownValues: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalFilters(new AppErrorFilter());
  app.useGlobalInterceptors(new LoggingInterceptor(logger), new ApiResponse());

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  app.enableCors(createCorsOptions(mainConfig));
  logger.log(
    `CORS habilitado para origenes: ${mainConfig.getCorsAllowedOrigins().join(', ')}`,
  );

  // Asegurar UTF-8 en respuestas JSON.
  app.use((_req: Request, res: Response, next: NextFunction) => {
    const originalJson = res.json.bind(res) as Response['json'];
    res.json = ((body: unknown) => {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      return originalJson(body);
    }) as Response['json'];
    next();
  });

  app.enableShutdownHooks();

  if (mainConfig.getNodeEnv() !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle(`${mainConfig.getAppName()} API`)
      .setDescription('Descripcion de la api de NutriFit Supervisor')
      .setVersion('1.0')
      .addBearerAuth(undefined, 'access-token')
      .addBearerAuth(undefined, 'refresh-token')
      .addSecurityRequirements('access-token')
      .build();

    const document = () => SwaggerModule.createDocument(app, swaggerConfig);

    SwaggerModule.setup('openapi', app, document);
  }

  await app.listen(mainConfig.getPort() ?? 3000);
}

void bootstrap();
