import 'reflect-metadata';
import { AgendaOrmEntity } from '../../persistence/typeorm/entities/agenda.entity';
import { AlimentoOrmEntity } from '../../persistence/typeorm/entities/alimento.entity';
import { DiplomaOrmEntity } from '../../persistence/typeorm/entities/diploma.entity';
import { CertificacionOrmEntity } from '../../persistence/typeorm/entities/certificacion.entity';
import {
  RecepcionistaOrmEntity,
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
import { FichaSaludVersionOrmEntity } from '../../persistence/typeorm/entities/ficha-salud-version.entity';
import { IaConfiguracionOrmEntity } from '../../persistence/typeorm/entities/ia-configuracion.entity';
import { UsuarioOrmEntity } from '../../persistence/typeorm/entities/usuario.entity';
import { OpcionComidaOrmEntity } from '../../persistence/typeorm/entities/opcion-comida.entity';
import { GrupoAlimenticioOrmEntity } from '../../persistence/typeorm/entities/grupo-alimenticio.entity';
import { PlanAlimentacionOrmEntity } from '../../persistence/typeorm/entities/plan-alimentacion.entity';
import { FormacionAcademicaOrmEntity } from '../../persistence/typeorm/entities/formacion-academica.entity';
import { ObservacionClinicaOrmEntity } from '../../persistence/typeorm/entities/observacion-clinica.entity';
import { AccionOrmEntity } from '../../persistence/typeorm/entities/accion.entity';
import { GrupoPermisoOrmEntity } from '../../persistence/typeorm/entities/grupo-permiso.entity';
import { UsuarioGrupoPermisoOrmEntity } from '../../persistence/typeorm/entities/usuario-grupo-permiso.entity';
import { MedicionOrmEntity } from '../../persistence/typeorm/entities/medicion.entity';
import { DiaPlanOrmEntity } from '../../persistence/typeorm/entities/dia-plan.entity';
import { GimnasioOrmEntity } from '../../persistence/typeorm/entities/gimnasio.entity';
import { FotoProgresoOrmEntity } from '../../persistence/typeorm/entities/foto-progreso.entity';
import { ItemComidaOrmEntity } from '../../persistence/typeorm/entities/item-comida.entity';
import { ObjetivoOrmEntity } from '../../persistence/typeorm/entities/objetivo.entity';
import { AdjuntoClinicoOrmEntity } from '../../persistence/typeorm/entities/adjunto-clinico.entity';
import { NotificacionOrmEntity } from '../../persistence/typeorm/entities/notificacion.entity';
import { AuditoriaOrmEntity } from '../../persistence/typeorm/entities/auditoria.entity';
import { RecordatorioEnviadoOrmEntity } from '../../persistence/typeorm/entities/recordatorio-enviado.entity';
import { SugerenciaIAOrmEntity } from '../../persistence/typeorm/entities/sugerencia-ia.entity';
import { TurnoConfirmacionTokenOrmEntity } from '../../persistence/typeorm/entities/turno-confirmacion-token.entity';
import { PoliticaOperativaOrmEntity } from '../../politicas/politica-operativa.entity';
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
    RecepcionistaOrmEntity,
    PatologiaOrmEntity,
    FichaSaludOrmEntity,
    FichaSaludVersionOrmEntity,
    IaConfiguracionOrmEntity,
    ItemComidaOrmEntity,
    OpcionComidaOrmEntity,
    NutricionistaOrmEntity,
    GrupoAlimenticioOrmEntity,
    PlanAlimentacionOrmEntity,
    FormacionAcademicaOrmEntity,
    CertificacionOrmEntity,
    ObservacionClinicaOrmEntity,
    AccionOrmEntity,
    GrupoPermisoOrmEntity,
    UsuarioGrupoPermisoOrmEntity,
    MedicionOrmEntity,
    DiaPlanOrmEntity,
    DiplomaOrmEntity,
    GimnasioOrmEntity,
    FotoProgresoOrmEntity,
    ObjetivoOrmEntity,
    AdjuntoClinicoOrmEntity,
    NotificacionOrmEntity,
    AuditoriaOrmEntity,
    RecordatorioEnviadoOrmEntity,
    SugerenciaIAOrmEntity,
    TurnoConfirmacionTokenOrmEntity,
    PoliticaOperativaOrmEntity,
  ],
  migrations: ['dist/infrastructure/persistence/typeorm/migrations/*.js'],
  synchronize: false,
  logging: true,
});
