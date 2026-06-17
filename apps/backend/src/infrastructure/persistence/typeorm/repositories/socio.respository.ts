import { Injectable, Inject, Optional } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { SocioOrmEntity } from '../entities/persona.entity';
import { SocioEntity } from 'src/domain/entities/Persona/Socio/socio.entity';
import { SocioRepository } from 'src/domain/entities/Persona/Socio/socio.repository';
import { TenantContextService } from 'src/infrastructure/auth/tenant-context.service';

/**
 * Obtiene el gimnasioId actual del tenant context.
 * @throws Error si el contexto no está inicializado (requiere request scope activo)
 */
function obtenerGimnasioIdActual(
  tenantContext: TenantContextService | undefined,
): number {
  if (!tenantContext?.isInitialized) {
    throw new Error(
      'Tenant context not initialized — cannot perform tenant-scoped operation',
    );
  }
  return tenantContext.gimnasioId;
}

@Injectable()
export class SocioRepositoryImplementation implements SocioRepository {
  constructor(
    @InjectRepository(SocioOrmEntity)
    private readonly socioRepository: Repository<SocioOrmEntity>,
    @Inject(TenantContextService)
    @Optional()
    private readonly tenantContext?: TenantContextService,
  ) {}

  private get gimnasioIdActual(): number {
    return obtenerGimnasioIdActual(this.tenantContext);
  }

  async save(entity: SocioEntity): Promise<SocioEntity> {
    const gimnasioId = entity.gimnasioId ?? this.gimnasioIdActual;
    const socioCreado = await this.socioRepository.save(
      this.toOrmEntity(entity, gimnasioId),
    );
    return this.toEntity(socioCreado);
  }

  async update(id: number, entity: SocioEntity): Promise<SocioEntity> {
    // Verificar que el socio pertenece al gimnasio actual antes de actualizar
    const gimnasioId = this.gimnasioIdActual;
    const existente = await this.socioRepository.findOne({
      where: { idPersona: id, gimnasioId },
      relations: ['usuario'],
    });
    if (!existente) {
      throw new Error(`Socio con id ${id} no encontrado en este gimnasio`);
    }

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
      observaciones: entity.observaciones ?? null,
    });

    const socioActualizado = await this.socioRepository.findOne({
      where: { idPersona: id, gimnasioId },
      relations: ['usuario'],
    });

    if (!socioActualizado) {
      throw new Error(`Socio con id ${id} no encontrado`);
    }

    return this.toEntity(socioActualizado);
  }

  async delete(id: number): Promise<void> {
    const gimnasioId = this.gimnasioIdActual;
    const resultado = await this.socioRepository.update(
      { idPersona: id, gimnasioId },
      { fechaBaja: new Date() },
    );
    if (resultado.affected === 0) {
      throw new Error(`Socio con id ${id} no encontrado en este gimnasio`);
    }
  }

  async reactivar(id: number): Promise<void> {
    const gimnasioId = this.gimnasioIdActual;
    const resultado = await this.socioRepository.update(
      { idPersona: id, gimnasioId },
      { fechaBaja: null },
    );
    if (resultado.affected === 0) {
      throw new Error(`Socio con id ${id} no encontrado en este gimnasio`);
    }
  }

  async findAll(): Promise<SocioEntity[]> {
    const gimnasioId = this.gimnasioIdActual;
    const socios = await this.socioRepository.find({
      where: { gimnasioId },
      relations: ['usuario'],
      order: { idPersona: 'ASC' },
    });
    return socios.map((socio) => this.toEntity(socio));
  }

  async findById(id: number): Promise<SocioEntity | null> {
    const whereClause: any = { idPersona: id };

    if (this.tenantContext?.isInitialized) {
      whereClause.gimnasioId = this.gimnasioIdActual;
    }

    const socio = await this.socioRepository.findOne({
      where: whereClause,
    });
    return socio ? this.toEntity(socio) : null;
  }

  private toOrmEntity(socio: SocioEntity, gimnasioId: number): SocioOrmEntity {
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
    orm.observaciones = socio.observaciones ?? null;
    orm.fechaAlta = new Date();
    orm.fichaSalud = null;
    orm.planesAlimentacion = [];
    orm.turnos = [];
    orm.gimnasioId = gimnasioId;
    return orm;
  }

  private toEntity(orm: SocioOrmEntity): SocioEntity {
    if (orm.gimnasioId == null) {
      throw new Error(
        `Socio ${orm.idPersona} sin gimnasio asociado en base de datos`,
      );
    }

    // Pasar el gimnnasioId del ORM al entity (SocioEntity lo necesita para tenant isolation)
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
      orm.gimnasioId,
    );

    // PersonaEntity expone email, fechaBaja, fotoPerfilKey y observaciones en sus props.
    if (orm.fechaBaja) {
      entity.fechaBaja = orm.fechaBaja;
    }

    if (orm.usuario?.email) {
      entity.email = orm.usuario.email;
    }

    if (orm.fotoPerfilKey) {
      entity.fotoPerfilKey = orm.fotoPerfilKey;
    }

    entity.observaciones = orm.observaciones ?? null;

    return entity;
  }
}
