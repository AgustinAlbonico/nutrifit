import { Injectable } from '@nestjs/common';
import { EntityManager, Repository } from 'typeorm';
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
    return new SocioEntity(
      socioCreado.idPersona,
      socioCreado.nombre,
      socioCreado.apellido,
      socioCreado.fechaNacimiento,
      socioCreado.telefono,
      socioCreado.genero,
      socioCreado.direccion,
      socioCreado.ciudad,
      socioCreado.provincia,
      socioCreado.dni ?? '',
      [],
      null,
      [],
    );
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
    } as Partial<SocioOrmEntity>);
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
    // Baja lógica - actualizar fechaBaja
    await this.socioRepository.update(id, {
      fechaBaja: new Date(),
    } as Partial<SocioOrmEntity>);
  }

  async reactivar(id: number): Promise<void> {
    // Reactivar - limpiar fechaBaja
    await this.socioRepository.update(id, {
      fechaBaja: null,
    } as Partial<SocioOrmEntity>);
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

  private toOrmEntity(socio: SocioEntity) {
    const socioOrmEntity = new SocioOrmEntity();
    socioOrmEntity.idPersona = socio.idPersona;
    socioOrmEntity.nombre = socio.nombre;
    socioOrmEntity.apellido = socio.apellido;
    socioOrmEntity.fechaNacimiento = socio.fechaNacimiento;
    socioOrmEntity.genero = socio.genero;
    socioOrmEntity.ciudad = socio.ciudad;
    socioOrmEntity.provincia = socio.provincia;
    socioOrmEntity.telefono = socio.telefono;
    socioOrmEntity.direccion = socio.direccion;
    socioOrmEntity.dni = socio.dni;
    socioOrmEntity.fotoPerfilKey = socio.fotoPerfilKey;
    socioOrmEntity.fechaAlta = new Date();
    socioOrmEntity.fichaSalud = null;
    socioOrmEntity.planesAlimentacion = [];
    socioOrmEntity.turnos = [];
    return socioOrmEntity;
  }

  private toEntity(socio: SocioOrmEntity): SocioEntity {
    const entity = new SocioEntity(
      socio.idPersona,
      socio.nombre,
      socio.apellido,
      socio.fechaNacimiento,
      socio.telefono,
      socio.genero,
      socio.direccion,
      socio.ciudad,
      socio.provincia,
      socio.dni ?? '',
      [],
      socio.fichaSalud as any,
      [],
    );
    // Asignar fechaBaja si existe
    if (socio.fechaBaja) {
      (entity as any).fechaBaja = socio.fechaBaja;
    }
    // Asignar email del usuario asociado
    if (socio.usuario?.email) {
      (entity as any).email = socio.usuario.email;
    }
    // Asignar fotoPerfilKey
    if (socio.fotoPerfilKey) {
      (entity as any).fotoPerfilKey = socio.fotoPerfilKey;
    }
    return entity;
  }
}
