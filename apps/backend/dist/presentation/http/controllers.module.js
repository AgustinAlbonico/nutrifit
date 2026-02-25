"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ControllersModule = void 0;
const common_1 = require("@nestjs/common");
const controllers_1 = require("./controllers");
const progreso_module_1 = require("../../application/progreso/progreso.module");
const application_module_1 = require("../../application/application.module");
const app_logger_module_1 = require("../../infrastructure/common/logger/app-logger.module");
const minio_module_1 = require("../../infrastructure/services/minio/minio.module");
const actions_guard_1 = require("../../infrastructure/auth/guards/actions.guard");
const auth_guard_1 = require("../../infrastructure/auth/guards/auth.guard");
const nutricionista_ownership_guard_1 = require("../../infrastructure/auth/guards/nutricionista-ownership.guard");
const plan_socio_access_guard_1 = require("../../infrastructure/auth/guards/plan-socio-access.guard");
const roles_guard_1 = require("../../infrastructure/auth/guards/roles.guard");
const alimentos_sync_service_1 = require("../../infrastructure/alimentos/alimentos-sync.service");
const crear_alimento_use_case_1 = require("../../application/alimentos/use-cases/crear-alimento.use-case");
const actualizar_alimento_use_case_1 = require("../../application/alimentos/use-cases/actualizar-alimento.use-case");
const eliminar_alimento_use_case_1 = require("../../application/alimentos/use-cases/eliminar-alimento.use-case");
const buscar_socios_con_ficha_use_case_1 = require("../../application/socios/buscar-socios-con-ficha.use-case");
const typeorm_1 = require("@nestjs/typeorm");
const turno_entity_1 = require("../../infrastructure/persistence/typeorm/entities/turno.entity");
const plan_alimentacion_entity_1 = require("../../infrastructure/persistence/typeorm/entities/plan-alimentacion.entity");
const alimento_entity_1 = require("../../infrastructure/persistence/typeorm/entities/alimento.entity");
const grupo_alimenticio_entity_1 = require("../../infrastructure/persistence/typeorm/entities/grupo-alimenticio.entity");
const persona_entity_1 = require("../../infrastructure/persistence/typeorm/entities/persona.entity");
let ControllersModule = class ControllersModule {
};
exports.ControllersModule = ControllersModule;
exports.ControllersModule = ControllersModule = __decorate([
    (0, common_1.Module)({
        imports: [
            application_module_1.ApplicationModule,
            app_logger_module_1.AppLoggerModule,
            minio_module_1.MinioModule,
            progreso_module_1.ProgresoModule,
            typeorm_1.TypeOrmModule.forFeature([
                turno_entity_1.TurnoOrmEntity,
                plan_alimentacion_entity_1.PlanAlimentacionOrmEntity,
                alimento_entity_1.AlimentoOrmEntity,
                persona_entity_1.SocioOrmEntity,
                grupo_alimenticio_entity_1.GrupoAlimenticioOrmEntity,
            ]),
        ],
        providers: [
            auth_guard_1.JwtAuthGuard,
            actions_guard_1.ActionsGuard,
            roles_guard_1.RolesGuard,
            nutricionista_ownership_guard_1.NutricionistaOwnershipGuard,
            plan_socio_access_guard_1.PlanSocioAccessGuard,
            alimentos_sync_service_1.AlimentosSyncService,
            crear_alimento_use_case_1.CrearAlimentoUseCase,
            actualizar_alimento_use_case_1.ActualizarAlimentoUseCase,
            eliminar_alimento_use_case_1.EliminarAlimentoUseCase,
            buscar_socios_con_ficha_use_case_1.BuscarSociosConFichaUseCase,
        ],
        controllers: [
            controllers_1.AgendaController,
            controllers_1.AlimentosController,
            controllers_1.AuthController,
            controllers_1.SocioController,
            controllers_1.ProfesionalController,
            controllers_1.PermisosController,
            controllers_1.PlanAlimentacionController,
            controllers_1.TurnosController,
            controllers_1.ProgresoController,
            controllers_1.AiController,
        ],
    })
], ControllersModule);
//# sourceMappingURL=controllers.module.js.map