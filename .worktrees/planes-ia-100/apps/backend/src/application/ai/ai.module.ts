import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  SocioOrmEntity,
  PlanAlimentacionOrmEntity,
  NutricionistaOrmEntity,
  SugerenciaIAOrmEntity,
  AlimentoOrmEntity,
} from 'src/infrastructure/persistence/typeorm/entities';
import { NUTRICIONISTA_REPOSITORY } from 'src/domain/entities/Persona/Nutricionista/nutricionista.repository';
import { NutricionistaRepositoryImplementation } from 'src/infrastructure/persistence/typeorm/repositories/nutricionista.repository';
import { AppLoggerModule } from 'src/infrastructure/common/logger/app-logger.module';
import { GroqModule } from 'src/infrastructure/services/groq/groq.module';
import { RestriccionesModule } from '../restricciones/restricciones.module';
import {
  PrepararContextoPacienteUseCase,
  GenerarRecomendacionComidaUseCase,
  GenerarPlanSemanalUseCase,
  ValidadorPlanSemanalUseCase,
  SugerirSustitucionUseCase,
  AnalizarPlanNutricionalUseCase,
  GenerarIdeasComidaUseCase,
  MapearIngredientesIAUseCase,
  AplicarDraftPlanSemanalUseCase,
} from './use-cases';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SocioOrmEntity,
      PlanAlimentacionOrmEntity,
      NutricionistaOrmEntity,
      SugerenciaIAOrmEntity,
      AlimentoOrmEntity,
    ]),
    AppLoggerModule,
    GroqModule,
    RestriccionesModule,
  ],
  providers: [
    PrepararContextoPacienteUseCase,
    GenerarRecomendacionComidaUseCase,
    GenerarPlanSemanalUseCase,
    ValidadorPlanSemanalUseCase,
    SugerirSustitucionUseCase,
    AnalizarPlanNutricionalUseCase,
    GenerarIdeasComidaUseCase,
    MapearIngredientesIAUseCase,
    AplicarDraftPlanSemanalUseCase,
    {
      provide: NUTRICIONISTA_REPOSITORY,
      useClass: NutricionistaRepositoryImplementation,
    },
  ],
  exports: [
    PrepararContextoPacienteUseCase,
    GenerarRecomendacionComidaUseCase,
    GenerarPlanSemanalUseCase,
    ValidadorPlanSemanalUseCase,
    SugerirSustitucionUseCase,
    AnalizarPlanNutricionalUseCase,
    GenerarIdeasComidaUseCase,
    MapearIngredientesIAUseCase,
    AplicarDraftPlanSemanalUseCase,
  ],
})
export class AiModule {}
