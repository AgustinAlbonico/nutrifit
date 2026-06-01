import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TypeOrmConfigModule } from 'src/infrastructure/config/typeorm/typeorm.module';
import {
  UsuarioRepositoryImplementation,
  SocioRepositoryImplementation,
  NutricionistaRepositoryImplementation,
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
} from '../entities/';
import { SOCIO_REPOSITORY } from 'src/domain/entities/Persona/Socio/socio.repository';
import { USUARIO_REPOSITORY } from 'src/domain/entities/Usuario/usuario.repository';
import { NUTRICIONISTA_REPOSITORY } from 'src/domain/entities/Persona/Nutricionista/nutricionista.repository';
import { POLITICA_OPERATIVA_REPOSITORY } from 'src/application/politicas/politica-operativa.repository';
import { PoliticaOperativaRepositoryImpl } from 'src/infrastructure/politicas/politica-operativa.repository.impl';

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
  ],
  exports: [
    USUARIO_REPOSITORY,
    SOCIO_REPOSITORY,
    NUTRICIONISTA_REPOSITORY,
    POLITICA_OPERATIVA_REPOSITORY,
  ],
})
export class RepositoriesModule {}
