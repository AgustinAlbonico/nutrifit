import 'reflect-metadata';
import { AgendaOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/agenda.entity';
import { AlimentoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/alimento.entity';
import { DiplomaOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/diploma.entity';
import { CertificacionOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/certificacion.entity';
import {
  RecepcionistaOrmEntity,
  NutricionistaOrmEntity,
  PersonaOrmEntity,
  SocioOrmEntity,
} from 'src/infrastructure/persistence/typeorm/entities/persona.entity';
import { TurnoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/turno.entity';
import {
  AlergiaOrmEntity,
  FichaSaludOrmEntity,
  PatologiaOrmEntity,
} from 'src/infrastructure/persistence/typeorm/entities/ficha-salud.entity';
import { FichaSaludVersionOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/ficha-salud-version.entity';
import { UsuarioOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/usuario.entity';
import { OpcionComidaOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/opcion-comida.entity';
import { GrupoAlimenticioOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/grupo-alimenticio.entity';
import { PlanAlimentacionOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/plan-alimentacion.entity';
import { PlanAlimentacionVersionOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/plan-alimentacion-version.entity';
import { PlanFeedbackOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/plan-feedback.entity';
import { NutricionistaIAMemoriaOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/nutricionista-ia-memoria.entity';
import { FormacionAcademicaOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/formacion-academica.entity';
import { ObservacionClinicaOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/observacion-clinica.entity';
import { AccionOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/accion.entity';
import { GrupoPermisoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/grupo-permiso.entity';
import { UsuarioGrupoPermisoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/usuario-grupo-permiso.entity';
import { MedicionOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/medicion.entity';
import { DiaPlanOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/dia-plan.entity';
import { ItemComidaOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/item-comida.entity';
import { ObjetivoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/objetivo.entity';
import { FotoProgresoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/foto-progreso.entity';
import { GimnasioOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/gimnasio.entity';
import { AdjuntoClinicoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/adjunto-clinico.entity';
import { NotificacionOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/notificacion.entity';
import { AuditoriaOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/auditoria.entity';
import { RecordatorioEnviadoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/recordatorio-enviado.entity';
import { SugerenciaIAOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/sugerencia-ia.entity';
import { TurnoConfirmacionTokenOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/turno-confirmacion-token.entity';
import { ExcepcionDisponibilidadOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/excepcion-disponibilidad.entity';
import { PoliticaOperativaOrmEntity } from 'src/infrastructure/politicas/politica-operativa.entity';
import { PreparacionOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/preparacion.entity';
import { PreparacionItemOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/preparacion-item.entity';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { EnvironmentConfigService } from '../environment-config/environment-config.service';

export const AppDataSource = (
  config: EnvironmentConfigService,
): TypeOrmModuleOptions => ({
  type: 'mysql',
  host: config.getDatabaseHost(),
  port: config.getDatabasePort(),
  username: config.getDatabaseUser(),
  password: config.getDatabasePassword(),
  database: config.getDatabaseName(),
  timezone: '-03:00',
  charset: 'utf8mb4',
  extra: {
    charset: 'utf8mb4_unicode_ci',
  },
  entities: [
    AgendaOrmEntity,
    AlimentoOrmEntity,
    ExcepcionDisponibilidadOrmEntity,
    SocioOrmEntity,
    TurnoOrmEntity,
    AlergiaOrmEntity,
    PersonaOrmEntity,
    UsuarioOrmEntity,
    RecepcionistaOrmEntity,
    PatologiaOrmEntity,
    FichaSaludOrmEntity,
    FichaSaludVersionOrmEntity,
    ItemComidaOrmEntity,
    OpcionComidaOrmEntity,
    NutricionistaOrmEntity,
    GrupoAlimenticioOrmEntity,
    PlanAlimentacionOrmEntity,
    PlanAlimentacionVersionOrmEntity,
    PlanFeedbackOrmEntity,
    NutricionistaIAMemoriaOrmEntity,
    FormacionAcademicaOrmEntity,
    CertificacionOrmEntity,
    ObservacionClinicaOrmEntity,
    AccionOrmEntity,
    GrupoPermisoOrmEntity,
    MedicionOrmEntity,
    DiaPlanOrmEntity,
    DiplomaOrmEntity,
    ObjetivoOrmEntity,
    FotoProgresoOrmEntity,
    GimnasioOrmEntity,
    AdjuntoClinicoOrmEntity,
    NotificacionOrmEntity,
    AuditoriaOrmEntity,
    RecordatorioEnviadoOrmEntity,
    SugerenciaIAOrmEntity,
    TurnoConfirmacionTokenOrmEntity,
    UsuarioGrupoPermisoOrmEntity,
    ExcepcionDisponibilidadOrmEntity,
    PoliticaOperativaOrmEntity,
    PreparacionOrmEntity,
    PreparacionItemOrmEntity,
  ],
  //BORRAR ESTO CUANDO SAQUE LA APP A PRODUCCION
  synchronize: true,
  logging: false,
});
