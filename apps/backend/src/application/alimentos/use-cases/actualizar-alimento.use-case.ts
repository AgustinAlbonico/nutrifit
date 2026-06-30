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
        alimento.grupoAlimenticio = [grupo];
      } else {
        alimento.grupoAlimenticio = [];
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
    if (dto.colesterol !== undefined) alimento.colesterol = dto.colesterol;
    if (dto.fibraAlimentaria !== undefined)
      alimento.fibraAlimentaria = dto.fibraAlimentaria;
    if (dto.sodio !== undefined) alimento.sodio = dto.sodio;
    if (dto.agua !== undefined) alimento.agua = dto.agua;
    if (dto.vitaminaA !== undefined) alimento.vitaminaA = dto.vitaminaA;
    if (dto.vitaminaB6 !== undefined) alimento.vitaminaB6 = dto.vitaminaB6;
    if (dto.vitaminaB12 !== undefined) alimento.vitaminaB12 = dto.vitaminaB12;
    if (dto.vitaminaC !== undefined) alimento.vitaminaC = dto.vitaminaC;
    if (dto.vitaminaD !== undefined) alimento.vitaminaD = dto.vitaminaD;
    if (dto.vitaminaE !== undefined) alimento.vitaminaE = dto.vitaminaE;
    if (dto.vitaminaK !== undefined) alimento.vitaminaK = dto.vitaminaK;
    if (dto.almidon !== undefined) alimento.almidon = dto.almidon;
    if (dto.lactosa !== undefined) alimento.lactosa = dto.lactosa;
    if (dto.alcohol !== undefined) alimento.alcohol = dto.alcohol;
    if (dto.cafeina !== undefined) alimento.cafeina = dto.cafeina;
    if (dto.azucares !== undefined) alimento.azucares = dto.azucares;
    if (dto.calcio !== undefined) alimento.calcio = dto.calcio;
    if (dto.hierro !== undefined) alimento.hierro = dto.hierro;
    if (dto.magnesio !== undefined) alimento.magnesio = dto.magnesio;
    if (dto.fosforo !== undefined) alimento.fosforo = dto.fosforo;
    if (dto.potasio !== undefined) alimento.potasio = dto.potasio;
    if (dto.cinc !== undefined) alimento.cinc = dto.cinc;
    if (dto.cobre !== undefined) alimento.cobre = dto.cobre;
    if (dto.fluor !== undefined) alimento.fluor = dto.fluor;
    if (dto.manganeso !== undefined) alimento.manganeso = dto.manganeso;
    if (dto.selenio !== undefined) alimento.selenio = dto.selenio;
    if (dto.tiamina !== undefined) alimento.tiamina = dto.tiamina;
    if (dto.riboflavina !== undefined) alimento.riboflavina = dto.riboflavina;
    if (dto.niacina !== undefined) alimento.niacina = dto.niacina;
    if (dto.acidoPantotenico !== undefined)
      alimento.acidoPantotenico = dto.acidoPantotenico;
    if (dto.folato !== undefined) alimento.folato = dto.folato;
    if (dto.acidoFolico !== undefined) alimento.acidoFolico = dto.acidoFolico;
    if (dto.grasasTrans !== undefined) alimento.grasasTrans = dto.grasasTrans;
    if (dto.grasasSaturadas !== undefined)
      alimento.grasasSaturadas = dto.grasasSaturadas;
    if (dto.grasasMonoinsaturadas !== undefined)
      alimento.grasasMonoinsaturadas = dto.grasasMonoinsaturadas;
    if (dto.grasasPoliinsaturadas !== undefined)
      alimento.grasasPoliinsaturadas = dto.grasasPoliinsaturadas;
    if (dto.cloruro !== undefined) alimento.cloruro = dto.cloruro;

    return this.alimentoRepo.save(alimento);
  }
}
