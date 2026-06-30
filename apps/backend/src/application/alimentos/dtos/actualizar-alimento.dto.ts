import { IsString, IsNumber, IsEnum, IsOptional } from 'class-validator';
import { UnidadMedida } from 'src/domain/entities/Alimento/UnidadMedida';

export class ActualizarAlimentoDto {
  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @IsNumber()
  cantidad?: number;

  @IsOptional()
  @IsEnum(UnidadMedida)
  unidadMedida?: UnidadMedida;

  @IsOptional()
  @IsNumber()
  calorias?: number | null;

  @IsOptional()
  @IsNumber()
  proteinas?: number | null;

  @IsOptional()
  @IsNumber()
  carbohidratos?: number | null;

  @IsOptional()
  @IsNumber()
  grasas?: number | null;

  @IsOptional()
  @IsNumber()
  hidratosDeCarbono?: number | null;

  @IsOptional()
  @IsNumber()
  colesterol?: number | null;

  @IsOptional()
  @IsNumber()
  fibraAlimentaria?: number | null;

  @IsOptional()
  @IsNumber()
  sodio?: number | null;

  @IsOptional()
  @IsNumber()
  agua?: number | null;

  @IsOptional()
  @IsNumber()
  vitaminaA?: number | null;

  @IsOptional()
  @IsNumber()
  vitaminaB6?: number | null;

  @IsOptional()
  @IsNumber()
  vitaminaB12?: number | null;

  @IsOptional()
  @IsNumber()
  vitaminaC?: number | null;

  @IsOptional()
  @IsNumber()
  vitaminaD?: number | null;

  @IsOptional()
  @IsNumber()
  vitaminaE?: number | null;

  @IsOptional()
  @IsNumber()
  vitaminaK?: number | null;

  @IsOptional()
  @IsNumber()
  almidon?: number | null;

  @IsOptional()
  @IsNumber()
  lactosa?: number | null;

  @IsOptional()
  @IsNumber()
  alcohol?: number | null;

  @IsOptional()
  @IsNumber()
  cafeina?: number | null;

  @IsOptional()
  @IsNumber()
  azucares?: number | null;

  @IsOptional()
  @IsNumber()
  calcio?: number | null;

  @IsOptional()
  @IsNumber()
  hierro?: number | null;

  @IsOptional()
  @IsNumber()
  magnesio?: number | null;

  @IsOptional()
  @IsNumber()
  fosforo?: number | null;

  @IsOptional()
  @IsNumber()
  potasio?: number | null;

  @IsOptional()
  @IsNumber()
  cinc?: number | null;

  @IsOptional()
  @IsNumber()
  cobre?: number | null;

  @IsOptional()
  @IsNumber()
  fluor?: number | null;

  @IsOptional()
  @IsNumber()
  manganeso?: number | null;

  @IsOptional()
  @IsNumber()
  selenio?: number | null;

  @IsOptional()
  @IsNumber()
  tiamina?: number | null;

  @IsOptional()
  @IsNumber()
  riboflavina?: number | null;

  @IsOptional()
  @IsNumber()
  niacina?: number | null;

  @IsOptional()
  @IsNumber()
  acidoPantotenico?: number | null;

  @IsOptional()
  @IsNumber()
  folato?: number | null;

  @IsOptional()
  @IsNumber()
  acidoFolico?: number | null;

  @IsOptional()
  @IsNumber()
  grasasTrans?: number | null;

  @IsOptional()
  @IsNumber()
  grasasSaturadas?: number | null;

  @IsOptional()
  @IsNumber()
  grasasMonoinsaturadas?: number | null;

  @IsOptional()
  @IsNumber()
  grasasPoliinsaturadas?: number | null;

  @IsOptional()
  @IsNumber()
  cloruro?: number | null;

  @IsOptional()
  @IsNumber()
  grupoAlimenticioId?: number | null;
}
