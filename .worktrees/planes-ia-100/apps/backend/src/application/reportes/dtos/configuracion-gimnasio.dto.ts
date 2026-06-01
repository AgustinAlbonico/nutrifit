import { Expose } from 'class-transformer';
import { IsString, IsOptional, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ConfiguracionGimnasioDto {
  @Expose()
  idGimnasio: number;

  @Expose()
  nombre: string;

  @Expose()
  direccion: string;

  @Expose()
  telefono: string;

  @Expose()
  ciudad: string;

  // Branding
  @Expose()
  @IsOptional()
  @IsString()
  logoUrl?: string | null;

  @Expose()
  @IsOptional()
  @IsString()
  colorPrimario?: string | null;

  @Expose()
  @IsOptional()
  @IsString()
  colorSecundario?: string | null;

  // Políticas operativas
  @Expose()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  plazoCancelacionHoras?: number;

  @Expose()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  plazoReprogramacionHoras?: number;

  @Expose()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  antelacionMinimaReservaHoras?: number;

  @Expose()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  umbralAusenteMinutos?: number;

  // Notificaciones
  @Expose()
  @IsOptional()
  @IsString()
  emailNotificaciones?: string | null;

  @Expose()
  @IsOptional()
  emailHabilitado?: boolean;
}

export class UpdateConfiguracionGimnasioDto {
  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @IsString()
  direccion?: string;

  @IsOptional()
  @IsString()
  telefono?: string;

  @IsOptional()
  @IsString()
  ciudad?: string;

  // Branding
  @IsOptional()
  @IsString()
  logoUrl?: string | null;

  @IsOptional()
  @IsString()
  colorPrimario?: string | null;

  @IsOptional()
  @IsString()
  colorSecundario?: string | null;

  // Políticas operativas
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  plazoCancelacionHoras?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  plazoReprogramacionHoras?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  antelacionMinimaReservaHoras?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  umbralAusenteMinutos?: number;

  // Notificaciones
  @IsOptional()
  @IsString()
  emailNotificaciones?: string | null;

  @IsOptional()
  emailHabilitado?: boolean;
}
