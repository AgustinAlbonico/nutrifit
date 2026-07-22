import { Injectable, Inject, Optional } from '@nestjs/common';
import { QueryFailedError, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CertificacionOrmEntity } from '../entities/certificacion.entity';
import { CertificacionEntity } from 'src/domain/entities/Certificacion/certificacion.entity';
import { DiplomaOrmEntity } from '../entities/diploma.entity';
import { DiplomaEntity } from 'src/domain/entities/Diploma/diploma.entity';
import { NivelFormacion } from 'src/domain/entities/Certificacion/nivel-formacion';
import { FormacionAcademicaEntity } from 'src/domain/entities/FormacionAcademica/formacion-academica.entity';
import { FormacionAcademicaOrmEntity } from '../entities/formacion-academica.entity';
import { NutricionistaOrmEntity } from '../entities/persona.entity';
import { NutricionistaEntity } from 'src/domain/entities/Persona/Nutricionista/nutricionista.entity';
import { NutricionistaRepository } from 'src/domain/entities/Persona/Nutricionista/nutricionista.repository';
import { ConflictError } from 'src/domain/exceptions/custom-exceptions';
import { TenantContextService } from 'src/infrastructure/auth/tenant-context.service';

function esErrorDuplicateEntry(error: unknown): boolean {
  if (!(error instanceof QueryFailedError)) return false;
  const codigo = (error as { code?: string }).code;
  return codigo === 'ER_DUP_ENTRY';
}

function obtenerGimnasioIdActual(
  tenantContext: TenantContextService | undefined,
): number {
  if (!tenantContext) {
    throw new Error(
      'Tenant context no disponible — no se pudo resolver TenantContextService en el repositorio.',
    );
  }
  if (!tenantContext.isInitialized) {
    throw new Error(
      'Tenant context not initialized — cannot perform tenant-scoped operation',
    );
  }
  return tenantContext.gimnasioId;
}

@Injectable()
export class NutricionistaRepositoryImplementation implements NutricionistaRepository {
  constructor(
    @InjectRepository(NutricionistaOrmEntity)
    private readonly nutricionistaRepository: Repository<NutricionistaOrmEntity>,
    @Inject(TenantContextService)
    @Optional()
    private readonly tenantContext?: TenantContextService,
  ) {}

  private get gimnasioIdActual(): number {
    return obtenerGimnasioIdActual(this.tenantContext);
  }

  async save(entity: NutricionistaEntity): Promise<NutricionistaEntity> {
    const gimnasioId = entity.gimnasioId ?? this.gimnasioIdActual;
    let idNutricionistaCreado: number;
    try {
      idNutricionistaCreado =
        await this.nutricionistaRepository.manager.transaction(async (tx) => {
          const nutricionistaCreado = await tx.save(
            NutricionistaOrmEntity,
            this.toOrmEntity(entity, gimnasioId),
          );
          if (nutricionistaCreado.idPersona == null) {
            throw new Error('Nutricionista creado sin idPersona');
          }

          await this.reemplazarTrayectoriaProfesional(
            tx,
            nutricionistaCreado.idPersona,
            entity,
          );
          return nutricionistaCreado.idPersona;
        });
    } catch (error) {
      if (esErrorDuplicateEntry(error)) {
        throw new ConflictError(
          'Ya existe un profesional con esa matrícula, DNI o email.',
        );
      }
      throw error;
    }

    const nutricionistaCreado = await this.findById(idNutricionistaCreado);
    if (!nutricionistaCreado) {
      throw new Error(
        `Nutricionista with id ${idNutricionistaCreado} not found after save`,
      );
    }

    return nutricionistaCreado;
  }

