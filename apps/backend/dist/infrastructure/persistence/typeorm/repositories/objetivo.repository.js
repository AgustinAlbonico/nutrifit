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
exports.ObjetivoRepository = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const objetivo_entity_1 = require("../entities/objetivo.entity");
const ESTADO_ACTIVO = 'ACTIVO';
const ESTADOS_CERRADOS = ['COMPLETADO', 'ABANDONADO'];
let ObjetivoRepository = class ObjetivoRepository {
    objetivoRepository;
    constructor(objetivoRepository) {
        this.objetivoRepository = objetivoRepository;
    }
    async findById(idObjetivo) {
        return this.objetivoRepository.findOne({
            where: { idObjetivo },
            relations: { socio: true },
        });
    }
    async findActivosBySocioId(socioId) {
        return this.objetivoRepository.find({
            where: {
                socio: { idPersona: socioId },
                estado: ESTADO_ACTIVO,
            },
            relations: { socio: true },
            order: { createdAt: 'DESC' },
        });
    }
    async findCompletadosBySocioId(socioId) {
        return this.objetivoRepository.find({
            where: {
                socio: { idPersona: socioId },
                estado: (0, typeorm_2.In)(ESTADOS_CERRADOS),
            },
            relations: { socio: true },
            order: { updatedAt: 'DESC' },
        });
    }
    async findActivoByTipo(socioId, tipoMetrica) {
        return this.objetivoRepository.findOne({
            where: {
                socio: { idPersona: socioId },
                tipoMetrica,
                estado: ESTADO_ACTIVO,
            },
            relations: { socio: true },
        });
    }
    async save(entity) {
        const objetivo = this.objetivoRepository.create(entity);
        return this.objetivoRepository.save(objetivo);
    }
    async updateEstado(idObjetivo, estado) {
        await this.objetivoRepository.update(idObjetivo, {
            estado,
            updatedAt: new Date(),
        });
    }
};
exports.ObjetivoRepository = ObjetivoRepository;
exports.ObjetivoRepository = ObjetivoRepository = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(objetivo_entity_1.ObjetivoOrmEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], ObjetivoRepository);
//# sourceMappingURL=objetivo.repository.js.map