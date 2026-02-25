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
exports.GetAgendaDiariaUseCase = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const agenda_slot_dto_1 = require("../dtos/agenda-slot.dto");
const dia_semana_1 = require("../../../domain/entities/Agenda/dia-semana");
const EstadoTurno_1 = require("../../../domain/entities/Turno/EstadoTurno");
const custom_exceptions_1 = require("../../../domain/exceptions/custom-exceptions");
const argentina_datetime_util_1 = require("../../../common/utils/argentina-datetime.util");
const entities_1 = require("../../../infrastructure/persistence/typeorm/entities");
const typeorm_2 = require("typeorm");
let GetAgendaDiariaUseCase = class GetAgendaDiariaUseCase {
    agendaRepository;
    turnoRepository;
    nutricionistaRepository;
    constructor(agendaRepository, turnoRepository, nutricionistaRepository) {
        this.agendaRepository = agendaRepository;
        this.turnoRepository = turnoRepository;
        this.nutricionistaRepository = nutricionistaRepository;
    }
    async execute(nutricionistaId, query) {
        const nutricionista = await this.nutricionistaRepository.findOne({
            where: { idPersona: nutricionistaId },
        });
        if (!nutricionista) {
            throw new custom_exceptions_1.NotFoundError('Profesional', String(nutricionistaId));
        }
        const fecha = (0, argentina_datetime_util_1.parseArgentinaDateInput)(query.fecha);
        const diaSemana = this.mapDateToDiaSemana(fecha);
        const agendas = await this.agendaRepository.find({
            where: {
                nutricionista: { idPersona: nutricionistaId },
                dia: diaSemana,
            },
            order: { horaInicio: 'ASC' },
        });
        if (!agendas.length) {
            return [];
        }
        const turnos = await this.turnoRepository.find({
            where: {
                nutricionista: { idPersona: nutricionistaId },
                fechaTurno: fecha,
                estadoTurno: (0, typeorm_2.Not)(EstadoTurno_1.EstadoTurno.CANCELADO),
            },
            relations: ['socio'],
        });
        const turnosMap = new Map();
        turnos.forEach((t) => turnosMap.set(t.horaTurno.slice(0, 5), t));
        const slots = [];
        for (const bloque of agendas) {
            let current = (0, argentina_datetime_util_1.timeToMinutes)(bloque.horaInicio);
            const end = (0, argentina_datetime_util_1.timeToMinutes)(bloque.horaFin);
            while (current + bloque.duracionTurno <= end) {
                const horaInicioStr = (0, argentina_datetime_util_1.minutesToTime)(current);
                const horaFinStr = (0, argentina_datetime_util_1.minutesToTime)(current + bloque.duracionTurno);
                const turnoExistente = turnosMap.get(horaInicioStr);
                const slot = new agenda_slot_dto_1.AgendaSlotDto();
                slot.horaInicio = horaInicioStr;
                slot.horaFin = horaFinStr;
                if (turnoExistente) {
                    slot.estado = turnoExistente.estadoTurno;
                    slot.turnoId = turnoExistente.idTurno;
                    if (turnoExistente.socio) {
                        slot.socio = {
                            nombre: `${turnoExistente.socio.nombre} ${turnoExistente.socio.apellido}`,
                            dni: turnoExistente.socio.dni ?? '',
                        };
                    }
                }
                else {
                    slot.estado = 'LIBRE';
                }
                slots.push(slot);
                current += bloque.duracionTurno;
            }
        }
        return slots;
    }
    mapDateToDiaSemana(date) {
        const day = (0, argentina_datetime_util_1.getArgentinaWeekdayIndex)(date);
        const days = [
            dia_semana_1.DiaSemana.DOMINGO,
            dia_semana_1.DiaSemana.LUNES,
            dia_semana_1.DiaSemana.MARTES,
            dia_semana_1.DiaSemana.MIERCOLES,
            dia_semana_1.DiaSemana.JUEVES,
            dia_semana_1.DiaSemana.VIERNES,
            dia_semana_1.DiaSemana.SABADO,
        ];
        return days[day];
    }
};
exports.GetAgendaDiariaUseCase = GetAgendaDiariaUseCase;
exports.GetAgendaDiariaUseCase = GetAgendaDiariaUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.AgendaOrmEntity)),
    __param(1, (0, typeorm_1.InjectRepository)(entities_1.TurnoOrmEntity)),
    __param(2, (0, typeorm_1.InjectRepository)(entities_1.NutricionistaOrmEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], GetAgendaDiariaUseCase);
//# sourceMappingURL=get-agenda-diaria.use-case.js.map