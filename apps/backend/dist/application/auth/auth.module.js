"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthModule = void 0;
const common_1 = require("@nestjs/common");
const bcrypt_service_1 = require("../../infrastructure/services/bcrypt/bcrypt.service");
const login_use_case_1 = require("./login.use-case");
const password_encrypter_service_1 = require("../../domain/services/password-encrypter.service");
const jwt_service_1 = require("../../domain/services/jwt.service");
const jwt_service_2 = require("../../infrastructure/services/jwt/jwt.service");
const jwt_1 = require("@nestjs/jwt");
const app_logger_module_1 = require("../../infrastructure/common/logger/app-logger.module");
const typeorm_1 = require("@nestjs/typeorm");
const entities_1 = require("../../infrastructure/persistence/typeorm/entities");
const usuario_repository_1 = require("../../domain/entities/Usuario/usuario.repository");
const repositories_1 = require("../../infrastructure/persistence/typeorm/repositories");
const environment_config_module_1 = require("../../infrastructure/config/environment-config/environment-config.module");
const environment_config_service_1 = require("../../infrastructure/config/environment-config/environment-config.service");
let AuthModule = class AuthModule {
};
exports.AuthModule = AuthModule;
exports.AuthModule = AuthModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([entities_1.UsuarioOrmEntity]),
            jwt_1.JwtModule.registerAsync({
                imports: [environment_config_module_1.EnvironmentConfigModule],
                inject: [environment_config_service_1.EnvironmentConfigService],
                useFactory: (configService) => ({
                    secret: configService.getJwtSecret(),
                    signOptions: { expiresIn: configService.getJwtExpirationTime() },
                }),
            }),
            app_logger_module_1.AppLoggerModule,
        ],
        providers: [
            {
                provide: password_encrypter_service_1.PASSWORD_ENCRYPTER_SERVICE,
                useClass: bcrypt_service_1.PasswordEncrypterService,
            },
            {
                provide: jwt_service_1.JWT_SERVICE,
                useClass: jwt_service_2.JwtServiceImpl,
            },
            { provide: usuario_repository_1.USUARIO_REPOSITORY, useClass: repositories_1.UsuarioRepositoryImplementation },
            login_use_case_1.LoginUseCase,
        ],
        exports: [login_use_case_1.LoginUseCase, jwt_1.JwtModule, jwt_service_1.JWT_SERVICE, usuario_repository_1.USUARIO_REPOSITORY],
    })
], AuthModule);
//# sourceMappingURL=auth.module.js.map