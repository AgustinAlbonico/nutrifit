import 'reflect-metadata';
process.env.TZ = 'America/Argentina/Buenos_Aires';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { EnvironmentConfigService } from './infrastructure/config/environment-config/environment-config.service';
import helmet from 'helmet';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
// import { VersioningType } from '@nestjs/common';
import { LoggingInterceptor } from './infrastructure/common/logger/app-logger.interceptor';
import { AppErrorFilter } from './infrastructure/common/filter/exception.filter';
import { ValidationPipe } from '@nestjs/common';
import { ApiResponse } from './infrastructure/common/responseHandler/api-response.interceptor';
import {
  APP_LOGGER_SERVICE,
  IAppLoggerService,
} from './domain/services/logger.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const mainConfig = app.get(EnvironmentConfigService);
  // const logger = app.get(AppLoggerService); ##No funca
  const logger = app.get<IAppLoggerService>(APP_LOGGER_SERVICE);

  // app.setGlobalPrefix('api');
  // Trigger restart

  //Pipes
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: false,
      forbidUnknownValues: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  //Filter
  app.useGlobalFilters(new AppErrorFilter());

  //Interceptors
  app.useGlobalInterceptors(new LoggingInterceptor(logger), new ApiResponse());

  //Express middleware
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  ); // Libreria de seguridad para la api

  //Features de nestjs
  app.enableCors();

  // Ensure UTF-8 charset for API responses
  app.use((_req: any, res: any, next: any) => {
    const originalJson = res.json.bind(res);
    res.json = (body: any) => {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      return originalJson(body);
    };
    next();
  });
  // app.enableVersioning({
  //   type: VersioningType.URI,
  //   defaultVersion: '1',
  // });
  app.enableShutdownHooks();

  if (mainConfig.getNodeEnv() !== 'production') {
    //Config para Swagger
    const swaggerConfig = new DocumentBuilder()
      .setTitle(`${mainConfig.getAppName()} API`)
      .setDescription('Descripcion de la api de NutriFit Supervisor')
      .setExternalDoc('Postman Collection', '/openapi-json')
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

bootstrap();
