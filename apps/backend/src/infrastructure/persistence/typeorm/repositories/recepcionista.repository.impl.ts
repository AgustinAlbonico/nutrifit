import { Inject, Injectable, Optional } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { RecepcionistaOrmEntity } from '../entities/persona.entity';
import { RecepcionistaEntity } from 'src/domain/entities/Persona/Recepcionista/recepcionista.entity';
import { RecepcionistaRepository } from 'src/domain/entities/Persona/Recepcionista/recepcionista.repository';
import { TenantContextService } from 'src/infrastructure/auth/tenant-context.service';
import { Rol } from 'src/domain/entities/Usuario/Rol';

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
export class RecepcionistaRepositoryImplementation implements RecepcionistaRepository {
  constructor(
    @InjectRepository(RecepcionistaOrmEntity)
    private readonly recepcionistaRepository: Repository<RecepcionistaOrmEntity>,
    @Inject(TenantContextService)
    @Optional()
    private readonly tenantContext?: TenantContextService,
  ) {}

  private get gimnasioIdActual(): number {
    return obtenerGimnasioIdActual(this.tenantContext);
  }

  async save(entity: RecepcionistaEntity): Promise<RecepcionistaEntity> {
    const gimnasioId = entity.gimnasioId ?? this.gimnasioIdActual;
    const recepcionistaCreado = await this.recepcionistaRepository.save(
      this.toOrmEntity(entity, gimnasioId),
    );
    return this.toDomainEntity(recepcionistaCreado);
  }

  async update(
    id: number,
    entity: RecepcionistaEntity,
  ): Promise<RecepcionistaEntity> {
    const whereClause: any = { idPersona: id };
    if (this.tenantContext?.isInitialized) {
      whereClause.gimnasioId = this.gimnasioIdActual;
    }

    const existing = await this.recepcionistaRepository.findOne({
      where: whereClause,
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
    const whereClause: any = { idPersona: id };
    if (this.tenantContext?.isInitialized) {
      whereClause.gimnasioId = this.gimnasioIdActual;
    }

    const existing = await this.recepcionistaRepository.findOne({
      where: whereClause,
    });

    if (!existing) {
      throw new Error(`Recepcionista with id ${id} not found`);
    }

    await this.recepcionistaRepository.softDelete(id);
  }

  async findAll(): Promise<RecepcionistaEntity[]> {
    const whereClause: any = {
      usuario: {
        rol: Rol.RECEPCIONISTA,
      },
    };
    if (this.tenantContext?.isInitialized) {
      whereClause.gimnasioId = this.gimnasioIdActual;
    }

    const recepcionistas = await this.recepcionistaRepository.find({
      where: whereClause,
      relations: {
        usuario: true,
      },
      order: { idPersona: 'ASC' },
    });
    return recepcionistas.map((rec) => this.toDomainEntity(rec));
  }

  async findById(id: number): Promise<RecepcionistaEntity | null> {
    const whereClause: any = { idPersona: id };
    if (this.tenantContext?.isInitialized) {
      whereClause.gimnasioId = this.gimnasioIdActual;
    }

    const recepcionista = await this.recepcionistaRepository.findOne({
      where: whereClause,
      relations: {
        usuario: true,
      },
    });
    if (!recepcionista) return null;
    return this.toDomainEntity(recepcionista);
  }

  async findByDni(dni: string): Promise<RecepcionistaEntity | null> {
    const whereClause: any = { dni };
    if (this.tenantContext?.isInitialized) {
      whereClause.gimnasioId = this.gimnasioIdActual;
    }

    const recepcionista = await this.recepcionistaRepository.findOne({
      where: whereClause,
      relations: {
        usuario: true,
      },
    });
    if (!recepcionista) return null;
    return this.toDomainEntity(recepcionista);
  }

  private toOrmEntity(
    recepcionista: RecepcionistaEntity,
    gimnasioId: number,
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
      gimnasioId,
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
      orm.gimnasioId ?? 1,
    );

    if (orm.fotoPerfilKey) {
      entity.fotoPerfilKey = orm.fotoPerfilKey;
    }
    if (orm.usuario) {
      entity.email = orm.usuario.email;
    }

    return entity;
  }
}
