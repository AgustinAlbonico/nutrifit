import { SetMetadata } from '@nestjs/common';
import type {
  AccionAuditoria,
  TipoAccionAuditoria,
} from 'src/infrastructure/persistence/typeorm/entities/auditoria.entity';

export const AUDITORIA_METADATA_KEY = 'auditoria:metadata';

export interface AuditOptions {
  modulo: string;
  accion: AccionAuditoria | string;
  descripcion: string;
  entidad?: string;
  entidadIdParam?: string;
  tipoAccion?: TipoAccionAuditoria | string;
  camposSensibles?: string[];
}

export const Audit = (options: AuditOptions) =>
  SetMetadata(AUDITORIA_METADATA_KEY, options);
