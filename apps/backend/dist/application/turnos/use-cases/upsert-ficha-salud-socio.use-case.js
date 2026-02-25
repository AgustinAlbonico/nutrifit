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
exports.UpsertFichaSaludSocioUseCase = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const dtos_1 = require("../dtos");
const custom_exceptions_1 = require("../../../domain/exceptions/custom-exceptions");
const logger_service_1 = require("../../../domain/services/logger.service");
const entities_1 = require("../../../infrastructure/persistence/typeorm/entities");
const typeorm_2 = require("typeorm");
let UpsertFichaSaludSocioUseCase = class UpsertFichaSaludSocioUseCase {
    usuarioRepository;
    socioRepository;
    fichaSaludRepository;
    alergiaRepository;
    patologiaRepository;
    logger;
    constructor(usuarioRepository, socioRepository, fichaSaludRepository, alergiaRepository, patologiaRepository, logger) {
        this.usuarioRepository = usuarioRepository;
        this.socioRepository = socioRepository;
        this.fichaSaludRepository = fichaSaludRepository;
        this.alergiaRepository = alergiaRepository;
        this.patologiaRepository = patologiaRepository;
        this.logger = logger;
    }
    async execute(userId, payload) {
        const socio = await this.resolveSocioByUserId(userId);
        const alergias = await this.resolveAlergias(payload.alergias ?? []);
        const patologias = await this.resolvePatologias(payload.patologias ?? []);
        let ficha = socio.fichaSalud;
        if (!ficha) {
            ficha = new entities_1.FichaSaludOrmEntity();
        }
        ficha.altura = payload.altura;
        ficha.peso = payload.peso;
        ficha.nivelActividadFisica = payload.nivelActividadFisica;
        ficha.objetivoPersonal = payload.objetivoPersonal;
        ficha.alergias = alergias;
        ficha.patologias = patologias;
        ficha.medicacionActual = payload.medicacionActual ?? null;
        ficha.suplementosActuales = payload.suplementosActuales ?? null;
        ficha.cirugiasPrevias = payload.cirugiasPrevias ?? null;
        ficha.antecedentesFamiliares = payload.antecedentesFamiliares ?? null;
        ficha.frecuenciaComidas = payload.frecuenciaComidas ?? null;
        ficha.consumoAguaDiario = payload.consumoAguaDiario ?? null;
        ficha.restriccionesAlimentarias = payload.restriccionesAlimentarias ?? null;
        ficha.consumoAlcohol = payload.consumoAlcohol ?? null;
        ficha.fumaTabaco = payload.fumaTabaco ?? false;
        ficha.horasSueno = payload.horasSueno ?? null;
        ficha.contactoEmergenciaNombre = payload.contactoEmergenciaNombre ?? null;
        ficha.contactoEmergenciaTelefono =
            payload.contactoEmergenciaTelefono ?? null;
        const fichaGuardada = await this.fichaSaludRepository.save(ficha);
        socio.fichaSalud = fichaGuardada;
        await this.socioRepository.save(socio);
        this.logger.log(`Ficha de salud guardada para socio ${socio.idPersona} por usuario ${userId}.`);
        const response = new dtos_1.FichaSaludSocioResponseDto();
        response.socioId = socio.idPersona ?? 0;
        response.fichaSaludId = fichaGuardada.idFichaSalud;
        response.altura = fichaGuardada.altura;
        response.peso = fichaGuardada.peso;
        response.nivelActividadFisica = fichaGuardada.nivelActividadFisica;
        response.alergias = fichaGuardada.alergias.map((item) => item.nombre);
        response.patologias = fichaGuardada.patologias.map((item) => item.nombre);
        response.objetivoPersonal = fichaGuardada.objetivoPersonal ?? '';
        response.medicacionActual = fichaGuardada.medicacionActual;
        response.suplementosActuales = fichaGuardada.suplementosActuales;
        response.cirugiasPrevias = fichaGuardada.cirugiasPrevias;
        response.antecedentesFamiliares = fichaGuardada.antecedentesFamiliares;
        response.frecuenciaComidas = fichaGuardada.frecuenciaComidas;
        response.consumoAguaDiario = fichaGuardada.consumoAguaDiario;
        response.restriccionesAlimentarias =
            fichaGuardada.restriccionesAlimentarias;
        response.consumoAlcohol = fichaGuardada.consumoAlcohol;
        response.fumaTabaco = fichaGuardada.fumaTabaco ?? false;
        response.horasSueno = fichaGuardada.horasSueno;
        response.contactoEmergenciaNombre = fichaGuardada.contactoEmergenciaNombre;
        response.contactoEmergenciaTelefono =
            fichaGuardada.contactoEmergenciaTelefono;
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
    async resolveAlergias(names) {
        const normalized = this.normalizeNames(names);
        if (!normalized.length) {
            return [];
        }
        const existing = await this.alergiaRepository.find();
        const byName = new Map(existing.map((item) => [item.nombre.trim().toLowerCase(), item]));
        const result = [];
        for (const name of normalized) {
            const key = name.toLowerCase();
            const found = byName.get(key);
            if (found) {
                result.push(found);
                continue;
            }
            const created = this.alergiaRepository.create({ nombre: name });
            const saved = await this.alergiaRepository.save(created);
            byName.set(key, saved);
            result.push(saved);
        }
        return result;
    }
    async resolvePatologias(names) {
        const normalized = this.normalizeNames(names);
        if (!normalized.length) {
            return [];
        }
        const existing = await this.patologiaRepository.find();
        const byName = new Map(existing.map((item) => [item.nombre.trim().toLowerCase(), item]));
        const result = [];
        for (const name of normalized) {
            const key = name.toLowerCase();
            const found = byName.get(key);
            if (found) {
                result.push(found);
                continue;
            }
            const created = this.patologiaRepository.create({ nombre: name });
            const saved = await this.patologiaRepository.save(created);
            byName.set(key, saved);
            result.push(saved);
        }
        return result;
    }
    normalizeNames(values) {
        return Array.from(new Set(values.map((value) => value.trim()).filter((value) => value.length > 0)));
    }
};
exports.UpsertFichaSaludSocioUseCase = UpsertFichaSaludSocioUseCase;
exports.UpsertFichaSaludSocioUseCase = UpsertFichaSaludSocioUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.UsuarioOrmEntity)),
    __param(1, (0, typeorm_1.InjectRepository)(entities_1.SocioOrmEntity)),
    __param(2, (0, typeorm_1.InjectRepository)(entities_1.FichaSaludOrmEntity)),
    __param(3, (0, typeorm_1.InjectRepository)(entities_1.AlergiaOrmEntity)),
    __param(4, (0, typeorm_1.InjectRepository)(entities_1.PatologiaOrmEntity)),
    __param(5, (0, common_1.Inject)(logger_service_1.APP_LOGGER_SERVICE)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository, Object])
], UpsertFichaSaludSocioUseCase);
//# sourceMappingURL=upsert-ficha-salud-socio.use-case.js.map