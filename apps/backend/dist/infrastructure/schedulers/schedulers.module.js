"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchedulersModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const alimento_entity_1 = require("../persistence/typeorm/entities/alimento.entity");
const turno_entity_1 = require("../persistence/typeorm/entities/turno.entity");
const alimentos_sync_service_1 = require("../alimentos/alimentos-sync.service");
const alimentos_sync_scheduler_1 = require("./alimentos-sync.scheduler");
const ausencia_turno_scheduler_1 = require("./ausencia-turno.scheduler");
const repositories_module_1 = require("../persistence/typeorm/repositories/repositories.module");
const recordatorio_enviado_entity_1 = require("../persistence/typeorm/entities/recordatorio-enviado.entity");
const turno_reminder_scheduler_1 = require("./turno-reminder.scheduler");
const email_service_1 = require("../../application/email/email.service");
const console_email_provider_1 = require("../email/console-email.provider");
const smtp_email_provider_1 = require("../email/smtp-email.provider");
const config_1 = require("@nestjs/config");
let SchedulersModule = class SchedulersModule {
};
exports.SchedulersModule = SchedulersModule;
exports.SchedulersModule = SchedulersModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                turno_entity_1.TurnoOrmEntity,
                alimento_entity_1.AlimentoOrmEntity,
                recordatorio_enviado_entity_1.RecordatorioEnviadoOrmEntity,
            ]),
            repositories_module_1.RepositoriesModule,
        ],
        providers: [
            ausencia_turno_scheduler_1.AusenciaTurnoScheduler,
            turno_reminder_scheduler_1.TurnoReminderScheduler,
            alimentos_sync_service_1.AlimentosSyncService,
            alimentos_sync_scheduler_1.AlimentosSyncScheduler,
            email_service_1.EmailService,
            console_email_provider_1.ConsoleEmailProvider,
            smtp_email_provider_1.SmtpEmailProvider,
            {
                provide: email_service_1.EMAIL_PROVIDER,
                useFactory: (configService) => {
                    const smtpHost = configService.get('SMTP_HOST');
                    if (smtpHost) {
                        return new smtp_email_provider_1.SmtpEmailProvider(configService);
                    }
                    return new console_email_provider_1.ConsoleEmailProvider();
                },
                inject: [config_1.ConfigService],
            },
        ],
    })
], SchedulersModule);
//# sourceMappingURL=schedulers.module.js.map