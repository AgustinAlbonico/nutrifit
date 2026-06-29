import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  AlimentoOrmEntity,
  DiaPlanOrmEntity,
  FichaSaludOrmEntity,
  NutricionistaOrmEntity,
  OpcionComidaOrmEntity,
  PlanAlimentacionOrmEntity,
  SocioOrmEntity,
  NotificacionOrmEntity,
  UsuarioOrmEntity,
} from 'src/infrastructure/persistence/typeorm/entities';
import {
  CrearPlanAlimentacionUseCase,
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
} from './use-cases';
import { AuditoriaModule } from 'src/infrastructure/services/auditoria/auditoria.module';
import { NotificacionesService } from 'src/application/notificaciones/notificaciones.service';
import { RestriccionesModule } from 'src/application/restricciones/restricciones.module';
import { RepositoriesModule } from 'src/infrastructure/persistence/typeorm/repositories/repositories.module';
import { AppLoggerModule } from 'src/infrastructure/common/logger/app-logger.module';
import { GroqModule } from 'src/infrastructure/services/groq/groq.module';

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
    ]),
    AuditoriaModule,
    RestriccionesModule,
    RepositoriesModule,
    AppLoggerModule,
    GroqModule,
  ],
  providers: [
    CrearPlanAlimentacionUseCase,
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
    NotificacionesService,
  ],
  exports: [
    CrearPlanAlimentacionUseCase,
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
  ],
})
export class PlanesAlimentacionModule {}
