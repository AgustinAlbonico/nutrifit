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
exports.AgendaOrmEntity = void 0;
const dia_semana_1 = require("../../../../domain/entities/Agenda/dia-semana");
const typeorm_1 = require("typeorm");
const persona_entity_1 = require("./persona.entity");
let AgendaOrmEntity = class AgendaOrmEntity {
    idAgenda;
    dia;
    horaInicio;
    horaFin;
    duracionTurno;
    nutricionista;
};
exports.AgendaOrmEntity = AgendaOrmEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ name: 'id_agenda' }),
    __metadata("design:type", Number)
], AgendaOrmEntity.prototype, "idAgenda", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'dia', type: 'enum', enum: dia_semana_1.DiaSemana }),
    __metadata("design:type", String)
], AgendaOrmEntity.prototype, "dia", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'time', name: 'hora_inicio' }),
    __metadata("design:type", String)
], AgendaOrmEntity.prototype, "horaInicio", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'time', name: 'hora_fin' }),
    __metadata("design:type", String)
], AgendaOrmEntity.prototype, "horaFin", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', name: 'duracion_turno' }),
    __metadata("design:type", Number)
], AgendaOrmEntity.prototype, "duracionTurno", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => persona_entity_1.NutricionistaOrmEntity, (nutricionista) => nutricionista.agenda, {
        nullable: false,
    }),
    (0, typeorm_1.JoinColumn)({ name: 'id_nutricionista' }),
    __metadata("design:type", persona_entity_1.NutricionistaOrmEntity)
], AgendaOrmEntity.prototype, "nutricionista", void 0);
exports.AgendaOrmEntity = AgendaOrmEntity = __decorate([
    (0, typeorm_1.Entity)('agenda')
], AgendaOrmEntity);
//# sourceMappingURL=agenda.entity.js.map