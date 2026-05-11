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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var AusenciaTurnoScheduler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AusenciaTurnoScheduler = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const turno_entity_1 = require("../persistence/typeorm/entities/turno.entity");
const EstadoTurno_1 = require("../../domain/entities/Turno/EstadoTurno");
const politica_operativa_repository_1 = require("../../application/politicas/politica-operativa.repository");
let AusenciaTurnoScheduler = AusenciaTurnoScheduler_1 = class AusenciaTurnoScheduler {
    turnoRepository;
    politicaRepository;
    logger = new common_1.Logger(AusenciaTurnoScheduler_1.name);
    constructor(turnoRepository, politicaRepository) {
        this.turnoRepository = turnoRepository;
        this.politicaRepository = politicaRepository;
    }
    async marcarAusentesAutomaticos() {
        this.logger.log('Ejecutando verificación de turnos ausentes...');
        const ahora = new Date();
        const fechaHoy = ahora.toISOString().split('T')[0];
        const turnos = await this.turnoRepository
            .createQueryBuilder('turno')
            .where('turno.fechaTurno = :fecha', { fecha: fechaHoy })
            .andWhere('turno.estadoTurno IN (:...estados)', {
            estados: [EstadoTurno_1.EstadoTurno.PROGRAMADO],
        })
            .getMany();
        for (const turno of turnos) {
            const gimnasioId = turno.gimnasio?.idGimnasio ?? 1;
            const umbralMinutos = await this.politicaRepository.getUmbralAusente(gimnasioId);
            const [hora, minuto] = turno.horaTurno.split(':').map(Number);
            const turnoTime = new Date(ahora);
            turnoTime.setHours(hora, minuto + umbralMinutos, 0, 0);
            if (ahora > turnoTime) {
                turno.estadoTurno = EstadoTurno_1.EstadoTurno.AUSENTE;
                turno.ausenteAt = ahora;
                await this.turnoRepository.save(turno);
                this.logger.log(`Turno ${turno.idTurno} marcado como AUSENTE`);
            }
        }
    }
};
exports.AusenciaTurnoScheduler = AusenciaTurnoScheduler;
__decorate([
    (0, schedule_1.Cron)('*/5 * * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AusenciaTurnoScheduler.prototype, "marcarAusentesAutomaticos", null);
exports.AusenciaTurnoScheduler = AusenciaTurnoScheduler = AusenciaTurnoScheduler_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(turno_entity_1.TurnoOrmEntity)),
    __param(1, (0, common_1.Inject)(politica_operativa_repository_1.POLITICA_OPERATIVA_REPOSITORY)),
    __metadata("design:paramtypes", [typeorm_2.Repository, Object])
], AusenciaTurnoScheduler);
//# sourceMappingURL=ausencia-turno.scheduler.js.map