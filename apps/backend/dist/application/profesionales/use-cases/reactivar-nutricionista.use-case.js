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
exports.ReactivarNutricionistaUseCase = void 0;
const common_1 = require("@nestjs/common");
const nutricionista_repository_1 = require("../../../domain/entities/Persona/Nutricionista/nutricionista.repository");
const logger_service_1 = require("../../../domain/services/logger.service");
const custom_exceptions_1 = require("../../../domain/exceptions/custom-exceptions");
const typeorm_1 = require("@nestjs/typeorm");
const persona_entity_1 = require("../../../infrastructure/persistence/typeorm/entities/persona.entity");
const typeorm_2 = require("typeorm");
let ReactivarNutricionistaUseCase = class ReactivarNutricionistaUseCase {
    nutricionistaRepository;
    logger;
    nutricionistaOrmRepository;
    constructor(nutricionistaRepository, logger, nutricionistaOrmRepository) {
        this.nutricionistaRepository = nutricionistaRepository;
        this.logger = logger;
        this.nutricionistaOrmRepository = nutricionistaOrmRepository;
    }
    async execute(id) {
        const nutricionista = await this.nutricionistaRepository.findById(id);
        if (!nutricionista) {
            this.logger.warn(`Nutricionista con ID ${id} no encontrado.`);
            throw new custom_exceptions_1.NotFoundError('Nutricionista no encontrado.');
        }
        await this.nutricionistaOrmRepository.update(id, {
            fechaBaja: null,
        });
        this.logger.log(`Nutricionista ${id} reactivado exitosamente.`);
    }
};
exports.ReactivarNutricionistaUseCase = ReactivarNutricionistaUseCase;
exports.ReactivarNutricionistaUseCase = ReactivarNutricionistaUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(nutricionista_repository_1.NUTRICIONISTA_REPOSITORY)),
    __param(1, (0, common_1.Inject)(logger_service_1.APP_LOGGER_SERVICE)),
    __param(2, (0, typeorm_1.InjectRepository)(persona_entity_1.NutricionistaOrmEntity)),
    __metadata("design:paramtypes", [nutricionista_repository_1.NutricionistaRepository, Object, typeorm_2.Repository])
], ReactivarNutricionistaUseCase);
//# sourceMappingURL=reactivar-nutricionista.use-case.js.map