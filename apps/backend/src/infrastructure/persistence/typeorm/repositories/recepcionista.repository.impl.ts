import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { RecepcionistaOrmEntity } from '../entities/persona.entity';
import { RecepcionistaEntity } from 'src/domain/entities/Persona/Recepcionista/recepcionista.entity';
import { RecepcionistaRepository } from 'src/domain/entities/Persona/Recepcionista/recepcionista.repository';

@Injectable()
export class RecepcionistaRepositoryImplementation implements RecepcionistaRepository {
  constructor(
    @InjectRepository(RecepcionistaOrmEntity)
    private readonly recepcionistaRepository: Repository<RecepcionistaOrmEntity>,
  ) {}

  async save(entity: RecepcionistaEntity): Promise<RecepcionistaEntity> {
    const recepcionistaCreado = await this.recepcionistaRepository.save(
      this.toOrmEntity(entity),
    );
    return this.toDomainEntity(recepcionistaCreado);
  }

  async update(
    id: number,
    entity: RecepcionistaEntity,
  ): Promise<RecepcionistaEntity> {
    const existing = await this.recepcionistaRepository.findOneBy({
      idPersona: id,
    });

    if (!existing) {
      throw new Error(`Recepcionista with id ${id} not found`);
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
    existing.fechaBaja = entity.fechaBaja;

    const updated = await this.recepcionistaRepository.save(existing);

    return this.toDomainEntity(updated);
  }

  async delete(id: number): Promise<void> {
    await this.recepcionistaRepository.softDelete(id);
  }

  async findAll(): Promise<RecepcionistaEntity[]> {
    const recepcionistas = await this.recepcionistaRepository.find({
      relations: {
        usuario: true,
      },
    });
    return recepcionistas.map((rec) => this.toDomainEntity(rec));
  }

  async findById(id: number): Promise<RecepcionistaEntity | null> {
    const recepcionista = await this.recepcionistaRepository.findOne({
      where: { idPersona: id },
      relations: {
        usuario: true,
      },
    });
    if (!recepcionista) return null;
    return this.toDomainEntity(recepcionista);
  }

  async findByDni(dni: string): Promise<RecepcionistaEntity | null> {
    const recepcionista = await this.recepcionistaRepository.findOne({
      where: { dni },
      relations: {
        usuario: true,
      },
    });
    if (!recepcionista) return null;
    return this.toDomainEntity(recepcionista);
  }

  private toOrmEntity(
    recepcionista: RecepcionistaEntity,
  ): Partial<RecepcionistaOrmEntity> {
    return {
      idPersona: recepcionista.idPersona ?? null,
      nombre: recepcionista.nombre,
      apellido: recepcionista.apellido,
      fechaNacimiento: recepcionista.fechaNacimiento,
      genero: recepcionista.genero,
      ciudad: recepcionista.ciudad,
      provincia: recepcionista.provincia,
      telefono: recepcionista.telefono,
      direccion: recepcionista.direccion,
      dni: recepcionista.dni,
      fotoPerfilKey: recepcionista.fotoPerfilKey,
      fechaBaja: recepcionista.fechaBaja,
    };
  }

  private toDomainEntity(orm: RecepcionistaOrmEntity): RecepcionistaEntity {
    const entity = new RecepcionistaEntity(
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
      orm.fechaBaja,
    );

    if (orm.fotoPerfilKey) {
      entity.fotoPerfilKey = orm.fotoPerfilKey;
    }

    return entity;
  }
}
