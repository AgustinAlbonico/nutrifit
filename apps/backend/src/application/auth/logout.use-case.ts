import { Inject, Injectable, Logger } from '@nestjs/common';

import { OrigenRequest } from 'src/infrastructure/common/http/request-origin.helper';
import {
  LOGIN_AUDIT_SERVICE,
  LoginAuditService,
} from 'src/infrastructure/services/auditoria/login-audit.service';
import { ResultadoLoginAudit } from 'src/infrastructure/persistence/typeorm/entities/login-audit.entity';
import {
  TOKEN_REVOCADO_REPOSITORY,
  TokenRevocadoRepository,
} from 'src/domain/repositories/token-revocado.repository';
import { UsuarioAutenticadoPayload } from 'src/infrastructure/auth/decorators/current-user.decorator';

export interface LogoutPayload {
  usuarioId: number;
  gimnasioId: number | null;
  jti: string;
  jwtExpiresAt: Date;
  origen: OrigenRequest;
}

@Injectable()
export class LogoutUseCase {
  private readonly logger = new Logger(LogoutUseCase.name);

  constructor(
    @Inject(LOGIN_AUDIT_SERVICE)
    private readonly loginAuditService: LoginAuditService,
    @Inject(TOKEN_REVOCADO_REPOSITORY)
    private readonly tokenRevocadoRepository: TokenRevocadoRepository,
  ) {}

  async execute(
    currentUser: UsuarioAutenticadoPayload,
    origen: OrigenRequest,
  ): Promise<void> {
    await this.loginAuditService.persistir({
      usuarioId: currentUser.id,
      emailIntentado: null,
      resultado: ResultadoLoginAudit.LOGOUT,
      ip: origen.ip ?? null,
      userAgent: origen.userAgent ?? null,
      gimnasioId: currentUser.gimnasioId,
    });

    // Persistir el jti en la blacklist para que el guard invalide el token
    // antes de su expiracion natural. Si la operacion falla, no rompemos el
    // logout: el token expirara solo.
    try {
      await this.tokenRevocadoRepository.save({
        jti: currentUser.jti,
        usuarioId: currentUser.id,
        gimnasioId: currentUser.gimnasioId,
        expiresAt: new Date((currentUser.exp ?? 0) * 1000 || Date.now() + 60 * 60 * 1000),
      });
    } catch (error) {
      this.logger.warn(
        `No se pudo persistir el jti revocado: ${(error as Error).message}`,
      );
    }
  }
}
