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
exports.UpsertFichaSaludSocioDto = void 0;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const NivelActividadFisica_1 = require("../../../domain/entities/FichaSalud/NivelActividadFisica");
const FrecuenciaComidas_1 = require("../../../domain/entities/FichaSalud/FrecuenciaComidas");
const ConsumoAlcohol_1 = require("../../../domain/entities/FichaSalud/ConsumoAlcohol");
class UpsertFichaSaludSocioDto {
    altura;
    peso;
    nivelActividadFisica;
    objetivoPersonal;
    alergias;
    patologias;
    medicacionActual;
    suplementosActuales;
    cirugiasPrevias;
    antecedentesFamiliares;
    frecuenciaComidas;
    consumoAguaDiario;
    restriccionesAlimentarias;
    consumoAlcohol;
    fumaTabaco;
    horasSueno;
    contactoEmergenciaNombre;
    contactoEmergenciaTelefono;
}
exports.UpsertFichaSaludSocioDto = UpsertFichaSaludSocioDto;
__decorate([
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(100),
    (0, class_validator_1.Max)(250),
    __metadata("design:type", Number)
], UpsertFichaSaludSocioDto.prototype, "altura", void 0);
__decorate([
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.Min)(20),
    (0, class_validator_1.Max)(500),
    __metadata("design:type", Number)
], UpsertFichaSaludSocioDto.prototype, "peso", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(NivelActividadFisica_1.NivelActividadFisica),
    __metadata("design:type", String)
], UpsertFichaSaludSocioDto.prototype, "nivelActividadFisica", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], UpsertFichaSaludSocioDto.prototype, "objetivoPersonal", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayUnique)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], UpsertFichaSaludSocioDto.prototype, "alergias", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayUnique)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], UpsertFichaSaludSocioDto.prototype, "patologias", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(1000),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpsertFichaSaludSocioDto.prototype, "medicacionActual", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpsertFichaSaludSocioDto.prototype, "suplementosActuales", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(1000),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpsertFichaSaludSocioDto.prototype, "cirugiasPrevias", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(1000),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpsertFichaSaludSocioDto.prototype, "antecedentesFamiliares", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(FrecuenciaComidas_1.FrecuenciaComidas),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpsertFichaSaludSocioDto.prototype, "frecuenciaComidas", void 0);
__decorate([
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(10),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], UpsertFichaSaludSocioDto.prototype, "consumoAguaDiario", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpsertFichaSaludSocioDto.prototype, "restriccionesAlimentarias", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(ConsumoAlcohol_1.ConsumoAlcohol),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpsertFichaSaludSocioDto.prototype, "consumoAlcohol", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], UpsertFichaSaludSocioDto.prototype, "fumaTabaco", void 0);
__decorate([
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(24),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], UpsertFichaSaludSocioDto.prototype, "horasSueno", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpsertFichaSaludSocioDto.prototype, "contactoEmergenciaNombre", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(20),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpsertFichaSaludSocioDto.prototype, "contactoEmergenciaTelefono", void 0);
//# sourceMappingURL=upsert-ficha-salud-socio.dto.js.map