import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { BaseUseCase } from 'src/application/shared/use-case.base';
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from 'src/domain/exceptions/custom-exceptions';
import { TenantContextService } from 'src/infrastructure/auth/tenant-context.service';
import {
  AlimentoOrmEntity,
  PreparacionOrmEntity,
  PreparacionItemOrmEntity,
} from 'src/infrastructure/persistence/typeorm/entities';
import { ActualizarPreparacionDto } from '../dtos';
import { PreparacionResponseDto } from '../dtos';
import { mapPreparacionToResponse } from '../preparacion.mapper';

@Injectable()
export class ActualizarPreparacionUseCase implements BaseUseCase {
  constructor(
    @InjectRepository(PreparacionOrmEntity)
    private readonly preparacionRepo: Repository<PreparacionOrmEntity>,
    @InjectRepository(PreparacionItemOrmEntity)
    private readonly itemRepo: Repository<PreparacionItemOrmEntity>,
    @InjectRepository(AlimentoOrmEntity)
    private readonly alimentoRepo: Repository<AlimentoOrmEntity>,
    private readonly tenantContext: TenantContextService,
  ) {}

  async execute(
    id: number,
    dto: ActualizarPreparacionDto,
  ): Promise<PreparacionResponseDto> {
    const preparacion = await this.preparacionRepo.findOne({
      where: { idPreparacion: id },
      relations: { items: true },
    });

    if (!preparacion || preparacion.fechaBaja) {
      throw new NotFoundError('Preparación', String(id));
    }
    if (preparacion.gimnasioId !== this.tenantContext.gimnasioId) {
      throw new ForbiddenError('No tiene acceso a esta preparación.');
    }

    // Actualizar nombre si viene
    if (dto.nombre !== undefined) {
      if (!dto.nombre.trim()) {
        throw new BadRequestError('El nombre no puede estar vacío.');
      }
      preparacion.nombre = dto.nombre.trim();
    }

    // Actualizar items si vienen
    if (dto.items !== undefined) {
      if (dto.items.length === 0) {
        throw new BadRequestError('La preparación debe tener al menos un ingrediente.');
      }

      // Validar alimentos
      const alimentoIds = [...new Set(dto.items.map((i) => i.alimentoId))];
      const alimentos = await this.alimentoRepo.findBy({ idAlimento: In(alimentoIds) });
      if (alimentos.length !== alimentoIds.length) {
        throw new NotFoundError('Uno o más alimentos no existen en el sistema.');
      }

      // Borrar items anteriores y crear nuevos
      await this.itemRepo.delete({ preparacionId: id });
      preparacion.items = dto.items.map((item) =>
        Object.assign(new PreparacionItemOrmEntity(), {
          preparacionId: id,
          alimentoId: item.alimentoId,
          cantidadDefault: item.cantidadDefault,
          unidadDefault: item.unidadDefault,
        }),
      );
    }

    await this.preparacionRepo.save(preparacion);

    // Recargar con relaciones completas
    const full = await this.preparacionRepo.findOne({
      where: { idPreparacion: id },
      relations: { items: { alimento: true } },
    });

    return mapPreparacionToResponse(full!);
  }
}
