import { ArrayUnique, IsArray, IsInt, Min } from 'class-validator';

export class AsignarGruposDto {
  @IsArray()
  @ArrayUnique()
  @IsInt({ each: true })
  @Min(1, { each: true })
  groupIds: number[];
}
