import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditoriaOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/auditoria.entity';
import { LoginAuditOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/login-audit.entity';
import { TurnoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/turno.entity';
import { AuditoriaService } from './auditoria.service';
import { AuditoriaSanitizer } from './auditoria-sanitizer.service';
import { LoginAuditService } from './login-audit.service';
import { TenantContextService } from 'src/infrastructure/auth/tenant-context.service';
import { AuditoriaEntityRegistry } from './auditoria-entity.registry';

@Module({
  imports: [TypeOrmModule.forFeature([AuditoriaOrmEntity, LoginAuditOrmEntity, TurnoOrmEntity])],
  providers: [
    AuditoriaService,
    AuditoriaSanitizer,
    LoginAuditService,
    TenantContextService,
    AuditoriaEntityRegistry,
  ],
  exports: [
    AuditoriaService,
    AuditoriaSanitizer,
    LoginAuditService,
    AuditoriaEntityRegistry,
  ],
})
export class AuditoriaModule {}
