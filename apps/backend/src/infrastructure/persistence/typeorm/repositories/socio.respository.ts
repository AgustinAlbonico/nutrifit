import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { SocioOrmEntity } from '../entities/persona.entity';
import { SocioEntity } from 'src/domain/entities/Persona/Socio/socio.entity';
import { SocioRepository } from 'src/domain/entities/Persona/Socio/socio.repository';

@Injectable()
export class SocioRepositoryImplementation implements SocioRepository {
  constructor(
    @InjectRepository(SocioOrmEntity)
    private readonly socioRepository: Repository<SocioOrmEntity>,
  ) {}

  async save(entity: SocioEntity): Promise<SocioEntity> {
    const socioCreado = await this.socioRepository.save(
      this.toOrmEntity(entity),
    );

    return this.toEntity(socioCreado);
  }

  async update(id: number, entity: SocioEntity): Promise<SocioEntity> {
    // Solo actualizar los campos de datos personales, no las relaciones ni fechaAlta
    await this.socioRepository.update(id, {
      nombre: entity.nombre,
      apellido: entity.apellido,
      fechaNacimiento: entity.fechaNacimiento,
      telefono: entity.telefono,
      genero: entity.genero,
      direccion: entity.direccion,
      ciudad: entity.ciudad,
      provincia: entity.provincia,
      dni: entity.dni,
      fotoPerfilKey: entity.fotoPerfilKey,
    });

    const socioActualizado = await this.socioRepository.findOne({
      where: { idPersona: id },
      relations: ['usuario'],
    });

    if (!socioActualizado) {
      throw new Error(`Socio con id ${id} no encontrado`);
    }

    return this.toEntity(socioActualizado);
  }

  async delete(id: number): Promise<void> {
    // Baja lógica: marcar fechaBaja
    await this.socioRepository.update(id, { fechaBaja: new Date() });
  }

  async reactivar(id: number): Promise<void> {
    // Reactivar: limpiar fechaBaja
    await this.socioRepository.update(id, { fechaBaja: null });
  }

  async findAll(): Promise<SocioEntity[]> {
    const socios = await this.socioRepository.find({
      relations: ['usuario'],
      order: { idPersona: 'ASC' },
    });

    return socios.map((socio) => this.toEntity(socio));
  }

  async findById(id: number): Promise<SocioEntity | null> {
    const socio = await this.socioRepository.findOne({
      where: { idPersona: id },
    });

    return socio ? this.toEntity(socio) : null;
  }

  private toOrmEntity(socio: SocioEntity): SocioOrmEntity {
    const orm = new SocioOrmEntity();
    orm.idPersona = socio.idPersona;
    orm.nombre = socio.nombre;
    orm.apellido = socio.apellido;
    orm.fechaNacimiento = socio.fechaNacimiento;
    orm.genero = socio.genero;
    orm.ciudad = socio.ciudad;
    orm.provincia = socio.provincia;
    orm.telefono = socio.telefono;
    orm.direccion = socio.direccion;
    orm.dni = socio.dni;
    orm.fotoPerfilKey = socio.fotoPerfilKey;
    orm.fechaAlta = new Date();
    orm.fichaSalud = null;
    orm.planesAlimentacion = [];
    orm.turnos = [];
    return orm;
  }

  private toEntity(orm: SocioOrmEntity): SocioEntity {
    const entity = new SocioEntity(
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
      [],
      null,
      [],
    );

    // PersonaEntity expone email, fechaBaja y fotoPerfilKey en sus props.
    if (orm.fechaBaja) {
      entity.fechaBaja = orm.fechaBaja;
    }

    if (orm.usuario?.email) {
      entity.email = orm.usuario.email;
    }

    if (orm.fotoPerfilKey) {
      entity.fotoPerfilKey = orm.fotoPerfilKey;
    }

    return entity;
  }
}
