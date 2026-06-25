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
  ObtenerPlanActivoSocioUseCase,
  ObtenerPlanPorIdUseCase,
  VaciarContenidoPlanUseCase,
  ListarVersionesPlanUseCase,
  ObtenerVersionPlanUseCase,
  CrearFeedbackPlanUseCase,
  EditarFeedbackPlanUseCase,
  ActivarPlanAlimentacionUseCase,
  FinalizarPlanAlimentacionUseCase,
} from './use-cases';
import { AuditoriaModule } from 'src/infrastructure/services/auditoria/auditoria.module';
import { NotificacionesService } from 'src/application/notificaciones/notificaciones.service';
import { RestriccionesModule } from 'src/application/restricciones/restricciones.module';
import { RepositoriesModule } from 'src/infrastructure/persistence/typeorm/repositories/repositories.module';

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
  ],
  providers: [
    CrearPlanAlimentacionUseCase,
    EditarPlanAlimentacionUseCase,
    EliminarPlanAlimentacionUseCase,
    ObtenerPlanActivoSocioUseCase,
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
    NotificacionesService,
  ],
  exports: [
    CrearPlanAlimentacionUseCase,
    EditarPlanAlimentacionUseCase,
    EliminarPlanAlimentacionUseCase,
    ObtenerPlanActivoSocioUseCase,
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
  ],
})
export class PlanesAlimentacionModule {}
