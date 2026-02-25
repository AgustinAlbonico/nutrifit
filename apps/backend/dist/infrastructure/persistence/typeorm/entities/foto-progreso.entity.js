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
exports.FotoProgresoOrmEntity = void 0;
const typeorm_1 = require("typeorm");
const persona_entity_1 = require("./persona.entity");
const tipo_foto_enum_1 = require("../../../../domain/entities/FotoProgreso/tipo-foto.enum");
let FotoProgresoOrmEntity = class FotoProgresoOrmEntity {
    idFoto;
    socio;
    tipoFoto;
    objectKey;
    mimeType;
    notas;
    fecha;
};
exports.FotoProgresoOrmEntity = FotoProgresoOrmEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ name: 'id_foto' }),
    __metadata("design:type", Number)
], FotoProgresoOrmEntity.prototype, "idFoto", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => persona_entity_1.SocioOrmEntity, { nullable: false, eager: false }),
    (0, typeorm_1.JoinColumn)({ name: 'id_socio' }),
    __metadata("design:type", persona_entity_1.SocioOrmEntity)
], FotoProgresoOrmEntity.prototype, "socio", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'tipo_foto', type: 'enum', enum: tipo_foto_enum_1.TipoFoto }),
    __metadata("design:type", String)
], FotoProgresoOrmEntity.prototype, "tipoFoto", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'object_key', type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], FotoProgresoOrmEntity.prototype, "objectKey", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'mime_type', type: 'varchar', length: 120 }),
    __metadata("design:type", String)
], FotoProgresoOrmEntity.prototype, "mimeType", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'notas', type: 'text', nullable: true }),
    __metadata("design:type", Object)
], FotoProgresoOrmEntity.prototype, "notas", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'fecha' }),
    __metadata("design:type", Date)
], FotoProgresoOrmEntity.prototype, "fecha", void 0);
exports.FotoProgresoOrmEntity = FotoProgresoOrmEntity = __decorate([
    (0, typeorm_1.Entity)('foto_progreso')
], FotoProgresoOrmEntity);
//# sourceMappingURL=foto-progreso.entity.js.map