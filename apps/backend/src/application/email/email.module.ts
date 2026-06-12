import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ConsoleEmailProvider } from 'src/infrastructure/email/console-email.provider';
import { SmtpEmailProvider } from 'src/infrastructure/email/smtp-email.provider';
import { EmailService, EMAIL_PROVIDER } from './email.service';

/**
 * Modulo que provee el servicio de email (`EmailService`) y la
 * implementacion del provider (`SmtpEmailProvider` si
 * `SMTP_HOST` esta seteado, sino `ConsoleEmailProvider` para
 * dev/staging).
 *
 * Se extrajo de `SchedulersModule` (PR-2 del change
 * `crear-turno-en-nombre-del-socio`) para que `TurnosModule` pueda
 * importar `EmailService` sin arrastrar los cron schedulers (que
 * deben vivir solo en el contexto de `InfrastructureModule`).
 */
@Module({
  providers: [
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
  exports: [EmailService],
})
export class EmailModule {}
