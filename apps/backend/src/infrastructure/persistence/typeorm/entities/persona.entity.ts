import { Type } from 'class-transformer';
import {
  ChildEntity,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  TableInheritance,
} from 'typeorm';
import { Genero } from 'src/domain/entities/Persona/Genero';
import { AgendaOrmEntity } from './agenda.entity';
import { AgendaEntity } from 'src/domain/entities/Agenda/agenda.entity';
import { FormacionAcademicaOrmEntity } from './formacion-academica.entity';
import { FormacionAcademicaEntity } from 'src/domain/entities/FormacionAcademica/formacion-academica.entity';
import { FichaSaludOrmEntity } from './ficha-salud.entity';
import { FichaSaludEntity } from 'src/domain/entities/FichaSalud/ficha-salud.entity';
import { PlanAlimentacionOrmEntity } from './plan-alimentacion.entity';
import { PlanAlimentacionEntity } from 'src/domain/entities/PlanAlimentacion/plan-alimentacion.entity';
import { UsuarioOrmEntity } from './usuario.entity';
import { TurnoOrmEntity } from './turno.entity';
import { TurnoEntity } from 'src/domain/entities/Turno/turno.entity';
import { GimnasioOrmEntity } from './gimnasio.entity';
import { CertificacionOrmEntity } from './certificacion.entity';
import { CertificacionEntity } from 'src/domain/entities/Certificacion/certificacion.entity';
import { DiplomaOrmEntity } from './diploma.entity';
import { AuditableOrmEntity } from '../common/auditable.orm-entity';

@Entity('persona')
@TableInheritance({ column: { type: 'varchar', name: 'tipo_persona' } })
export abstract class PersonaOrmEntity extends AuditableOrmEntity {
  @PrimaryGeneratedColumn({ name: 'id_persona' })
  idPersona: number | null;

  @Column({ name: 'nombre', type: 'varchar', length: 100 })
  nombre: string;

  @Column({ name: 'apellido', type: 'varchar', length: 100 })
  apellido: string;

  @Column({ name: 'fecha_nacimiento', type: 'date' })
  @Type(() => Date)
  fechaNacimiento: Date;

  @Column({ name: 'genero', type: 'enum', enum: Genero })
  genero: Genero;

  @Column({ name: 'telefono', type: 'varchar', length: 30 })
  telefono: string;

  @Column({ name: 'direccion', type: 'varchar', length: 255 })
  direccion: string;

  @Column({ name: 'ciudad', type: 'varchar', length: 100 })
  ciudad: string;

  @Column({ name: 'provincia', type: 'varchar', length: 100 })
  provincia: string;

  @Column({ name: 'dni', type: 'varchar', length: 20, nullable: true })
  dni: string | null;

  @Column({
    name: 'foto_perfil_key',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  fotoPerfilKey: string | null;

  @Column({ name: 'observaciones', type: 'text', nullable: true })
  observaciones: string | null;

  @Column({ name: 'id_gimnasio', type: 'int', nullable: true })
  gimnasioId: number | null;

  @OneToOne(() => UsuarioOrmEntity, (usuario) => usuario.persona, {
    nullable: true,
  })
  usuario: UsuarioOrmEntity | null;
}

@ChildEntity()
export class SocioOrmEntity extends PersonaOrmEntity {
  @Column({ name: 'fecha_alta', type: 'date' })
  @Type(() => Date)
  fechaAlta: Date;

  @OneToOne(() => FichaSaludOrmEntity, {
    eager: false,
    nullable: true,
    lazy: false,
  })
  @JoinColumn({ name: 'id_ficha_salud' })
  fichaSalud: FichaSaludOrmEntity | FichaSaludEntity | null;

  @OneToMany(() => PlanAlimentacionOrmEntity, (plan) => plan.socio, {
    eager: false,
    lazy: false,
  })
  planesAlimentacion: PlanAlimentacionOrmEntity[] | PlanAlimentacionEntity[];

  @OneToMany(() => TurnoOrmEntity, (turno) => turno.socio, {
    eager: false,
    lazy: false,
  })
  turnos: TurnoOrmEntity[] | TurnoEntity[];
}

@ChildEntity()
export class RecepcionistaOrmEntity extends PersonaOrmEntity {}

@ChildEntity()
export class NutricionistaOrmEntity extends PersonaOrmEntity {
  @Column({ name: 'matricula', type: 'varchar', length: 50, unique: true })
  matricula: string;

  @Column({ name: 'anios_experiencia', type: 'int' })
  aniosExperiencia: number;

  @Column({ name: 'tarifa_sesion', type: 'decimal', precision: 10, scale: 2 })
  tarifaSesion: number;

  @Column({ name: 'presentacion', type: 'text', nullable: true })
  presentacion: string | null;

  @Column({ name: 'duracion_turno_min', type: 'int', default: 30 })
  duracionTurnoMin: number;

  @Column({
    name: 'matricula_documento_key',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  matriculaDocumentoKey: string | null;

  /**
   * Notas persistentes privadas del nutricionista para la IA (max 2000 chars).
   * Se concatenan con `plan_alimentacion.notas_generacion` al construir el
   * prompt de generación de planes. Son preferencias blandas (no restricciones
   * duras del socio) y aplican a TODAS las futuras generaciones del NUT.
   */
  @Column({ name: 'preferencias_ia', type: 'text', nullable: true })
  preferenciasIa: string | null;

  @OneToMany(() => DiplomaOrmEntity, (diploma) => diploma.nutricionista, {
    eager: true,
    nullable: true,
  })
  diplomas: DiplomaOrmEntity[];

  @OneToMany(
    () => CertificacionOrmEntity,
    (certificacion) => certificacion.nutricionista,
    {
      cascade: true,
      eager: true,
      nullable: true,
      orphanedRowAction: 'delete',
    },
  )
  certificaciones: CertificacionOrmEntity[] | CertificacionEntity[];

  @OneToMany(() => AgendaOrmEntity, (agenda) => agenda.nutricionista, {
    eager: false,
    nullable: true,
  })
  agenda?: AgendaOrmEntity[] | AgendaEntity[];

  @OneToMany(
    () => FormacionAcademicaOrmEntity,
    (formacion) => formacion.nutricionista,
    {
      cascade: true,
      eager: true,
      nullable: true,
      orphanedRowAction: 'delete',
    },
  )
  formacionAcademica:
    | FormacionAcademicaOrmEntity[]
    | FormacionAcademicaEntity[];

  @OneToMany(() => PlanAlimentacionOrmEntity, (plan) => plan.nutricionista, {
    eager: true,
    nullable: true,
  })
  planesAlimentacion:
    | PlanAlimentacionOrmEntity[]
    | PlanAlimentacionEntity[]
    | null;

  @OneToMany(() => TurnoOrmEntity, (turno) => turno.nutricionista, {
    eager: true,
    nullable: true,
  })
  turnos: TurnoOrmEntity[] | TurnoEntity[] | null;
}
