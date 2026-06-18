import { Injectable, Inject, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TipoFoto } from 'src/domain/entities/FotoProgreso/tipo-foto.enum';
import { FotoProgresoOrmEntity } from '../entities/foto-progreso.entity';
import { SocioOrmEntity } from '../entities/persona.entity';
import { TurnoOrmEntity } from '../entities/turno.entity';
import { TenantContextService } from 'src/infrastructure/auth/tenant-context.service';

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
export class FotoProgresoRepository {
  constructor(
    @InjectRepository(FotoProgresoOrmEntity)
    private readonly fotoProgresoOrmRepository: Repository<FotoProgresoOrmEntity>,
    @Inject(TenantContextService)
    @Optional()
    private readonly tenantContext?: TenantContextService,
  ) {}

  private get gimnasioIdActual(): number {
    return obtenerGimnasioIdActual(this.tenantContext);
  }

  async findBySocioId(socioId: number): Promise<FotoProgresoOrmEntity[]> {
    const gimnasioId = this.gimnasioIdActual;
    return this.fotoProgresoOrmRepository.find({
      where: { socio: { idPersona: socioId, gimnasioId } },
      relations: { socio: true, turno: true },
      order: { fecha: 'DESC' },
    });
  }

  async findByTurnoId(turnoId: number): Promise<FotoProgresoOrmEntity[]> {
    const gimnasioId = this.gimnasioIdActual;
    return this.fotoProgresoOrmRepository.find({
      where: {
        turno: { idTurno: turnoId, gimnasio: { idGimnasio: gimnasioId } },
      },
      relations: { socio: true, turno: true },
      order: { fecha: 'DESC' },
    });
  }

  async findBySocioIdAndTipo(
    socioId: number,
    tipoFoto: TipoFoto,
  ): Promise<FotoProgresoOrmEntity[]> {
    const gimnasioId = this.gimnasioIdActual;
    return this.fotoProgresoOrmRepository.find({
      where: { socio: { idPersona: socioId, gimnasioId }, tipoFoto },
      relations: { socio: true, turno: true },
      order: { fecha: 'DESC' },
    });
  }

  async findLatestBySocioId(socioId: number): Promise<FotoProgresoOrmEntity[]> {
    const gimnasioId = this.gimnasioIdActual;
    return this.fotoProgresoOrmRepository.find({
      where: { socio: { idPersona: socioId, gimnasioId } },
      relations: { socio: true, turno: true },
      order: { fecha: 'DESC' },
      take: 10,
    });
  }

  async findByIdAndSocioId(
    idFoto: number,
    socioId: number,
  ): Promise<FotoProgresoOrmEntity | null> {
    const gimnasioId = this.gimnasioIdActual;
    return this.fotoProgresoOrmRepository.findOne({
      where: { idFoto, socio: { idPersona: socioId, gimnasioId } },
      relations: { socio: true, turno: true },
    });
  }

  async saveForSocio(
    entity: Partial<FotoProgresoOrmEntity> & {
      socioId: number;
      turnoId?: number;
    },
  ): Promise<FotoProgresoOrmEntity> {
    const gimnasioId = this.gimnasioIdActual;
    const socio = await this.fotoProgresoOrmRepository.manager.findOne(
      SocioOrmEntity,
      {
        where: { idPersona: entity.socioId, gimnasioId },
      },
    );

    if (!socio) {
      throw new Error('Socio no pertenece al gimnasio actual');
    }

    const turno = entity.turnoId
      ? await this.fotoProgresoOrmRepository.manager.findOne(TurnoOrmEntity, {
          where: {
            idTurno: entity.turnoId,
            socio: { idPersona: entity.socioId, gimnasioId },
          },
          relations: { socio: true },
        })
      : null;

    if (entity.turnoId && !turno) {
      throw new Error('Turno no pertenece al socio o gimnasio actual');
    }

    const foto = this.fotoProgresoOrmRepository.create({
      tipoFoto: entity.tipoFoto,
      notas: entity.notas ?? null,
      objectKey: entity.objectKey,
      mimeType: entity.mimeType,
      socio,
      turno,
    });

    return this.fotoProgresoOrmRepository.save(foto);
  }

  async save(
    entity: Partial<FotoProgresoOrmEntity>,
  ): Promise<FotoProgresoOrmEntity> {
    const gimnasioId = this.gimnasioIdActual;
    // Si el entity tiene socio adjunta, verificar que pertenece al gimnasio actual
    if (entity.socio) {
      if (entity.socio.gimnasioId !== gimnasioId) {
        throw new Error('Socio no pertenece al gimnasio actual');
      }
    }
    const foto = this.fotoProgresoOrmRepository.create(entity);
    return this.fotoProgresoOrmRepository.save(foto);
  }

  async delete(idFoto: number): Promise<void> {
    const gimnasioId = this.gimnasioIdActual;
    // Verificar que la foto existe y pertenece al gimnasio antes de eliminar
    const foto = await this.fotoProgresoOrmRepository.findOne({
      where: { idFoto, socio: { gimnasioId } },
      relations: { socio: true },
    });
    if (!foto) {
      throw new Error(`Foto with id ${idFoto} not found in this gym`);
    }
    await this.fotoProgresoOrmRepository.delete(idFoto);
  }
}
