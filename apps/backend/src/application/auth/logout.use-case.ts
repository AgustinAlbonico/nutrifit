import { Inject, Injectable, Logger } from '@nestjs/common';

import { OrigenRequest } from 'src/infrastructure/common/http/request-origin.helper';
import {
  LOGIN_AUDIT_SERVICE,
  LoginAuditService,
} from 'src/infrastructure/services/auditoria/login-audit.service';
import { ResultadoLoginAudit } from 'src/infrastructure/persistence/typeorm/entities/login-audit.entity';

@Injectable()
export class LogoutUseCase {
  private readonly logger = new Logger(LogoutUseCase.name);

  constructor(
    @Inject(LOGIN_AUDIT_SERVICE)
    private readonly loginAuditService: LoginAuditService,
  ) {}

  async execute(
    usuarioId: number,
    gimnasioId: number | null,
    origen: OrigenRequest,
  ): Promise<void> {
    await this.loginAuditService.persistir({
      usuarioId,
      emailIntentado: null,
      resultado: ResultadoLoginAudit.LOGOUT,
      ip: origen.ip ?? null,
      userAgent: origen.userAgent ?? null,
      gimnasioId,
    });
  }
}
