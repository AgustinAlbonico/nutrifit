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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigureAgendaItemDto = void 0;
const class_validator_1 = require("class-validator");
const dia_semana_1 = require("../../../domain/entities/Agenda/dia-semana");
const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;
class ConfigureAgendaItemDto {
    dia;
    horaInicio;
    horaFin;
    duracionTurno;
}
exports.ConfigureAgendaItemDto = ConfigureAgendaItemDto;
__decorate([
    (0, class_validator_1.IsEnum)(dia_semana_1.DiaSemana),
    __metadata("design:type", String)
], ConfigureAgendaItemDto.prototype, "dia", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(TIME_REGEX, {
        message: 'horaInicio debe estar en formato HH:mm',
    }),
    __metadata("design:type", String)
], ConfigureAgendaItemDto.prototype, "horaInicio", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(TIME_REGEX, {
        message: 'horaFin debe estar en formato HH:mm',
    }),
    __metadata("design:type", String)
], ConfigureAgendaItemDto.prototype, "horaFin", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(5),
    __metadata("design:type", Number)
], ConfigureAgendaItemDto.prototype, "duracionTurno", void 0);
//# sourceMappingURL=configure-agenda-item.dto.js.map