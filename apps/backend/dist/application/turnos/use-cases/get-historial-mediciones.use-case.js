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
exports.GetHistorialMedicionesUseCase = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const medicion_entity_1 = require("../../../infrastructure/persistence/typeorm/entities/medicion.entity");
const persona_entity_1 = require("../../../infrastructure/persistence/typeorm/entities/persona.entity");
const custom_exceptions_1 = require("../../../domain/exceptions/custom-exceptions");
let GetHistorialMedicionesUseCase = class GetHistorialMedicionesUseCase {
    medicionRepository;
    socioRepository;
    constructor(medicionRepository, socioRepository) {
        this.medicionRepository = medicionRepository;
        this.socioRepository = socioRepository;
    }
    async execute(socioId) {
        const socio = await this.socioRepository.findOne({
            where: { idPersona: socioId },
            relations: ['fichaSalud'],
        });
        if (!socio) {
            throw new custom_exceptions_1.NotFoundError('Socio no encontrado');
        }
        const mediciones = await this.medicionRepository
            .createQueryBuilder('medicion')
            .innerJoinAndSelect('medicion.turno', 'turno')
            .innerJoinAndSelect('turno.nutricionista', 'nutricionista')
            .innerJoin('turno.socio', 'socio')
            .where('socio.idPersona = :socioId', { socioId })
            .orderBy('medicion.createdAt', 'DESC')
            .getMany();
        let ultimaAltura = socio.fichaSalud?.altura ?? 0;
        if (mediciones.length > 0) {
            const medicionConAltura = mediciones.find((m) => m.altura > 0);
            if (medicionConAltura) {
                ultimaAltura = medicionConAltura.altura;
            }
        }
        const medicionesFormateadas = mediciones.map((m) => ({
            idMedicion: m.idMedicion,
            fecha: m.createdAt,
            peso: Number(m.peso),
            altura: m.altura,
            imc: Number(m.imc),
            perimetroCintura: m.perimetroCintura ? Number(m.perimetroCintura) : null,
            perimetroCadera: m.perimetroCadera ? Number(m.perimetroCadera) : null,
            perimetroBrazo: m.perimetroBrazo ? Number(m.perimetroBrazo) : null,
            perimetroMuslo: m.perimetroMuslo ? Number(m.perimetroMuslo) : null,
            perimetroPecho: m.perimetroPecho ? Number(m.perimetroPecho) : null,
            pliegueTriceps: m.pliegueTriceps ? Number(m.pliegueTriceps) : null,
            pliegueAbdominal: m.pliegueAbdominal ? Number(m.pliegueAbdominal) : null,
            pliegueMuslo: m.pliegueMuslo ? Number(m.pliegueMuslo) : null,
            porcentajeGrasa: m.porcentajeGrasa ? Number(m.porcentajeGrasa) : null,
            masaMagra: m.masaMagra ? Number(m.masaMagra) : null,
            frecuenciaCardiaca: m.frecuenciaCardiaca,
            tensionSistolica: m.tensionSistolica,
            tensionDiastolica: m.tensionDiastolica,
            notasMedicion: m.notasMedicion,
            profesional: m.turno.nutricionista
                ? {
                    id: m.turno.nutricionista.idPersona,
                    nombre: m.turno.nutricionista.nombre,
                    apellido: m.turno.nutricionista.apellido,
                }
                : null,
        }));
        return {
            socioId,
            nombreSocio: socio.nombre,
            apellidoSocio: socio.apellido,
            altura: ultimaAltura,
            mediciones: medicionesFormateadas,
        };
    }
};
exports.GetHistorialMedicionesUseCase = GetHistorialMedicionesUseCase;
exports.GetHistorialMedicionesUseCase = GetHistorialMedicionesUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(medicion_entity_1.MedicionOrmEntity)),
    __param(1, (0, typeorm_1.InjectRepository)(persona_entity_1.SocioOrmEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], GetHistorialMedicionesUseCase);
//# sourceMappingURL=get-historial-mediciones.use-case.js.map