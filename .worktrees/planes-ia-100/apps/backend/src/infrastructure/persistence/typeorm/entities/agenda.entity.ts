import { DiaSemana } from 'src/domain/entities/Agenda/dia-semana';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { NutricionistaOrmEntity } from './persona.entity';

@Entity('agenda')
export class AgendaOrmEntity {
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
