"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProgresoModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const progreso_controller_1 = require("../../presentation/http/controllers/progreso.controller");
const subir_foto_progreso_use_case_1 = require("../fotos/use-cases/subir-foto-progreso.use-case");
const obtener_galeria_fotos_use_case_1 = require("../fotos/use-cases/obtener-galeria-fotos.use-case");
const eliminar_foto_progreso_use_case_1 = require("../fotos/use-cases/eliminar-foto-progreso.use-case");
const crear_objetivo_use_case_1 = require("../objetivos/use-cases/crear-objetivo.use-case");
const actualizar_objetivo_use_case_1 = require("../objetivos/use-cases/actualizar-objetivo.use-case");
const marcar_objetivo_completado_use_case_1 = require("../objetivos/use-cases/marcar-objetivo-completado.use-case");
const obtener_objetivos_activos_use_case_1 = require("../objetivos/use-cases/obtener-objetivos-activos.use-case");
const foto_progreso_repository_1 = require("../../infrastructure/persistence/typeorm/repositories/foto-progreso.repository");
const objetivo_repository_1 = require("../../infrastructure/persistence/typeorm/repositories/objetivo.repository");
const foto_progreso_entity_1 = require("../../infrastructure/persistence/typeorm/entities/foto-progreso.entity");
const objetivo_entity_1 = require("../../infrastructure/persistence/typeorm/entities/objetivo.entity");
const persona_entity_1 = require("../../infrastructure/persistence/typeorm/entities/persona.entity");
const minio_module_1 = require("../../infrastructure/services/minio/minio.module");
const app_logger_module_1 = require("../../infrastructure/common/logger/app-logger.module");
const auth_module_1 = require("../auth/auth.module");
const permisos_module_1 = require("../permisos/permisos.module");
let ProgresoModule = class ProgresoModule {
};
exports.ProgresoModule = ProgresoModule;
exports.ProgresoModule = ProgresoModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                foto_progreso_entity_1.FotoProgresoOrmEntity,
                objetivo_entity_1.ObjetivoOrmEntity,
                persona_entity_1.SocioOrmEntity,
            ]),
            minio_module_1.MinioModule,
            app_logger_module_1.AppLoggerModule,
            auth_module_1.AuthModule,
            permisos_module_1.PermisosModule,
        ],
        controllers: [progreso_controller_1.ProgresoController],
        providers: [
            foto_progreso_repository_1.FotoProgresoRepository,
            objetivo_repository_1.ObjetivoRepository,
            subir_foto_progreso_use_case_1.SubirFotoProgresoUseCase,
            obtener_galeria_fotos_use_case_1.ObtenerGaleriaFotosUseCase,
            eliminar_foto_progreso_use_case_1.EliminarFotoProgresoUseCase,
            crear_objetivo_use_case_1.CrearObjetivoUseCase,
            actualizar_objetivo_use_case_1.ActualizarObjetivoUseCase,
            marcar_objetivo_completado_use_case_1.MarcarObjetivoCompletadoUseCase,
            obtener_objetivos_activos_use_case_1.ObtenerObjetivosActivosUseCase,
        ],
        exports: [
            subir_foto_progreso_use_case_1.SubirFotoProgresoUseCase,
            obtener_galeria_fotos_use_case_1.ObtenerGaleriaFotosUseCase,
            eliminar_foto_progreso_use_case_1.EliminarFotoProgresoUseCase,
            crear_objetivo_use_case_1.CrearObjetivoUseCase,
            actualizar_objetivo_use_case_1.ActualizarObjetivoUseCase,
            marcar_objetivo_completado_use_case_1.MarcarObjetivoCompletadoUseCase,
            obtener_objetivos_activos_use_case_1.ObtenerObjetivosActivosUseCase,
        ],
    })
], ProgresoModule);
//# sourceMappingURL=progreso.module.js.map