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
      colesterol: dto.colesterol ?? null,
      fibraAlimentaria: dto.fibraAlimentaria ?? null,
      sodio: dto.sodio ?? null,
      agua: dto.agua ?? null,
      vitaminaA: dto.vitaminaA ?? null,
      vitaminaB6: dto.vitaminaB6 ?? null,
      vitaminaB12: dto.vitaminaB12 ?? null,
      vitaminaC: dto.vitaminaC ?? null,
      vitaminaD: dto.vitaminaD ?? null,
      vitaminaE: dto.vitaminaE ?? null,
      vitaminaK: dto.vitaminaK ?? null,
      almidon: dto.almidon ?? null,
      lactosa: dto.lactosa ?? null,
      alcohol: dto.alcohol ?? null,
      cafeina: dto.cafeina ?? null,
      azucares: dto.azucares ?? null,
      calcio: dto.calcio ?? null,
      hierro: dto.hierro ?? null,
      magnesio: dto.magnesio ?? null,
      fosforo: dto.fosforo ?? null,
      potasio: dto.potasio ?? null,
      cinc: dto.cinc ?? null,
      cobre: dto.cobre ?? null,
      fluor: dto.fluor ?? null,
      manganeso: dto.manganeso ?? null,
      selenio: dto.selenio ?? null,
      tiamina: dto.tiamina ?? null,
      riboflavina: dto.riboflavina ?? null,
      niacina: dto.niacina ?? null,
      acidoPantotenico: dto.acidoPantotenico ?? null,
      folato: dto.folato ?? null,
      acidoFolico: dto.acidoFolico ?? null,
      grasasTrans: dto.grasasTrans ?? null,
      grasasSaturadas: dto.grasasSaturadas ?? null,
      grasasMonoinsaturadas: dto.grasasMonoinsaturadas ?? null,
      grasasPoliinsaturadas: dto.grasasPoliinsaturadas ?? null,
      cloruro: dto.cloruro ?? null,
    });

    // Guardar el alimento
    const savedAlimento = await this.alimentoRepo.save(alimento);

    // Asignar grupos si hay
    if (grupos.length > 0) {
      savedAlimento.grupoAlimenticio = grupos;
      return this.alimentoRepo.save(savedAlimento);
    }

    return savedAlimento;
  }
}
