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
exports.CheckInTurnoUseCase = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const turno_entity_1 = require("../../../infrastructure/persistence/typeorm/entities/turno.entity");
const EstadoTurno_1 = require("../../../domain/entities/Turno/EstadoTurno");
const custom_exceptions_1 = require("../../../domain/exceptions/custom-exceptions");
const notificaciones_service_1 = require("../../notificaciones/notificaciones.service");
const tipo_notificacion_enum_1 = require("../../../domain/entities/Notificacion/tipo-notificacion.enum");
let CheckInTurnoUseCase = class CheckInTurnoUseCase {
    turnoRepository;
    notificacionesService;
    constructor(turnoRepository, notificacionesService) {
        this.turnoRepository = turnoRepository;
        this.notificacionesService = notificacionesService;
    }
    async execute(turnoId) {
        const turno = await this.turnoRepository.findOne({
            where: { idTurno: turnoId },
            relations: { socio: true },
        });
        if (!turno) {
            throw new custom_exceptions_1.BadRequestError('Turno no encontrado');
        }
        if (turno.estadoTurno !== EstadoTurno_1.EstadoTurno.PROGRAMADO) {
            throw new custom_exceptions_1.BadRequestError(`No se puede hacer check-in en un turno con estado ${turno.estadoTurno}`);
        }
        turno.estadoTurno = EstadoTurno_1.EstadoTurno.PRESENTE;
        turno.checkInAt = new Date();
        await this.turnoRepository.save(turno);
        if (turno.socio?.idPersona) {
            await this.notificacionesService.crear({
                destinatarioId: turno.socio.idPersona,
                tipo: tipo_notificacion_enum_1.TipoNotificacion.CHECK_IN,
                titulo: 'Check-in registrado',
                mensaje: `Se registró tu check-in del turno #${turno.idTurno}.`,
                metadata: { turnoId: turno.idTurno },
            });
        }
        if (turno.nutricionista?.idPersona) {
            await this.notificacionesService.crear({
                destinatarioId: turno.nutricionista.idPersona,
                tipo: tipo_notificacion_enum_1.TipoNotificacion.CHECK_IN,
                titulo: 'Socio realizó check-in',
                mensaje: `El socio hizo check-in para el turno #${turno.idTurno}.`,
                metadata: { turnoId: turno.idTurno },
            });
        }
        return { success: true, estado: EstadoTurno_1.EstadoTurno.PRESENTE };
    }
};
exports.CheckInTurnoUseCase = CheckInTurnoUseCase;
exports.CheckInTurnoUseCase = CheckInTurnoUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(turno_entity_1.TurnoOrmEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        notificaciones_service_1.NotificacionesService])
], CheckInTurnoUseCase);
//# sourceMappingURL=check-in-turno.use-case.js.map