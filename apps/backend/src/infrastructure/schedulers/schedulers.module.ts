import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AlimentoOrmEntity } from '../persistence/typeorm/entities/alimento.entity';
import { TurnoOrmEntity } from '../persistence/typeorm/entities/turno.entity';
import { AlimentosSyncService } from '../alimentos/alimentos-sync.service';
import { AlimentosSyncScheduler } from './alimentos-sync.scheduler';
import { AusenciaTurnoScheduler } from './ausencia-turno.scheduler';
import { RepositoriesModule } from '../persistence/typeorm/repositories/repositories.module';
import { RecordatorioEnviadoOrmEntity } from '../persistence/typeorm/entities/recordatorio-enviado.entity';
import { NotificacionOrmEntity } from '../persistence/typeorm/entities/notificacion.entity';
import { TurnoReminderScheduler } from './turno-reminder.scheduler';
import { NotificacionesService } from 'src/application/notificaciones/notificaciones.service';
import { EmailModule } from 'src/application/email/email.module';
import { FinalizarConsultaPorInactividadUseCase } from 'src/application/turnos/use-cases/finalizar-consulta-por-inactividad.use-case';
import { CierreConsultaScheduler } from './cierre-consulta.scheduler';
import { GeneracionPlanIaReaperScheduler } from './generacion-plan-ia-reaper.scheduler';
import { AuditoriaModule } from 'src/infrastructure/services/auditoria/auditoria.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TurnoOrmEntity,
      AlimentoOrmEntity,
      RecordatorioEnviadoOrmEntity,
      NotificacionOrmEntity,
    ]),
    RepositoriesModule,
    EmailModule,
    AuditoriaModule,
  ],
  providers: [
    AusenciaTurnoScheduler,
    TurnoReminderScheduler,
    CierreConsultaScheduler,
    GeneracionPlanIaReaperScheduler,
    NotificacionesService,
    FinalizarConsultaPorInactividadUseCase,
    AlimentosSyncService,
    AlimentosSyncScheduler,
  ],
})
export class SchedulersModule {}
