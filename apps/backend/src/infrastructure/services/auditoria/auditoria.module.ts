import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditoriaOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/auditoria.entity';
import { AuditoriaService } from './auditoria.service';
import { TenantContextService } from 'src/infrastructure/auth/tenant-context.service';

@Module({
  imports: [TypeOrmModule.forFeature([AuditoriaOrmEntity])],
  providers: [AuditoriaService, TenantContextService],
  exports: [AuditoriaService],
})
export class AuditoriaModule {}
