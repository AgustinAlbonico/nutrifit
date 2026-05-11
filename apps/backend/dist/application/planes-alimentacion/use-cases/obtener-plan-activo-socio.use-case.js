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
exports.ObtenerPlanActivoSocioUseCase = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const custom_exceptions_1 = require("../../../domain/exceptions/custom-exceptions");
const entities_1 = require("../../../infrastructure/persistence/typeorm/entities");
const typeorm_2 = require("typeorm");
const plan_alimentacion_mapper_1 = require("./plan-alimentacion.mapper");
let ObtenerPlanActivoSocioUseCase = class ObtenerPlanActivoSocioUseCase {
    planRepo;
    socioRepo;
    constructor(planRepo, socioRepo) {
        this.planRepo = planRepo;
        this.socioRepo = socioRepo;
    }
    async execute(socioId) {
        const socio = await this.socioRepo.findOne({
            where: { idPersona: socioId },
        });
        if (!socio) {
            throw new custom_exceptions_1.NotFoundError('Socio', String(socioId));
        }
        const plan = await this.planRepo.findOne({
            where: {
                socio: { idPersona: socioId },
                activo: true,
            },
            relations: {
                dias: { opcionesComida: { items: { alimento: true } } },
                socio: true,
                nutricionista: true,
            },
        });
        if (!plan) {
            throw new custom_exceptions_1.NotFoundError('Plan de alimentación activo para el socio', String(socioId));
        }
        return (0, plan_alimentacion_mapper_1.mapPlanToResponse)(plan);
    }
};
exports.ObtenerPlanActivoSocioUseCase = ObtenerPlanActivoSocioUseCase;
exports.ObtenerPlanActivoSocioUseCase = ObtenerPlanActivoSocioUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.PlanAlimentacionOrmEntity)),
    __param(1, (0, typeorm_1.InjectRepository)(entities_1.SocioOrmEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], ObtenerPlanActivoSocioUseCase);
//# sourceMappingURL=obtener-plan-activo-socio.use-case.js.map