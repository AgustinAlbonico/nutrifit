"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TurnosModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const nutricionista_repository_1 = require("../../domain/entities/Persona/Nutricionista/nutricionista.repository");
const app_logger_module_1 = require("../../infrastructure/common/logger/app-logger.module");
const entities_1 = require("../../infrastructure/persistence/typeorm/entities");
const nutricionista_repository_2 = require("../../infrastructure/persistence/typeorm/repositories/nutricionista.repository");
const use_cases_1 = require("./use-cases");
const auditoria_module_1 = require("../../infrastructure/services/auditoria/auditoria.module");
const adjunto_clinico_module_1 = require("../../infrastructure/services/adjunto-clinico/adjunto-clinico.module");
const notificaciones_service_1 = require("../notificaciones/notificaciones.service");
const notificacion_entity_1 = require("../../infrastructure/persistence/typeorm/entities/notificacion.entity");
let TurnosModule = class TurnosModule {
};
exports.TurnosModule = TurnosModule;
exports.TurnosModule = TurnosModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                entities_1.AgendaOrmEntity,
                entities_1.AlergiaOrmEntity,
                entities_1.FichaSaludOrmEntity,
                entities_1.MedicionOrmEntity,
                entities_1.NutricionistaOrmEntity,
                entities_1.ObservacionClinicaOrmEntity,
                entities_1.PatologiaOrmEntity,
                entities_1.SocioOrmEntity,
                entities_1.TurnoConfirmacionTokenOrmEntity,
                entities_1.TurnoOrmEntity,
                entities_1.UsuarioOrmEntity,
                notificacion_entity_1.NotificacionOrmEntity,
            ]),
            app_logger_module_1.AppLoggerModule,
            auditoria_module_1.AuditoriaModule,
            adjunto_clinico_module_1.AdjuntoClinicoModule,
        ],
        providers: [
            use_cases_1.AsignarTurnoManualUseCase,
            use_cases_1.BloquearTurnoUseCase,
            use_cases_1.CancelarTurnoSocioUseCase,
            use_cases_1.CheckInTurnoUseCase,
            use_cases_1.ConfirmarTurnoSocioUseCase,
            use_cases_1.DesbloquearTurnoUseCase,
            use_cases_1.FinalizarConsultaUseCase,
            use_cases_1.GetAgendaDiariaUseCase,
            use_cases_1.GetFichaSaludPacienteUseCase,
            use_cases_1.GetFichaSaludSocioUseCase,
            use_cases_1.GetHistorialConsultasPacienteUseCase,
            use_cases_1.GetHistorialMedicionesUseCase,
            use_cases_1.GetResumenProgresoUseCase,
            use_cases_1.GetTurnosDelDiaUseCase,
            use_cases_1.GetTurnosRecepcionDiaUseCase,
            use_cases_1.GetTurnoByIdUseCase,
            use_cases_1.GuardarMedicionesUseCase,
            use_cases_1.GuardarObservacionesUseCase,
            use_cases_1.IniciarConsultaUseCase,
            use_cases_1.ListMisTurnosUseCase,
            use_cases_1.ListPacientesProfesionalUseCase,
            use_cases_1.ReprogramarTurnoSocioUseCase,
            use_cases_1.RegistrarAsistenciaTurnoUseCase,
            use_cases_1.ReservarTurnoSocioUseCase,
            use_cases_1.UpsertFichaSaludSocioUseCase,
            notificaciones_service_1.NotificacionesService,
            {
                provide: nutricionista_repository_1.NUTRICIONISTA_REPOSITORY,
                useClass: nutricionista_repository_2.NutricionistaRepositoryImplementation,
            },
        ],
        exports: [
            use_cases_1.AsignarTurnoManualUseCase,
            use_cases_1.BloquearTurnoUseCase,
            use_cases_1.CancelarTurnoSocioUseCase,
            use_cases_1.CheckInTurnoUseCase,
            use_cases_1.ConfirmarTurnoSocioUseCase,
            use_cases_1.DesbloquearTurnoUseCase,
            use_cases_1.FinalizarConsultaUseCase,
            use_cases_1.GetAgendaDiariaUseCase,
            use_cases_1.GetFichaSaludPacienteUseCase,
            use_cases_1.GetFichaSaludSocioUseCase,
            use_cases_1.GetHistorialConsultasPacienteUseCase,
            use_cases_1.GetHistorialMedicionesUseCase,
            use_cases_1.GetResumenProgresoUseCase,
            use_cases_1.GetTurnosDelDiaUseCase,
            use_cases_1.GetTurnosRecepcionDiaUseCase,
            use_cases_1.GetTurnoByIdUseCase,
            use_cases_1.GuardarMedicionesUseCase,
            use_cases_1.GuardarObservacionesUseCase,
            use_cases_1.IniciarConsultaUseCase,
            use_cases_1.ListMisTurnosUseCase,
            use_cases_1.ListPacientesProfesionalUseCase,
            use_cases_1.ReprogramarTurnoSocioUseCase,
            use_cases_1.RegistrarAsistenciaTurnoUseCase,
            use_cases_1.ReservarTurnoSocioUseCase,
            use_cases_1.UpsertFichaSaludSocioUseCase,
        ],
    })
], TurnosModule);
//# sourceMappingURL=turnos.module.js.map