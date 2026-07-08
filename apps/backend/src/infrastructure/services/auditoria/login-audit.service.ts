import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
  LoginAuditOrmEntity,
  ResultadoLoginAudit,
} from 'src/infrastructure/persistence/typeorm/entities/login-audit.entity';

export const LOGIN_AUDIT_SERVICE = Symbol('LOGIN_AUDIT_SERVICE');

export interface RegistrarLoginAuditDto {
  usuarioId?: number | null;
  emailIntentado?: string | null;
  resultado: ResultadoLoginAudit;
  ip?: string | null;
  userAgent?: string | null;
  gimnasioId?: number | null;
}

@Injectable()
export class LoginAuditService {
  private readonly logger = new Logger(LoginAuditService.name);

  constructor(
    @InjectRepository(LoginAuditOrmEntity)
    private readonly loginAuditRepository: Repository<LoginAuditOrmEntity>,
  ) {}

  async registrar(dto: RegistrarLoginAuditDto): Promise<void> {
    void this.persistir(dto).catch((error: unknown) => {
      const mensaje = error instanceof Error ? error.message : String(error);
      this.logger.warn(`No se pudo registrar auditoria de login: ${mensaje}`);
    });
  }

  private async persistir(dto: RegistrarLoginAuditDto): Promise<void> {
    const registro = this.loginAuditRepository.create({
      usuarioId: dto.usuarioId ?? null,
      emailIntentado: dto.emailIntentado ?? null,
      resultado: dto.resultado,
      ip: dto.ip ?? null,
      userAgent: dto.userAgent ?? null,
      gimnasioId: dto.gimnasioId ?? null,
    });

    await this.loginAuditRepository.save(registro);
  }
}
