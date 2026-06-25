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
  RegenerarPlanSemanalUseCase,
  SugerirSustitucionUseCase,
  AnalizarPlanNutricionalUseCase,
  GenerarIdeasComidaUseCase,
} from './use-cases';
import { PromptPlanSemanalBuilder } from './builders/prompt-plan-semanal.builder';
import { PromptRegeneracionBuilder } from './builders/prompt-regeneracion.builder';
import { IaMemoriaModule } from '../ia-memoria/ia-memoria.module';
import { TenantContextModule } from 'src/infrastructure/auth/tenant-context.module';

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
    IaMemoriaModule,
    TenantContextModule,
  ],
  providers: [
    PrepararContextoPacienteUseCase,
    GenerarRecomendacionComidaUseCase,
    GenerarPlanSemanalUseCase,
    RegenerarPlanSemanalUseCase,
    SugerirSustitucionUseCase,
    AnalizarPlanNutricionalUseCase,
    GenerarIdeasComidaUseCase,
    PromptPlanSemanalBuilder,
    PromptRegeneracionBuilder,
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
    RegenerarPlanSemanalUseCase,
    SugerirSustitucionUseCase,
    AnalizarPlanNutricionalUseCase,
    GenerarIdeasComidaUseCase,
    PromptPlanSemanalBuilder,
    PromptRegeneracionBuilder,
    NotificacionesService,
  ],
})
export class AiModule {}
