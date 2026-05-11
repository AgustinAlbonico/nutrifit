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
exports.GuardarMedicionesDto = void 0;
const class_validator_1 = require("class-validator");
class GuardarMedicionesDto {
    peso;
    altura;
    perimetroCintura;
    perimetroCadera;
    perimetroBrazo;
    perimetroMuslo;
    perimetroPecho;
    pliegueTriceps;
    pliegueAbdominal;
    pliegueMuslo;
    porcentajeGrasa;
    frecuenciaCardiaca;
    tensionSistolica;
    tensionDiastolica;
    notasMedicion;
}
exports.GuardarMedicionesDto = GuardarMedicionesDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(20, { message: 'El peso debe ser al menos 20 kg' }),
    (0, class_validator_1.Max)(500, { message: 'El peso debe ser como máximo 500 kg' }),
    __metadata("design:type", Number)
], GuardarMedicionesDto.prototype, "peso", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(100, { message: 'La altura debe ser al menos 100 cm' }),
    (0, class_validator_1.Max)(250, { message: 'La altura debe ser como máximo 250 cm' }),
    __metadata("design:type", Number)
], GuardarMedicionesDto.prototype, "altura", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(300),
    __metadata("design:type", Number)
], GuardarMedicionesDto.prototype, "perimetroCintura", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(300),
    __metadata("design:type", Number)
], GuardarMedicionesDto.prototype, "perimetroCadera", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], GuardarMedicionesDto.prototype, "perimetroBrazo", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(150),
    __metadata("design:type", Number)
], GuardarMedicionesDto.prototype, "perimetroMuslo", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(200),
    __metadata("design:type", Number)
], GuardarMedicionesDto.prototype, "perimetroPecho", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], GuardarMedicionesDto.prototype, "pliegueTriceps", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], GuardarMedicionesDto.prototype, "pliegueAbdominal", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], GuardarMedicionesDto.prototype, "pliegueMuslo", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], GuardarMedicionesDto.prototype, "porcentajeGrasa", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(30),
    (0, class_validator_1.Max)(220),
    __metadata("design:type", Number)
], GuardarMedicionesDto.prototype, "frecuenciaCardiaca", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(60),
    (0, class_validator_1.Max)(250),
    __metadata("design:type", Number)
], GuardarMedicionesDto.prototype, "tensionSistolica", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(40),
    (0, class_validator_1.Max)(150),
    __metadata("design:type", Number)
], GuardarMedicionesDto.prototype, "tensionDiastolica", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GuardarMedicionesDto.prototype, "notasMedicion", void 0);
//# sourceMappingURL=guardar-mediciones.dto.js.map