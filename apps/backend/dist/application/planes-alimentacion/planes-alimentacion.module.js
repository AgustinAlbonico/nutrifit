"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlanesAlimentacionModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const entities_1 = require("../../infrastructure/persistence/typeorm/entities");
const use_cases_1 = require("./use-cases");
const auditoria_module_1 = require("../../infrastructure/services/auditoria/auditoria.module");
const notificaciones_service_1 = require("../notificaciones/notificaciones.service");
const restricciones_module_1 = require("../restricciones/restricciones.module");
let PlanesAlimentacionModule = class PlanesAlimentacionModule {
};
exports.PlanesAlimentacionModule = PlanesAlimentacionModule;
exports.PlanesAlimentacionModule = PlanesAlimentacionModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                entities_1.PlanAlimentacionOrmEntity,
                entities_1.DiaPlanOrmEntity,
                entities_1.OpcionComidaOrmEntity,
                entities_1.AlimentoOrmEntity,
                entities_1.SocioOrmEntity,
                entities_1.NutricionistaOrmEntity,
                entities_1.FichaSaludOrmEntity,
                entities_1.UsuarioOrmEntity,
                entities_1.NotificacionOrmEntity,
            ]),
            auditoria_module_1.AuditoriaModule,
            restricciones_module_1.RestriccionesModule,
        ],
        providers: [
            use_cases_1.CrearPlanAlimentacionUseCase,
            use_cases_1.EditarPlanAlimentacionUseCase,
            use_cases_1.EliminarPlanAlimentacionUseCase,
            use_cases_1.ObtenerPlanActivoSocioUseCase,
            use_cases_1.ObtenerPlanPorIdUseCase,
            use_cases_1.ListarPlanesSocioUseCase,
            use_cases_1.ListarPlanesNutricionistaUseCase,
            use_cases_1.VaciarContenidoPlanUseCase,
            notificaciones_service_1.NotificacionesService,
        ],
        exports: [
            use_cases_1.CrearPlanAlimentacionUseCase,
            use_cases_1.EditarPlanAlimentacionUseCase,
            use_cases_1.EliminarPlanAlimentacionUseCase,
            use_cases_1.ObtenerPlanActivoSocioUseCase,
            use_cases_1.ObtenerPlanPorIdUseCase,
            use_cases_1.ListarPlanesSocioUseCase,
            use_cases_1.ListarPlanesNutricionistaUseCase,
            use_cases_1.VaciarContenidoPlanUseCase,
        ],
    })
], PlanesAlimentacionModule);
//# sourceMappingURL=planes-alimentacion.module.js.map