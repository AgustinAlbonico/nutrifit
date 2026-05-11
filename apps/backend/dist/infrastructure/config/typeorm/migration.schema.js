"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppMigrationDataSource = void 0;
require("reflect-metadata");
const agenda_entity_1 = require("../../persistence/typeorm/entities/agenda.entity");
const alimento_entity_1 = require("../../persistence/typeorm/entities/alimento.entity");
const persona_entity_1 = require("../../persistence/typeorm/entities/persona.entity");
const turno_entity_1 = require("../../persistence/typeorm/entities/turno.entity");
const ficha_salud_entity_1 = require("../../persistence/typeorm/entities/ficha-salud.entity");
const usuario_entity_1 = require("../../persistence/typeorm/entities/usuario.entity");
const opcion_comida_entity_1 = require("../../persistence/typeorm/entities/opcion-comida.entity");
const grupo_alimenticio_entity_1 = require("../../persistence/typeorm/entities/grupo-alimenticio.entity");
const plan_alimentacion_entity_1 = require("../../persistence/typeorm/entities/plan-alimentacion.entity");
const formacion_academica_entity_1 = require("../../persistence/typeorm/entities/formacion-academica.entity");
const observacion_clinica_entity_1 = require("../../persistence/typeorm/entities/observacion-clinica.entity");
const accion_entity_1 = require("../../persistence/typeorm/entities/accion.entity");
const grupo_permiso_entity_1 = require("../../persistence/typeorm/entities/grupo-permiso.entity");
const medicion_entity_1 = require("../../persistence/typeorm/entities/medicion.entity");
const dia_plan_entity_1 = require("../../persistence/typeorm/entities/dia-plan.entity");
const gimnasio_entity_1 = require("../../persistence/typeorm/entities/gimnasio.entity");
const foto_progreso_entity_1 = require("../../persistence/typeorm/entities/foto-progreso.entity");
const item_comida_entity_1 = require("../../persistence/typeorm/entities/item-comida.entity");
const objetivo_entity_1 = require("../../persistence/typeorm/entities/objetivo.entity");
const typeorm_1 = require("typeorm");
exports.AppMigrationDataSource = new typeorm_1.DataSource({
    type: 'mysql',
    host: 'localhost',
    port: 3306,
    username: 'root',
    password: 'root',
    database: 'nutrifit_supervisor',
    timezone: '-03:00',
    entities: [
        agenda_entity_1.AgendaOrmEntity,
        alimento_entity_1.AlimentoOrmEntity,
        persona_entity_1.SocioOrmEntity,
        turno_entity_1.TurnoOrmEntity,
        ficha_salud_entity_1.AlergiaOrmEntity,
        persona_entity_1.PersonaOrmEntity,
        usuario_entity_1.UsuarioOrmEntity,
        persona_entity_1.AsistenteOrmEntity,
        ficha_salud_entity_1.PatologiaOrmEntity,
        ficha_salud_entity_1.FichaSaludOrmEntity,
        item_comida_entity_1.ItemComidaOrmEntity,
        opcion_comida_entity_1.OpcionComidaOrmEntity,
        persona_entity_1.NutricionistaOrmEntity,
        grupo_alimenticio_entity_1.GrupoAlimenticioOrmEntity,
        plan_alimentacion_entity_1.PlanAlimentacionOrmEntity,
        formacion_academica_entity_1.FormacionAcademicaOrmEntity,
        observacion_clinica_entity_1.ObservacionClinicaOrmEntity,
        accion_entity_1.AccionOrmEntity,
        grupo_permiso_entity_1.GrupoPermisoOrmEntity,
        medicion_entity_1.MedicionOrmEntity,
        dia_plan_entity_1.DiaPlanOrmEntity,
        gimnasio_entity_1.GimnasioOrmEntity,
        foto_progreso_entity_1.FotoProgresoOrmEntity,
        objetivo_entity_1.ObjetivoOrmEntity,
    ],
    migrations: ['dist/infrastructure/persistence/typeorm/migrations/*.js'],
    synchronize: false,
    logging: true,
});
//# sourceMappingURL=migration.schema.js.map