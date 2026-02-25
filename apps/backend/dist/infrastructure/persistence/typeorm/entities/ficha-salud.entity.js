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
exports.AlergiaOrmEntity = exports.PatologiaOrmEntity = exports.FichaSaludOrmEntity = void 0;
const NivelActividadFisica_1 = require("../../../../domain/entities/FichaSalud/NivelActividadFisica");
const FrecuenciaComidas_1 = require("../../../../domain/entities/FichaSalud/FrecuenciaComidas");
const ConsumoAlcohol_1 = require("../../../../domain/entities/FichaSalud/ConsumoAlcohol");
const typeorm_1 = require("typeorm");
const persona_entity_1 = require("./persona.entity");
const socio_entity_1 = require("../../../../domain/entities/Persona/Socio/socio.entity");
let FichaSaludOrmEntity = class FichaSaludOrmEntity {
    idFichaSalud;
    altura;
    peso;
    fechaCreacion;
    objetivoPersonal;
    nivelActividadFisica;
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
    socio;
    patologias;
    alergias;
};
exports.FichaSaludOrmEntity = FichaSaludOrmEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ name: 'id_ficha_salud' }),
    __metadata("design:type", Number)
], FichaSaludOrmEntity.prototype, "idFichaSalud", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'altura', type: 'int' }),
    __metadata("design:type", Number)
], FichaSaludOrmEntity.prototype, "altura", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'peso', type: 'decimal', precision: 5, scale: 2 }),
    __metadata("design:type", Number)
], FichaSaludOrmEntity.prototype, "peso", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'fecha_creacion',
        type: 'timestamp',
        default: () => 'CURRENT_TIMESTAMP',
    }),
    __metadata("design:type", Date)
], FichaSaludOrmEntity.prototype, "fechaCreacion", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'objetivo_personal',
        type: 'varchar',
        length: 255,
        nullable: true,
    }),
    __metadata("design:type", Object)
], FichaSaludOrmEntity.prototype, "objetivoPersonal", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'nivel_actividad_fisica',
        type: 'enum',
        enum: NivelActividadFisica_1.NivelActividadFisica,
    }),
    __metadata("design:type", String)
], FichaSaludOrmEntity.prototype, "nivelActividadFisica", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'medicacion_actual',
        type: 'text',
        nullable: true,
    }),
    __metadata("design:type", Object)
], FichaSaludOrmEntity.prototype, "medicacionActual", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'suplementos_actuales',
        type: 'text',
        nullable: true,
    }),
    __metadata("design:type", Object)
], FichaSaludOrmEntity.prototype, "suplementosActuales", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'cirugias_previas',
        type: 'text',
        nullable: true,
    }),
    __metadata("design:type", Object)
], FichaSaludOrmEntity.prototype, "cirugiasPrevias", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'antecedentes_familiares',
        type: 'text',
        nullable: true,
    }),
    __metadata("design:type", Object)
], FichaSaludOrmEntity.prototype, "antecedentesFamiliares", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'frecuencia_comidas',
        type: 'enum',
        enum: FrecuenciaComidas_1.FrecuenciaComidas,
        nullable: true,
    }),
    __metadata("design:type", Object)
], FichaSaludOrmEntity.prototype, "frecuenciaComidas", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'consumo_agua_diario',
        type: 'decimal',
        precision: 4,
        scale: 1,
        nullable: true,
    }),
    __metadata("design:type", Object)
], FichaSaludOrmEntity.prototype, "consumoAguaDiario", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'restricciones_alimentarias',
        type: 'text',
        nullable: true,
    }),
    __metadata("design:type", Object)
], FichaSaludOrmEntity.prototype, "restriccionesAlimentarias", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'consumo_alcohol',
        type: 'enum',
        enum: ConsumoAlcohol_1.ConsumoAlcohol,
        nullable: true,
    }),
    __metadata("design:type", Object)
], FichaSaludOrmEntity.prototype, "consumoAlcohol", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'fuma_tabaco',
        type: 'boolean',
        default: false,
    }),
    __metadata("design:type", Boolean)
], FichaSaludOrmEntity.prototype, "fumaTabaco", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'horas_sueno',
        type: 'int',
        nullable: true,
    }),
    __metadata("design:type", Object)
], FichaSaludOrmEntity.prototype, "horasSueno", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'contacto_emergencia_nombre',
        type: 'varchar',
        length: 100,
        nullable: true,
    }),
    __metadata("design:type", Object)
], FichaSaludOrmEntity.prototype, "contactoEmergenciaNombre", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'contacto_emergencia_telefono',
        type: 'varchar',
        length: 20,
        nullable: true,
    }),
    __metadata("design:type", Object)
], FichaSaludOrmEntity.prototype, "contactoEmergenciaTelefono", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => persona_entity_1.SocioOrmEntity, (socio) => socio.fichaSalud),
    __metadata("design:type", socio_entity_1.SocioEntity)
], FichaSaludOrmEntity.prototype, "socio", void 0);
__decorate([
    (0, typeorm_1.ManyToMany)(() => PatologiaOrmEntity, {
        eager: true,
        nullable: true,
    }),
    (0, typeorm_1.JoinTable)({
        name: 'ficha_salud_patologias',
        joinColumn: {
            name: 'id_ficha_salud',
            referencedColumnName: 'idFichaSalud',
        },
        inverseJoinColumn: {
            name: 'id_patologia',
            referencedColumnName: 'idPatologia',
        },
    }),
    __metadata("design:type", Array)
], FichaSaludOrmEntity.prototype, "patologias", void 0);
__decorate([
    (0, typeorm_1.ManyToMany)(() => AlergiaOrmEntity, {
        eager: true,
        nullable: true,
    }),
    (0, typeorm_1.JoinTable)({
        name: 'ficha_salud_alergias',
        joinColumn: {
            name: 'id_ficha_salud',
            referencedColumnName: 'idFichaSalud',
        },
        inverseJoinColumn: {
            name: 'id_alergia',
            referencedColumnName: 'idAlergia',
        },
    }),
    __metadata("design:type", Array)
], FichaSaludOrmEntity.prototype, "alergias", void 0);
exports.FichaSaludOrmEntity = FichaSaludOrmEntity = __decorate([
    (0, typeorm_1.Entity)('ficha_salud')
], FichaSaludOrmEntity);
let PatologiaOrmEntity = class PatologiaOrmEntity {
    idPatologia;
    nombre;
};
exports.PatologiaOrmEntity = PatologiaOrmEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ name: 'id_patologia' }),
    __metadata("design:type", Number)
], PatologiaOrmEntity.prototype, "idPatologia", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'nombre', type: 'varchar', length: 100 }),
    __metadata("design:type", String)
], PatologiaOrmEntity.prototype, "nombre", void 0);
exports.PatologiaOrmEntity = PatologiaOrmEntity = __decorate([
    (0, typeorm_1.Entity)('patologia')
], PatologiaOrmEntity);
let AlergiaOrmEntity = class AlergiaOrmEntity {
    idAlergia;
    nombre;
};
exports.AlergiaOrmEntity = AlergiaOrmEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ name: 'id_alergia' }),
    __metadata("design:type", Number)
], AlergiaOrmEntity.prototype, "idAlergia", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'nombre', type: 'varchar', length: 100 }),
    __metadata("design:type", String)
], AlergiaOrmEntity.prototype, "nombre", void 0);
exports.AlergiaOrmEntity = AlergiaOrmEntity = __decorate([
    (0, typeorm_1.Entity)('alergia')
], AlergiaOrmEntity);
//# sourceMappingURL=ficha-salud.entity.js.map