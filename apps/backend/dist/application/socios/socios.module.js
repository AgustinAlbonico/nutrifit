"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SociosModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const registrarSocio_use_case_1 = require("./registrarSocio.use-case");
const listarSocios_use_case_1 = require("./listarSocios.use-case");
const actualizarSocio_use_case_1 = require("./actualizarSocio.use-case");
const eliminarSocio_use_case_1 = require("./eliminarSocio.use-case");
const reactivarSocio_use_case_1 = require("./reactivarSocio.use-case");
const app_logger_module_1 = require("../../infrastructure/common/logger/app-logger.module");
const bcrypt_module_1 = require("../../infrastructure/services/bcrypt/bcrypt.module");
const minio_module_1 = require("../../infrastructure/services/minio/minio.module");
const entities_1 = require("../../infrastructure/persistence/typeorm/entities");
const grupo_permiso_entity_1 = require("../../infrastructure/persistence/typeorm/entities/grupo-permiso.entity");
const usuario_repository_1 = require("../../domain/entities/Usuario/usuario.repository");
const socio_repository_1 = require("../../domain/entities/Persona/Socio/socio.repository");
const repositories_1 = require("../../infrastructure/persistence/typeorm/repositories");
let SociosModule = class SociosModule {
};
exports.SociosModule = SociosModule;
exports.SociosModule = SociosModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                entities_1.UsuarioOrmEntity,
                entities_1.SocioOrmEntity,
                grupo_permiso_entity_1.GrupoPermisoOrmEntity,
            ]),
            app_logger_module_1.AppLoggerModule,
            bcrypt_module_1.PasswordEncrypterModule,
            minio_module_1.MinioModule,
        ],
        providers: [
            registrarSocio_use_case_1.RegistrarSocioUseCase,
            listarSocios_use_case_1.ListarSociosUseCase,
            actualizarSocio_use_case_1.ActualizarSocioUseCase,
            eliminarSocio_use_case_1.EliminarSocioUseCase,
            reactivarSocio_use_case_1.ReactivarSocioUseCase,
            { provide: usuario_repository_1.USUARIO_REPOSITORY, useClass: repositories_1.UsuarioRepositoryImplementation },
            { provide: socio_repository_1.SOCIO_REPOSITORY, useClass: repositories_1.SocioRepositoryImplementation },
        ],
        exports: [
            registrarSocio_use_case_1.RegistrarSocioUseCase,
            listarSocios_use_case_1.ListarSociosUseCase,
            actualizarSocio_use_case_1.ActualizarSocioUseCase,
            eliminarSocio_use_case_1.EliminarSocioUseCase,
            reactivarSocio_use_case_1.ReactivarSocioUseCase,
        ],
    })
], SociosModule);
//# sourceMappingURL=socios.module.js.map