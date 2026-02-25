"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const entities_1 = require("../../infrastructure/persistence/typeorm/entities");
const nutricionista_repository_1 = require("../../domain/entities/Persona/Nutricionista/nutricionista.repository");
const nutricionista_repository_2 = require("../../infrastructure/persistence/typeorm/repositories/nutricionista.repository");
const app_logger_module_1 = require("../../infrastructure/common/logger/app-logger.module");
const groq_module_1 = require("../../infrastructure/services/groq/groq.module");
const use_cases_1 = require("./use-cases");
let AiModule = class AiModule {
};
exports.AiModule = AiModule;
exports.AiModule = AiModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                entities_1.SocioOrmEntity,
                entities_1.PlanAlimentacionOrmEntity,
                entities_1.NutricionistaOrmEntity,
            ]),
            app_logger_module_1.AppLoggerModule,
            groq_module_1.GroqModule,
        ],
        providers: [
            use_cases_1.PrepararContextoPacienteUseCase,
            use_cases_1.GenerarRecomendacionComidaUseCase,
            use_cases_1.GenerarPlanSemanalUseCase,
            use_cases_1.SugerirSustitucionUseCase,
            use_cases_1.AnalizarPlanNutricionalUseCase,
            {
                provide: nutricionista_repository_1.NUTRICIONISTA_REPOSITORY,
                useClass: nutricionista_repository_2.NutricionistaRepositoryImplementation,
            },
        ],
        exports: [
            use_cases_1.PrepararContextoPacienteUseCase,
            use_cases_1.GenerarRecomendacionComidaUseCase,
            use_cases_1.GenerarPlanSemanalUseCase,
            use_cases_1.SugerirSustitucionUseCase,
            use_cases_1.AnalizarPlanNutricionalUseCase,
        ],
    })
], AiModule);
//# sourceMappingURL=ai.module.js.map