import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AlimentoOrmEntity } from 'src/infrastructure/persistence/typeorm/entities/alimento.entity';
import { NotFoundError } from 'src/domain/exceptions/custom-exceptions';

@Injectable()
export class EliminarAlimentoUseCase {
  constructor(
    @InjectRepository(AlimentoOrmEntity)
    private readonly alimentoRepo: Repository<AlimentoOrmEntity>,
  ) {}

  async execute(id: number): Promise<void> {
    // Verificar que existe el alimento
    const alimento = await this.alimentoRepo.findOne({
      where: { idAlimento: id },
    });

    if (!alimento) {
      throw new NotFoundError('Alimento', String(id));
    }

    // Eliminar el alimento
    await this.alimentoRepo.remove(alimento);
  }
}
