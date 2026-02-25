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
exports.GetTurnoByIdUseCase = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const EstadoTurno_1 = require("../../../domain/entities/Turno/EstadoTurno");
const custom_exceptions_1 = require("../../../domain/exceptions/custom-exceptions");
const NivelActividadFisica_1 = require("../../../domain/entities/FichaSalud/NivelActividadFisica");
const FrecuenciaComidas_1 = require("../../../domain/entities/FichaSalud/FrecuenciaComidas");
const ConsumoAlcohol_1 = require("../../../domain/entities/FichaSalud/ConsumoAlcohol");
const entities_1 = require("../../../infrastructure/persistence/typeorm/entities");
const typeorm_2 = require("typeorm");
let GetTurnoByIdUseCase = class GetTurnoByIdUseCase {
    turnoRepository;
    nutricionistaRepository;
    fichaSaludRepository;
    constructor(turnoRepository, nutricionistaRepository, fichaSaludRepository) {
        this.turnoRepository = turnoRepository;
        this.nutricionistaRepository = nutricionistaRepository;
        this.fichaSaludRepository = fichaSaludRepository;
    }
    async execute(turnoId, nutricionistaId) {
        const turno = await this.turnoRepository.findOne({
            where: { idTurno: turnoId },
            relations: ['socio', 'nutricionista'],
        });
        if (!turno) {
            throw new custom_exceptions_1.NotFoundError('Turno', String(turnoId));
        }
        if (turno.nutricionista.idPersona !== nutricionistaId) {
            throw new custom_exceptions_1.BadRequestError('No tienes permiso para ver este turno. No es de tu autoría.');
        }
        if (turno.estadoTurno === EstadoTurno_1.EstadoTurno.CANCELADO) {
            throw new custom_exceptions_1.BadRequestError('El turno está cancelado');
        }
        const socioResponse = {
            idPersona: turno.socio?.idPersona ?? 0,
            nombre: turno.socio?.nombre ?? '',
            apellido: turno.socio?.apellido ?? '',
            dni: turno.socio?.dni ?? '',
            email: '',
            telefono: turno.socio?.telefono ?? null,
        };
        let fichaSaludResponse = null;
        const socioId = turno.socio?.idPersona;
        if (socioId) {
            try {
                const fichaSaludOrm = await this.fichaSaludRepository.findOne({
                    where: { socio: { idPersona: socioId } },
                    relations: ['alergias', 'patologias'],
                });
                if (fichaSaludOrm) {
                    fichaSaludResponse = {
                        fichaSaludId: fichaSaludOrm.idFichaSalud,
                        altura: fichaSaludOrm.altura,
                        peso: Number(fichaSaludOrm.peso),
                        nivelActividadFisica: this.mapNivelActividad(fichaSaludOrm.nivelActividadFisica),
                        alergias: fichaSaludOrm.alergias?.map((a) => a.nombre) ?? [],
                        patologias: fichaSaludOrm.patologias?.map((p) => p.nombre) ?? [],
                        objetivoPersonal: fichaSaludOrm.objetivoPersonal ?? null,
                        medicacionActual: fichaSaludOrm.medicacionActual ?? null,
                        suplementosActuales: fichaSaludOrm.suplementosActuales ?? null,
                        cirugiasPrevias: fichaSaludOrm.cirugiasPrevias ?? null,
                        antecedentesFamiliares: fichaSaludOrm.antecedentesFamiliares ?? null,
                        frecuenciaComidas: this.mapFrecuenciaComidas(fichaSaludOrm.frecuenciaComidas),
                        consumoAguaDiario: fichaSaludOrm.consumoAguaDiario
                            ? Number(fichaSaludOrm.consumoAguaDiario)
                            : null,
                        restriccionesAlimentarias: fichaSaludOrm.restriccionesAlimentarias || null,
                        consumoAlcohol: this.mapConsumoAlcohol(fichaSaludOrm.consumoAlcohol),
                        fumaTabaco: fichaSaludOrm.fumaTabaco ?? false,
                        horasSueno: fichaSaludOrm.horasSueno || null,
                        contactoEmergenciaNombre: fichaSaludOrm.contactoEmergenciaNombre || null,
                        contactoEmergenciaTelefono: fichaSaludOrm.contactoEmergenciaTelefono || null,
                    };
                }
            }
            catch (error) {
                console.error('Error al buscar ficha de salud:', error);
            }
        }
        const response = {
            idTurno: turno.idTurno,
            fechaTurno: this.formatDate(turno.fechaTurno),
            horaTurno: turno.horaTurno,
            estadoTurno: turno.estadoTurno,
            socio: socioResponse,
            fichaSalud: fichaSaludResponse,
        };
        return response;
    }
    mapNivelActividad(nivel) {
        switch (nivel) {
            case NivelActividadFisica_1.NivelActividadFisica.SEDENTARIO:
                return 'Sedentario';
            case NivelActividadFisica_1.NivelActividadFisica.MODERADO:
                return 'Moderado';
            case NivelActividadFisica_1.NivelActividadFisica.INTENSO:
                return 'Intenso';
            default:
                return 'Sedentario';
        }
    }
    mapFrecuenciaComidas(frecuencia) {
        if (!frecuencia)
            return null;
        switch (frecuencia) {
            case FrecuenciaComidas_1.FrecuenciaComidas.UNO_DOS:
                return '1-2 comidas';
            case FrecuenciaComidas_1.FrecuenciaComidas.TRES:
                return '3 comidas';
            case FrecuenciaComidas_1.FrecuenciaComidas.CUATRO_CINCO:
                return '4-5 comidas';
            case FrecuenciaComidas_1.FrecuenciaComidas.SEIS_O_MAS:
                return '6 o más comidas';
            default:
                return null;
        }
    }
    mapConsumoAlcohol(consumo) {
        if (!consumo)
            return null;
        switch (consumo) {
            case ConsumoAlcohol_1.ConsumoAlcohol.NUNCA:
                return 'Nunca';
            case ConsumoAlcohol_1.ConsumoAlcohol.OCASIONAL:
                return 'Ocasional';
            case ConsumoAlcohol_1.ConsumoAlcohol.MODERADO:
                return 'Moderado';
            case ConsumoAlcohol_1.ConsumoAlcohol.FRECUENTE:
                return 'Frecuente';
            default:
                return null;
        }
    }
    formatDate(date) {
        if (typeof date === 'string') {
            return date.split('T')[0];
        }
        return date.toISOString().split('T')[0];
    }
};
exports.GetTurnoByIdUseCase = GetTurnoByIdUseCase;
exports.GetTurnoByIdUseCase = GetTurnoByIdUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.TurnoOrmEntity)),
    __param(1, (0, typeorm_1.InjectRepository)(entities_1.NutricionistaOrmEntity)),
    __param(2, (0, typeorm_1.InjectRepository)(entities_1.FichaSaludOrmEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], GetTurnoByIdUseCase);
//# sourceMappingURL=get-turno-by-id.use-case.js.map