import { Injectable, Inject, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  EstadoObjetivo,
  TipoMetrica,
} from 'src/domain/entities/Objetivo/objetivo.entity';
import { In, Repository } from 'typeorm';
import { ObjetivoOrmEntity } from '../entities/objetivo.entity';
import { TenantContextService } from 'src/infrastructure/auth/tenant-context.service';

const ESTADO_ACTIVO: EstadoObjetivo = 'ACTIVO';
const ESTADOS_CERRADOS: EstadoObjetivo[] = ['COMPLETADO', 'ABANDONADO'];

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
export class ObjetivoRepository {
  constructor(
    @InjectRepository(ObjetivoOrmEntity)
    private readonly objetivoRepository: Repository<ObjetivoOrmEntity>,
    @Inject(TenantContextService)
    @Optional()
    private readonly tenantContext?: TenantContextService,
  ) {}

  private get gimnasioIdActual(): number {
    return obtenerGimnasioIdActual(this.tenantContext);
  }

  async findById(idObjetivo: number): Promise<ObjetivoOrmEntity | null> {
    const gimnasioId = this.gimnasioIdActual;
    return this.objetivoRepository.findOne({
      where: { idObjetivo, socio: { gimnasioId } },
      relations: { socio: true },
    });
  }

  async findActivosBySocioId(socioId: number): Promise<ObjetivoOrmEntity[]> {
    const gimnasioId = this.gimnasioIdActual;
    return this.objetivoRepository.find({
      where: {
        socio: { idPersona: socioId, gimnasioId },
        estado: ESTADO_ACTIVO,
      },
      relations: { socio: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findCompletadosBySocioId(
    socioId: number,
  ): Promise<ObjetivoOrmEntity[]> {
    const gimnasioId = this.gimnasioIdActual;
    return this.objetivoRepository.find({
      where: {
        socio: { idPersona: socioId, gimnasioId },
        estado: In(ESTADOS_CERRADOS),
      },
      relations: { socio: true },
      order: { updatedAt: 'DESC' },
    });
  }

  async findActivoByTipo(
    socioId: number,
    tipoMetrica: TipoMetrica,
  ): Promise<ObjetivoOrmEntity | null> {
    const gimnasioId = this.gimnasioIdActual;
    return this.objetivoRepository.findOne({
      where: {
        socio: { idPersona: socioId, gimnasioId },
        tipoMetrica,
        estado: ESTADO_ACTIVO,
      },
      relations: { socio: true },
    });
  }

  async save(entity: Partial<ObjetivoOrmEntity>): Promise<ObjetivoOrmEntity> {
    const gimnasioId = this.gimnasioIdActual;
    // Verificar que el socio asociado pertenece al gimnasio actual
    if (entity.socio) {
      if (entity.socio.gimnasioId !== gimnasioId) {
        throw new Error('Socio no pertenece al gimnasio actual');
      }
    }
    const objetivo = this.objetivoRepository.create(entity);
    return this.objetivoRepository.save(objetivo);
  }

  async updateEstado(
    idObjetivo: number,
    estado: EstadoObjetivo,
  ): Promise<void> {
    const gimnasioId = this.gimnasioIdActual;
    // Verificar que el objetivo pertenece al gimnasio actual antes de actualizar
    const objetivo = await this.objetivoRepository.findOne({
      where: { idObjetivo, socio: { gimnasioId } },
    });
    if (!objetivo) {
      throw new Error(`Objetivo with id ${idObjetivo} not found in this gym`);
    }
    await this.objetivoRepository.update(idObjetivo, {
      estado,
      updatedAt: new Date(),
    });
  }
}
