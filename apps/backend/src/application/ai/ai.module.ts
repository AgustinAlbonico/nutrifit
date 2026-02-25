import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  SocioOrmEntity,
  PlanAlimentacionOrmEntity,
  NutricionistaOrmEntity,
} from 'src/infrastructure/persistence/typeorm/entities';
import { NUTRICIONISTA_REPOSITORY } from 'src/domain/entities/Persona/Nutricionista/nutricionista.repository';
import { NutricionistaRepositoryImplementation } from 'src/infrastructure/persistence/typeorm/repositories/nutricionista.repository';
import { AppLoggerModule } from 'src/infrastructure/common/logger/app-logger.module';
import { GroqModule } from 'src/infrastructure/services/groq/groq.module';
import {
  PrepararContextoPacienteUseCase,
  GenerarRecomendacionComidaUseCase,
  GenerarPlanSemanalUseCase,
  SugerirSustitucionUseCase,
  AnalizarPlanNutricionalUseCase,
} from './use-cases';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SocioOrmEntity,
      PlanAlimentacionOrmEntity,
      NutricionistaOrmEntity,
    ]),
    AppLoggerModule,
    GroqModule,
  ],
  providers: [
    PrepararContextoPacienteUseCase,
    GenerarRecomendacionComidaUseCase,
    GenerarPlanSemanalUseCase,
    SugerirSustitucionUseCase,
    AnalizarPlanNutricionalUseCase,
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
  ],
})
export class AiModule {}
