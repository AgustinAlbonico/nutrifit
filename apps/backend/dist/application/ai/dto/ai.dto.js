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
exports.AnalizarPlanDto = exports.SugerirSustitucionDto = exports.GenerarPlanSemanalDto = exports.GenerarRecomendacionDto = void 0;
const class_validator_1 = require("class-validator");
class GenerarRecomendacionDto {
    socioId;
    tipoComida;
    preferenciasAdicionales;
}
exports.GenerarRecomendacionDto = GenerarRecomendacionDto;
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], GenerarRecomendacionDto.prototype, "socioId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(['DESAYUNO', 'ALMUERZO', 'MERIENDA', 'CENA', 'COLACION']),
    __metadata("design:type", String)
], GenerarRecomendacionDto.prototype, "tipoComida", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GenerarRecomendacionDto.prototype, "preferenciasAdicionales", void 0);
class GenerarPlanSemanalDto {
    socioId;
    caloriasObjetivo;
    diasAGenerar;
}
exports.GenerarPlanSemanalDto = GenerarPlanSemanalDto;
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], GenerarPlanSemanalDto.prototype, "socioId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1200),
    __metadata("design:type", Number)
], GenerarPlanSemanalDto.prototype, "caloriasObjetivo", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], GenerarPlanSemanalDto.prototype, "diasAGenerar", void 0);
class SugerirSustitucionDto {
    alimento;
    razon;
}
exports.SugerirSustitucionDto = SugerirSustitucionDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SugerirSustitucionDto.prototype, "alimento", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SugerirSustitucionDto.prototype, "razon", void 0);
class AnalizarPlanDto {
    planId;
}
exports.AnalizarPlanDto = AnalizarPlanDto;
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], AnalizarPlanDto.prototype, "planId", void 0);
//# sourceMappingURL=ai.dto.js.map