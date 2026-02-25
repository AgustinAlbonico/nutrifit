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
import { ObservacionClinicaOrmEntity } from './observacion-clinica.entity';
import { MedicionOrmEntity } from './medicion.entity';
import { NutricionistaOrmEntity, SocioOrmEntity } from './persona.entity';

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
}
