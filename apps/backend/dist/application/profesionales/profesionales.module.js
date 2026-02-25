"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProfesionalesModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const app_logger_module_1 = require("../../infrastructure/common/logger/app-logger.module");
const bcrypt_module_1 = require("../../infrastructure/services/bcrypt/bcrypt.module");
const minio_module_1 = require("../../infrastructure/services/minio/minio.module");
const entities_1 = require("../../infrastructure/persistence/typeorm/entities");
const nutricionista_repository_1 = require("../../domain/entities/Persona/Nutricionista/nutricionista.repository");
const usuario_repository_1 = require("../../domain/entities/Usuario/usuario.repository");
const nutricionista_repository_2 = require("../../infrastructure/persistence/typeorm/repositories/nutricionista.repository");
const usuario_repository_2 = require("../../infrastructure/persistence/typeorm/repositories/usuario.repository");
const use_cases_1 = require("./use-cases");
let ProfesionalesModule = class ProfesionalesModule {
};
exports.ProfesionalesModule = ProfesionalesModule;
exports.ProfesionalesModule = ProfesionalesModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                entities_1.UsuarioOrmEntity,
                entities_1.NutricionistaOrmEntity,
                entities_1.GrupoPermisoOrmEntity,
                entities_1.TurnoOrmEntity,
            ]),
            app_logger_module_1.AppLoggerModule,
            bcrypt_module_1.PasswordEncrypterModule,
            minio_module_1.MinioModule,
        ],
        providers: [
            use_cases_1.CreateNutricionistaUseCase,
            use_cases_1.UpdateNutricionistaUseCase,
            use_cases_1.DeleteNutricionistaUseCase,
            use_cases_1.GetPerfilProfesionalPublicoUseCase,
            use_cases_1.GetNutricionistaUseCase,
            use_cases_1.ListNutricionistasUseCase,
            use_cases_1.ListProfesionalesPublicosUseCase,
            use_cases_1.ReactivarNutricionistaUseCase,
            {
                provide: usuario_repository_1.USUARIO_REPOSITORY,
                useClass: usuario_repository_2.UsuarioRepositoryImplementation,
            },
            {
                provide: nutricionista_repository_1.NUTRICIONISTA_REPOSITORY,
                useClass: nutricionista_repository_2.NutricionistaRepositoryImplementation,
            },
        ],
        exports: [
            use_cases_1.CreateNutricionistaUseCase,
            use_cases_1.UpdateNutricionistaUseCase,
            use_cases_1.DeleteNutricionistaUseCase,
            use_cases_1.GetPerfilProfesionalPublicoUseCase,
            use_cases_1.GetNutricionistaUseCase,
            use_cases_1.ListNutricionistasUseCase,
            use_cases_1.ListProfesionalesPublicosUseCase,
            use_cases_1.ReactivarNutricionistaUseCase,
        ],
    })
], ProfesionalesModule);
//# sourceMappingURL=profesionales.module.js.map