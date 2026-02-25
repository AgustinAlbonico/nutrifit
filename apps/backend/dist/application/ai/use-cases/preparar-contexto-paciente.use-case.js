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
exports.PrepararContextoPacienteUseCase = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const nutricionista_repository_1 = require("../../../domain/entities/Persona/Nutricionista/nutricionista.repository");
const custom_exceptions_1 = require("../../../domain/exceptions/custom-exceptions");
const logger_service_1 = require("../../../domain/services/logger.service");
const entities_1 = require("../../../infrastructure/persistence/typeorm/entities");
const typeorm_2 = require("typeorm");
let PrepararContextoPacienteUseCase = class PrepararContextoPacienteUseCase {
    socioRepository;
    nutricionistaRepository;
    logger;
    constructor(socioRepository, nutricionistaRepository, logger) {
        this.socioRepository = socioRepository;
        this.nutricionistaRepository = nutricionistaRepository;
        this.logger = logger;
    }
    async execute(socioId) {
        const socio = await this.socioRepository.findOne({
            where: { idPersona: socioId },
            relations: {
                fichaSalud: {
                    alergias: true,
                    patologias: true,
                },
            },
        });
        if (!socio) {
            throw new custom_exceptions_1.NotFoundError('Socio', String(socioId));
        }
        if (!socio.fichaSalud) {
            throw new custom_exceptions_1.BadRequestError('El paciente debe completar su ficha de salud para poder generar recomendaciones de alimentación.');
        }
        const contextoPaciente = {
            socioId: socio.idPersona ?? 0,
            peso: socio.fichaSalud.peso,
            altura: socio.fichaSalud.altura,
            objetivoPersonal: socio.fichaSalud.objetivoPersonal ?? 'Sin objetivo definido',
            nivelActividadFisica: this.convertirNivelActividadFisica(socio.fichaSalud.nivelActividadFisica),
            alergias: (socio.fichaSalud.alergias ?? []).map((alergia) => alergia.nombre),
            patologias: (socio.fichaSalud.patologias ?? []).map((patologia) => patologia.nombre),
            restriccionesAlimentarias: socio.fichaSalud.restriccionesAlimentarias ?? null,
            frecuenciaComidas: this.convertirFrecuenciaComidas(socio.fichaSalud.frecuenciaComidas),
            consumoAguaDiario: socio.fichaSalud.consumoAguaDiario,
            consumoAlcohol: this.convertirConsumoAlcohol(socio.fichaSalud.consumoAlcohol),
            fumaTabaco: socio.fichaSalud.fumaTabaco,
            horasSueno: socio.fichaSalud.horasSueno,
            medicamentosActuales: socio.fichaSalud.medicacionActual ?? null,
            suplementosActuales: socio.fichaSalud.suplementosActuales ?? null,
            cirugiasPrevias: socio.fichaSalud.cirugiasPrevias ?? null,
            antecedentesFamiliares: socio.fichaSalud.antecedentesFamiliares ?? null,
        };
        this.logger.log(`Contexto de paciente preparado para IA. Socio=${socioId}. Datos anonimizados listos para prompt.`);
        return contextoPaciente;
    }
    convertirNivelActividadFisica(nivelActividadFisica) {
        switch (nivelActividadFisica) {
            case 'Sedentario':
                return 'SEDENTARIO';
            case 'Moderado':
                return 'MODERADO';
            case 'Intenso':
                return 'ALTO';
            case 'Bajo':
                return 'BAJO';
            default:
                return 'SEDENTARIO';
        }
    }
    convertirFrecuenciaComidas(frecuenciaComidas) {
        if (!frecuenciaComidas)
            return null;
        switch (frecuenciaComidas) {
            case '1-2 comidas':
                return '1';
            case '3 comidas':
                return '3';
            case '4-5 comidas':
                return '4';
            case '6 o más comidas':
                return '5+';
            default:
                return '3';
        }
    }
    convertirConsumoAlcohol(consumoAlcohol) {
        if (!consumoAlcohol)
            return null;
        switch (consumoAlcohol) {
            case 'Nunca':
                return 'NUNCA';
            case 'Ocasional':
                return 'OCCASIONAL';
            case 'Moderado':
                return 'FRECUENTE';
            case 'Frecuente':
                return 'FRECUENTE';
            default:
                return 'NUNCA';
        }
    }
};
exports.PrepararContextoPacienteUseCase = PrepararContextoPacienteUseCase;
exports.PrepararContextoPacienteUseCase = PrepararContextoPacienteUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.SocioOrmEntity)),
    __param(1, (0, common_1.Inject)(nutricionista_repository_1.NUTRICIONISTA_REPOSITORY)),
    __param(2, (0, common_1.Inject)(logger_service_1.APP_LOGGER_SERVICE)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        nutricionista_repository_1.NutricionistaRepository, Object])
], PrepararContextoPacienteUseCase);
//# sourceMappingURL=preparar-contexto-paciente.use-case.js.map