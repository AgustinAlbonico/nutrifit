import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigureAgendaUseCase, GetAgendaUseCase } from './use-cases';
import { AGENDA_REPOSITORY } from 'src/domain/entities/Agenda/agenda.repository';
import { NUTRICIONISTA_REPOSITORY } from 'src/domain/entities/Persona/Nutricionista/nutricionista.repository';
import { AgendaRepositoryImplementation } from 'src/infrastructure/persistence/typeorm/repositories/agenda.repository';
import { NutricionistaRepositoryImplementation } from 'src/infrastructure/persistence/typeorm/repositories/nutricionista.repository';
import {
  AgendaOrmEntity,
  NutricionistaOrmEntity,
} from 'src/infrastructure/persistence/typeorm/entities';
import { AppLoggerModule } from 'src/infrastructure/common/logger/app-logger.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AgendaOrmEntity, NutricionistaOrmEntity]),
    AppLoggerModule,
  ],
  providers: [
    ConfigureAgendaUseCase,
    GetAgendaUseCase,
    {
      provide: AGENDA_REPOSITORY,
      useClass: AgendaRepositoryImplementation,
    },
    {
      provide: NUTRICIONISTA_REPOSITORY,
      useClass: NutricionistaRepositoryImplementation,
    },
  ],
  exports: [ConfigureAgendaUseCase, GetAgendaUseCase],
})
export class AgendaModule {}
