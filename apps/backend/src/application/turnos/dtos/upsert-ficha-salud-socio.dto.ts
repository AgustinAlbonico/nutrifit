import { Type } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { NivelActividadFisica } from 'src/domain/entities/FichaSalud/NivelActividadFisica';
import { FrecuenciaComidas } from 'src/domain/entities/FichaSalud/FrecuenciaComidas';
import { ConsumoAlcohol } from 'src/domain/entities/FichaSalud/ConsumoAlcohol';

/**
 * DTO para crear o actualizar la ficha de salud del socio.
 *
 * **Consentimiento (RB44)**: el campo `consentimiento` es OPCIONAL a nivel
 * de DTO — la validación semántica la hace el use case. En el momento de
 * crear una ficha nueva, el use case exige `consentimiento === true`. En
 * edición, el campo se ignora silenciosamente (no se re-pide consentimiento).
 *
 * **Rangos**: `altura` valida 100..250 cm y `peso` valida 20..500 kg en el
 * backend (rango permisivo para no romper integraciones legacy). El frontend
 * valida un rango más estricto (peso 20..300) con Zod — ver
 * `apps/frontend/src/schemas/ficha-salud.schema.ts`. Esta discrepancia
 * es intencional y está documentada en la sección §10 del design.
 */
export class UpsertFichaSaludSocioDto {
  // --- Datos físicos básicos ---
  @Type(() => Number)
  @IsInt()
  @Min(100)
  @Max(250)
  altura: number;

  @Type(() => Number)
  @Min(20)
  @Max(500)
  peso: number;

  @IsEnum(NivelActividadFisica)
  nivelActividadFisica: NivelActividadFisica;

  @IsString()
  @MaxLength(500)
  objetivoPersonal: string;

  // --- Alergias y patologías ---
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  @IsOptional()
  alergias?: string[];

  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  @IsOptional()
  patologias?: string[];

  // --- Medicación y suplementos ---
  @IsString()
  @MaxLength(1000)
  @IsOptional()
  medicacionActual?: string;

  @IsString()
  @MaxLength(500)
  @IsOptional()
  suplementosActuales?: string;

  // --- Historial médico ---
  @IsString()
  @MaxLength(1000)
  @IsOptional()
  cirugiasPrevias?: string;

  @IsString()
  @MaxLength(1000)
  @IsOptional()
  antecedentesFamiliares?: string;

  // --- Hábitos alimentarios ---
  @IsEnum(FrecuenciaComidas)
  @IsOptional()
  frecuenciaComidas?: FrecuenciaComidas;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(10)
  @IsOptional()
  consumoAguaDiario?: number;

  @IsString()
  @MaxLength(500)
  @IsOptional()
  restriccionesAlimentarias?: string;

  // --- Hábitos de vida ---
  @IsEnum(ConsumoAlcohol)
  @IsOptional()
  consumoAlcohol?: ConsumoAlcohol;

  @IsBoolean()
  @IsOptional()
  fumaTabaco?: boolean;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(24)
  @IsOptional()
  horasSueno?: number;

  // --- Contacto de emergencia ---
  @IsString()
  @MaxLength(100)
  @IsOptional()
  contactoEmergenciaNombre?: string;

  @IsString()
  @MaxLength(20)
  @IsOptional()
  contactoEmergenciaTelefono?: string;

  // --- RGPD (RB44) ---
  /**
   * Consentimiento expreso para almacenar la ficha de salud. Requerido
   * `true` en creación; ignorado en edición. La validación semántica la
   * hace `UpsertFichaSaludSocioUseCase` — no se valida en este DTO para
   * permitir reglas de negocio más complejas (e.g. mensajes distintos
   * según si es creación o edición).
   */
  @IsBoolean()
  @IsOptional()
  consentimiento?: boolean;
}
