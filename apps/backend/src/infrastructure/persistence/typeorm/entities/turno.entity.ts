import { EstadoTurno } from 'src/domain/entities/Turno/EstadoTurno';
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
import {
  EntrenadorOrmEntity,
  NutricionistaOrmEntity,
  SocioOrmEntity,
} from './persona.entity';
import { AdjuntoClinicoOrmEntity } from './adjunto-clinico.entity';

@Entity('turno')
export class TurnoOrmEntity {
  @PrimaryGeneratedColumn({ name: 'id_turno' })
  idTurno: number;

  @Column({ name: 'fecha', type: 'date' })
  fechaTurno: Date;

  @Column({ name: 'hora_turno', type: 'varchar', length: 10 })
  horaTurno: string;

  @Column({ name: 'estado', type: 'enum', enum: EstadoTurno })
  estadoTurno: EstadoTurno;

  @Column({ name: 'check_in_at', type: 'datetime', nullable: true })
  checkInAt: Date | null;

  @Column({ name: 'consulta_iniciada_at', type: 'datetime', nullable: true })
  consultaIniciadaAt: Date | null;

  @Column({ name: 'consulta_finalizada_at', type: 'datetime', nullable: true })
  consultaFinalizadaAt: Date | null;

  @Column({ name: 'ausente_at', type: 'datetime', nullable: true })
  ausenteAt: Date | null;

  @Column({
    name: 'motivo_cancelacion',
    type: 'varchar',
    length: 500,
    nullable: true,
  })
  motivoCancelacion: string | null;

  @Column({ name: 'fecha_original', type: 'datetime', nullable: true })
  fechaOriginal: Date | null;

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

  @ManyToOne(() => EntrenadorOrmEntity, (entrenador) => entrenador.turnos, {
    nullable: true,
  })
  @JoinColumn({ name: 'id_entrenador' })
  entrenador?: EntrenadorOrmEntity;

  @ManyToOne(() => GimnasioOrmEntity, (gimnasio) => gimnasio.turnos, {
    nullable: true,
  })
  @JoinColumn({ name: 'id_gimnasio' })
  gimnasio: GimnasioOrmEntity;
}
