import { DiaSemana } from 'src/domain/entities/Agenda/dia-semana';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { NutricionistaOrmEntity } from './persona.entity';
import { AuditableOrmEntity } from '../common/auditable.orm-entity';

@Entity('agenda')
@Unique('UQ_AGENDA_NUTRI_DIA_HORARIO', ['nutricionista', 'dia', 'horaInicio', 'horaFin'])
export class AgendaOrmEntity extends AuditableOrmEntity {
  @PrimaryGeneratedColumn({ name: 'id_agenda' })
  idAgenda: number;

  @Column({ name: 'dia', type: 'enum', enum: DiaSemana })
  dia: DiaSemana;

  @Column({ type: 'time', name: 'hora_inicio' })
  horaInicio: string;

  @Column({ type: 'time', name: 'hora_fin' })
  horaFin: string;

  @Column({ type: 'int', name: 'duracion_turno' })
  duracionTurno: number;

  @ManyToOne(
    () => NutricionistaOrmEntity,
    (nutricionista) => nutricionista.agenda,
    {
      nullable: false,
    },
  )
  @JoinColumn({ name: 'id_nutricionista' })
  nutricionista: NutricionistaOrmEntity;
}
