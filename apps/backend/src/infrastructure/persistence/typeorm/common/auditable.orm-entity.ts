import { DeleteDateColumn } from 'typeorm';

export abstract class AuditableOrmEntity {
  @DeleteDateColumn({ name: 'fecha_baja', nullable: true })
  fechaBaja: Date | null;
}
