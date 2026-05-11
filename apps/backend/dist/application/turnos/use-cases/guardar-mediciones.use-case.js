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
exports.GuardarMedicionesUseCase = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const turno_entity_1 = require("../../../infrastructure/persistence/typeorm/entities/turno.entity");
const medicion_entity_1 = require("../../../infrastructure/persistence/typeorm/entities/medicion.entity");
const EstadoTurno_1 = require("../../../domain/entities/Turno/EstadoTurno");
const custom_exceptions_1 = require("../../../domain/exceptions/custom-exceptions");
let GuardarMedicionesUseCase = class GuardarMedicionesUseCase {
    turnoRepository;
    medicionRepository;
    constructor(turnoRepository, medicionRepository) {
        this.turnoRepository = turnoRepository;
        this.medicionRepository = medicionRepository;
    }
    async execute(turnoId, dto) {
        const turno = await this.turnoRepository.findOne({
            where: { idTurno: turnoId },
            relations: ['socio', 'socio.fichaSalud'],
        });
        if (!turno) {
            throw new custom_exceptions_1.NotFoundError('Turno no encontrado');
        }
        if (turno.consultaFinalizadaAt !== null) {
            throw new custom_exceptions_1.BadRequestError('No se pueden agregar mediciones a una consulta ya finalizada');
        }
        if (turno.estadoTurno !== EstadoTurno_1.EstadoTurno.EN_CURSO) {
            throw new custom_exceptions_1.BadRequestError(`Solo se pueden guardar mediciones durante una consulta en curso. Estado actual: ${turno.estadoTurno}`);
        }
        let altura = dto.altura;
        if (!altura) {
            const ultimaMedicion = await this.medicionRepository
                .createQueryBuilder('medicion')
                .innerJoin('medicion.turno', 'turno')
                .innerJoin('turno.socio', 'socio')
                .where('socio.idPersona = :socioId', { socioId: turno.socio.idPersona })
                .orderBy('medicion.createdAt', 'DESC')
                .getOne();
            if (ultimaMedicion) {
                altura = ultimaMedicion.altura;
            }
            else if (turno.socio?.fichaSalud) {
                altura = turno.socio.fichaSalud.altura;
            }
            else {
                throw new custom_exceptions_1.BadRequestError('No se encontró altura registrada. Por favor, ingrese la altura.');
            }
        }
        const alturaEnMetros = altura / 100;
        const imc = parseFloat((dto.peso / (alturaEnMetros * alturaEnMetros)).toFixed(2));
        this.validarRangosClinicos(dto, imc);
        let masaMagra = null;
        if (dto.porcentajeGrasa !== undefined) {
            masaMagra = parseFloat((dto.peso * (1 - dto.porcentajeGrasa / 100)).toFixed(2));
        }
        const medicion = this.medicionRepository.create({
            peso: dto.peso,
            altura,
            imc,
            perimetroCintura: dto.perimetroCintura ?? null,
            perimetroCadera: dto.perimetroCadera ?? null,
            perimetroBrazo: dto.perimetroBrazo ?? null,
            perimetroMuslo: dto.perimetroMuslo ?? null,
            perimetroPecho: dto.perimetroPecho ?? null,
            pliegueTriceps: dto.pliegueTriceps ?? null,
            pliegueAbdominal: dto.pliegueAbdominal ?? null,
            pliegueMuslo: dto.pliegueMuslo ?? null,
            porcentajeGrasa: dto.porcentajeGrasa ?? null,
            masaMagra,
            frecuenciaCardiaca: dto.frecuenciaCardiaca ?? null,
            tensionSistolica: dto.tensionSistolica ?? null,
            tensionDiastolica: dto.tensionDiastolica ?? null,
            notasMedicion: dto.notasMedicion ?? null,
            turno,
        });
        const savedMedicion = await this.medicionRepository.save(medicion);
        return {
            success: true,
            imc,
            idMedicion: savedMedicion.idMedicion,
        };
    }
    validarRangosClinicos(dto, imc) {
        if (imc < 10 || imc > 80) {
            throw new custom_exceptions_1.BadRequestError('El IMC calculado queda fuera de un rango clinico razonable. Revisá peso y altura.');
        }
        const tieneTensionSistolica = dto.tensionSistolica !== undefined;
        const tieneTensionDiastolica = dto.tensionDiastolica !== undefined;
        if (tieneTensionSistolica !== tieneTensionDiastolica) {
            throw new custom_exceptions_1.BadRequestError('Para registrar la tensión arterial debes informar el valor sistólico y el diastólico.');
        }
        if (dto.tensionSistolica !== undefined &&
            dto.tensionDiastolica !== undefined &&
            dto.tensionDiastolica >= dto.tensionSistolica) {
            throw new custom_exceptions_1.BadRequestError('La tensión diastólica debe ser menor que la sistólica.');
        }
    }
};
exports.GuardarMedicionesUseCase = GuardarMedicionesUseCase;
exports.GuardarMedicionesUseCase = GuardarMedicionesUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(turno_entity_1.TurnoOrmEntity)),
    __param(1, (0, typeorm_1.InjectRepository)(medicion_entity_1.MedicionOrmEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], GuardarMedicionesUseCase);
//# sourceMappingURL=guardar-mediciones.use-case.js.map