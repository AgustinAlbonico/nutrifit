"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AlimentosSyncScheduler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlimentosSyncScheduler = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const alimentos_sync_service_1 = require("../alimentos/alimentos-sync.service");
let AlimentosSyncScheduler = AlimentosSyncScheduler_1 = class AlimentosSyncScheduler {
    alimentosSyncService;
    logger = new common_1.Logger(AlimentosSyncScheduler_1.name);
    constructor(alimentosSyncService) {
        this.alimentosSyncService = alimentosSyncService;
    }
    async ejecutarSincronizacionNocturna() {
        if (!this.alimentosSyncService.sincronizacionAutomaticaHabilitada()) {
            return;
        }
        this.logger.log('Iniciando sincronizacion automatica de alimentos...');
        try {
            const resultado = await this.alimentosSyncService.sincronizarCatalogo('cron');
            this.logger.log(`Sincronizacion automatica OK. Insertados=${resultado.insertados}, ` +
                `eliminados=${resultado.eliminadosPorCuracion}, ` +
                `paginas=${resultado.paginasConsultadas}.`);
        }
        catch (error) {
            const detalle = error instanceof Error ? error.message : String(error);
            this.logger.error(`Error en sincronizacion automatica de alimentos: ${detalle}`);
        }
    }
};
exports.AlimentosSyncScheduler = AlimentosSyncScheduler;
__decorate([
    (0, schedule_1.Cron)('30 3 * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AlimentosSyncScheduler.prototype, "ejecutarSincronizacionNocturna", null);
exports.AlimentosSyncScheduler = AlimentosSyncScheduler = AlimentosSyncScheduler_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [alimentos_sync_service_1.AlimentosSyncService])
], AlimentosSyncScheduler);
//# sourceMappingURL=alimentos-sync.scheduler.js.map