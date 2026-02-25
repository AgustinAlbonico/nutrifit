import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { NutricionistaOrmEntity } from '../entities/persona.entity';
import { NutricionistaEntity } from 'src/domain/entities/Persona/Nutricionista/nutricionista.entity';
import { NutricionistaRepository } from 'src/domain/entities/Persona/Nutricionista/nutricionista.repository';

@Injectable()
export class NutricionistaRepositoryImplementation implements NutricionistaRepository {
  constructor(
    @InjectRepository(NutricionistaOrmEntity)
    private readonly nutricionistaRepository: Repository<NutricionistaOrmEntity>,
  ) {}

  async save(entity: NutricionistaEntity): Promise<NutricionistaEntity> {
    const nutricionistaCreado = await this.nutricionistaRepository.save(
      this.toOrmEntity(entity),
    );
    return this.toDomainEntity(nutricionistaCreado);
  }

  async update(
    id: number,
    entity: NutricionistaEntity,
  ): Promise<NutricionistaEntity> {
    const existing = await this.nutricionistaRepository.findOneBy({
      idPersona: id,
    });

    if (!existing) {
      throw new Error(`Nutricionista with id ${id} not found`);
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
    await this.nutricionistaRepository.delete(id);
  }

  async findAll(): Promise<NutricionistaEntity[]> {
    const nutricionistas = await this.nutricionistaRepository.find({
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
    const nutricionista = await this.nutricionistaRepository.findOne({
      where: { idPersona: id },
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
    const nutricionista = await this.nutricionistaRepository.findOne({
      where: { dni },
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
    const nutricionista = await this.nutricionistaRepository.findOne({
      where: { matricula },
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
    };
  }

  private toDomainEntity(orm: NutricionistaOrmEntity): NutricionistaEntity {
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
    // Asignar fotoPerfilKey
    if (orm.fotoPerfilKey) {
      (entity as any).fotoPerfilKey = orm.fotoPerfilKey;
    }
    return entity;
  }
}
