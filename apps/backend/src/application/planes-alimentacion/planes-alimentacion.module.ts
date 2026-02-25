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
    ]),
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
