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
exports.GetFichaSaludSocioUseCase = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const dtos_1 = require("../dtos");
const custom_exceptions_1 = require("../../../domain/exceptions/custom-exceptions");
const logger_service_1 = require("../../../domain/services/logger.service");
const entities_1 = require("../../../infrastructure/persistence/typeorm/entities");
const typeorm_2 = require("typeorm");
let GetFichaSaludSocioUseCase = class GetFichaSaludSocioUseCase {
    usuarioRepository;
    socioRepository;
    logger;
    constructor(usuarioRepository, socioRepository, logger) {
        this.usuarioRepository = usuarioRepository;
        this.socioRepository = socioRepository;
        this.logger = logger;
    }
    async execute(userId) {
        const socio = await this.resolveSocioByUserId(userId);
        if (!socio.fichaSalud) {
            this.logger.log(`Socio ${socio.idPersona} no tiene ficha de salud cargada.`);
            return null;
        }
        const response = new dtos_1.FichaSaludSocioResponseDto();
        response.socioId = socio.idPersona ?? 0;
        response.fichaSaludId = socio.fichaSalud.idFichaSalud ?? 0;
        response.altura = socio.fichaSalud.altura;
        response.peso = socio.fichaSalud.peso;
        response.nivelActividadFisica = socio.fichaSalud.nivelActividadFisica;
        response.alergias = (socio.fichaSalud.alergias ?? []).map((item) => item.nombre);
        response.patologias = (socio.fichaSalud.patologias ?? []).map((item) => item.nombre);
        response.objetivoPersonal = socio.fichaSalud.objetivoPersonal ?? '';
        response.medicacionActual = socio.fichaSalud.medicacionActual;
        response.suplementosActuales = socio.fichaSalud.suplementosActuales;
        response.cirugiasPrevias = socio.fichaSalud.cirugiasPrevias;
        response.antecedentesFamiliares = socio.fichaSalud.antecedentesFamiliares;
        response.frecuenciaComidas = socio.fichaSalud.frecuenciaComidas;
        response.consumoAguaDiario = socio.fichaSalud.consumoAguaDiario;
        response.restriccionesAlimentarias =
            socio.fichaSalud.restriccionesAlimentarias;
        response.consumoAlcohol = socio.fichaSalud.consumoAlcohol;
        response.fumaTabaco = socio.fichaSalud.fumaTabaco ?? false;
        response.horasSueno = socio.fichaSalud.horasSueno;
        response.contactoEmergenciaNombre =
            socio.fichaSalud.contactoEmergenciaNombre;
        response.contactoEmergenciaTelefono =
            socio.fichaSalud.contactoEmergenciaTelefono;
        return response;
    }
    async resolveSocioByUserId(userId) {
        const user = await this.usuarioRepository.findOne({
            where: { idUsuario: userId },
            relations: {
                persona: true,
            },
        });
        const personaId = user?.persona?.idPersona;
        if (!personaId) {
            throw new custom_exceptions_1.ForbiddenError('El usuario autenticado no tiene un socio asociado.');
        }
        const socio = await this.socioRepository.findOne({
            where: { idPersona: personaId },
            relations: {
                fichaSalud: {
                    alergias: true,
                    patologias: true,
                },
            },
        });
        if (!socio) {
            throw new custom_exceptions_1.NotFoundError('Socio', String(personaId));
        }
        return socio;
    }
};
exports.GetFichaSaludSocioUseCase = GetFichaSaludSocioUseCase;
exports.GetFichaSaludSocioUseCase = GetFichaSaludSocioUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.UsuarioOrmEntity)),
    __param(1, (0, typeorm_1.InjectRepository)(entities_1.SocioOrmEntity)),
    __param(2, (0, common_1.Inject)(logger_service_1.APP_LOGGER_SERVICE)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository, Object])
], GetFichaSaludSocioUseCase);
//# sourceMappingURL=get-ficha-salud-socio.use-case.js.map