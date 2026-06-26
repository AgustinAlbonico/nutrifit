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
 * DTO que el nutricionista usa para editar la ficha de salud de un
 * paciente desde `PUT /turnos/profesional/:nutricionistaId/pacientes/:socioId/ficha-salud`.
 *
 * **Diferencia con `UpsertFichaSaludSocioDto`**:
 *  - **No incluye** `consentimiento`: el RGPD (RB44) ya fue aceptado por el
 *    socio al crear su ficha; el nutricionista edita en su nombre y no
 *    necesita re-validar consentimiento en cada edición.
 *  - **Mismas validaciones** para todos los demás campos (altura 100..250,
 *    peso 20..500, enums, longitudes). Mantenerlas en sincronía con el DTO
 *    del socio es crítico para que el backend no rechace fichas editables
 *    que el socio ya había guardado.
 *
 * RBs: RB44 (consentimiento solo una vez), RB42 (ficha editable),
 * RB33 (auditoría con shape seguro).
 */
export class EditarFichaPacienteNutricionistaDto {
  // --- Datos físicos básicos ---
  @Type(() => Number)
  @IsInt({ message: 'La altura debe ser un número entero en centímetros' })
  @Min(100, { message: 'La altura debe estar entre 100 y 250 cm' })
  @Max(250, { message: 'La altura debe estar entre 100 y 250 cm' })
  altura: number;

  @Type(() => Number)
  @IsNumber(
    { allowNaN: false, allowInfinity: false, maxDecimalPlaces: 2 },
    { message: 'El peso debe ser un número válido' },
  )
  @Min(20, { message: 'El peso debe estar entre 20 y 500 kg' })
  @Max(500, { message: 'El peso debe estar entre 20 y 500 kg' })
  peso: number;

  @IsEnum(NivelActividadFisica, {
    message: 'Seleccioná un nivel de actividad física válido',
  })
  nivelActividadFisica: NivelActividadFisica;

  @IsString({ message: 'El objetivo personal es obligatorio' })
  @MaxLength(500, {
    message: 'El objetivo personal no puede superar los 500 caracteres',
  })
  objetivoPersonal: string;

  // --- Alergias y patologías ---
  @IsArray({ message: 'Las alergias deben ser una lista' })
  @ArrayUnique({ message: 'Las alergias no pueden estar repetidas' })
  @IsString({ each: true, message: 'Cada alergia debe ser un texto' })
  @IsOptional()
  alergias?: string[];

  @IsArray({ message: 'Las patologías deben ser una lista' })
  @ArrayUnique({ message: 'Las patologías no pueden estar repetidas' })
  @IsString({ each: true, message: 'Cada patología debe ser un texto' })
  @IsOptional()
  patologias?: string[];

  // --- Medicación y suplementos ---
  @IsString({ message: 'La medicación actual debe ser un texto' })
  @MaxLength(1000, {
    message: 'La medicación actual no puede superar los 1000 caracteres',
  })
  @IsOptional()
  medicacionActual?: string;

  @IsString({ message: 'Los suplementos actuales deben ser un texto' })
  @MaxLength(500, {
    message: 'Los suplementos actuales no pueden superar los 500 caracteres',
  })
  @IsOptional()
  suplementosActuales?: string;

  // --- Historial médico ---
  @IsString({ message: 'Las cirugías previas deben ser un texto' })
  @MaxLength(1000, {
    message: 'Las cirugías previas no pueden superar los 1000 caracteres',
  })
  @IsOptional()
  cirugiasPrevias?: string;

  @IsString({ message: 'Los antecedentes familiares deben ser un texto' })
  @MaxLength(1000, {
    message:
      'Los antecedentes familiares no pueden superar los 1000 caracteres',
  })
  @IsOptional()
  antecedentesFamiliares?: string;

  // --- Hábitos alimentarios ---
  @IsEnum(FrecuenciaComidas, {
    message: 'Seleccioná una frecuencia de comidas válida',
  })
  @IsOptional()
  frecuenciaComidas?: FrecuenciaComidas;

  @Type(() => Number)
  @IsNumber(
    { allowNaN: false, allowInfinity: false },
    { message: 'El consumo de agua diario debe ser un número válido' },
  )
  @Min(0, { message: 'El consumo de agua diario no puede ser negativo' })
  @Max(10, {
    message: 'El consumo de agua diario no puede superar los 10 litros',
  })
  @IsOptional()
  consumoAguaDiario?: number;

  @IsString({ message: 'Las restricciones alimentarias deben ser un texto' })
  @MaxLength(500, {
    message:
      'Las restricciones alimentarias no pueden superar los 500 caracteres',
  })
  @IsOptional()
  restriccionesAlimentarias?: string;

  // --- Hábitos de vida ---
  @IsEnum(ConsumoAlcohol, {
    message: 'Seleccioná un valor de consumo de alcohol válido',
  })
  @IsOptional()
  consumoAlcohol?: ConsumoAlcohol;

  @IsBoolean({ message: 'El campo "fuma tabaco" debe ser verdadero o falso' })
  @IsOptional()
  fumaTabaco?: boolean;

  @Type(() => Number)
  @IsInt({ message: 'Las horas de sueño deben ser un número entero' })
  @Min(0, { message: 'Las horas de sueño no pueden ser negativas' })
  @Max(24, { message: 'Las horas de sueño no pueden superar las 24' })
  @IsOptional()
  horasSueno?: number;

  // --- Contacto de emergencia ---
  @IsString({
    message: 'El nombre del contacto de emergencia debe ser un texto',
  })
  @MaxLength(100, {
    message:
      'El nombre del contacto de emergencia no puede superar los 100 caracteres',
  })
  @IsOptional()
  contactoEmergenciaNombre?: string;

  @IsString({
    message: 'El teléfono del contacto de emergencia debe ser un texto',
  })
  @MaxLength(20, {
    message:
      'El teléfono del contacto de emergencia no puede superar los 20 caracteres',
  })
  @IsOptional()
  contactoEmergenciaTelefono?: string;
}