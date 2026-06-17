import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  ConfigureAgendaUseCase,
  GetAgendaUseCase,
  ListarExcepcionesDisponibilidadUseCase,
} from './use-cases';
import { AGENDA_REPOSITORY } from 'src/domain/entities/Agenda/agenda.repository';
import { EXCEPCION_DISPONIBILIDAD_REPOSITORY } from 'src/domain/entities/Agenda/excepcion-disponibilidad.repository';
import { NUTRICIONISTA_REPOSITORY } from 'src/domain/entities/Persona/Nutricionista/nutricionista.repository';
import { AgendaRepositoryImplementation } from 'src/infrastructure/persistence/typeorm/repositories/agenda.repository';
import { ExcepcionDisponibilidadRepositoryImpl } from 'src/infrastructure/persistence/typeorm/repositories/excepcion-disponibilidad.repository';
import { NutricionistaRepositoryImplementation } from 'src/infrastructure/persistence/typeorm/repositories/nutricionista.repository';
import {
  AgendaOrmEntity,
  ExcepcionDisponibilidadOrmEntity,
  NutricionistaOrmEntity,
  TurnoOrmEntity,
} from 'src/infrastructure/persistence/typeorm/entities';
import { AppLoggerModule } from 'src/infrastructure/common/logger/app-logger.module';
import { SlotComputationService } from 'src/application/turnos/services/slot-computation.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AgendaOrmEntity,
      ExcepcionDisponibilidadOrmEntity,
      NutricionistaOrmEntity,
      TurnoOrmEntity,
    ]),
    AppLoggerModule,
  ],
  providers: [
    ConfigureAgendaUseCase,
    GetAgendaUseCase,
    ListarExcepcionesDisponibilidadUseCase,
    SlotComputationService,
    {
      provide: AGENDA_REPOSITORY,
      useClass: AgendaRepositoryImplementation,
    },
    {
      provide: EXCEPCION_DISPONIBILIDAD_REPOSITORY,
      useClass: ExcepcionDisponibilidadRepositoryImpl,
    },
    {
      provide: NUTRICIONISTA_REPOSITORY,
      useClass: NutricionistaRepositoryImplementation,
    },
  ],
  exports: [
    ConfigureAgendaUseCase,
    GetAgendaUseCase,
    ListarExcepcionesDisponibilidadUseCase,
  ],
})
export class AgendaModule {}
