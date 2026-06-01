import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import {
  IEmailProvider,
  type EmailPayload,
} from 'src/application/email/contracts/email-provider.interface';

@Injectable()
export class SmtpEmailProvider implements IEmailProvider {
  private readonly logger = new Logger(SmtpEmailProvider.name);
  private readonly transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST', 'localhost'),
      port: this.configService.get<number>('SMTP_PORT', 587),
      secure: this.configService.get<boolean>('SMTP_SECURE', false),
      auth: {
        user: this.configService.get<string>('SMTP_USER', ''),
        pass: this.configService.get<string>('SMTP_PASS', ''),
      },
    });
  }

  async enviar(payload: EmailPayload): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: this.configService.get<string>(
          'SMTP_FROM',
          'nutrifit@noreply.com',
        ),
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
      });
      this.logger.log(
        `[EMAIL-SMTP] to=${payload.to} subject="${payload.subject}"`,
      );
    } catch (error) {
      this.logger.error(
        `Error enviando email via SMTP a ${payload.to}`,
        error as Error,
      );
      throw error;
    }
  }
}
