import { ArrayUnique, IsArray, IsInt, Min } from 'class-validator';

export class AsignarAccionesDto {
  @IsArray()
  @ArrayUnique()
  @IsInt({ each: true })
  @Min(1, { each: true })
  actionIds: number[];
}
