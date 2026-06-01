import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AlimentoOrmEntity } from '../persistence/typeorm/entities/alimento.entity';
import { TurnoOrmEntity } from '../persistence/typeorm/entities/turno.entity';
import { AlimentosSyncService } from '../alimentos/alimentos-sync.service';
import { AlimentosSyncScheduler } from './alimentos-sync.scheduler';
import { AusenciaTurnoScheduler } from './ausencia-turno.scheduler';
import { RepositoriesModule } from '../persistence/typeorm/repositories/repositories.module';
import { RecordatorioEnviadoOrmEntity } from '../persistence/typeorm/entities/recordatorio-enviado.entity';
import { TurnoReminderScheduler } from './turno-reminder.scheduler';
import {
  EmailService,
  EMAIL_PROVIDER,
} from 'src/application/email/email.service';
import { ConsoleEmailProvider } from '../email/console-email.provider';
import { SmtpEmailProvider } from '../email/smtp-email.provider';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TurnoOrmEntity,
      AlimentoOrmEntity,
      RecordatorioEnviadoOrmEntity,
    ]),
    RepositoriesModule,
  ],
  providers: [
    AusenciaTurnoScheduler,
    TurnoReminderScheduler,
    AlimentosSyncService,
    AlimentosSyncScheduler,
    EmailService,
    ConsoleEmailProvider,
    SmtpEmailProvider,
    {
      provide: EMAIL_PROVIDER,
      useFactory: (configService: ConfigService) => {
        const smtpHost = configService.get<string>('SMTP_HOST');
        if (smtpHost) {
          return new SmtpEmailProvider(configService);
        }
        return new ConsoleEmailProvider();
      },
      inject: [ConfigService],
    },
  ],
})
export class SchedulersModule {}