  async update(
    id: number,
    entity: NutricionistaEntity,
  ): Promise<NutricionistaEntity> {
    const gimnasioId = this.gimnasioIdActual;
    const existe = await this.nutricionistaRepository.count({
      where: { idPersona: id, gimnasioId },
    });

    if (existe === 0) {
      throw new Error(`Nutricionista with id ${id} not found in this gym`);
    }

    try {
      await this.nutricionistaRepository.manager.transaction(async (tx) => {
        await tx.update(
          NutricionistaOrmEntity,
          { idPersona: id, gimnasioId },
          {
            nombre: entity.nombre,
            apellido: entity.apellido,
            fechaNacimiento: entity.fechaNacimiento,
            genero: entity.genero,
            ciudad: entity.ciudad,
            provincia: entity.provincia,
            telefono: entity.telefono,
            direccion: entity.direccion,
            dni: entity.dni,
            fotoPerfilKey: entity.fotoPerfilKey,
            matricula: entity.matricula,
            tarifaSesion: entity.tarifaSesion,
            aniosExperiencia: entity.aniosExperiencia,
            duracionTurnoMin: entity.duracionTurnoMin,
            matriculaDocumentoKey: entity.matriculaDocumentoKey,
            fechaBaja: entity.fechaBaja,
            presentacion: entity.presentacion,
            preferenciasIa: entity.preferenciasIa,
          },
        );

        await this.reemplazarTrayectoriaProfesional(tx, id, entity);
      });
    } catch (error) {
      if (esErrorDuplicateEntry(error)) {
        throw new ConflictError(
          'Ya existe un profesional con esa matrícula o DNI.',
        );
      }
      throw error;
    }

    const updated = await this.findById(id);
    if (!updated) {
      throw new Error(`Nutricionista with id ${id} not found after update`);
    }

    return updated;
  }

