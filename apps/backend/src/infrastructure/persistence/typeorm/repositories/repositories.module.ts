import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TypeOrmConfigModule } from 'src/infrastructure/config/typeorm/typeorm.module';
import {
  UsuarioRepositoryImplementation,
  SocioRepositoryImplementation,
  NutricionistaRepositoryImplementation,
  ConsentimientoRepositoryImpl,
  PreferenciasPrivacidadRepositoryImpl,
} from './';
import {
  SocioOrmEntity,
  AgendaOrmEntity,
  AlergiaOrmEntity,
  AlimentoOrmEntity,
  AsistenteOrmEntity,
  FichaSaludOrmEntity,
  FormacionAcademicaOrmEntity,
  GrupoAlimenticioOrmEntity,
  NutricionistaOrmEntity,
  ObservacionClinicaOrmEntity,
  OpcionComidaOrmEntity,
  PatologiaOrmEntity,
  PersonaOrmEntity,
  PlanAlimentacionOrmEntity,
  TurnoOrmEntity,
  UsuarioOrmEntity,
  GimnasioOrmEntity,
  TerminoConsentimientoOrmEntity,
  ConsentimientoUsuarioOrmEntity,
  PreferenciasPrivacidadOrmEntity,
} from '../entities/';
import { SOCIO_REPOSITORY } from 'src/domain/entities/Persona/Socio/socio.repository';
import { USUARIO_REPOSITORY } from 'src/domain/entities/Usuario/usuario.repository';
import { NUTRICIONISTA_REPOSITORY } from 'src/domain/entities/Persona/Nutricionista/nutricionista.repository';
import { POLITICA_OPERATIVA_REPOSITORY } from 'src/application/politicas/politica-operativa.repository';
import { PoliticaOperativaRepositoryImpl } from 'src/infrastructure/politicas/politica-operativa.repository.impl';
import { CONSENTIMIENTO_REPOSITORY } from 'src/domain/entities/Consentimiento/consentimiento.repository';
import { PREFERENCIAS_PRIVACIDAD_REPOSITORY } from 'src/domain/entities/Consentimiento/preferencias-privacidad.repository';

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
      AsistenteOrmEntity,
      FichaSaludOrmEntity,
      FormacionAcademicaOrmEntity,
      GrupoAlimenticioOrmEntity,
      NutricionistaOrmEntity,
      ObservacionClinicaOrmEntity,
      OpcionComidaOrmEntity,
      PatologiaOrmEntity,
      PersonaOrmEntity,
      PlanAlimentacionOrmEntity,
      TurnoOrmEntity,
      UsuarioOrmEntity,
      GimnasioOrmEntity,
      TerminoConsentimientoOrmEntity,
      ConsentimientoUsuarioOrmEntity,
      PreferenciasPrivacidadOrmEntity,
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
      provide: POLITICA_OPERATIVA_REPOSITORY,
      useClass: PoliticaOperativaRepositoryImpl,
    },
    {
      provide: CONSENTIMIENTO_REPOSITORY,
      useClass: ConsentimientoRepositoryImpl,
    },
    {
      provide: PREFERENCIAS_PRIVACIDAD_REPOSITORY,
      useClass: PreferenciasPrivacidadRepositoryImpl,
    },
  ],
  exports: [
    USUARIO_REPOSITORY,
    SOCIO_REPOSITORY,
    NUTRICIONISTA_REPOSITORY,
    POLITICA_OPERATIVA_REPOSITORY,
    CONSENTIMIENTO_REPOSITORY,
    PREFERENCIAS_PRIVACIDAD_REPOSITORY,
  ],
})
export class RepositoriesModule {}
