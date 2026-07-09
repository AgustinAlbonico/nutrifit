import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('pago_simulado')
export class PagoSimuladoOrmEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'suscripcion_gimnasio_id', type: 'int' })
  suscripcionGimnasioId: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  monto: number;

  @Column({ type: 'varchar', length: 20 })
  estado: string;

  @Column({ type: 'text', nullable: true })
  motivo: string | null;

  @CreateDateColumn({ name: 'creado_en' })
  creadoEn: Date;
}
