import { Injectable, Inject, Optional } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { NutricionistaOrmEntity } from '../entities/persona.entity';
import { NutricionistaEntity } from 'src/domain/entities/Persona/Nutricionista/nutricionista.entity';
import { NutricionistaRepository } from 'src/domain/entities/Persona/Nutricionista/nutricionista.repository';
import { TenantContextService } from 'src/infrastructure/auth/tenant-context.service';

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
    const nutricionistaCreado = await this.nutricionistaRepository.save(
      this.toOrmEntity(entity, gimnasioId),
    );
    return this.toDomainEntity(nutricionistaCreado);
  }

  async update(
    id: number,
    entity: NutricionistaEntity,
  ): Promise<NutricionistaEntity> {
    const gimnasioId = this.gimnasioIdActual;
    const existing = await this.nutricionistaRepository.findOne({
      where: { idPersona: id, gimnasioId },
    });

    if (!existing) {
      throw new Error(`Nutricionista with id ${id} not found in this gym`);
    }

    existing.nombre = entity.nombre;
    existing.apellido = entity.apellido;
    existing.fechaNacimiento = entity.fechaNacimiento;
    existing.genero = entity.genero;
    existing.ciudad = entity.ciudad;
    existing.provincia = entity.provincia;
    existing.telefono = entity.telefono;
    existing.direccion = entity.direccion;
    existing.dni = entity.dni;
    existing.fotoPerfilKey = entity.fotoPerfilKey;
    existing.matricula = entity.matricula;
    existing.tarifaSesion = entity.tarifaSesion;
    existing.añosExperiencia = entity.añosExperiencia;
    existing.fechaBaja = entity.fechaBaja;

    const updated = await this.nutricionistaRepository.save(existing);

    return this.toDomainEntity(updated);
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
      relations: {
        usuario: true,
        agenda: true,
        formacionAcademica: true,
        turnos: true,
      },
    });
    return nutricionistas.map((nut) => this.toDomainEntity(nut));
  }

  async findById(id: number): Promise<NutricionistaEntity | null> {
    const gimnasioId = this.gimnasioIdActual;
    const nutricionista = await this.nutricionistaRepository.findOne({
      where: { idPersona: id, gimnasioId },
      relations: {
        usuario: true,
        agenda: true,
        formacionAcademica: true,
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
    const gimnasioId = this.gimnasioIdActual;
    const nutricionista = await this.nutricionistaRepository.findOne({
      where: { dni, gimnasioId },
      relations: {
        usuario: true,
        agenda: true,
        formacionAcademica: true,
        turnos: true,
      },
    });
    if (!nutricionista) return null;
    return this.toDomainEntity(nutricionista);
  }

  async findByMatricula(
    matricula: string,
  ): Promise<NutricionistaEntity | null> {
    const gimnasioId = this.gimnasioIdActual;
    const nutricionista = await this.nutricionistaRepository.findOne({
      where: { matricula, gimnasioId },
      relations: {
        usuario: true,
        agenda: true,
        formacionAcademica: true,
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
      añosExperiencia: nutricionista.añosExperiencia,
      formacionAcademica: nutricionista.formacionAcademica || [],
      turnos: nutricionista.turnos || [],
      fechaBaja: nutricionista.fechaBaja,
      gimnasioId,
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
      orm.añosExperiencia,
      orm.tarifaSesion,
      orm.agenda || [],
      [],
      [],
      orm.fechaBaja,
      orm.usuario?.email ?? '',
    );

    // Establecer gimnasioId del ORM (heredado de PersonaOrmEntity como columna directa)
    entity.gimnasioId = orm.gimnasioId;

    if (orm.fotoPerfilKey) {
      entity.fotoPerfilKey = orm.fotoPerfilKey;
    }

    return entity;
  }
}
