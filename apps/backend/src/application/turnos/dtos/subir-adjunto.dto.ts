import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class SubirAdjuntoDto {
  @IsNotEmpty()
  @IsString()
  nombreOriginal: string;

  @IsNotEmpty()
  @IsString()
  mimeType: string;

  @IsNotEmpty()
  @IsNumber()
  @Max(10 * 1024 * 1024) // 10MB
  sizeBytes: number;
}

export interface SubirAdjuntoResponse {
  id: number;
  nombreOriginal: string;
  urlFirmada: string;
  esPostCierre: boolean;
}