  private async reemplazarTrayectoriaProfesional(
    tx: Repository<NutricionistaOrmEntity>['manager'],
    idNutricionista: number,
    entity: NutricionistaEntity,
  ): Promise<void> {
    await tx.query(
      'DELETE FROM formacion_academica WHERE id_nutricionista = ?',
      [idNutricionista],
    );
    await tx.query('DELETE FROM certificacion WHERE id_nutricionista = ?', [
      idNutricionista,
    ]);

    for (const formacion of entity.formacionAcademica) {
      await tx.query(
        `INSERT INTO formacion_academica
          (id_nutricionista, titulo, institucion, anio_inicio, anio_fin, nivel, fecha_baja)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          idNutricionista,
          formacion.titulo,
          formacion.institucion,
          formacion.añoComienzo,
          formacion.añoFin ?? null,
          formacion.nivel,
          formacion.fechaBaja ?? null,
        ],
      );
    }

    for (const certificacion of entity.certificaciones) {
      await tx.query(
        `INSERT INTO certificacion
          (id_nutricionista, nombre, entidad, anio, carga_horaria, nivel, fecha_baja)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          idNutricionista,
          certificacion.nombre,
          certificacion.entidad,
          certificacion.anio ?? null,
          certificacion.cargaHoraria ?? null,
          certificacion.nivel,
          certificacion.fechaBaja ?? null,
        ],
      );
    }
  }

  async delete(id: number): Promise<void> {
    const gimnasioId = this.gimnasioIdActual;
    const resultado = await this.nutricionistaRepository.delete({
      idPersona: id,
      gimnasioId,
    });
    if (resultado.affected === 0) {
      throw new Error(`Nutricionista with id ${id} not found in this gym`);
    }
  }

  async findAll(): Promise<NutricionistaEntity[]> {
    const gimnasioId = this.gimnasioIdActual;
    const nutricionistas = await this.nutricionistaRepository.find({
      where: { gimnasioId },
      withDeleted: true,
      relations: {
        usuario: true,
        agenda: true,
        formacionAcademica: true,
        certificaciones: true,
        diplomas: true,
        turnos: true,
      },
    });
    return nutricionistas.map((nut) => this.toDomainEntity(nut));
  }

  async findById(id: number): Promise<NutricionistaEntity | null> {
    const whereClause: any = { idPersona: id };

    if (this.tenantContext?.isInitialized) {
      whereClause.gimnasioId = this.gimnasioIdActual;
    }

    const nutricionista = await this.nutricionistaRepository.findOne({
      where: whereClause,
      withDeleted: true,
      relations: {
        usuario: true,
        agenda: true,
        formacionAcademica: true,
        certificaciones: true,
        diplomas: true,
        turnos: true,
      },
    });
    if (!nutricionista) return null;
    return this.toDomainEntity(nutricionista);
  }

  async findByEmail(email: string): Promise<NutricionistaEntity | null> {
    // Note: Email is not directly stored in NutricionistaOrmEntity
    // It's typically found through the usuario relationship
    // This is a placeholder that should be implemented based on your actual requirements
    return null;
  }

  async findByDni(dni: string): Promise<NutricionistaEntity | null> {
    const nutricionista = await this.nutricionistaRepository.findOne({
      where: { dni },
      relations: {
        usuario: true,
        agenda: true,
        formacionAcademica: true,
        certificaciones: true,
        diplomas: true,
        turnos: true,
      },
    });
    if (!nutricionista) return null;
    return this.toDomainEntity(nutricionista);
  }

  async findByMatricula(
    matricula: string,
  ): Promise<NutricionistaEntity | null> {
    const nutricionista = await this.nutricionistaRepository.findOne({
      where: { matricula },
      relations: {
        usuario: true,
        agenda: true,
        formacionAcademica: true,
        certificaciones: true,
        diplomas: true,
        turnos: true,
      },
    });
    if (!nutricionista) return null;
    return this.toDomainEntity(nutricionista);
  }

  private toOrmEntity(
    nutricionista: NutricionistaEntity,
    gimnasioId: number,
  ): Partial<NutricionistaOrmEntity> {
    return {
      idPersona: nutricionista.idPersona ?? null,
      nombre: nutricionista.nombre,
      apellido: nutricionista.apellido,
      fechaNacimiento: nutricionista.fechaNacimiento,
      genero: nutricionista.genero,
      ciudad: nutricionista.ciudad,
      provincia: nutricionista.provincia,
      telefono: nutricionista.telefono,
      direccion: nutricionista.direccion,
      dni: nutricionista.dni,
      fotoPerfilKey: nutricionista.fotoPerfilKey,
      matricula: nutricionista.matricula,
      tarifaSesion: nutricionista.tarifaSesion,
      aniosExperiencia: nutricionista.aniosExperiencia,
      duracionTurnoMin: nutricionista.duracionTurnoMin,
      matriculaDocumentoKey: nutricionista.matriculaDocumentoKey,
      turnos: nutricionista.turnos || [],
      fechaBaja: nutricionista.fechaBaja,
      gimnasioId,
      presentacion: nutricionista.presentacion,
      preferenciasIa: nutricionista.preferenciasIa,
    };
  }

  private toDomainEntity(orm: NutricionistaOrmEntity): NutricionistaEntity {
    if (orm.gimnasioId == null) {
      throw new Error(
        `Nutricionista ${orm.idPersona} sin gimnasio asociado en base de datos`,
      );
    }

    // Convert ORM entity to domain entity using constructor
    const entity = new NutricionistaEntity(
      orm.idPersona,
      orm.nombre,
      orm.apellido,
      orm.fechaNacimiento,
      orm.telefono,
      orm.genero,
      orm.direccion,
      orm.ciudad,
      orm.provincia,
      orm.dni ?? '',
      orm.aniosExperiencia,
      orm.tarifaSesion,
      orm.agenda || [],
      [],
      [],
      [],
      [],
      orm.fechaBaja,
      orm.usuario?.email ?? '',
      orm.presentacion ?? null,
      orm.duracionTurnoMin ?? 30,
      orm.matriculaDocumentoKey ?? null,
      orm.preferenciasIa ?? null,
    );

    // Establecer gimnasioId del ORM (heredado de PersonaOrmEntity como columna directa)
    entity.gimnasioId = orm.gimnasioId;

    if (orm.matricula !== undefined && orm.matricula !== null) {
      entity.matricula = orm.matricula;
    }

    if (orm.fotoPerfilKey) {
      entity.fotoPerfilKey = orm.fotoPerfilKey;
    }

    if (orm.formacionAcademica) {
      entity.formacionAcademica = (
        orm.formacionAcademica as FormacionAcademicaOrmEntity[]
      ).map(
        (f: FormacionAcademicaOrmEntity) =>
          new FormacionAcademicaEntity(
            f.idFormacionAcademica,
            f.titulo,
            f.institucion,
            f.añoInicio,
            f.añoFin,
            f.nivel,
            f.fechaBaja,
          ),
      );
    }

    if (orm.certificaciones) {
      entity.certificaciones = (
        orm.certificaciones as CertificacionOrmEntity[]
      ).map(
        (c: CertificacionOrmEntity) =>
          new CertificacionEntity(
            c.idCertificacion,
            c.nombre,
            c.entidad,
            c.anio,
            c.cargaHoraria,
            (c.nivel as NivelFormacion | null) ?? null,
            c.fechaBaja,
          ),
      );
    }

    if (orm.diplomas) {
      entity.diplomas = orm.diplomas.map(
        (d: DiplomaOrmEntity) =>
          new DiplomaEntity(
            d.idDiploma,
            d.idNutricionista,
            d.documentKey,
            d.nombreOriginal,
            d.mimeType,
            d.creadoEn,
          ),
      );
    }

    return entity;
  }
}
