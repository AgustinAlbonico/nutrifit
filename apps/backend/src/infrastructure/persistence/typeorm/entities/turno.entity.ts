import { EstadoTurno } from 'src/domain/entities/Turno/EstadoTurno';
import { CreadoPor } from 'src/domain/entities/Turno/creado-por.enum';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { GimnasioOrmEntity } from './gimnasio.entity';
import { ObservacionClinicaOrmEntity } from './observacion-clinica.entity';
import { MedicionOrmEntity } from './medicion.entity';
import { NutricionistaOrmEntity, SocioOrmEntity } from './persona.entity';
import { AdjuntoClinicoOrmEntity } from './adjunto-clinico.entity';
import { AuditableOrmEntity } from '../common/auditable.orm-entity';

@Entity('turno')
export class TurnoOrmEntity extends AuditableOrmEntity {
  @PrimaryGeneratedColumn({ name: 'id_turno' })
  idTurno: number;

  @Column({ name: 'fecha', type: 'date' })
  fechaTurno: Date;

  @Column({ name: 'hora_turno', type: 'varchar', length: 10 })
  horaTurno: string;

  @Column({ name: 'estado', type: 'enum', enum: EstadoTurno })
  estadoTurno: EstadoTurno;

  @Column({
    name: 'creado_por',
    type: 'varchar',
    length: 20,
    default: 'SOCIO',
  })
  creadoPor: CreadoPor;

  @Column({ name: 'check_in_at', type: 'datetime', nullable: true })
  checkInAt: Date | null;

  @Column({ name: 'consulta_iniciada_at', type: 'datetime', nullable: true })
  consultaIniciadaAt: Date | null;

  @Column({ name: 'consulta_finalizada_at', type: 'datetime', nullable: true })
  consultaFinalizadaAt: Date | null;

  @Column({ name: 'cierre_automatico', type: 'boolean', default: false })
  cierreAutomatico: boolean;

  @Column({
    name: 'motivo_cierre_automatico',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  motivoCierreAutomatico: string | null;

  @Column({
    name: 'cierre_automatico_en',
    type: 'datetime',
    nullable: true,
  })
  cierreAutomaticoEn: Date | null;

  @Column({
    name: 'preaviso_cierre_auto_enviado_en',
    type: 'datetime',
    nullable: true,
  })
  preavisoCierreAutoEnviadoEn: Date | null;

  @Column({
    name: 'reabierta_por_cierre_auto',
    type: 'boolean',
    default: false,
  })
  reabiertaPorCierreAuto: boolean;

  @Column({ name: 'ausente_at', type: 'datetime', nullable: true })
  ausenteAt: Date | null;

  @Column({
    name: 'ausente_motivo',
    type: 'varchar',
    length: 500,
    nullable: true,
  })
  ausenteMotivo: string | null;

  @Column({
    name: 'motivo_cancelacion',
    type: 'varchar',
    length: 500,
    nullable: true,
  })
  motivoCancelacion: string | null;

  @Column({ name: 'fecha_original', type: 'datetime', nullable: true })
  fechaOriginal: Date | null;

  @Column({ name: 'llegada_tarde_min', type: 'int', nullable: true })
  llegadaTardeMin: number | null;

  @Column({
    name: 'token_confirmacion',
    type: 'varchar',
    length: 255,
    nullable: true,
    unique: true,
  })
  tokenConfirmacion: string | null;

  @OneToOne(
    () => ObservacionClinicaOrmEntity,
    (observacion) => observacion.turno,
    {
      eager: true,
      nullable: true,
    },
  )
  @JoinColumn({ name: 'id_observacion' })
  observacionClinica?: ObservacionClinicaOrmEntity;

  @OneToMany(() => MedicionOrmEntity, (medicion) => medicion.turno)
  mediciones: MedicionOrmEntity[];

  @OneToMany(() => AdjuntoClinicoOrmEntity, (adjunto) => adjunto.turno)
  adjuntos: AdjuntoClinicoOrmEntity[];

  @ManyToOne(() => SocioOrmEntity, (socio) => socio.turnos, {
    nullable: true,
  })
  @JoinColumn({ name: 'id_socio' })
  socio: SocioOrmEntity;

  @ManyToOne(
    () => NutricionistaOrmEntity,
    (nutricionista) => nutricionista.turnos,
    {
      nullable: false,
    },
  )
  @JoinColumn({ name: 'id_nutricionista' })
  nutricionista: NutricionistaOrmEntity;

  @ManyToOne(() => GimnasioOrmEntity, (gimnasio) => gimnasio.turnos, {
    nullable: true,
  })
  @JoinColumn({ name: 'id_gimnasio' })
  gimnasio: GimnasioOrmEntity;
}
