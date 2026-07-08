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
import { Calendar, Loader2, Sparkles, AlertCircle, Info, ShieldAlert, X } from 'lucide-react';
import { toast } from 'sonner';
import { apiRequest } from '@/lib/api';
import { useEffect } from 'react';

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
import { traducirErrorApi } from '@/lib/error-messages';
import {
  solicitudPlanSemanalSchema,
} from '@/schemas/ia-plan-semanal.schema';
import type {
  GeneracionPlanIaFE,
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

interface DatosPacienteParaGeneracion {
  alergias: string[];
  patologias: string[];
  restriccionesAlimentarias: string | null;
}

interface PropiedadesGeneradorPlanSemanal {
  planAlimentacionId?: number;
  socioIdPreseleccionado?: number;
  /** Si false, deshabilita el botón de generar (ej: socio sin ficha de salud). */
  fichaDisponible?: boolean;
  /** Datos de ficha de salud para mostrar restricciones visibles antes de generar. */
  datosPaciente?: DatosPacienteParaGeneracion | null;
  onSuccess?: (respuesta: RespuestaPlanSemanalV2FE) => void;
  modoBackground?: boolean;
  generacionBloqueada?: boolean;
  onGeneracionIniciada?: (generacion: GeneracionPlanIaFE) => void;

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
  datosPaciente,
  onSuccess,
  modoBackground = false,
  generacionBloqueada = false,
  onGeneracionIniciada,
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
  const [mostrarAvanzado, setMostrarAvanzado] = useState(false);

  const { generarPlanSemanalV2, iniciarGeneracionPlanSemanal } = useIa();

  // Estados para alimentos preferidos interactivos
  const [alimentosPreferidos, setAlimentosPreferidos] = useState<string[]>([]);
  const [busquedaPref, setBusquedaPref] = useState('');
  const [sugerenciasPref, setSugerenciasPref] = useState<string[]>([]);
  const [buscandoPref, setBuscandoPref] = useState(false);
  const [mostrarSugerenciasPref, setMostrarSugerenciasPref] = useState(false);

  // Estados para alimentos evitados interactivos
  const [alimentosEvitados, setAlimentosEvitados] = useState<string[]>([]);
  const [busquedaEvit, setBusquedaEvit] = useState('');
  const [sugerenciasEvit, setSugerenciasEvit] = useState<string[]>([]);
  const [buscandoEvit, setBuscandoEvit] = useState(false);
  const [mostrarSugerenciasEvit, setMostrarSugerenciasEvit] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isValid },
    reset,
    setValue,
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
      alimentosPreferidos: [],
      alimentosEvitados: [],
    },
  });

  // Registrar campos al montar
  useEffect(() => {
    register('alimentosPreferidos');
    register('alimentosEvitados');
  }, [register]);

  // Debounce para alimentos preferidos
  useEffect(() => {
    if (!busquedaPref.trim()) {
      setSugerenciasPref([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setBuscandoPref(true);
      try {
        const respuesta = await apiRequest<{ data: { data: Array<{ nombre: string }> } }>(
          `/alimentos?search=${encodeURIComponent(busquedaPref.trim())}&limit=5`
        );
        const nombres = respuesta?.data?.data?.map((a) => a.nombre) ?? [];
        setSugerenciasPref(nombres);
      } catch (err) {
        console.error('Error buscando alimentos', err);
      } finally {
        setBuscandoPref(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [busquedaPref]);

  // Debounce para alimentos evitados
  useEffect(() => {
    if (!busquedaEvit.trim()) {
      setSugerenciasEvit([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setBuscandoEvit(true);
      try {
        const respuesta = await apiRequest<{ data: { data: Array<{ nombre: string }> } }>(
          `/alimentos?search=${encodeURIComponent(busquedaEvit.trim())}&limit=5`
        );
        const nombres = respuesta?.data?.data?.map((a) => a.nombre) ?? [];
        setSugerenciasEvit(nombres);
      } catch (err) {
        console.error('Error buscando alimentos', err);
      } finally {
        setBuscandoEvit(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [busquedaEvit]);

  // Manejadores para alimentos preferidos
  const agregarPreferido = (alimento: string) => {
    const limpio = alimento.trim();
    if (!limpio) return;
    if (alimentosPreferidos.includes(limpio)) return;
    const nuevaLista = [...alimentosPreferidos, limpio];
    setAlimentosPreferidos(nuevaLista);
    setValue('alimentosPreferidos', nuevaLista, { shouldValidate: true });
    setBusquedaPref('');
    setSugerenciasPref([]);
    setMostrarSugerenciasPref(false);
  };

  const eliminarPreferido = (alimento: string) => {
    const nuevaLista = alimentosPreferidos.filter((a) => a !== alimento);
    setAlimentosPreferidos(nuevaLista);
    setValue('alimentosPreferidos', nuevaLista, { shouldValidate: true });
  };

  // Manejadores para alimentos evitados
  const agregarEvitado = (alimento: string) => {
    const limpio = alimento.trim();
    if (!limpio) return;
    if (alimentosEvitados.includes(limpio)) return;
    const nuevaLista = [...alimentosEvitados, limpio];
    setAlimentosEvitados(nuevaLista);
    setValue('alimentosEvitados', nuevaLista, { shouldValidate: true });
    setBusquedaEvit('');
    setSugerenciasEvit([]);
    setMostrarSugerenciasEvit(false);
  };

  const eliminarEvitado = (alimento: string) => {
    const nuevaLista = alimentosEvitados.filter((a) => a !== alimento);
    setAlimentosEvitados(nuevaLista);
    setValue('alimentosEvitados', nuevaLista, { shouldValidate: true });
  };

  const notasActuales = watch('notasGeneracion') ?? '';
  const operacionPendiente =
    enviando ||
    generarPlanSemanalV2.isPending ||
    iniciarGeneracionPlanSemanal.isPending;
  const formularioBloqueado = operacionPendiente || generacionBloqueada;

  const onSubmit: SubmitHandler<FormOutput> = async (valores) => {
    if (formularioBloqueado) return;

    setEnviando(true);
    try {
      // Construir payload limpio: enviar solo lo definido (Zod ya validó rangos)
      const payload: SolicitudPlanSemanalV2FE = {
        socioId: valores.socioId,
        ...(planAlimentacionId !== undefined ? { planAlimentacionId } : {}),
        diasAGenerar: valores.diasAGenerar,
        comidasPorDia: valores.comidasPorDia,
        alternativasPorComida: valores.alternativasPorComida,
        ...(valores.notasGeneracion && valores.notasGeneracion.trim().length > 0
          ? { notasGeneracion: valores.notasGeneracion.trim() }
          : {}),
        ...(valores.fechaInicio ? { fechaInicio: valores.fechaInicio } : {}),
        ...((valores.caloriasLimite !== undefined && !Number.isNaN(valores.caloriasLimite)) ? { caloriasLimite: valores.caloriasLimite } : {}),
        ...((valores.proteinasEstimadas !== undefined && !Number.isNaN(valores.proteinasEstimadas)) ? { proteinasEstimadas: valores.proteinasEstimadas } : {}),
        ...((valores.carbohidratosEstimados !== undefined && !Number.isNaN(valores.carbohidratosEstimados)) ? { carbohidratosEstimados: valores.carbohidratosEstimados } : {}),
        ...((valores.grasasEstimados !== undefined && !Number.isNaN(valores.grasasEstimados)) ? { grasasEstimados: valores.grasasEstimados } : {}),
        ...(valores.alimentosPreferidos && valores.alimentosPreferidos.length > 0
          ? { alimentosPreferidos: valores.alimentosPreferidos }
          : {}),
        ...(valores.alimentosEvitados && valores.alimentosEvitados.length > 0
          ? { alimentosEvitados: valores.alimentosEvitados }
          : {}),
      };

      if (modoBackground) {
        const generacion = await iniciarGeneracionPlanSemanal.mutateAsync(payload);
        toast.success('Generación iniciada en segundo plano', {
          description: 'Podés seguir usando el sistema; el plan queda bloqueado hasta que termine.',
        });
        onGeneracionIniciada?.(generacion);
        return;
      }

      const respuesta = await generarPlanSemanalV2.mutateAsync(payload);

      toast.success('Plan generado correctamente', {
        description: `Versión ${respuesta.numeroVersion} creada. Revisá el plan y la validación.`,
      });

      onSuccess?.(respuesta);
    } catch (err) {
      const errorTraducido = traducirErrorApi(err);
      toast.error(errorTraducido.titulo, {
        description: errorTraducido.descripcion,
      });
    } finally {
      setEnviando(false);
    }
  };

  const submitDeshabilitado = formularioBloqueado || !isValid || !fichaDisponible;
  const errorGeneracion = modoBackground
    ? iniciarGeneracionPlanSemanal.error
    : generarPlanSemanalV2.error;

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

      {/* Banner compacto con datos del paciente — visible antes de generar */}
      {datosPaciente && (datosPaciente.alergias.length > 0 || datosPaciente.patologias.length > 0 || datosPaciente.restriccionesAlimentarias) && (
        <div
          className="rounded-lg border border-border/60 bg-muted/15 p-3"
          aria-label="Datos del paciente que la IA considerará"
        >
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <Info className="size-3.5" aria-hidden="true" />
            Datos del paciente que la IA considerará
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {datosPaciente.alergias.length > 0 && (
              <span className="inline-flex items-center gap-1 rounded-md border border-rose-200 bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-900 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-200">
                <ShieldAlert className="size-3" aria-hidden="true" />
                Alergias: {datosPaciente.alergias.join(', ')}
              </span>
            )}
            {datosPaciente.patologias.length > 0 && (
              <span className="inline-flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
                Patologías: {datosPaciente.patologias.join(', ')}
              </span>
            )}
            {datosPaciente.restriccionesAlimentarias && (
              <span className="inline-flex items-center gap-1 rounded-md border border-sky-200 bg-sky-50 px-2 py-0.5 text-xs font-medium text-sky-900 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-200">
                Dieta: {datosPaciente.restriccionesAlimentarias}
              </span>
            )}
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {/* socioId — campo oculto, el socio ya está en el header de la página */}
        <input
          type="hidden"
          data-testid="socio-id-input"
          {...register('socioId', { valueAsNumber: true })}
        />

        {/* diasAGenerar */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="diasAGenerar">Días a generar</Label>
          <Input
            id="diasAGenerar"
            type="number"
            min={1}
            max={14}
            inputMode="numeric"
            disabled={formularioBloqueado}
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
                disabled={formularioBloqueado}
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
            disabled={formularioBloqueado}
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
              disabled={formularioBloqueado}
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

      {/* Botón para alternar personalización avanzada de macros */}
      <div className="flex justify-start">
        <button
          type="button"
          onClick={() => setMostrarAvanzado(!mostrarAvanzado)}
          className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-expanded={mostrarAvanzado}
          aria-controls="seccion-macros-personalizados"
        >
          {mostrarAvanzado ? 'Ocultar personalización de macros' : 'Personalizar calorías y macros (opcional)'}
        </button>
      </div>

      {/* Inputs de macros colapsables */}
      {mostrarAvanzado && (
        <div
          id="seccion-macros-personalizados"
          className="grid gap-4 sm:grid-cols-2 p-4 rounded-lg border border-border/80 bg-muted/20 animate-in fade-in slide-in-from-top-1 duration-200"
        >
          {/* caloriasLimite */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="caloriasLimite">Límite calórico diario (kcal)</Label>
            <Input
              id="caloriasLimite"
              type="number"
              min={500}
              max={10000}
              placeholder="Ej: 2000"
              disabled={formularioBloqueado}
              aria-invalid={errors.caloriasLimite ? 'true' : 'false'}
              aria-describedby={errors.caloriasLimite ? 'caloriasLimite-error' : undefined}
              {...register('caloriasLimite', { valueAsNumber: true })}
            />
            {errors.caloriasLimite && (
              <p id="caloriasLimite-error" role="alert" className="text-xs text-destructive">
                {errors.caloriasLimite.message}
              </p>
            )}
          </div>

          {/* proteinasEstimadas */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="proteinasEstimadas">Proteínas diarias (g)</Label>
            <Input
              id="proteinasEstimadas"
              type="number"
              min={10}
              max={500}
              placeholder="Ej: 140"
              disabled={formularioBloqueado}
              aria-invalid={errors.proteinasEstimadas ? 'true' : 'false'}
              aria-describedby={errors.proteinasEstimadas ? 'proteinasEstimadas-error' : undefined}
              {...register('proteinasEstimadas', { valueAsNumber: true })}
            />
            {errors.proteinasEstimadas && (
              <p id="proteinasEstimadas-error" role="alert" className="text-xs text-destructive">
                {errors.proteinasEstimadas.message}
              </p>
            )}
          </div>

          {/* carbohidratosEstimados */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="carbohidratosEstimados">Carbohidratos diarios (g)</Label>
            <Input
              id="carbohidratosEstimados"
              type="number"
              min={10}
              max={1000}
              placeholder="Ej: 220"
              disabled={formularioBloqueado}
              aria-invalid={errors.carbohidratosEstimados ? 'true' : 'false'}
              aria-describedby={errors.carbohidratosEstimados ? 'carbohidratosEstimados-error' : undefined}
              {...register('carbohidratosEstimados', { valueAsNumber: true })}
            />
            {errors.carbohidratosEstimados && (
              <p id="carbohidratosEstimados-error" role="alert" className="text-xs text-destructive">
                {errors.carbohidratosEstimados.message}
              </p>
            )}
          </div>

          {/* grasasEstimados */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="grasasEstimados">Grasas diarias (g)</Label>
            <Input
              id="grasasEstimados"
              type="number"
              min={10}
              max={300}
              placeholder="Ej: 65"
              disabled={enviando || generarPlanSemanalV2.isPending}
              aria-invalid={errors.grasasEstimados ? 'true' : 'false'}
              aria-describedby={errors.grasasEstimados ? 'grasasEstimados-error' : undefined}
              {...register('grasasEstimados', { valueAsNumber: true })}
            />
            {errors.grasasEstimados && (
              <p id="grasasEstimados-error" role="alert" className="text-xs text-destructive">
                {errors.grasasEstimados.message}
              </p>
            )}
          </div>

          {/* alimentosPreferidos */}
          <div className="flex flex-col gap-1.5 sm:col-span-2 relative">
            <Label>Ingredientes/Alimentos preferidos (a priorizar)</Label>
            
            {/* Renderizar los chips/tags actuales */}
            <div className="flex flex-wrap gap-2 mb-1">
              {alimentosPreferidos.map((alimento) => (
                <span
                  key={alimento}
                  className="inline-flex items-center gap-1 bg-primary/10 border border-primary/20 text-primary-foreground text-xs font-medium px-2 py-0.5 rounded-full text-foreground"
                >
                  {alimento}
                  <button
                    type="button"
                    onClick={() => eliminarPreferido(alimento)}
                    disabled={formularioBloqueado}
                    className="text-muted-foreground hover:text-foreground hover:bg-muted p-0.5 rounded-full transition-all"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              {alimentosPreferidos.length === 0 && (
                <span className="text-xs text-muted-foreground italic">
                  Ningún ingrediente preferido agregado
                </span>
              )}
            </div>

            <div className="flex gap-2">
              <Input
                type="text"
                value={busquedaPref}
                onChange={(e) => setBusquedaPref(e.target.value)}
                onFocus={() => setMostrarSugerenciasPref(true)}
                onBlur={() => {
                  setTimeout(() => setMostrarSugerenciasPref(false), 200);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (busquedaPref.trim()) {
                      agregarPreferido(busquedaPref.trim());
                    }
                  }
                }}
                placeholder="Buscar o escribir ingrediente a priorizar..."
                disabled={formularioBloqueado}
              />
              <Button
                type="button"
                variant="outline"
                disabled={formularioBloqueado || !busquedaPref.trim()}
                onClick={() => agregarPreferido(busquedaPref.trim())}
              >
                Agregar
              </Button>
            </div>

            {/* Dropdown de sugerencias */}
            {mostrarSugerenciasPref && (busquedaPref.trim().length > 0) && (
              <div className="absolute top-[100%] left-0 w-full bg-popover border rounded-xl shadow-lg mt-1 z-50 max-h-60 overflow-y-auto p-1">
                {buscandoPref && (
                  <div className="flex items-center gap-2 p-2 text-xs text-muted-foreground italic">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Buscando en el catálogo...
                  </div>
                )}
                
                {sugerenciasPref.map((sug) => (
                  <button
                    key={sug}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      agregarPreferido(sug);
                    }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground rounded-lg transition-colors"
                  >
                    {sug}
                  </button>
                ))}

                {!buscandoPref && sugerenciasPref.length === 0 && (
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      agregarPreferido(busquedaPref.trim());
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-primary font-medium hover:bg-accent rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    Crear &ldquo;{busquedaPref.trim()}&rdquo; como nuevo alimento
                  </button>
                )}
              </div>
            )}
            
            {errors.alimentosPreferidos && (
              <p className="text-xs text-destructive mt-1">
                {errors.alimentosPreferidos.message}
              </p>
            )}
          </div>

          {/* alimentosEvitados */}
          <div className="flex flex-col gap-1.5 sm:col-span-2 relative">
            <Label>Ingredientes/Alimentos a evitar (excluir)</Label>
            
            {/* Renderizar los chips/tags actuales */}
            <div className="flex flex-wrap gap-2 mb-1">
              {alimentosEvitados.map((alimento) => (
                <span
                  key={alimento}
                  className="inline-flex items-center gap-1 bg-primary/10 border border-primary/20 text-primary-foreground text-xs font-medium px-2 py-0.5 rounded-full text-foreground"
                >
                  {alimento}
                  <button
                    type="button"
                    onClick={() => eliminarEvitado(alimento)}
                    disabled={formularioBloqueado}
                    className="text-muted-foreground hover:text-foreground hover:bg-muted p-0.5 rounded-full transition-all"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              {alimentosEvitados.length === 0 && (
                <span className="text-xs text-muted-foreground italic">
                  Ningún ingrediente a evitar agregado
                </span>
              )}
            </div>

            <div className="flex gap-2">
              <Input
                type="text"
                value={busquedaEvit}
                onChange={(e) => setBusquedaEvit(e.target.value)}
                onFocus={() => setMostrarSugerenciasEvit(true)}
                onBlur={() => {
                  setTimeout(() => setMostrarSugerenciasEvit(false), 200);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (busquedaEvit.trim()) {
                      agregarEvitado(busquedaEvit.trim());
                    }
                  }
                }}
                placeholder="Buscar o escribir ingrediente a evitar..."
                disabled={formularioBloqueado}
              />
              <Button
                type="button"
                variant="outline"
                disabled={formularioBloqueado || !busquedaEvit.trim()}
                onClick={() => agregarEvitado(busquedaEvit.trim())}
              >
                Agregar
              </Button>
            </div>

            {/* Dropdown de sugerencias */}
            {mostrarSugerenciasEvit && (busquedaEvit.trim().length > 0) && (
              <div className="absolute top-[100%] left-0 w-full bg-popover border rounded-xl shadow-lg mt-1 z-50 max-h-60 overflow-y-auto p-1">
                {buscandoEvit && (
                  <div className="flex items-center gap-2 p-2 text-xs text-muted-foreground italic">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Buscando en el catálogo...
                  </div>
                )}
                
                {sugerenciasEvit.map((sug) => (
                  <button
                    key={sug}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      agregarEvitado(sug);
                    }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground rounded-lg transition-colors"
                  >
                    {sug}
                  </button>
                ))}

                {!buscandoEvit && sugerenciasEvit.length === 0 && (
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      agregarEvitado(busquedaEvit.trim());
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-primary font-medium hover:bg-accent rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    Crear &ldquo;{busquedaEvit.trim()}&rdquo; como nuevo alimento
                  </button>
                )}
              </div>
            )}
            
            {errors.alimentosEvitados && (
              <p className="text-xs text-destructive mt-1">
                {errors.alimentosEvitados.message}
              </p>
            )}
          </div>
        </div>
      )}

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
          disabled={formularioBloqueado}
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

      {/* Hint suave: avisa que el botón estará bloqueado si no hay ficha.
          Antes era un alert rojo redundante con el botón deshabilitado. */}
      {!fichaDisponible && (
        <div
          role="status"
          aria-live="polite"
          className="flex items-start gap-2 rounded-md border border-border/60 bg-muted/30 px-3 py-2 text-xs text-muted-foreground"
        >
          <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          <p>
            El socio debe completar su ficha de salud antes de poder generar
            un plan.
          </p>
        </div>
      )}

      {/* Error global del mutation con mensaje semántico en español. */}
      {errorGeneracion && (
        <ErrorGlobal
          error={errorGeneracion}
        />
      )}

      <div className="flex items-center justify-end gap-2">
        <Button
          type="button"
          variant="ghost"
          disabled={formularioBloqueado}
          onClick={() => reset()}
          data-testid="reset-form-button"
        >
          Limpiar
        </Button>
        <Button
          type="submit"
          disabled={submitDeshabilitado}
          aria-busy={operacionPendiente}
          data-testid="generar-plan-button"
          className="min-w-[160px]"
        >
          {operacionPendiente ? (
            <>
              <Loader2 className="animate-spin" aria-hidden="true" />
              {modoBackground ? 'Iniciando…' : 'Generando…'}
            </>
          ) : (
            <>
              <Sparkles aria-hidden="true" />
              {modoBackground ? 'Generar en segundo plano' : 'Generar plan'}
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

// ============================================================================
// Sub-componente: ErrorGlobal con mensaje semántico
// ============================================================================

function ErrorGlobal({ error }: { error: unknown }) {
  const errorTraducido = traducirErrorApi(error);
  return (
    <div
      role="alert"
      className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
    >
      <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <div className="flex-1">
        <p className="font-medium">{errorTraducido.titulo}</p>
        {errorTraducido.descripcion && (
          <p className="mt-0.5 text-xs opacity-90">
            {errorTraducido.descripcion}
          </p>
        )}
      </div>
    </div>
  );
}
