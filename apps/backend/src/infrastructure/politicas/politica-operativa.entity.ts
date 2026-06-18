import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { GimnasioOrmEntity } from '../persistence/typeorm/entities/gimnasio.entity';

@Entity('politica_operativa')
export class PoliticaOperativaOrmEntity {
  @PrimaryGeneratedColumn({ name: 'id_politica' })
  id: number;

  @Column({ name: 'id_gimnasio' })
  gimnasioId: number;

  @Column({ name: 'plazo_cancelacion_horas', type: 'int' })
  plazoCancelacionHoras: number;

  @Column({ name: 'plazo_reprogramacion_horas', type: 'int' })
  plazoReprogramacionHoras: number;

  @Column({ name: 'umbral_ausente_minutos', type: 'int' })
  umbralAusenteMinutos: number;

  @Column({
    name: 'umbral_cierre_consulta_min',
    type: 'int',
    nullable: true,
  })
  umbralCierreConsultaMin: number | null;

  @Column({
    name: 'preaviso_cierre_consulta_min',
    type: 'int',
    nullable: true,
  })
  preavisoCierreConsultaMin: number | null;

  @ManyToOne(() => GimnasioOrmEntity, (gimnasio) => gimnasio.turnos)
  gimnasio: GimnasioOrmEntity;
}
