/**
 * Formulario V2 de generación de plan semanal con IA.
 *
 * Implementa el RF-001 del change `plan-alimentacion-ia-v2`:
 * - Campos: socioId, diasAGenerar (1-14), comidasPorDia (1-5),
 *   alternativasPorComida (1-5), notasGeneracion (max 1000),
 *   fechaInicio (YYYY-MM-DD, default lunes AR).
 * - Validación con Zod (`solicitudPlanSemanalSchema`).
 * - Submit vía `useIa().generarPlanSemanalV2.mutateAsync`.
 * - Botón se deshabilita tras el primer click para evitar dobles submits.
 * - Toasts (sonner) para feedback de éxito/error.
 *
 * UX del socio:
 * - El socio SIEMPRE viene de la URL (/profesional/plan/:socioId/editar).
 * - El Select está DISABLED: no se puede cambiar el socio desde acá.
 * - El nombre lo pasa el PlanEditorPage (que ya lo carga para el header).
 *
 * Accesibilidad:
 * - Labels asociados por htmlFor / id
 * - Errores inline con aria-invalid y aria-describedby
 * - aria-busy en el botón mientras se envía
 * - role="alert" en errores de submit
 */

import { useState } from 'react';
import { useForm, Controller, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { Calendar, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useIa } from '@/hooks/useIa';
import { cn } from '@/lib/utils';
import {
  solicitudPlanSemanalSchema,
} from '@/schemas/ia-plan-semanal.schema';
import type {
  PlanSemanalIA,
  RespuestaPlanSemanalV2FE,
  SolicitudPlanSemanalV2FE,
} from '@/types/ia';

const MAX_CARACTERES_NOTAS = 1000;

const OPCIONES_COMIDAS_POR_DIA = [
  { valor: 1, etiqueta: '1 comida' },
  { valor: 2, etiqueta: '2 comidas' },
  { valor: 3, etiqueta: '3 comidas' },
  { valor: 4, etiqueta: '4 comidas (recomendado)' },
  { valor: 5, etiqueta: '5 comidas' },
] as const;

interface PropiedadesGeneradorPlanSemanal {
  planAlimentacionId?: number;
  socioIdPreseleccionado?: number;
  /** Si false, deshabilita el botón de generar (ej: socio sin ficha de salud). */
  fichaDisponible?: boolean;
  onSuccess?: (respuesta: RespuestaPlanSemanalV2FE) => void;

  // ─── DEPRECATED props (legacy V1 API, conservados para no romper
  // PlanEditorPage mientras se refactoriza en Packet 5b) ──────────────
  /** @deprecated usar `socioIdPreseleccionado` y el form V2 */
  socioId?: number;
  /** @deprecated el token ahora lo maneja `apiRequest` automáticamente */
  token?: string | null;
  /** @deprecated las alergias se leen de la ficha clínica del socio */
  alergias?: string[];
  /** @deprecated usar `onSuccess` con la nueva respuesta */
  onPlanGenerado?: (plan: PlanSemanalIA) => void;
}

// Tipos derivados del schema Zod:
// - FormInput: lo que el form maneja (inputs del usuario, con campos opcionales)
// - FormOutput: lo que se envía tras aplicar defaults (.default())
type FormInput = z.input<typeof solicitudPlanSemanalSchema>;
type FormOutput = z.output<typeof solicitudPlanSemanalSchema>;

export function GeneradorPlanSemanal({
  planAlimentacionId,
  socioIdPreseleccionado,
  fichaDisponible = true,
  onSuccess,
  // Deprecated props — ignorados en V2 (no rompen typecheck de PlanEditorPage)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  socioId: _socioIdLegacy,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  token: _tokenLegacy,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  alergias: _alergiasLegacy,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onPlanGenerado: _onPlanGeneradoLegacy,
}: PropiedadesGeneradorPlanSemanal) {
  const [enviando, setEnviando] = useState(false);

  const { generarPlanSemanalV2 } = useIa();

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isValid },
    reset,
  } = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(solicitudPlanSemanalSchema),
    mode: 'onChange',
    defaultValues: {
      socioId: socioIdPreseleccionado ?? 0,
      diasAGenerar: 7,
      comidasPorDia: 4,
      alternativasPorComida: 3,
      notasGeneracion: '',
      fechaInicio: obtenerLunesArgentina(),
    },
  });

  const notasActuales = watch('notasGeneracion') ?? '';

  const onSubmit: SubmitHandler<FormOutput> = async (valores) => {
    if (enviando || generarPlanSemanalV2.isPending) return;

    setEnviando(true);
    try {
      // Construir payload limpio: enviar solo lo definido (Zod ya validó rangos)
      const payload: SolicitudPlanSemanalV2FE = {
        socioId: valores.socioId,
        diasAGenerar: valores.diasAGenerar,
        comidasPorDia: valores.comidasPorDia,
        alternativasPorComida: valores.alternativasPorComida,
        ...(valores.notasGeneracion && valores.notasGeneracion.trim().length > 0
          ? { notasGeneracion: valores.notasGeneracion.trim() }
          : {}),
        ...(valores.fechaInicio ? { fechaInicio: valores.fechaInicio } : {}),
      };

      const respuesta = await generarPlanSemanalV2.mutateAsync(payload);

      toast.success('Plan generado correctamente', {
        description: `Versión ${respuesta.numeroVersion} creada. Revisá el plan y la validación.`,
      });

      onSuccess?.(respuesta);
    } catch (err) {
      const mensaje =
        err instanceof Error
          ? err.message
          : 'No se pudo generar el plan. Reintentá en unos minutos.';
      toast.error('Error al generar el plan', { description: mensaje });
    } finally {
      setEnviando(false);
    }
  };

  const submitDeshabilitado =
    enviando ||
    generarPlanSemanalV2.isPending ||
    !isValid ||
    !fichaDisponible;

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      aria-label="Formulario de generación de plan semanal con IA"
      className="flex flex-col gap-4"
    >
      <header className="flex items-start gap-2">
        <Sparkles
          className="mt-0.5 size-5 shrink-0 text-primary"
          aria-hidden="true"
        />
        <div>
          <h3 className="text-base font-semibold text-foreground">
            Generar plan semanal con IA
          </h3>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Configurá los parámetros. La IA genera un plan completo respetando
            restricciones, validando macros y versionando en forma inmutable.
          </p>
          {planAlimentacionId !== undefined && (
            <p className="mt-1 text-xs text-muted-foreground">
              Editando plan #{planAlimentacionId}. Se creará una nueva versión.
            </p>
          )}
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* socioId — campo oculto, el socio ya está en el header de la página */}
        <input type="hidden" {...register('socioId', { valueAsNumber: true })} />

        {/* diasAGenerar */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="diasAGenerar">Días a generar</Label>
          <Input
            id="diasAGenerar"
            type="number"
            min={1}
            max={14}
            inputMode="numeric"
            disabled={enviando || generarPlanSemanalV2.isPending}
            aria-invalid={errors.diasAGenerar ? 'true' : 'false'}
            aria-describedby={
              errors.diasAGenerar ? 'diasAGenerar-error' : undefined
            }
            data-testid="dias-a-generar-input"
            {...register('diasAGenerar', { valueAsNumber: true })}
          />
          {errors.diasAGenerar && (
            <p
              id="diasAGenerar-error"
              role="alert"
              className="text-xs text-destructive"
            >
              {errors.diasAGenerar.message}
            </p>
          )}
        </div>

        {/* comidasPorDia */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="comidasPorDia">Comidas por día</Label>
          <Controller
            control={control}
            name="comidasPorDia"
            render={({ field }) => (
              <Select
                value={String(field.value)}
                onValueChange={(valor) => field.onChange(Number(valor))}
                disabled={enviando || generarPlanSemanalV2.isPending}
              >
                <SelectTrigger
                  id="comidasPorDia"
                  data-testid="comidas-por-dia-select"
                  aria-invalid={errors.comidasPorDia ? 'true' : 'false'}
                >
                  <SelectValue placeholder="Seleccionar cantidad" />
                </SelectTrigger>
                <SelectContent>
                  {OPCIONES_COMIDAS_POR_DIA.map((opcion) => (
                    <SelectItem
                      key={opcion.valor}
                      value={String(opcion.valor)}
                    >
                      {opcion.etiqueta}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.comidasPorDia && (
            <p
              role="alert"
              className="text-xs text-destructive"
            >
              {errors.comidasPorDia.message}
            </p>
          )}
        </div>

        {/* alternativasPorComida */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="alternativasPorComida">Alternativas por comida</Label>
          <Input
            id="alternativasPorComida"
            type="number"
            min={1}
            max={5}
            inputMode="numeric"
            disabled={enviando || generarPlanSemanalV2.isPending}
            aria-invalid={errors.alternativasPorComida ? 'true' : 'false'}
            aria-describedby={
              errors.alternativasPorComida
                ? 'alternativasPorComida-error'
                : undefined
            }
            data-testid="alternativas-por-comida-input"
            {...register('alternativasPorComida', { valueAsNumber: true })}
          />
          {errors.alternativasPorComida && (
            <p
              id="alternativasPorComida-error"
              role="alert"
              className="text-xs text-destructive"
            >
              {errors.alternativasPorComida.message}
            </p>
          )}
        </div>

        {/* fechaInicio */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="fechaInicio">Fecha de inicio</Label>
          <div className="relative">
            <Calendar
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              id="fechaInicio"
              type="date"
              disabled={enviando || generarPlanSemanalV2.isPending}
              aria-invalid={errors.fechaInicio ? 'true' : 'false'}
              aria-describedby={
                errors.fechaInicio ? 'fechaInicio-error' : 'fechaInicio-help'
              }
              data-testid="fecha-inicio-input"
              className="pl-9"
              {...register('fechaInicio')}
            />
          </div>
          {errors.fechaInicio ? (
            <p
              id="fechaInicio-error"
              role="alert"
              className="text-xs text-destructive"
            >
              {errors.fechaInicio.message}
            </p>
          ) : (
            <p id="fechaInicio-help" className="text-xs text-muted-foreground">
              Default: lunes de esta semana (AR).
            </p>
          )}
        </div>
      </div>

      {/* notasGeneracion */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="notasGeneracion">
            Notas para esta generación (opcional)
          </Label>
          <span
            className={cn(
              'text-xs tabular-nums',
              notasActuales.length > MAX_CARACTERES_NOTAS
                ? 'text-destructive'
                : notasActuales.length > MAX_CARACTERES_NOTAS - 100
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-muted-foreground',
            )}
            aria-live="polite"
          >
            {notasActuales.length} / {MAX_CARACTERES_NOTAS} caracteres
          </span>
        </div>
        <Textarea
          id="notasGeneracion"
          placeholder="Ej: Semana de transición, evitar ultraprocesados, priorizar fibra."
          rows={3}
          maxLength={MAX_CARACTERES_NOTAS}
          disabled={enviando || generarPlanSemanalV2.isPending}
          aria-invalid={errors.notasGeneracion ? 'true' : 'false'}
          aria-describedby={
            errors.notasGeneracion ? 'notasGeneracion-error' : undefined
          }
          data-testid="notas-generacion-textarea"
          {...register('notasGeneracion')}
        />
        {errors.notasGeneracion && (
          <p
            id="notasGeneracion-error"
            role="alert"
            className="text-xs text-destructive"
          >
            {errors.notasGeneracion.message}
          </p>
        )}
      </div>

      {/* Aviso: no se puede generar sin ficha de salud */}
      {!fichaDisponible && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <p>
            No se puede generar el plan porque el socio no tiene ficha de
            salud cargada. El socio debe completarla primero.
          </p>
        </div>
      )}

      {/* Error global del mutation (si existe y no fue capturado) */}
      {generarPlanSemanalV2.isError && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <p>
            {generarPlanSemanalV2.error instanceof Error
              ? generarPlanSemanalV2.error.message
              : 'Ocurrió un error al generar el plan.'}
          </p>
        </div>
      )}

      <div className="flex items-center justify-end gap-2">
        <Button
          type="button"
          variant="ghost"
          disabled={enviando || generarPlanSemanalV2.isPending}
          onClick={() => reset()}
          data-testid="reset-form-button"
        >
          Limpiar
        </Button>
        <Button
          type="submit"
          disabled={submitDeshabilitado}
          aria-busy={enviando || generarPlanSemanalV2.isPending}
          data-testid="generar-plan-button"
          className="min-w-[160px]"
        >
          {enviando || generarPlanSemanalV2.isPending ? (
            <>
              <Loader2 className="animate-spin" aria-hidden="true" />
              Generando…
            </>
          ) : (
            <>
              <Sparkles aria-hidden="true" />
              Generar plan
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

/**
 * Calcula el lunes de la semana actual en timezone Argentina (UTC-3).
 * Devuelve la fecha en formato YYYY-MM-DD (input type="date").
 */
function obtenerLunesArgentina(): string {
  const ahora = new Date();
  // Convertir a timezone AR (UTC-3 fijo, no usamos DST porque AR ya no cambia)
  const utcMs = ahora.getTime() + ahora.getTimezoneOffset() * 60_000;
  const arMs = utcMs - 3 * 60 * 60 * 1000;
  const ar = new Date(arMs);

  // getUTCDay: 0=domingo, 1=lunes, ..., 6=sábado
  const diaSemana = ar.getUTCDay();
  const diff = diaSemana === 0 ? -6 : 1 - diaSemana;
  ar.setUTCDate(ar.getUTCDate() + diff);

  const anio = ar.getUTCFullYear();
  const mes = String(ar.getUTCMonth() + 1).padStart(2, '0');
  const dia = String(ar.getUTCDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
}