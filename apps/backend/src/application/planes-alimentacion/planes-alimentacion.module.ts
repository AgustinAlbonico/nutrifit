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
} from './use-cases';
import { AuditoriaModule } from 'src/infrastructure/services/auditoria/auditoria.module';
import { NotificacionesService } from 'src/application/notificaciones/notificaciones.service';
import { RestriccionesModule } from 'src/application/restricciones/restricciones.module';

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
  ],
})
export class PlanesAlimentacionModule {}
