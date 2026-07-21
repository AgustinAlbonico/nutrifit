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
      port: this.parsePort(
        this.configService.get<string | number>('SMTP_PORT'),
      ),
      secure: this.parseSecure(
        this.configService.get<string | boolean>('SMTP_SECURE'),
      ),
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
      const mailOptions: nodemailer.SendMailOptions = {
        from: this.configService.get<string>(
          'SMTP_FROM',
          'nutrifit@noreply.com',
        ),
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
      };

      if (payload.text) {
        mailOptions.text = payload.text;
      }

      await this.transporter.sendMail(mailOptions);
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

  private parsePort(value: string | number | undefined): number {
    const port = typeof value === 'number' ? value : Number(value?.trim());
    return Number.isInteger(port) && port > 0 && port <= 65535 ? port : 587;
  }

  private parseSecure(value: string | boolean | undefined): boolean {
    if (typeof value === 'boolean') {
      return value;
    }

    return ['true', '1', 'si', 'yes'].includes(
      value?.trim().toLowerCase() ?? '',
    );
  }
}
