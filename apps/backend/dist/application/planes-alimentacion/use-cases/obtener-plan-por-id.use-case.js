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
exports.ObtenerPlanPorIdUseCase = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const custom_exceptions_1 = require("../../../domain/exceptions/custom-exceptions");
const entities_1 = require("../../../infrastructure/persistence/typeorm/entities");
const typeorm_2 = require("typeorm");
const plan_alimentacion_mapper_1 = require("./plan-alimentacion.mapper");
let ObtenerPlanPorIdUseCase = class ObtenerPlanPorIdUseCase {
    planRepo;
    constructor(planRepo) {
        this.planRepo = planRepo;
    }
    async execute(planId) {
        const plan = await this.planRepo.findOne({
            where: { idPlanAlimentacion: planId },
            relations: {
                dias: { opcionesComida: { items: { alimento: true } } },
                socio: true,
                nutricionista: true,
            },
        });
        if (!plan) {
            throw new custom_exceptions_1.NotFoundError('Plan de alimentación', String(planId));
        }
        return (0, plan_alimentacion_mapper_1.mapPlanToResponse)(plan);
    }
};
exports.ObtenerPlanPorIdUseCase = ObtenerPlanPorIdUseCase;
exports.ObtenerPlanPorIdUseCase = ObtenerPlanPorIdUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.PlanAlimentacionOrmEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], ObtenerPlanPorIdUseCase);
//# sourceMappingURL=obtener-plan-por-id.use-case.js.map