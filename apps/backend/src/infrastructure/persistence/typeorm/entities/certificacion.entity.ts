import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { NutricionistaOrmEntity } from './persona.entity';
import { NutricionistaEntity } from 'src/domain/entities/Persona/Nutricionista/nutricionista.entity';
import { AuditableOrmEntity } from '../common/auditable.orm-entity';

@Entity('certificacion')
export class CertificacionOrmEntity extends AuditableOrmEntity {
  @PrimaryGeneratedColumn({ name: 'id_certificacion' })
  idCertificacion: number;

  @Column({ name: 'nombre', type: 'varchar', length: 255 })
  nombre: string;

  @Column({ name: 'entidad', type: 'varchar', length: 255 })
  entidad: string;

  @Column({ name: 'anio', type: 'int', nullable: true })
  anio: number | null;

  @Column({ name: 'carga_horaria', type: 'int', nullable: true })
  cargaHoraria: number | null;

  @Column({ name: 'nivel', type: 'varchar', length: 50, nullable: true })
  nivel: string | null;

  @ManyToOne(
    () => NutricionistaOrmEntity,
    (nutricionista) => nutricionista.certificaciones,
    { nullable: false },
  )
  @JoinColumn({ name: 'id_nutricionista' })
  nutricionista: NutricionistaOrmEntity;
}
