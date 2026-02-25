"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgendaModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const use_cases_1 = require("./use-cases");
const agenda_repository_1 = require("../../domain/entities/Agenda/agenda.repository");
const nutricionista_repository_1 = require("../../domain/entities/Persona/Nutricionista/nutricionista.repository");
const agenda_repository_2 = require("../../infrastructure/persistence/typeorm/repositories/agenda.repository");
const nutricionista_repository_2 = require("../../infrastructure/persistence/typeorm/repositories/nutricionista.repository");
const entities_1 = require("../../infrastructure/persistence/typeorm/entities");
const app_logger_module_1 = require("../../infrastructure/common/logger/app-logger.module");
let AgendaModule = class AgendaModule {
};
exports.AgendaModule = AgendaModule;
exports.AgendaModule = AgendaModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([entities_1.AgendaOrmEntity, entities_1.NutricionistaOrmEntity]),
            app_logger_module_1.AppLoggerModule,
        ],
        providers: [
            use_cases_1.ConfigureAgendaUseCase,
            use_cases_1.GetAgendaUseCase,
            {
                provide: agenda_repository_1.AGENDA_REPOSITORY,
                useClass: agenda_repository_2.AgendaRepositoryImplementation,
            },
            {
                provide: nutricionista_repository_1.NUTRICIONISTA_REPOSITORY,
                useClass: nutricionista_repository_2.NutricionistaRepositoryImplementation,
            },
        ],
        exports: [use_cases_1.ConfigureAgendaUseCase, use_cases_1.GetAgendaUseCase],
    })
], AgendaModule);
//# sourceMappingURL=agenda.module.js.map