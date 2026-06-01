import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateRecepcionistaDto } from './create-recepcionista.dto';

export class UpdateRecepcionistaDto extends PartialType(
  OmitType(CreateRecepcionistaDto, ['contrasena', 'email', 'dni'] as const),
) {}
