import 'reflect-metadata';
import { AgendaOrmEntity } from '../../persistence/typeorm/entities/agenda.entity';
import { AlimentoOrmEntity } from '../../persistence/typeorm/entities/alimento.entity';
import {
  AsistenteOrmEntity,
  NutricionistaOrmEntity,
  PersonaOrmEntity,
  SocioOrmEntity,
} from '../../persistence/typeorm/entities/persona.entity';
import { TurnoOrmEntity } from '../../persistence/typeorm/entities/turno.entity';
import {
  AlergiaOrmEntity,
  FichaSaludOrmEntity,
  PatologiaOrmEntity,
} from '../../persistence/typeorm/entities/ficha-salud.entity';
import { UsuarioOrmEntity } from '../../persistence/typeorm/entities/usuario.entity';
import { OpcionComidaOrmEntity } from '../../persistence/typeorm/entities/opcion-comida.entity';
import { GrupoAlimenticioOrmEntity } from '../../persistence/typeorm/entities/grupo-alimenticio.entity';
import { PlanAlimentacionOrmEntity } from '../../persistence/typeorm/entities/plan-alimentacion.entity';
import { FormacionAcademicaOrmEntity } from '../../persistence/typeorm/entities/formacion-academica.entity';
import { ObservacionClinicaOrmEntity } from '../../persistence/typeorm/entities/observacion-clinica.entity';
import { AccionOrmEntity } from '../../persistence/typeorm/entities/accion.entity';
import { GrupoPermisoOrmEntity } from '../../persistence/typeorm/entities/grupo-permiso.entity';
import { MedicionOrmEntity } from '../../persistence/typeorm/entities/medicion.entity';
import { DiaPlanOrmEntity } from '../../persistence/typeorm/entities/dia-plan.entity';
import { GimnasioOrmEntity } from '../../persistence/typeorm/entities/gimnasio.entity';
import { FotoProgresoOrmEntity } from '../../persistence/typeorm/entities/foto-progreso.entity';
import { ItemComidaOrmEntity } from '../../persistence/typeorm/entities/item-comida.entity';
import { ObjetivoOrmEntity } from '../../persistence/typeorm/entities/objetivo.entity';
import { DataSource } from 'typeorm';

export const AppMigrationDataSource = new DataSource({
  type: 'mysql',
  host: 'localhost',
  port: 3306,
  username: 'root',
  password: 'root',
  database: 'nutrifit_supervisor',
  timezone: '-03:00',
  entities: [
    AgendaOrmEntity,
    AlimentoOrmEntity,
    SocioOrmEntity,
    TurnoOrmEntity,
    AlergiaOrmEntity,
    PersonaOrmEntity,
    UsuarioOrmEntity,
    AsistenteOrmEntity,
    PatologiaOrmEntity,
    FichaSaludOrmEntity,
    ItemComidaOrmEntity,
    OpcionComidaOrmEntity,
    NutricionistaOrmEntity,
    GrupoAlimenticioOrmEntity,
    PlanAlimentacionOrmEntity,
    FormacionAcademicaOrmEntity,
    ObservacionClinicaOrmEntity,
    AccionOrmEntity,
    GrupoPermisoOrmEntity,
    MedicionOrmEntity,
    DiaPlanOrmEntity,
    GimnasioOrmEntity,
    FotoProgresoOrmEntity,
    ObjetivoOrmEntity,
  ],
  migrations: ['dist/infrastructure/persistence/typeorm/migrations/*.js'],
  synchronize: false,
  logging: true,
});
