import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TypeOrmConfigModule } from 'src/infrastructure/config/typeorm/typeorm.module';
import { UsuarioRepositoryImplementation } from './usuario.repository';
import { SocioRepositoryImplementation } from './socio.respository';
import { NutricionistaRepositoryImplementation } from './nutricionista.repository';
import { RecepcionistaRepositoryImplementation } from './recepcionista.repository.impl';
import {
  SocioOrmEntity,
  AgendaOrmEntity,
  AlergiaOrmEntity,
  AlimentoOrmEntity,
  ExcepcionDisponibilidadOrmEntity,
  RecepcionistaOrmEntity,
  FichaSaludOrmEntity,
  FichaSaludVersionOrmEntity,
  FormacionAcademicaOrmEntity,
  GrupoAlimenticioOrmEntity,
  NutricionistaOrmEntity,
  NutricionistaIAMemoriaOrmEntity,
  ObservacionClinicaOrmEntity,
  OpcionComidaOrmEntity,
  PatologiaOrmEntity,
  PersonaOrmEntity,
  PlanAlimentacionOrmEntity,
  PlanAlimentacionVersionOrmEntity,
  PlanFeedbackOrmEntity,
  TurnoOrmEntity,
  UsuarioOrmEntity,
  GimnasioOrmEntity,
} from '../entities/';
import { SOCIO_REPOSITORY } from 'src/domain/entities/Persona/Socio/socio.repository';
import { USUARIO_REPOSITORY } from 'src/domain/entities/Usuario/usuario.repository';
import { NUTRICIONISTA_REPOSITORY } from 'src/domain/entities/Persona/Nutricionista/nutricionista.repository';
import { RECEPCIONISTA_REPOSITORY } from 'src/domain/entities/Persona/Recepcionista/recepcionista.repository';
import { POLITICA_OPERATIVA_REPOSITORY } from 'src/application/politicas/politica-operativa.repository';
import { PoliticaOperativaRepositoryImpl } from 'src/infrastructure/politicas/politica-operativa.repository.impl';
import { PoliticaOperativaOrmEntity } from 'src/infrastructure/politicas/politica-operativa.entity';
import { FICHA_SALUD_VERSION_REPOSITORY } from 'src/domain/entities/FichaSalud/ficha-salud-version.repository';
import { FichaSaludVersionRepositoryImpl } from './ficha-salud-version.repository.impl';
import { EXCEPCION_DISPONIBILIDAD_REPOSITORY } from 'src/domain/entities/Agenda/excepcion-disponibilidad.repository';
import { ExcepcionDisponibilidadRepositoryImpl } from './excepcion-disponibilidad.repository';
import { PLAN_ALIMENTACION_VERSION_REPOSITORY } from 'src/domain/repositories/plan-alimentacion-version.repository';
import { PlanAlimentacionVersionRepositoryImpl } from './plan-alimentacion-version.repository.impl';
import { PLAN_FEEDBACK_REPOSITORY } from 'src/domain/repositories/plan-feedback.repository';
import { PlanFeedbackRepositoryImpl } from './plan-feedback.repository.impl';
import { NUTRICIONISTA_IA_MEMORIA_REPOSITORY } from 'src/domain/repositories/nutricionista-ia-memoria.repository';
import { NutricionistaIAMemoriaRepositoryImpl } from './nutricionista-ia-memoria.repository.impl';

// This module is responsible for providing TypeORM repositories for the application.
// It imports the TypeOrmConfigModule for database configuration and registers the necessary entities.
@Module({
  imports: [
    TypeOrmConfigModule,
    TypeOrmModule.forFeature([
      SocioOrmEntity,
      AgendaOrmEntity,
      AlergiaOrmEntity,
      AlimentoOrmEntity,
      ExcepcionDisponibilidadOrmEntity,
      RecepcionistaOrmEntity,
      FichaSaludOrmEntity,
      FichaSaludVersionOrmEntity,
      FormacionAcademicaOrmEntity,
      GrupoAlimenticioOrmEntity,
      NutricionistaOrmEntity,
      NutricionistaIAMemoriaOrmEntity,
      ObservacionClinicaOrmEntity,
      OpcionComidaOrmEntity,
      PatologiaOrmEntity,
      PersonaOrmEntity,
      PlanAlimentacionOrmEntity,
      PlanAlimentacionVersionOrmEntity,
      PlanFeedbackOrmEntity,
      TurnoOrmEntity,
      UsuarioOrmEntity,
      GimnasioOrmEntity,
      PoliticaOperativaOrmEntity,
    ]),
  ],
  providers: [
    { provide: USUARIO_REPOSITORY, useClass: UsuarioRepositoryImplementation },
    { provide: SOCIO_REPOSITORY, useClass: SocioRepositoryImplementation },
    {
      provide: NUTRICIONISTA_REPOSITORY,
      useClass: NutricionistaRepositoryImplementation,
    },
    {
      provide: RECEPCIONISTA_REPOSITORY,
      useClass: RecepcionistaRepositoryImplementation,
    },
    {
      provide: POLITICA_OPERATIVA_REPOSITORY,
      useClass: PoliticaOperativaRepositoryImpl,
    },
    {
      provide: FICHA_SALUD_VERSION_REPOSITORY,
      useClass: FichaSaludVersionRepositoryImpl,
    },
    {
      provide: EXCEPCION_DISPONIBILIDAD_REPOSITORY,
      useClass: ExcepcionDisponibilidadRepositoryImpl,
    },
    {
      provide: PLAN_ALIMENTACION_VERSION_REPOSITORY,
      useClass: PlanAlimentacionVersionRepositoryImpl,
    },
    {
      provide: PLAN_FEEDBACK_REPOSITORY,
      useClass: PlanFeedbackRepositoryImpl,
    },
    {
      provide: NUTRICIONISTA_IA_MEMORIA_REPOSITORY,
      useClass: NutricionistaIAMemoriaRepositoryImpl,
    },
  ],
  exports: [
    USUARIO_REPOSITORY,
    SOCIO_REPOSITORY,
    NUTRICIONISTA_REPOSITORY,
    RECEPCIONISTA_REPOSITORY,
    POLITICA_OPERATIVA_REPOSITORY,
    FICHA_SALUD_VERSION_REPOSITORY,
    EXCEPCION_DISPONIBILIDAD_REPOSITORY,
    PLAN_ALIMENTACION_VERSION_REPOSITORY,
    PLAN_FEEDBACK_REPOSITORY,
    NUTRICIONISTA_IA_MEMORIA_REPOSITORY,
  ],
})
export class RepositoriesModule {}
