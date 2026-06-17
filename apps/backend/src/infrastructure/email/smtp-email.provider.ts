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
    const port = this.parsePort(this.configService.get<string>('SMTP_PORT'));
    const secure = this.parseSecure(
      this.configService.get<string | boolean>('SMTP_SECURE'),
    );

    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST', 'localhost'),
      port,
      secure,
      auth: {
        user: this.configService.get<string>('SMTP_USER', ''),
        pass: this.configService.get<string>('SMTP_PASS', ''),
      },
      pool: true,
      maxConnections: 3,
      maxMessages: 50,
      connectionTimeout: 15000,
      greetingTimeout: 10000,
      socketTimeout: 20000,
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
        text: payload.text,
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

  private parsePort(value: string | undefined): number {
    const normalizedValue = value?.trim();
    if (!normalizedValue) {
      return 587;
    }

    const port = Number(normalizedValue);
    return Number.isInteger(port) && port > 0 && port <= 65535 ? port : 587;
  }

  private parseSecure(value: string | boolean | undefined): boolean {
    if (typeof value === 'boolean') {
      return value;
    }

    return value?.trim().toLowerCase() === 'true';
  }
}
