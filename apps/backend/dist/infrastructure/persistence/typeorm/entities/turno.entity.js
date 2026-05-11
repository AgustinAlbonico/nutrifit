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
exports.TurnoOrmEntity = void 0;
const EstadoTurno_1 = require("../../../../domain/entities/Turno/EstadoTurno");
const typeorm_1 = require("typeorm");
const gimnasio_entity_1 = require("./gimnasio.entity");
const observacion_clinica_entity_1 = require("./observacion-clinica.entity");
const medicion_entity_1 = require("./medicion.entity");
const persona_entity_1 = require("./persona.entity");
const adjunto_clinico_entity_1 = require("./adjunto-clinico.entity");
let TurnoOrmEntity = class TurnoOrmEntity {
    idTurno;
    fechaTurno;
    horaTurno;
    estadoTurno;
    checkInAt;
    consultaIniciadaAt;
    consultaFinalizadaAt;
    ausenteAt;
    motivoCancelacion;
    fechaOriginal;
    tokenConfirmacion;
    observacionClinica;
    mediciones;
    adjuntos;
    socio;
    nutricionista;
    entrenador;
    gimnasio;
};
exports.TurnoOrmEntity = TurnoOrmEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ name: 'id_turno' }),
    __metadata("design:type", Number)
], TurnoOrmEntity.prototype, "idTurno", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'fecha', type: 'date' }),
    __metadata("design:type", Date)
], TurnoOrmEntity.prototype, "fechaTurno", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'hora_turno', type: 'varchar', length: 10 }),
    __metadata("design:type", String)
], TurnoOrmEntity.prototype, "horaTurno", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'estado', type: 'enum', enum: EstadoTurno_1.EstadoTurno }),
    __metadata("design:type", String)
], TurnoOrmEntity.prototype, "estadoTurno", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'check_in_at', type: 'datetime', nullable: true }),
    __metadata("design:type", Object)
], TurnoOrmEntity.prototype, "checkInAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'consulta_iniciada_at', type: 'datetime', nullable: true }),
    __metadata("design:type", Object)
], TurnoOrmEntity.prototype, "consultaIniciadaAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'consulta_finalizada_at', type: 'datetime', nullable: true }),
    __metadata("design:type", Object)
], TurnoOrmEntity.prototype, "consultaFinalizadaAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'ausente_at', type: 'datetime', nullable: true }),
    __metadata("design:type", Object)
], TurnoOrmEntity.prototype, "ausenteAt", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'motivo_cancelacion',
        type: 'varchar',
        length: 500,
        nullable: true,
    }),
    __metadata("design:type", Object)
], TurnoOrmEntity.prototype, "motivoCancelacion", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'fecha_original', type: 'datetime', nullable: true }),
    __metadata("design:type", Object)
], TurnoOrmEntity.prototype, "fechaOriginal", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'token_confirmacion',
        type: 'varchar',
        length: 255,
        nullable: true,
        unique: true,
    }),
    __metadata("design:type", Object)
], TurnoOrmEntity.prototype, "tokenConfirmacion", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => observacion_clinica_entity_1.ObservacionClinicaOrmEntity, (observacion) => observacion.turno, {
        eager: true,
        nullable: true,
    }),
    (0, typeorm_1.JoinColumn)({ name: 'id_observacion' }),
    __metadata("design:type", observacion_clinica_entity_1.ObservacionClinicaOrmEntity)
], TurnoOrmEntity.prototype, "observacionClinica", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => medicion_entity_1.MedicionOrmEntity, (medicion) => medicion.turno),
    __metadata("design:type", Array)
], TurnoOrmEntity.prototype, "mediciones", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => adjunto_clinico_entity_1.AdjuntoClinicoOrmEntity, (adjunto) => adjunto.turno),
    __metadata("design:type", Array)
], TurnoOrmEntity.prototype, "adjuntos", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => persona_entity_1.SocioOrmEntity, (socio) => socio.turnos, {
        nullable: true,
    }),
    (0, typeorm_1.JoinColumn)({ name: 'id_socio' }),
    __metadata("design:type", persona_entity_1.SocioOrmEntity)
], TurnoOrmEntity.prototype, "socio", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => persona_entity_1.NutricionistaOrmEntity, (nutricionista) => nutricionista.turnos, {
        nullable: false,
    }),
    (0, typeorm_1.JoinColumn)({ name: 'id_nutricionista' }),
    __metadata("design:type", persona_entity_1.NutricionistaOrmEntity)
], TurnoOrmEntity.prototype, "nutricionista", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => persona_entity_1.EntrenadorOrmEntity, (entrenador) => entrenador.turnos, {
        nullable: true,
    }),
    (0, typeorm_1.JoinColumn)({ name: 'id_entrenador' }),
    __metadata("design:type", persona_entity_1.EntrenadorOrmEntity)
], TurnoOrmEntity.prototype, "entrenador", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => gimnasio_entity_1.GimnasioOrmEntity, (gimnasio) => gimnasio.turnos, {
        nullable: true,
    }),
    (0, typeorm_1.JoinColumn)({ name: 'id_gimnasio' }),
    __metadata("design:type", gimnasio_entity_1.GimnasioOrmEntity)
], TurnoOrmEntity.prototype, "gimnasio", void 0);
exports.TurnoOrmEntity = TurnoOrmEntity = __decorate([
    (0, typeorm_1.Entity)('turno')
], TurnoOrmEntity);
//# sourceMappingURL=turno.entity.js.map