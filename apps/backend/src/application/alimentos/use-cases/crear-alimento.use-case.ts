import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AlimentoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/alimento.entity';
import { GrupoAlimenticioOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/grupo-alimenticio.entity';
import { CrearAlimentoDto } from '../dtos/crear-alimento.dto';
import { NotFoundError } from 'src/domain/exceptions/custom-exceptions';
@Injectable()
export class CrearAlimentoUseCase {
  constructor(
    @InjectRepository(AlimentoOrmEntity)
    private readonly alimentoRepo: Repository<AlimentoOrmEntity>,
    @InjectRepository(GrupoAlimenticioOrmEntity)
    private readonly grupoRepo: Repository<GrupoAlimenticioOrmEntity>,
  ) {}
  async execute(dto: CrearAlimentoDto): Promise<AlimentoOrmEntity> {
    // Validar que el grupo alimenticio existe si se proporciona
    const grupos: GrupoAlimenticioOrmEntity[] = [];
    if (dto.grupoAlimenticioId) {
      const grupo = await this.grupoRepo.findOne({
        where: { idGrupoAlimenticio: dto.grupoAlimenticioId },
      });
      if (!grupo) {
        throw new NotFoundError(
          'Grupo alimenticio',
          String(dto.grupoAlimenticioId),
        );
      }
      grupos.push(grupo);
    }
    // Crear el alimento
    const alimento = this.alimentoRepo.create({
      nombre: dto.nombre,
      cantidad: dto.cantidad,
      unidadMedida: dto.unidadMedida,
      calorias: dto.calorias ?? null,
      proteinas: dto.proteinas ?? null,
      carbohidratos: dto.carbohidratos ?? null,
      grasas: dto.grasas ?? null,
      hidratosDeCarbono: dto.hidratosDeCarbono ?? null,
    });

    // Guardar el alimento
    const savedAlimento = await this.alimentoRepo.save(alimento);

    // Asignar grupos si hay
    if (grupos.length > 0) {
      savedAlimento.grupoAlimenticio = grupos as any;
      return this.alimentoRepo.save(savedAlimento);
    }

    return savedAlimento;
  }
}
