import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  AlimentoOrmEntity,
  DiaPlanOrmEntity,
  FichaSaludOrmEntity,
  GrupoAlimenticioOrmEntity,
  NutricionistaOrmEntity,
  OpcionComidaOrmEntity,
  PlanAlimentacionOrmEntity,
  PreparacionOrmEntity,
  SocioOrmEntity,
  NotificacionOrmEntity,
  UsuarioOrmEntity,
} from 'src/infrastructure/persistence/typeorm/entities';
import {
  CrearPlanAlimentacionUseCase,
  CrearPlanManualVacioUseCase,
  EditarPlanAlimentacionUseCase,
  EliminarPlanAlimentacionUseCase,
  ListarPlanesSocioUseCase,
  ListarPlanesNutricionistaUseCase,
  ListarPlanesActivosSocioUseCase,
  ObtenerPlanPorIdUseCase,
  VaciarContenidoPlanUseCase,
  ListarVersionesPlanUseCase,
  ObtenerVersionPlanUseCase,
  CrearFeedbackPlanUseCase,
  EditarFeedbackPlanUseCase,
  ActivarPlanAlimentacionUseCase,
  FinalizarPlanAlimentacionUseCase,
  GenerarIdeasComidaUseCase,
  PersistirPlanManualUseCase,
  GuardarVersionPlanUseCase,
} from './use-cases';
import { AuditoriaModule } from 'src/infrastructure/services/auditoria/auditoria.module';
import { NotificacionesService } from 'src/application/notificaciones/notificaciones.service';
import { RestriccionesModule } from 'src/application/restricciones/restricciones.module';
import { RepositoriesModule } from 'src/infrastructure/persistence/typeorm/repositories/repositories.module';
import { AppLoggerModule } from 'src/infrastructure/common/logger/app-logger.module';
import { GroqModule } from 'src/infrastructure/services/groq/groq.module';
import { AiModule } from 'src/application/ai/ai.module';
import { BloqueoGeneracionPlanIaService } from './services/bloqueo-generacion-plan-ia.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PlanAlimentacionOrmEntity,
      DiaPlanOrmEntity,
      OpcionComidaOrmEntity,
      AlimentoOrmEntity,
      SocioOrmEntity,
      NutricionistaOrmEntity,
      FichaSaludOrmEntity,
      UsuarioOrmEntity,
      NotificacionOrmEntity,
      GrupoAlimenticioOrmEntity,
      PreparacionOrmEntity,
    ]),
    AuditoriaModule,
    RestriccionesModule,
    RepositoriesModule,
    AppLoggerModule,
    GroqModule,
    AiModule,
  ],
  providers: [
    CrearPlanAlimentacionUseCase,
    CrearPlanManualVacioUseCase,
    EditarPlanAlimentacionUseCase,
    EliminarPlanAlimentacionUseCase,
    ListarPlanesActivosSocioUseCase,
    ObtenerPlanPorIdUseCase,
    ListarPlanesSocioUseCase,
    ListarPlanesNutricionistaUseCase,
    VaciarContenidoPlanUseCase,
    ListarVersionesPlanUseCase,
    ObtenerVersionPlanUseCase,
    CrearFeedbackPlanUseCase,
    EditarFeedbackPlanUseCase,
    ActivarPlanAlimentacionUseCase,
    FinalizarPlanAlimentacionUseCase,
    GenerarIdeasComidaUseCase,
    PersistirPlanManualUseCase,
    GuardarVersionPlanUseCase,
    BloqueoGeneracionPlanIaService,
    NotificacionesService,
  ],
  exports: [
    CrearPlanAlimentacionUseCase,
    CrearPlanManualVacioUseCase,
    EditarPlanAlimentacionUseCase,
    EliminarPlanAlimentacionUseCase,
    ListarPlanesActivosSocioUseCase,
    ObtenerPlanPorIdUseCase,
    ListarPlanesSocioUseCase,
    ListarPlanesNutricionistaUseCase,
    VaciarContenidoPlanUseCase,
    ListarVersionesPlanUseCase,
    ObtenerVersionPlanUseCase,
    CrearFeedbackPlanUseCase,
    EditarFeedbackPlanUseCase,
    ActivarPlanAlimentacionUseCase,
    FinalizarPlanAlimentacionUseCase,
    PersistirPlanManualUseCase,
    GenerarIdeasComidaUseCase,
    GuardarVersionPlanUseCase,
    BloqueoGeneracionPlanIaService,
  ],
})
export class PlanesAlimentacionModule {}
