import { Inject, Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';

import { UnauthorizedError } from 'src/domain/exceptions/custom-exceptions';
import {
  IJwtService,
  JWT_SERVICE,
  JwtPayload,
} from 'src/domain/services/jwt.service';
import { UsuarioAutenticadoPayload } from 'src/infrastructure/auth/decorators/current-user.decorator';
import { OrigenRequest } from 'src/infrastructure/common/http/request-origin.helper';
import {
  LOGIN_AUDIT_SERVICE,
  LoginAuditService,
} from 'src/infrastructure/services/auditoria/login-audit.service';
import { ResultadoLoginAudit } from 'src/infrastructure/persistence/typeorm/entities/login-audit.entity';

@Injectable()
export class RefreshTokenUseCase {
  private readonly logger = new Logger(RefreshTokenUseCase.name);

  constructor(
    @Inject(JWT_SERVICE)
    private readonly jwtService: IJwtService,
    @Inject(LOGIN_AUDIT_SERVICE)
    private readonly loginAuditService: LoginAuditService,
  ) {}

  async execute(
    currentTokenPayload: UsuarioAutenticadoPayload,
    origen: OrigenRequest,
  ): Promise<{ token: string }> {
    try {
      const payload: JwtPayload = {
        id: currentTokenPayload.id,
        email: currentTokenPayload.email,
        rol: currentTokenPayload.rol,
        acciones: currentTokenPayload.acciones,
        personaId: currentTokenPayload.personaId,
        gimnasioId: currentTokenPayload.gimnasioId,
        jti: randomUUID(),
      };

      const token = this.jwtService.sign(payload);

      await this.registrarRefresh(
        currentTokenPayload.id,
        currentTokenPayload.gimnasioId,
        ResultadoLoginAudit.REFRESH_SUCCESS,
        origen,
      );

      return { token };
    } catch (error) {
      await this.registrarRefresh(
        null,
        null,
        ResultadoLoginAudit.REFRESH_FAILURE,
        origen,
      );
      throw error instanceof UnauthorizedError
        ? error
        : new UnauthorizedError('Token invalido o expirado');
    }
  }

  private async registrarRefresh(
    usuarioId: number | null,
    gimnasioId: number | null,
    resultado: ResultadoLoginAudit,
    origen: OrigenRequest,
  ): Promise<void> {
    await this.loginAuditService.persistir({
      usuarioId,
      emailIntentado: null,
      resultado,
      ip: origen.ip ?? null,
      userAgent: origen.userAgent ?? null,
      gimnasioId,
    });
  }
}
