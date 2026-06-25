import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  SocioOrmEntity,
  PlanAlimentacionOrmEntity,
  NutricionistaOrmEntity,
  SugerenciaIAOrmEntity,
  FichaSaludOrmEntity,
  NotificacionOrmEntity,
} from 'src/infrastructure/persistence/typeorm/entities';
import { NUTRICIONISTA_REPOSITORY } from 'src/domain/entities/Persona/Nutricionista/nutricionista.repository';
import { NutricionistaRepositoryImplementation } from 'src/infrastructure/persistence/typeorm/repositories/nutricionista.repository';
import { AppLoggerModule } from 'src/infrastructure/common/logger/app-logger.module';
import { GroqModule } from 'src/infrastructure/services/groq/groq.module';
import { RestriccionesModule } from '../restricciones/restricciones.module';
import { RepositoriesModule } from 'src/infrastructure/persistence/typeorm/repositories/repositories.module';
import { AuditoriaModule } from 'src/infrastructure/services/auditoria/auditoria.module';
import { NotificacionesService } from 'src/application/notificaciones/notificaciones.service';
import {
  PrepararContextoPacienteUseCase,
  GenerarRecomendacionComidaUseCase,
  GenerarPlanSemanalUseCase,
  SugerirSustitucionUseCase,
  AnalizarPlanNutricionalUseCase,
  GenerarIdeasComidaUseCase,
} from './use-cases';
import { PromptPlanSemanalBuilder } from './builders/prompt-plan-semanal.builder';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SocioOrmEntity,
      PlanAlimentacionOrmEntity,
      NutricionistaOrmEntity,
      SugerenciaIAOrmEntity,
      FichaSaludOrmEntity,
      NotificacionOrmEntity,
    ]),
    AppLoggerModule,
    GroqModule,
    RestriccionesModule,
    RepositoriesModule,
    AuditoriaModule,
  ],
  providers: [
    PrepararContextoPacienteUseCase,
    GenerarRecomendacionComidaUseCase,
    GenerarPlanSemanalUseCase,
    SugerirSustitucionUseCase,
    AnalizarPlanNutricionalUseCase,
    GenerarIdeasComidaUseCase,
    PromptPlanSemanalBuilder,
    NotificacionesService,
    {
      provide: NUTRICIONISTA_REPOSITORY,
      useClass: NutricionistaRepositoryImplementation,
    },
  ],
  exports: [
    PrepararContextoPacienteUseCase,
    GenerarRecomendacionComidaUseCase,
    GenerarPlanSemanalUseCase,
    SugerirSustitucionUseCase,
    AnalizarPlanNutricionalUseCase,
    GenerarIdeasComidaUseCase,
    PromptPlanSemanalBuilder,
    NotificacionesService,
  ],
})
export class AiModule {}
