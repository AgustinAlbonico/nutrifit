"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApplicationModule = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const auth_module_1 = require("./auth/auth.module");
const socios_module_1 = require("./socios/socios.module");
const permisos_module_1 = require("./permisos/permisos.module");
const profesionales_module_1 = require("./profesionales/profesionales.module");
const agenda_module_1 = require("./agenda/agenda.module");
const turnos_module_1 = require("./turnos/turnos.module");
const planes_alimentacion_module_1 = require("./planes-alimentacion/planes-alimentacion.module");
const ai_module_1 = require("./ai/ai.module");
const reportes_module_1 = require("./reportes/reportes.module");
let ApplicationModule = class ApplicationModule {
};
exports.ApplicationModule = ApplicationModule;
exports.ApplicationModule = ApplicationModule = __decorate([
    (0, common_1.Module)({
        imports: [
            auth_module_1.AuthModule,
            socios_module_1.SociosModule,
            schedule_1.ScheduleModule.forRoot(),
            permisos_module_1.PermisosModule,
            profesionales_module_1.ProfesionalesModule,
            agenda_module_1.AgendaModule,
            turnos_module_1.TurnosModule,
            planes_alimentacion_module_1.PlanesAlimentacionModule,
            ai_module_1.AiModule,
            reportes_module_1.ReportesModule,
        ],
        exports: [
            auth_module_1.AuthModule,
            socios_module_1.SociosModule,
            permisos_module_1.PermisosModule,
            profesionales_module_1.ProfesionalesModule,
            agenda_module_1.AgendaModule,
            turnos_module_1.TurnosModule,
            planes_alimentacion_module_1.PlanesAlimentacionModule,
            ai_module_1.AiModule,
            reportes_module_1.ReportesModule,
        ],
    })
], ApplicationModule);
//# sourceMappingURL=application.module.js.map