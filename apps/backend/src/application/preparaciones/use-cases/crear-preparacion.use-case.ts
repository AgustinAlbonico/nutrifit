import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { BaseUseCase } from 'src/application/shared/use-case.base';
import { BadRequestError, NotFoundError } from 'src/domain/exceptions/custom-exceptions';
import { TenantContextService } from 'src/infrastructure/auth/tenant-context.service';
import {
  AlimentoOrmEntity,
  PreparacionOrmEntity,
  PreparacionItemOrmEntity,
} from 'src/infrastructure/persistence/typeorm/entities';
import { CrearPreparacionDto } from '../dtos';
import { PreparacionResponseDto } from '../dtos';
import { mapPreparacionToResponse } from '../preparacion.mapper';

@Injectable()
export class CrearPreparacionUseCase implements BaseUseCase {
  constructor(
    @InjectRepository(PreparacionOrmEntity)
    private readonly preparacionRepo: Repository<PreparacionOrmEntity>,
    @InjectRepository(AlimentoOrmEntity)
    private readonly alimentoRepo: Repository<AlimentoOrmEntity>,
    private readonly tenantContext: TenantContextService,
  ) {}

  async execute(dto: CrearPreparacionDto): Promise<PreparacionResponseDto> {
    if (!dto.nombre?.trim()) {
      throw new BadRequestError('El nombre de la preparación es obligatorio.');
    }
    if (!dto.items?.length) {
      throw new BadRequestError('La preparación debe tener al menos un ingrediente.');
    }

    // Validar que todos los alimentos existan
    const alimentoIds = [...new Set(dto.items.map((i) => i.alimentoId))];
    const alimentos = await this.alimentoRepo.findBy({ idAlimento: In(alimentoIds) });
    if (alimentos.length !== alimentoIds.length) {
      throw new NotFoundError('Uno o más alimentos no existen en el sistema.');
    }

    const gimnasioId = this.tenantContext.gimnasioId;
    const creadoPorId = this.tenantContext.personaId;
    if (!creadoPorId) {
      throw new BadRequestError('No se pudo determinar el nutricionista.');
    }

    const preparacion = this.preparacionRepo.create({
      nombre: dto.nombre.trim(),
      gimnasioId,
      creadoPorId,
      items: dto.items.map((item) =>
        Object.assign(new PreparacionItemOrmEntity(), {
          alimentoId: item.alimentoId,
          cantidadDefault: item.cantidadDefault,
          unidadDefault: item.unidadDefault,
        }),
      ),
    });

    const saved = await this.preparacionRepo.save(preparacion);

    // Recargar con relaciones para el response
    const full = await this.preparacionRepo.findOne({
      where: { idPreparacion: saved.idPreparacion },
      relations: { items: { alimento: true } },
    });

    return mapPreparacionToResponse(full!);
  }
}
