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
Object.defineProperty(exports, "__esModule", { value: true });
exports.IniciarConsultaUseCase = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const turno_entity_1 = require("../../../infrastructure/persistence/typeorm/entities/turno.entity");
const EstadoTurno_1 = require("../../../domain/entities/Turno/EstadoTurno");
const custom_exceptions_1 = require("../../../domain/exceptions/custom-exceptions");
let IniciarConsultaUseCase = class IniciarConsultaUseCase {
    turnoRepository;
    constructor(turnoRepository) {
        this.turnoRepository = turnoRepository;
    }
    async execute(turnoId) {
        const turno = await this.turnoRepository.findOne({
            where: { idTurno: turnoId },
        });
        if (!turno) {
            throw new custom_exceptions_1.BadRequestError('Turno no encontrado');
        }
        if (turno.estadoTurno !== EstadoTurno_1.EstadoTurno.PRESENTE) {
            throw new custom_exceptions_1.BadRequestError(`No se puede iniciar consulta en un turno con estado ${turno.estadoTurno}`);
        }
        turno.estadoTurno = EstadoTurno_1.EstadoTurno.EN_CURSO;
        turno.consultaIniciadaAt = new Date();
        await this.turnoRepository.save(turno);
        return { success: true, estado: EstadoTurno_1.EstadoTurno.EN_CURSO };
    }
};
exports.IniciarConsultaUseCase = IniciarConsultaUseCase;
exports.IniciarConsultaUseCase = IniciarConsultaUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(turno_entity_1.TurnoOrmEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], IniciarConsultaUseCase);
//# sourceMappingURL=iniciar-consulta.use-case.js.map