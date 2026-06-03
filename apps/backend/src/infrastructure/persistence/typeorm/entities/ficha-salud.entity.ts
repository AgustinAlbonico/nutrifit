import { NivelActividadFisica } from 'src/domain/entities/FichaSalud/NivelActividadFisica';
import { FrecuenciaComidas } from 'src/domain/entities/FichaSalud/FrecuenciaComidas';
import { ConsumoAlcohol } from 'src/domain/entities/FichaSalud/ConsumoAlcohol';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { PatologiaEntity } from 'src/domain/entities/FichaSalud/patologia.entity';
import { AlergiaEntity } from 'src/domain/entities/FichaSalud/alergia.entity';
import { SocioOrmEntity } from './persona.entity';
import { SocioEntity } from 'src/domain/entities/Persona/Socio/socio.entity';
import { AuditableOrmEntity } from '../common/auditable.orm-entity';
import { FichaSaludVersionOrmEntity } from './ficha-salud-version.entity';

@Entity('ficha_salud')
@Index('idx_fs_completada', ['completada'])
export class FichaSaludOrmEntity extends AuditableOrmEntity {
  @PrimaryGeneratedColumn({ name: 'id_ficha_salud' })
  idFichaSalud: number;

  @Column({ name: 'altura', type: 'int' })
  altura: number;

  @Column({ name: 'peso', type: 'decimal', precision: 5, scale: 2 })
  peso: number;

  @Column({
    name: 'fecha_creacion',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  fechaCreacion: Date;

  @Column({
    name: 'objetivo_personal',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  objetivoPersonal: string | null;

  @Column({
    name: 'nivel_actividad_fisica',
    type: 'enum',
    enum: NivelActividadFisica,
  })
  nivelActividadFisica: NivelActividadFisica;

  // --- Medicación y suplementos ---
  @Column({
    name: 'medicacion_actual',
    type: 'text',
    nullable: true,
  })
  medicacionActual: string | null;

  @Column({
    name: 'suplementos_actuales',
    type: 'text',
    nullable: true,
  })
  suplementosActuales: string | null;

  // --- Historial médico ---
  @Column({
    name: 'cirugias_previas',
    type: 'text',
    nullable: true,
  })
  cirugiasPrevias: string | null;

  @Column({
    name: 'antecedentes_familiares',
    type: 'text',
    nullable: true,
  })
  antecedentesFamiliares: string | null;

  // --- Hábitos alimentarios ---
  @Column({
    name: 'frecuencia_comidas',
    type: 'enum',
    enum: FrecuenciaComidas,
    nullable: true,
  })
  frecuenciaComidas: FrecuenciaComidas | null;

  @Column({
    name: 'consumo_agua_diario',
    type: 'decimal',
    precision: 4,
    scale: 1,
    nullable: true,
  })
  consumoAguaDiario: number | null;

  @Column({
    name: 'restricciones_alimentarias',
    type: 'text',
    nullable: true,
  })
  restriccionesAlimentarias: string | null;

  // --- Hábitos de vida ---
  @Column({
    name: 'consumo_alcohol',
    type: 'enum',
    enum: ConsumoAlcohol,
    nullable: true,
  })
  consumoAlcohol: ConsumoAlcohol | null;

  @Column({
    name: 'fuma_tabaco',
    type: 'boolean',
    default: false,
  })
  fumaTabaco: boolean;

  @Column({
    name: 'horas_sueno',
    type: 'int',
    nullable: true,
  })
  horasSueno: number | null;

  // --- Contacto de emergencia ---
  @Column({
    name: 'contacto_emergencia_nombre',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  contactoEmergenciaNombre: string | null;

  @Column({
    name: 'contacto_emergencia_telefono',
    type: 'varchar',
    length: 20,
    nullable: true,
  })
  contactoEmergenciaTelefono: string | null;

  // --- Versionado y estado (RB14, RB44, RB50) ---
  @Column({
    name: 'completada',
    type: 'boolean',
    default: false,
  })
  completada: boolean;

  @Column({
    name: 'completada_at',
    type: 'datetime',
    nullable: true,
  })
  completadaAt: Date | null;

  @Column({
    name: 'actualizada_at',
    type: 'datetime',
    nullable: true,
  })
  actualizadaAt: Date | null;

  @Column({
    name: 'consent_at',
    type: 'datetime',
    nullable: true,
  })
  consentAt: Date | null;

  @Column({
    name: 'version_actual_id',
    type: 'int',
    nullable: true,
  })
  versionActualId: number | null;

  @ManyToOne(() => FichaSaludVersionOrmEntity, {
    nullable: true,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'version_actual_id' })
  versionActual?: FichaSaludVersionOrmEntity | null;

  @Column({
    name: 'revisada_por_nutricionista_at',
    type: 'datetime',
    nullable: true,
  })
  revisadaPorNutricionistaAt: Date | null;

  @OneToOne(() => SocioOrmEntity, (socio) => socio.fichaSalud)
  socio: SocioEntity;

  @ManyToMany(() => PatologiaOrmEntity, {
    eager: true,
    nullable: true,
  })
  @JoinTable({
    name: 'ficha_salud_patologias',
    joinColumn: {
      name: 'id_ficha_salud',
      referencedColumnName: 'idFichaSalud',
    },
    inverseJoinColumn: {
      name: 'id_patologia',
      referencedColumnName: 'idPatologia',
    },
  })
  patologias: PatologiaEntity[];

  @ManyToMany(() => AlergiaOrmEntity, {
    eager: true,
    nullable: true,
  })
  @JoinTable({
    name: 'ficha_salud_alergias',
    joinColumn: {
      name: 'id_ficha_salud',
      referencedColumnName: 'idFichaSalud',
    },
    inverseJoinColumn: {
      name: 'id_alergia',
      referencedColumnName: 'idAlergia',
    },
  })
  alergias: AlergiaEntity[];
}

@Entity('patologia')
export class PatologiaOrmEntity extends AuditableOrmEntity {
  @PrimaryGeneratedColumn({ name: 'id_patologia' })
  idPatologia: number;

  @Column({ name: 'nombre', type: 'varchar', length: 100 })
  nombre: string;
}

@Entity('alergia')
export class AlergiaOrmEntity extends AuditableOrmEntity {
  @PrimaryGeneratedColumn({ name: 'id_alergia' })
  idAlergia: number;

  @Column({ name: 'nombre', type: 'varchar', length: 100 })
  nombre: string;
}
