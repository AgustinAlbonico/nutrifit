import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { TurnoOrmEntity } from './turno.entity';

@Entity('gimnasio')
export class GimnasioOrmEntity {
  @PrimaryGeneratedColumn({ name: 'id_gimnasio' })
  idGimnasio: number;

  @Column({ name: 'nombre', type: 'varchar', length: 100 })
  nombre: string;

  @Column({ name: 'direccion', type: 'varchar', length: 255 })
  direccion: string;

  @Column({ name: 'telefono', type: 'varchar', length: 15 })
  telefono: string;

  @Column({ name: 'ciudad', type: 'varchar', length: 100 })
  ciudad: string;

  // Branding
  @Column({ name: 'logo_url', type: 'varchar', length: 500, nullable: true })
  logoUrl: string | null;

  @Column({
    name: 'color_primario',
    type: 'varchar',
    length: 7,
    nullable: true,
  })
  colorPrimario: string | null;

  @Column({
    name: 'color_secundario',
    type: 'varchar',
    length: 7,
    nullable: true,
  })
  colorSecundario: string | null;

  // Políticas operativas
  @Column({ name: 'plazo_cancelacion_horas', type: 'int', default: 24 })
  plazoCancelacionHoras: number;

  @Column({ name: 'plazo_reprogramacion_horas', type: 'int', default: 12 })
  plazoReprogramacionHoras: number;

  @Column({ name: 'antelacion_minima_reserva_horas', type: 'int', default: 2 })
  antelacionMinimaReservaHoras: number;

  @Column({ name: 'umbral_ausente_minutos', type: 'int', default: 15 })
  umbralAusenteMinutos: number;

  // Notificaciones
  @Column({
    name: 'email_notificaciones',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  emailNotificaciones: string | null;

  @Column({ name: 'email_habilitado', type: 'boolean', default: false })
  emailHabilitado: boolean;

  @OneToMany(() => TurnoOrmEntity, (turno) => turno.gimnasio)
  turnos: TurnoOrmEntity[];
}
