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
exports.EntrenadorOrmEntity = exports.NutricionistaOrmEntity = exports.AsistenteOrmEntity = exports.SocioOrmEntity = exports.PersonaOrmEntity = void 0;
const class_transformer_1 = require("class-transformer");
const typeorm_1 = require("typeorm");
const Genero_1 = require("../../../../domain/entities/Persona/Genero");
const agenda_entity_1 = require("./agenda.entity");
const formacion_academica_entity_1 = require("./formacion-academica.entity");
const ficha_salud_entity_1 = require("./ficha-salud.entity");
const plan_alimentacion_entity_1 = require("./plan-alimentacion.entity");
const usuario_entity_1 = require("./usuario.entity");
const turno_entity_1 = require("./turno.entity");
let PersonaOrmEntity = class PersonaOrmEntity {
    idPersona;
    nombre;
    apellido;
    fechaNacimiento;
    genero;
    telefono;
    direccion;
    ciudad;
    provincia;
    dni;
    fotoPerfilKey;
    gimnasioId;
    usuario;
};
exports.PersonaOrmEntity = PersonaOrmEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ name: 'id_persona' }),
    __metadata("design:type", Object)
], PersonaOrmEntity.prototype, "idPersona", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'nombre', type: 'varchar', length: 100 }),
    __metadata("design:type", String)
], PersonaOrmEntity.prototype, "nombre", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'apellido', type: 'varchar', length: 100 }),
    __metadata("design:type", String)
], PersonaOrmEntity.prototype, "apellido", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'fecha_nacimiento', type: 'date' }),
    (0, class_transformer_1.Type)(() => Date),
    __metadata("design:type", Date)
], PersonaOrmEntity.prototype, "fechaNacimiento", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'genero', type: 'enum', enum: Genero_1.Genero }),
    __metadata("design:type", String)
], PersonaOrmEntity.prototype, "genero", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'telefono', type: 'varchar', length: 15 }),
    __metadata("design:type", String)
], PersonaOrmEntity.prototype, "telefono", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'direccion', type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], PersonaOrmEntity.prototype, "direccion", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'ciudad', type: 'varchar', length: 100 }),
    __metadata("design:type", String)
], PersonaOrmEntity.prototype, "ciudad", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'provincia', type: 'varchar', length: 100 }),
    __metadata("design:type", String)
], PersonaOrmEntity.prototype, "provincia", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'dni', type: 'varchar', length: 20, nullable: true }),
    __metadata("design:type", Object)
], PersonaOrmEntity.prototype, "dni", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'foto_perfil_key',
        type: 'varchar',
        length: 255,
        nullable: true,
    }),
    __metadata("design:type", Object)
], PersonaOrmEntity.prototype, "fotoPerfilKey", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'id_gimnasio', type: 'int' }),
    __metadata("design:type", Number)
], PersonaOrmEntity.prototype, "gimnasioId", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => usuario_entity_1.UsuarioOrmEntity, (usuario) => usuario.persona, {
        nullable: true,
    }),
    __metadata("design:type", Object)
], PersonaOrmEntity.prototype, "usuario", void 0);
exports.PersonaOrmEntity = PersonaOrmEntity = __decorate([
    (0, typeorm_1.Entity)('persona'),
    (0, typeorm_1.TableInheritance)({ column: { type: 'varchar', name: 'tipo_persona' } })
], PersonaOrmEntity);
let SocioOrmEntity = class SocioOrmEntity extends PersonaOrmEntity {
    fechaAlta;
    fechaBaja;
    fichaSalud;
    planesAlimentacion;
    turnos;
};
exports.SocioOrmEntity = SocioOrmEntity;
__decorate([
    (0, typeorm_1.Column)({ name: 'fecha_alta', type: 'date' }),
    (0, class_transformer_1.Type)(() => Date),
    __metadata("design:type", Date)
], SocioOrmEntity.prototype, "fechaAlta", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'fecha_baja', type: 'datetime', nullable: true }),
    (0, class_transformer_1.Type)(() => Date),
    __metadata("design:type", Object)
], SocioOrmEntity.prototype, "fechaBaja", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => ficha_salud_entity_1.FichaSaludOrmEntity, {
        eager: false,
        nullable: true,
        lazy: false,
    }),
    (0, typeorm_1.JoinColumn)({ name: 'id_ficha_salud' }),
    __metadata("design:type", Object)
], SocioOrmEntity.prototype, "fichaSalud", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => plan_alimentacion_entity_1.PlanAlimentacionOrmEntity, (plan) => plan.socio, {
        eager: false,
        lazy: false,
    }),
    __metadata("design:type", Array)
], SocioOrmEntity.prototype, "planesAlimentacion", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => turno_entity_1.TurnoOrmEntity, (turno) => turno.socio, {
        eager: false,
        lazy: false,
    }),
    __metadata("design:type", Array)
], SocioOrmEntity.prototype, "turnos", void 0);
exports.SocioOrmEntity = SocioOrmEntity = __decorate([
    (0, typeorm_1.ChildEntity)()
], SocioOrmEntity);
let AsistenteOrmEntity = class AsistenteOrmEntity extends PersonaOrmEntity {
};
exports.AsistenteOrmEntity = AsistenteOrmEntity;
exports.AsistenteOrmEntity = AsistenteOrmEntity = __decorate([
    (0, typeorm_1.ChildEntity)()
], AsistenteOrmEntity);
let NutricionistaOrmEntity = class NutricionistaOrmEntity extends PersonaOrmEntity {
    matricula;
    añosExperiencia;
    tarifaSesion;
    fechaBaja;
    agenda;
    formacionAcademica;
    planesAlimentacion;
    turnos;
};
exports.NutricionistaOrmEntity = NutricionistaOrmEntity;
__decorate([
    (0, typeorm_1.Column)({ name: 'matricula', type: 'varchar', length: 50, unique: true }),
    __metadata("design:type", String)
], NutricionistaOrmEntity.prototype, "matricula", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'anios_experiencia', type: 'int' }),
    __metadata("design:type", Number)
], NutricionistaOrmEntity.prototype, "a\u00F1osExperiencia", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'tarifa_sesion', type: 'decimal', precision: 10, scale: 2 }),
    __metadata("design:type", Number)
], NutricionistaOrmEntity.prototype, "tarifaSesion", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'fecha_baja', type: 'datetime', nullable: true }),
    (0, class_transformer_1.Type)(() => Date),
    __metadata("design:type", Object)
], NutricionistaOrmEntity.prototype, "fechaBaja", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => agenda_entity_1.AgendaOrmEntity, (agenda) => agenda.nutricionista, {
        eager: false,
        nullable: true,
    }),
    __metadata("design:type", Array)
], NutricionistaOrmEntity.prototype, "agenda", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => formacion_academica_entity_1.FormacionAcademicaOrmEntity, (formacion) => formacion.nutricionista, {
        eager: true,
        nullable: true,
    }),
    __metadata("design:type", Array)
], NutricionistaOrmEntity.prototype, "formacionAcademica", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => plan_alimentacion_entity_1.PlanAlimentacionOrmEntity, (plan) => plan.nutricionista, {
        eager: true,
        nullable: true,
    }),
    __metadata("design:type", Object)
], NutricionistaOrmEntity.prototype, "planesAlimentacion", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => turno_entity_1.TurnoOrmEntity, (turno) => turno.nutricionista, {
        eager: true,
        nullable: true,
    }),
    __metadata("design:type", Object)
], NutricionistaOrmEntity.prototype, "turnos", void 0);
exports.NutricionistaOrmEntity = NutricionistaOrmEntity = __decorate([
    (0, typeorm_1.ChildEntity)()
], NutricionistaOrmEntity);
let EntrenadorOrmEntity = class EntrenadorOrmEntity extends PersonaOrmEntity {
    especialidad;
    fechaBaja;
    turnos;
};
exports.EntrenadorOrmEntity = EntrenadorOrmEntity;
__decorate([
    (0, typeorm_1.Column)({ name: 'especialidad', type: 'varchar', length: 100 }),
    __metadata("design:type", String)
], EntrenadorOrmEntity.prototype, "especialidad", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'fecha_baja', type: 'datetime', nullable: true }),
    (0, class_transformer_1.Type)(() => Date),
    __metadata("design:type", Object)
], EntrenadorOrmEntity.prototype, "fechaBaja", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => turno_entity_1.TurnoOrmEntity, (turno) => turno.entrenador, {
        eager: false,
        nullable: true,
    }),
    __metadata("design:type", Array)
], EntrenadorOrmEntity.prototype, "turnos", void 0);
exports.EntrenadorOrmEntity = EntrenadorOrmEntity = __decorate([
    (0, typeorm_1.ChildEntity)()
], EntrenadorOrmEntity);
//# sourceMappingURL=persona.entity.js.map