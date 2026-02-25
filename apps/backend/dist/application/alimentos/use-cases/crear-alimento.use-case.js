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
exports.CrearAlimentoUseCase = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const alimento_entity_1 = require("../../../infrastructure/persistence/typeorm/entities/alimento.entity");
const grupo_alimenticio_entity_1 = require("../../../infrastructure/persistence/typeorm/entities/grupo-alimenticio.entity");
const custom_exceptions_1 = require("../../../domain/exceptions/custom-exceptions");
let CrearAlimentoUseCase = class CrearAlimentoUseCase {
    alimentoRepo;
    grupoRepo;
    constructor(alimentoRepo, grupoRepo) {
        this.alimentoRepo = alimentoRepo;
        this.grupoRepo = grupoRepo;
    }
    async execute(dto) {
        const grupos = [];
        if (dto.grupoAlimenticioId) {
            const grupo = await this.grupoRepo.findOne({
                where: { idGrupoAlimenticio: dto.grupoAlimenticioId },
            });
            if (!grupo) {
                throw new custom_exceptions_1.NotFoundError('Grupo alimenticio', String(dto.grupoAlimenticioId));
            }
            grupos.push(grupo);
        }
        const alimento = this.alimentoRepo.create({
            nombre: dto.nombre,
            cantidad: dto.cantidad,
            unidadMedida: dto.unidadMedida,
            calorias: dto.calorias ?? null,
            proteinas: dto.proteinas ?? null,
            carbohidratos: dto.carbohidratos ?? null,
            grasas: dto.grasas ?? null,
            hidratosDeCarbono: dto.hidratosDeCarbono ?? null,
        });
        const savedAlimento = await this.alimentoRepo.save(alimento);
        if (grupos.length > 0) {
            savedAlimento.grupoAlimenticio = grupos;
            return this.alimentoRepo.save(savedAlimento);
        }
        return savedAlimento;
    }
};
exports.CrearAlimentoUseCase = CrearAlimentoUseCase;
exports.CrearAlimentoUseCase = CrearAlimentoUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(alimento_entity_1.AlimentoOrmEntity)),
    __param(1, (0, typeorm_1.InjectRepository)(grupo_alimenticio_entity_1.GrupoAlimenticioOrmEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], CrearAlimentoUseCase);
//# sourceMappingURL=crear-alimento.use-case.js.map