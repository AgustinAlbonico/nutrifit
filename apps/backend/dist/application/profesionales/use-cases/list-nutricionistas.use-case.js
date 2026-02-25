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
exports.ListNutricionistasUseCase = void 0;
const common_1 = require("@nestjs/common");
const nutricionista_repository_1 = require("../../../domain/entities/Persona/Nutricionista/nutricionista.repository");
const logger_service_1 = require("../../../domain/services/logger.service");
let ListNutricionistasUseCase = class ListNutricionistasUseCase {
    nutricionistaRepository;
    logger;
    constructor(nutricionistaRepository, logger) {
        this.nutricionistaRepository = nutricionistaRepository;
        this.logger = logger;
    }
    async execute() {
        const nutricionistas = await this.nutricionistaRepository.findAll();
        this.logger.log(`Se recuperaron ${nutricionistas.length} nutricionistas de la base de datos.`);
        return nutricionistas;
    }
};
exports.ListNutricionistasUseCase = ListNutricionistasUseCase;
exports.ListNutricionistasUseCase = ListNutricionistasUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(nutricionista_repository_1.NUTRICIONISTA_REPOSITORY)),
    __param(1, (0, common_1.Inject)(logger_service_1.APP_LOGGER_SERVICE)),
    __metadata("design:paramtypes", [nutricionista_repository_1.NutricionistaRepository, Object])
], ListNutricionistasUseCase);
//# sourceMappingURL=list-nutricionistas.use-case.js.map