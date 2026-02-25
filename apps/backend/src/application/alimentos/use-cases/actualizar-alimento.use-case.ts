import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AlimentoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/alimento.entity';
import { GrupoAlimenticioOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/grupo-alimenticio.entity';
import { ActualizarAlimentoDto } from '../dtos/actualizar-alimento.dto';
import { NotFoundError } from 'src/domain/exceptions/custom-exceptions';

@Injectable()
export class ActualizarAlimentoUseCase {
  constructor(
    @InjectRepository(AlimentoOrmEntity)
    private readonly alimentoRepo: Repository<AlimentoOrmEntity>,
    @InjectRepository(GrupoAlimenticioOrmEntity)
    private readonly grupoRepo: Repository<GrupoAlimenticioOrmEntity>,
  ) {}

  async execute(
    id: number,
    dto: ActualizarAlimentoDto,
  ): Promise<AlimentoOrmEntity> {
    // Buscar el alimento
    const alimento = await this.alimentoRepo.findOne({
      where: { idAlimento: id },
    });

    if (!alimento) {
      throw new NotFoundError('Alimento', String(id));
    }

    // Validar grupo alimenticio si se proporciona
    if (dto.grupoAlimenticioId !== undefined) {
      if (dto.grupoAlimenticioId !== null) {
        const grupo = await this.grupoRepo.findOne({
          where: { idGrupoAlimenticio: dto.grupoAlimenticioId },
        });
        if (!grupo) {
          throw new NotFoundError(
            'Grupo alimenticio',
            String(dto.grupoAlimenticioId),
          );
        }
        alimento.grupoAlimenticio = [grupo] as any;
      } else {
        alimento.grupoAlimenticio = [] as any;
      }
    }

    // Actualizar campos proporcionados
    if (dto.nombre !== undefined) alimento.nombre = dto.nombre;
    if (dto.cantidad !== undefined) alimento.cantidad = dto.cantidad;
    if (dto.unidadMedida !== undefined)
      alimento.unidadMedida = dto.unidadMedida;
    if (dto.calorias !== undefined) alimento.calorias = dto.calorias;
    if (dto.proteinas !== undefined) alimento.proteinas = dto.proteinas;
    if (dto.carbohidratos !== undefined)
      alimento.carbohidratos = dto.carbohidratos;
    if (dto.grasas !== undefined) alimento.grasas = dto.grasas;
    if (dto.hidratosDeCarbono !== undefined)
      alimento.hidratosDeCarbono = dto.hidratosDeCarbono;

    return this.alimentoRepo.save(alimento);
  }
}
