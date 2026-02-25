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
exports.CrearAlimentoDto = void 0;
const class_validator_1 = require("class-validator");
const UnidadMedida_1 = require("../../../domain/entities/Alimento/UnidadMedida");
class CrearAlimentoDto {
    nombre;
    cantidad;
    unidadMedida;
    calorias;
    proteinas;
    carbohidratos;
    grasas;
    hidratosDeCarbono;
    grupoAlimenticioId;
}
exports.CrearAlimentoDto = CrearAlimentoDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CrearAlimentoDto.prototype, "nombre", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsPositive)(),
    __metadata("design:type", Number)
], CrearAlimentoDto.prototype, "cantidad", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(UnidadMedida_1.UnidadMedida),
    __metadata("design:type", String)
], CrearAlimentoDto.prototype, "unidadMedida", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Object)
], CrearAlimentoDto.prototype, "calorias", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Object)
], CrearAlimentoDto.prototype, "proteinas", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Object)
], CrearAlimentoDto.prototype, "carbohidratos", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Object)
], CrearAlimentoDto.prototype, "grasas", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Object)
], CrearAlimentoDto.prototype, "hidratosDeCarbono", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Object)
], CrearAlimentoDto.prototype, "grupoAlimenticioId", void 0);
//# sourceMappingURL=crear-alimento.dto.js.map