"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RepositoriesModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_module_1 = require("../../../config/typeorm/typeorm.module");
const _1 = require("./");
const entities_1 = require("../entities/");
const socio_repository_1 = require("../../../../domain/entities/Persona/Socio/socio.repository");
const usuario_repository_1 = require("../../../../domain/entities/Usuario/usuario.repository");
const nutricionista_repository_1 = require("../../../../domain/entities/Persona/Nutricionista/nutricionista.repository");
const politica_operativa_repository_1 = require("../../../../application/politicas/politica-operativa.repository");
const politica_operativa_repository_impl_1 = require("../../../politicas/politica-operativa.repository.impl");
let RepositoriesModule = class RepositoriesModule {
};
exports.RepositoriesModule = RepositoriesModule;
exports.RepositoriesModule = RepositoriesModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_module_1.TypeOrmConfigModule,
            typeorm_1.TypeOrmModule.forFeature([
                entities_1.SocioOrmEntity,
                entities_1.AgendaOrmEntity,
                entities_1.AlergiaOrmEntity,
                entities_1.AlimentoOrmEntity,
                entities_1.AsistenteOrmEntity,
                entities_1.FichaSaludOrmEntity,
                entities_1.FormacionAcademicaOrmEntity,
                entities_1.GrupoAlimenticioOrmEntity,
                entities_1.NutricionistaOrmEntity,
                entities_1.ObservacionClinicaOrmEntity,
                entities_1.OpcionComidaOrmEntity,
                entities_1.PatologiaOrmEntity,
                entities_1.PersonaOrmEntity,
                entities_1.PlanAlimentacionOrmEntity,
                entities_1.TurnoOrmEntity,
                entities_1.UsuarioOrmEntity,
                entities_1.GimnasioOrmEntity,
            ]),
        ],
        providers: [
            { provide: usuario_repository_1.USUARIO_REPOSITORY, useClass: _1.UsuarioRepositoryImplementation },
            { provide: socio_repository_1.SOCIO_REPOSITORY, useClass: _1.SocioRepositoryImplementation },
            {
                provide: nutricionista_repository_1.NUTRICIONISTA_REPOSITORY,
                useClass: _1.NutricionistaRepositoryImplementation,
            },
            {
                provide: politica_operativa_repository_1.POLITICA_OPERATIVA_REPOSITORY,
                useClass: politica_operativa_repository_impl_1.PoliticaOperativaRepositoryImpl,
            },
        ],
        exports: [
            usuario_repository_1.USUARIO_REPOSITORY,
            socio_repository_1.SOCIO_REPOSITORY,
            nutricionista_repository_1.NUTRICIONISTA_REPOSITORY,
            politica_operativa_repository_1.POLITICA_OPERATIVA_REPOSITORY,
        ],
    })
], RepositoriesModule);
//# sourceMappingURL=repositories.module.js.map