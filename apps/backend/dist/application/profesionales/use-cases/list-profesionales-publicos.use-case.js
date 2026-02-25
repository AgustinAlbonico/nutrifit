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
exports.ListProfesionalesPublicosUseCase = void 0;
const common_1 = require("@nestjs/common");
const dtos_1 = require("../dtos");
const nutricionista_repository_1 = require("../../../domain/entities/Persona/Nutricionista/nutricionista.repository");
const logger_service_1 = require("../../../domain/services/logger.service");
let ListProfesionalesPublicosUseCase = class ListProfesionalesPublicosUseCase {
    nutricionistaRepository;
    logger;
    constructor(nutricionistaRepository, logger) {
        this.nutricionistaRepository = nutricionistaRepository;
        this.logger = logger;
    }
    async execute(query) {
        const nutricionistas = await this.nutricionistaRepository.findAll();
        const normalizedNombre = query.nombre?.trim().toLowerCase();
        const normalizedEspecialidad = query.especialidad?.trim().toLowerCase();
        const profesionalesActivos = nutricionistas
            .filter((nutricionista) => !nutricionista.fechaBaja)
            .filter((nutricionista) => {
            if (!normalizedNombre) {
                return true;
            }
            const fullName = `${nutricionista.nombre} ${nutricionista.apellido}`
                .trim()
                .toLowerCase();
            return fullName.includes(normalizedNombre);
        })
            .filter(() => {
            if (!normalizedEspecialidad) {
                return true;
            }
            return 'nutricionista'.includes(normalizedEspecialidad);
        });
        this.logger.log(`Listado publico de profesionales recuperado: ${profesionalesActivos.length} resultados.`);
        return profesionalesActivos.map((nutricionista) => {
            const response = new dtos_1.ProfesionalPublicoResponseDto();
            response.idPersona = nutricionista.idPersona ?? 0;
            response.nombre = nutricionista.nombre;
            response.apellido = nutricionista.apellido;
            response.especialidad = 'Nutricionista';
            response.ciudad = nutricionista.ciudad;
            response.provincia = nutricionista.provincia;
            response.añosExperiencia = nutricionista.añosExperiencia;
            response.tarifaSesion = nutricionista.tarifaSesion;
            return response;
        });
    }
};
exports.ListProfesionalesPublicosUseCase = ListProfesionalesPublicosUseCase;
exports.ListProfesionalesPublicosUseCase = ListProfesionalesPublicosUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(nutricionista_repository_1.NUTRICIONISTA_REPOSITORY)),
    __param(1, (0, common_1.Inject)(logger_service_1.APP_LOGGER_SERVICE)),
    __metadata("design:paramtypes", [nutricionista_repository_1.NutricionistaRepository, Object])
], ListProfesionalesPublicosUseCase);
//# sourceMappingURL=list-profesionales-publicos.use-case.js.map