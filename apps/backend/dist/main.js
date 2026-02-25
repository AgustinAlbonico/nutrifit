"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
process.env.TZ = 'America/Argentina/Buenos_Aires';
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const environment_config_service_1 = require("./infrastructure/config/environment-config/environment-config.service");
const helmet_1 = __importDefault(require("helmet"));
const swagger_1 = require("@nestjs/swagger");
const app_logger_interceptor_1 = require("./infrastructure/common/logger/app-logger.interceptor");
const exception_filter_1 = require("./infrastructure/common/filter/exception.filter");
const common_1 = require("@nestjs/common");
const api_response_interceptor_1 = require("./infrastructure/common/responseHandler/api-response.interceptor");
const logger_service_1 = require("./domain/services/logger.service");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const mainConfig = app.get(environment_config_service_1.EnvironmentConfigService);
    const logger = app.get(logger_service_1.APP_LOGGER_SERVICE);
    app.useGlobalPipes(new common_1.ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: false,
        forbidUnknownValues: true,
        transformOptions: { enableImplicitConversion: true },
    }));
    app.useGlobalFilters(new exception_filter_1.AppErrorFilter());
    app.useGlobalInterceptors(new app_logger_interceptor_1.LoggingInterceptor(logger), new api_response_interceptor_1.ApiResponse());
    app.use((0, helmet_1.default)({
        crossOriginResourcePolicy: { policy: 'cross-origin' },
    }));
    app.enableCors();
    app.use((_req, res, next) => {
        const originalJson = res.json.bind(res);
        res.json = (body) => {
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            return originalJson(body);
        };
        next();
    });
    app.enableShutdownHooks();
    if (mainConfig.getNodeEnv() !== 'production') {
        const swaggerConfig = new swagger_1.DocumentBuilder()
            .setTitle(`${mainConfig.getAppName()} API`)
            .setDescription('Descripcion de la api de NutriFit Supervisor')
            .setExternalDoc('Postman Collection', '/openapi-json')
            .setVersion('1.0')
            .addBearerAuth(undefined, 'access-token')
            .addBearerAuth(undefined, 'refresh-token')
            .addSecurityRequirements('access-token')
            .build();
        const document = () => swagger_1.SwaggerModule.createDocument(app, swaggerConfig);
        swagger_1.SwaggerModule.setup('openapi', app, document);
    }
    await app.listen(mainConfig.getPort() ?? 3000);
}
bootstrap();
//# sourceMappingURL=main.js.map