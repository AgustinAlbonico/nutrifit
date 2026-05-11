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
exports.GuardarObservacionesUseCase = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const EstadoTurno_1 = require("../../../domain/entities/Turno/EstadoTurno");
const turno_entity_1 = require("../../../infrastructure/persistence/typeorm/entities/turno.entity");
const observacion_clinica_entity_1 = require("../../../infrastructure/persistence/typeorm/entities/observacion-clinica.entity");
const custom_exceptions_1 = require("../../../domain/exceptions/custom-exceptions");
let GuardarObservacionesUseCase = class GuardarObservacionesUseCase {
    turnoRepository;
    observacionRepository;
    constructor(turnoRepository, observacionRepository) {
        this.turnoRepository = turnoRepository;
        this.observacionRepository = observacionRepository;
    }
    async execute(turnoId, dto) {
        const turno = await this.turnoRepository.findOne({
            where: { idTurno: turnoId },
            relations: ['observacionClinica'],
        });
        if (!turno) {
            throw new custom_exceptions_1.BadRequestError('Turno no encontrado');
        }
        if (turno.consultaFinalizadaAt !== null) {
            throw new custom_exceptions_1.BadRequestError('No se pueden agregar observaciones a una consulta ya finalizada');
        }
        if (turno.estadoTurno !== EstadoTurno_1.EstadoTurno.EN_CURSO) {
            throw new custom_exceptions_1.BadRequestError(`Solo se pueden guardar observaciones durante una consulta en curso. Estado actual: ${turno.estadoTurno}`);
        }
        if (turno.observacionClinica) {
            turno.observacionClinica.comentario = dto.comentario;
            turno.observacionClinica.sugerencias = dto.sugerencias ?? null;
            turno.observacionClinica.habitosSocio = dto.habitosSocio ?? null;
            turno.observacionClinica.objetivosSocio = dto.objetivosSocio ?? null;
            turno.observacionClinica.esPublica = dto.esPublica ?? false;
            await this.observacionRepository.save(turno.observacionClinica);
        }
        else {
            const medicionReciente = await this.turnoRepository
                .createQueryBuilder('turno')
                .innerJoinAndSelect('turno.mediciones', 'medicion')
                .where('turno.idTurno = :turnoId', { turnoId })
                .orderBy('medicion.createdAt', 'DESC')
                .getOne();
            if (!medicionReciente?.mediciones ||
                medicionReciente.mediciones.length === 0) {
                throw new custom_exceptions_1.BadRequestError('No se puede crear observación sin mediciones previas');
            }
            const ultimaMedicion = medicionReciente.mediciones[0];
            const observacion = this.observacionRepository.create({
                comentario: dto.comentario,
                peso: ultimaMedicion.peso,
                altura: ultimaMedicion.altura,
                imc: ultimaMedicion.imc,
                sugerencias: dto.sugerencias ?? null,
                habitosSocio: dto.habitosSocio ?? null,
                objetivosSocio: dto.objetivosSocio ?? null,
                esPublica: dto.esPublica ?? false,
                turno: turno,
            });
            await this.observacionRepository.save(observacion);
        }
        return { success: true };
    }
};
exports.GuardarObservacionesUseCase = GuardarObservacionesUseCase;
exports.GuardarObservacionesUseCase = GuardarObservacionesUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(turno_entity_1.TurnoOrmEntity)),
    __param(1, (0, typeorm_1.InjectRepository)(observacion_clinica_entity_1.ObservacionClinicaOrmEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], GuardarObservacionesUseCase);
//# sourceMappingURL=guardar-observaciones.use-case.js.map