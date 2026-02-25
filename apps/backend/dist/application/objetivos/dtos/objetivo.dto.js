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
exports.ListaObjetivosResponseDto = exports.ObjetivoResponseDto = exports.ActualizarObjetivoDto = exports.CrearObjetivoDto = void 0;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
class CrearObjetivoDto {
    socioId;
    tipoMetrica;
    valorInicial;
    valorObjetivo;
    fechaObjetivo;
}
exports.CrearObjetivoDto = CrearObjetivoDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], CrearObjetivoDto.prototype, "socioId", void 0);
__decorate([
    (0, class_validator_1.IsIn)(['PESO', 'CINTURA', 'CADERA', 'BRAZO', 'MUSLO', 'PECHO']),
    __metadata("design:type", String)
], CrearObjetivoDto.prototype, "tipoMetrica", void 0);
__decorate([
    (0, class_validator_1.IsNumber)({ allowInfinity: false, allowNaN: false }),
    __metadata("design:type", Number)
], CrearObjetivoDto.prototype, "valorInicial", void 0);
__decorate([
    (0, class_validator_1.IsNumber)({ allowInfinity: false, allowNaN: false }),
    __metadata("design:type", Number)
], CrearObjetivoDto.prototype, "valorObjetivo", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Date),
    (0, class_validator_1.IsDate)(),
    __metadata("design:type", Date)
], CrearObjetivoDto.prototype, "fechaObjetivo", void 0);
class ActualizarObjetivoDto {
    valorActual;
}
exports.ActualizarObjetivoDto = ActualizarObjetivoDto;
__decorate([
    (0, class_validator_1.IsNumber)({ allowInfinity: false, allowNaN: false }),
    __metadata("design:type", Number)
], ActualizarObjetivoDto.prototype, "valorActual", void 0);
class ObjetivoResponseDto {
    idObjetivo;
    socioId;
    tipoMetrica;
    valorInicial;
    valorActual;
    valorObjetivo;
    estado;
    fechaInicio;
    fechaObjetivo;
    createdAt;
    updatedAt;
    progreso;
}
exports.ObjetivoResponseDto = ObjetivoResponseDto;
class ListaObjetivosResponseDto {
    activos;
    completados;
}
exports.ListaObjetivosResponseDto = ListaObjetivosResponseDto;
//# sourceMappingURL=objetivo.dto.js.map