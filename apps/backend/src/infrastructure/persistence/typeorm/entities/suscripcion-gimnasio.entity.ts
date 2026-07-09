import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('suscripcion_gimnasio')
export class SuscripcionGimnasioOrmEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'gimnasio_id', type: 'int' })
  gimnasioId: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  monto: number;

  @Column({ type: 'varchar', length: 20, default: 'pendiente' })
  estado: string;

  @Column({ name: 'fecha_inicio', type: 'date', nullable: true })
  fechaInicio: Date | null;

  @Column({ name: 'fecha_proximo_pago', type: 'date', nullable: true })
  fechaProximoPago: Date | null;

  @Column({ type: 'varchar', length: 36, unique: true })
  uuid: string;

  @Column({ name: 'usuario_id_admin', type: 'int', nullable: true })
  usuarioIdAdmin: number | null;

  @CreateDateColumn({ name: 'creado_en' })
  creadoEn: Date;

  @UpdateDateColumn({ name: 'actualizado_en' })
  actualizadoEn: Date;
}
