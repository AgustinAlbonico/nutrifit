import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class RevertirCheckinDto {
  @IsString()
  @IsNotEmpty({ message: 'El motivo es obligatorio.' })
  @MaxLength(500)
  motivo: string;
}
