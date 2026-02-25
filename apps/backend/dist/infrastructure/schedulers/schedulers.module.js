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
let SchedulersModule = class SchedulersModule {
};
exports.SchedulersModule = SchedulersModule;
exports.SchedulersModule = SchedulersModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([turno_entity_1.TurnoOrmEntity, alimento_entity_1.AlimentoOrmEntity])],
        providers: [
            ausencia_turno_scheduler_1.AusenciaTurnoScheduler,
            alimentos_sync_service_1.AlimentosSyncService,
            alimentos_sync_scheduler_1.AlimentosSyncScheduler,
        ],
    })
], SchedulersModule);
//# sourceMappingURL=schedulers.module.js.map