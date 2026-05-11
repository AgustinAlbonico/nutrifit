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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CrearPlanAlimentacionDto = exports.CrearDiaPlanDto = exports.CrearOpcionComidaDto = exports.CrearItemComidaDto = void 0;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const DiaSemana_1 = require("../../../domain/entities/DiaPlan/DiaSemana");
const TipoComida_1 = require("../../../domain/entities/OpcionComida/TipoComida");
class CrearItemComidaDto {
    alimentoId;
    cantidad;
}
exports.CrearItemComidaDto = CrearItemComidaDto;
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], CrearItemComidaDto.prototype, "alimentoId", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], CrearItemComidaDto.prototype, "cantidad", void 0);
class CrearOpcionComidaDto {
    tipoComida;
    comentarios;
    items;
}
exports.CrearOpcionComidaDto = CrearOpcionComidaDto;
__decorate([
    (0, class_validator_1.IsEnum)(TipoComida_1.TipoComida),
    __metadata("design:type", String)
], CrearOpcionComidaDto.prototype, "tipoComida", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(255),
    __metadata("design:type", String)
], CrearOpcionComidaDto.prototype, "comentarios", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => CrearItemComidaDto),
    __metadata("design:type", Array)
], CrearOpcionComidaDto.prototype, "items", void 0);
class CrearDiaPlanDto {
    dia;
    orden;
    opcionesComida;
}
exports.CrearDiaPlanDto = CrearDiaPlanDto;
__decorate([
    (0, class_validator_1.IsEnum)(DiaSemana_1.DiaSemana),
    __metadata("design:type", String)
], CrearDiaPlanDto.prototype, "dia", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], CrearDiaPlanDto.prototype, "orden", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => CrearOpcionComidaDto),
    __metadata("design:type", Array)
], CrearDiaPlanDto.prototype, "opcionesComida", void 0);
class CrearPlanAlimentacionDto {
    socioId;
    objetivoNutricional;
    dias;
}
exports.CrearPlanAlimentacionDto = CrearPlanAlimentacionDto;
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], CrearPlanAlimentacionDto.prototype, "socioId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(255),
    __metadata("design:type", String)
], CrearPlanAlimentacionDto.prototype, "objetivoNutricional", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => CrearDiaPlanDto),
    __metadata("design:type", Array)
], CrearPlanAlimentacionDto.prototype, "dias", void 0);
//# sourceMappingURL=crear-plan-alimentacion.dto.js.map