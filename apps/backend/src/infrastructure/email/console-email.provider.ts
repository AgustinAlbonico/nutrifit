import { Injectable, Logger } from '@nestjs/common';
import {
  IEmailProvider,
  type EmailPayload,
} from 'src/application/email/contracts/email-provider.interface';

@Injectable()
export class ConsoleEmailProvider implements IEmailProvider {
  private readonly logger = new Logger(ConsoleEmailProvider.name);

  async enviar(payload: EmailPayload): Promise<void> {
    this.logger.log(
      `[EMAIL-CONSOLE] to=${payload.to} subject="${payload.subject}" gimnasioId=${payload.gimnasioId ?? 'N/A'}`,
    );
  }
}
