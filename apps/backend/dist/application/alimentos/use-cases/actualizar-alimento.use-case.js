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
exports.ActualizarAlimentoUseCase = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const alimento_entity_1 = require("../../../infrastructure/persistence/typeorm/entities/alimento.entity");
const grupo_alimenticio_entity_1 = require("../../../infrastructure/persistence/typeorm/entities/grupo-alimenticio.entity");
const custom_exceptions_1 = require("../../../domain/exceptions/custom-exceptions");
let ActualizarAlimentoUseCase = class ActualizarAlimentoUseCase {
    alimentoRepo;
    grupoRepo;
    constructor(alimentoRepo, grupoRepo) {
        this.alimentoRepo = alimentoRepo;
        this.grupoRepo = grupoRepo;
    }
    async execute(id, dto) {
        const alimento = await this.alimentoRepo.findOne({
            where: { idAlimento: id },
        });
        if (!alimento) {
            throw new custom_exceptions_1.NotFoundError('Alimento', String(id));
        }
        if (dto.grupoAlimenticioId !== undefined) {
            if (dto.grupoAlimenticioId !== null) {
                const grupo = await this.grupoRepo.findOne({
                    where: { idGrupoAlimenticio: dto.grupoAlimenticioId },
                });
                if (!grupo) {
                    throw new custom_exceptions_1.NotFoundError('Grupo alimenticio', String(dto.grupoAlimenticioId));
                }
                alimento.grupoAlimenticio = [grupo];
            }
            else {
                alimento.grupoAlimenticio = [];
            }
        }
        if (dto.nombre !== undefined)
            alimento.nombre = dto.nombre;
        if (dto.cantidad !== undefined)
            alimento.cantidad = dto.cantidad;
        if (dto.unidadMedida !== undefined)
            alimento.unidadMedida = dto.unidadMedida;
        if (dto.calorias !== undefined)
            alimento.calorias = dto.calorias;
        if (dto.proteinas !== undefined)
            alimento.proteinas = dto.proteinas;
        if (dto.carbohidratos !== undefined)
            alimento.carbohidratos = dto.carbohidratos;
        if (dto.grasas !== undefined)
            alimento.grasas = dto.grasas;
        if (dto.hidratosDeCarbono !== undefined)
            alimento.hidratosDeCarbono = dto.hidratosDeCarbono;
        return this.alimentoRepo.save(alimento);
    }
};
exports.ActualizarAlimentoUseCase = ActualizarAlimentoUseCase;
exports.ActualizarAlimentoUseCase = ActualizarAlimentoUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(alimento_entity_1.AlimentoOrmEntity)),
    __param(1, (0, typeorm_1.InjectRepository)(grupo_alimenticio_entity_1.GrupoAlimenticioOrmEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], ActualizarAlimentoUseCase);
//# sourceMappingURL=actualizar-alimento.use-case.js.map