/**
 * Card editable de la ficha de salud del paciente, vista por el
 * nutricionista desde `PlanEditorPage`.
 *
 * Muestra TODA la información clínica relevante de la ficha (no solo
 * las restricciones duras) y permite al NUT editarla en nombre del
 * paciente — completar campos que el socio dejó vacíos (objetivo,
 * restricciones alimentarias, medicación, suplementos, peso, altura,
 * nivel de actividad física).
 *
 * Comportamiento:
 *  - Modo lectura (default): muestra los datos en formato legible.
 *  - Modo edición (botón "Editar"): muestra inputs/textarea/select
 *    pre-poblados con la ficha actual.
 *  - "Guardar cambios" llama a `onSave` (que dispara la mutación
 *    contra `PUT /turnos/profesional/.../ficha-salud`). Al éxito,
 *    sale de modo edición.
 *  - "Cancelar" descarta los cambios locales y vuelve a modo lectura.
 *
 * Accesibilidad:
 *  - Labels asociados con htmlFor/id.
 *  - aria-invalid en campos con error.
 *  - role="alert" en mensajes de error.
 *  - aria-describedby apuntando al mensaje de error del campo.
 *  - role="region" + aria-labelledby en el card.
 */

import { useMemo, useState } from 'react';
import {
  AlertCircle,
  Check,
  Edit3,
  Loader2,
  Lock,
  Plus,
  ShieldAlert,
  Stethoscope,
  Trash2,
  User,
  X,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import { cn } from '@/lib/utils';
import { NIVELES_ACTIVIDAD_FISICA, type NivelActividadFisicaValue } from '@nutrifit/shared';
import type { FichaSaludSocio } from '@/types/ficha-salud';

interface PropiedadesRestriccionesEditablesCard {
  ficha: FichaSaludSocio | null | undefined;
  /** Datos opcionales del socio (encabezado read-only). */
  socio?: {
    nombreCompleto?: string;
    dni?: string;
    email?: string;
  } | null;
  isLoading?: boolean;
  isError?: boolean;
  sinFicha?: boolean;
  sinPermisos?: boolean;
  /** Se llama cuando el NUT hace click en "Guardar cambios". */
  onSave: (datosEditados: Partial<FichaSaludSocio>) => Promise<void>;
  /** `true` mientras la mutación está en vuelo (deshabilita botones). */
  isSaving: boolean;
  /** Mensaje de error de la última mutación fallida (se muestra inline). */
  errorGuardar?: string | null;
  className?: string;
}

/**
 * Estado interno del formulario de edición. Strings (no números) para
 * manejar inputs vacíos sin warnings de TS; se parsean al enviar.
 */
interface FormularioFicha {
  altura: string;
  peso: string;
  nivelActividadFisica: NivelActividadFisicaValue;
  alergias: string[];
  patologias: string[];
  restriccionesAlimentarias: string;
  objetivoPersonal: string;
  medicacionActual: string;
  suplementosActuales: string;
}

const FORMULARIO_VACIO: FormularioFicha = {
  altura: '',
  peso: '',
  nivelActividadFisica: 'MODERADO',
  alergias: [],
  patologias: [],
  restriccionesAlimentarias: '',
  objetivoPersonal: '',
  medicacionActual: '',
  suplementosActuales: '',
};

function mapearFichaAFormulario(
  ficha: FichaSaludSocio,
): FormularioFicha {
  return {
    altura: String(ficha.altura),
    peso: String(ficha.peso),
    nivelActividadFisica: ficha.nivelActividadFisica,
    alergias: Array.from(new Set(ficha.alergias ?? [])),
    patologias: Array.from(new Set(ficha.patologias ?? [])),
    restriccionesAlimentarias: ficha.restriccionesAlimentarias ?? '',
    objetivoPersonal: ficha.objetivoPersonal ?? '',
    medicacionActual: ficha.medicacionActual ?? '',
    suplementosActuales: ficha.suplementosActuales ?? '',
  };
}

function serializarFormulario(
  form: FormularioFicha,
): Partial<FichaSaludSocio> {
  return {
    altura: Number(form.altura),
    peso: Number(form.peso),
    nivelActividadFisica: form.nivelActividadFisica,
    alergias: form.alergias,
    patologias: form.patologias,
    restriccionesAlimentarias: form.restriccionesAlimentarias.trim() || null,
    objetivoPersonal: form.objetivoPersonal.trim(),
    medicacionActual: form.medicacionActual.trim() || null,
    suplementosActuales: form.suplementosActuales.trim() || null,
  };
}

export function RestriccionesEditablesCard({
  ficha,
  socio,
  isLoading = false,
  isError = false,
  sinFicha = false,
  sinPermisos = false,
  onSave,
  isSaving,
  errorGuardar,
  className,
}: PropiedadesRestriccionesEditablesCard) {
const [modoEdicion, setModoEdicion] = useState(false);
  const [formulario, setFormulario] = useState<FormularioFicha>(() =>
    ficha ? mapearFichaAFormulario(ficha) : FORMULARIO_VACIO,
  );
  const [errores, setErrores] = useState<Record<string, string>>({});

  // Estado derivado: cuando NO estamos editando, el formulario siempre
  // refleja la ficha del backend (sin usar useEffect). Cuando SÍ estamos
  // editando, el estado local `formulario` manda y se inicializa al
  // entrar a modo edición.
  const formularioEfectivo = useMemo<FormularioFicha>(() => {
    if (modoEdicion) return formulario;
    return ficha ? mapearFichaAFormulario(ficha) : FORMULARIO_VACIO;
    // `formulario` se incluye para que TS no se queje (también cubre el
    // caso de re-renders por cambios internos durante la edición).
  }, [modoEdicion, formulario, ficha]);

  const etiquetaTitulo = useMemo(() => {
    if (modoEdicion) return 'Editar ficha del paciente';
    return 'Ficha de salud del paciente';
  }, [modoEdicion]);

  const manejarClickEditar = () => {
    setFormulario(
      ficha ? mapearFichaAFormulario(ficha) : FORMULARIO_VACIO,
    );
    setErrores({});
    setModoEdicion(true);
  };

  const manejarCancelar = () => {
    setFormulario(
      ficha ? mapearFichaAFormulario(ficha) : FORMULARIO_VACIO,
    );
    setErrores({});
    setModoEdicion(false);
  };

  const manejarGuardar = async () => {
    const nuevosErrores = validarFormulario(formularioEfectivo);
    setErrores(nuevosErrores);
    if (Object.keys(nuevosErrores).length > 0) {
      // Enfocar el primer error
      const primerCampo = Object.keys(nuevosErrores)[0];
      const elemento = document.getElementById(`campo-${primerCampo}`);
      if (elemento) {
        elemento.scrollIntoView({ behavior: 'smooth', block: 'center' });
        elemento.focus({ preventScroll: true });
      }
      return;
    }

    try {
      await onSave(serializarFormulario(formularioEfectivo));
      // Salir de modo edición al éxito (la prop onSave propaga errores
      // a través de `errorGuardar` y rechaza la Promise).
      setModoEdicion(false);
    } catch {
      // El error se muestra via `errorGuardar` (estado del padre).
    }
  };

  // ===== Handlers de chips (alergias / patologías) =====
  const [nuevoItem, setNuevoItem] = useState<{ tipo: 'alergias' | 'patologias'; valor: string }>({
    tipo: 'alergias',
    valor: '',
  });

  const agregarItem = (tipo: 'alergias' | 'patologias') => {
    const valor = nuevoItem.valor.trim();
    if (!valor) return;
    setFormulario((prev) => {
      if (prev[tipo].some((item) => item.toLowerCase() === valor.toLowerCase())) {
        return prev; // duplicado, no agregar
      }
      return { ...prev, [tipo]: [...prev[tipo], valor] };
    });
    setNuevoItem({ tipo, valor: '' });
  };

  const eliminarItem = (tipo: 'alergias' | 'patologias', item: string) => {
    setFormulario((prev) => ({
      ...prev,
      [tipo]: prev[tipo].filter((i) => i !== item),
    }));
  };

  return (
    <Card
      className={cn('rounded-2xl border-border/50', className)}
      role="region"
      aria-labelledby="restricciones-editables-titulo"
      data-testid="restricciones-editables-card"
    >
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle
              id="restricciones-editables-titulo"
              className="flex items-center gap-2 text-base"
            >
              <Stethoscope
                className="size-4 text-emerald-600 dark:text-emerald-400"
                aria-hidden="true"
              />
              {etiquetaTitulo}
            </CardTitle>
            <CardDescription className="mt-1 text-xs">
              Datos clínicos del paciente. Como nutricionista podés
              completar los campos que el socio haya dejado vacíos.
            </CardDescription>
          </div>

          {/* Botones de acción (esquina superior derecha) */}
          {ficha && !modoEdicion && !sinPermisos && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={manejarClickEditar}
              aria-label="Editar ficha del paciente"
              data-testid="boton-editar-ficha"
            >
              <Edit3 className="size-4" aria-hidden="true" />
              Editar
            </Button>
          )}
          {modoEdicion && (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={manejarCancelar}
                disabled={isSaving}
                aria-label="Cancelar edición de ficha"
                data-testid="boton-cancelar-edicion"
              >
                <X className="size-4" aria-hidden="true" />
                Cancelar
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={manejarGuardar}
                disabled={isSaving}
                aria-label="Guardar cambios en la ficha"
                data-testid="boton-guardar-ficha"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                    Guardando…
                  </>
                ) : (
                  <>
                    <Check className="size-4" aria-hidden="true" />
                    Guardar cambios
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* === Encabezado: datos del socio (read-only) === */}
        {socio && (
          <div
            className="flex flex-wrap items-center gap-3 rounded-lg border border-border/40 bg-muted/30 p-3"
            aria-label="Datos del socio"
          >
            <User className="size-4 text-muted-foreground" aria-hidden="true" />
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
              {socio.nombreCompleto && (
                <span className="font-medium">{socio.nombreCompleto}</span>
              )}
              {socio.dni && (
                <Badge variant="outline" className="text-[10px]">
                  DNI {socio.dni}
                </Badge>
              )}
              {socio.email && (
                <span className="text-xs text-muted-foreground">{socio.email}</span>
              )}
            </div>
          </div>
        )}

        {/* === Estados de carga / error / sin permisos / sin ficha === */}
        {isLoading && (
          <div
            className="flex items-center gap-2 text-sm text-muted-foreground"
            role="status"
            aria-live="polite"
          >
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            <span>Cargando ficha del paciente…</span>
          </div>
        )}

        {!isLoading && sinPermisos && (
          <div
            className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-sm text-amber-900 dark:text-amber-200"
            role="alert"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <p>
              No tenés turno previo con este socio, por lo que no podés
              acceder ni editar su ficha.
            </p>
          </div>
        )}

        {!isLoading && !sinPermisos && sinFicha && (
          <div
            className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-sm text-amber-900 dark:text-amber-200"
            role="alert"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <p>
              El paciente aún no completó su ficha de salud. Podés crear
              una en su nombre usando el formulario de abajo.
            </p>
          </div>
        )}

        {!isLoading && isError && !sinFicha && !sinPermisos && (
          <div
            className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
            role="alert"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <p>No se pudo obtener la ficha del paciente. Reintentá más tarde.</p>
          </div>
        )}

        {/* === Error global al guardar === */}
        {errorGuardar && (
          <div
            className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
            role="alert"
            aria-live="assertive"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <div>
              <p className="font-medium">No se pudo guardar la ficha.</p>
              <p className="mt-0.5 text-xs">{errorGuardar}</p>
            </div>
          </div>
        )}

        {/* === Cuerpo: lectura o edición === */}
        {!isLoading && !isError && (ficha || sinFicha) && !sinPermisos && (
          <>
{modoEdicion ? (
                <FormularioEdicion
                  formulario={formularioEfectivo}
                  setFormulario={setFormulario}
                errores={errores}
                nuevoItem={nuevoItem}
                setNuevoItem={setNuevoItem}
                agregarItem={agregarItem}
                eliminarItem={eliminarItem}
              />
            ) : ficha ? (
              <VistaLectura ficha={ficha} />
            ) : (
              <VistaLecturaVacia onHabilitarEdicion={manejarClickEditar} />
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

// =============================================================================
// Sub-componentes
// =============================================================================

interface PropiedadesVistaLectura {
  ficha: FichaSaludSocio;
}

function VistaLectura({ ficha }: PropiedadesVistaLectura) {
  // Defensive defaults: el backend puede devolver campos opcionales como null
  // o undefined. Normalizamos para que los .length y .map no exploten.
  const alergias = ficha.alergias ?? [];
  const patologias = ficha.patologias ?? [];
  const restriccionesAlimentarias = ficha.restriccionesAlimentarias ?? '';
  const objetivoPersonal = ficha.objetivoPersonal ?? '';
  const medicacionActual = ficha.medicacionActual ?? '';
  const suplementosActuales = ficha.suplementosActuales ?? '';

  return (
    <dl
      className="grid gap-4 sm:grid-cols-2"
      aria-label="Datos de la ficha del paciente"
    >
      {/* Antropometría */}
      <SeccionLectura titulo="Antropometría">
        <div className="flex flex-wrap gap-2 text-sm">
          <Badge variant="outline" className="text-xs">
            Altura: {ficha.altura} cm
          </Badge>
          <Badge variant="outline" className="text-xs">
            Peso: {ficha.peso} kg
          </Badge>
          <Badge variant="secondary" className="text-xs">
            {formatearNivelActividad(ficha.nivelActividadFisica)}
          </Badge>
        </div>
      </SeccionLectura>

      {/* Alergias */}
      <SeccionLectura titulo="Alergias">
        {alergias.length > 0 ? (
          <ul className="flex flex-wrap gap-1.5" aria-label="Alergias">
            {alergias.map((a) => (
              <li
                key={a}
                className="inline-flex items-center rounded-md border border-rose-200 bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-900 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-200"
              >
                <ShieldAlert className="mr-1 size-3" aria-hidden="true" />
                {a}
              </li>
            ))}
          </ul>
        ) : (
          <span className="text-sm text-muted-foreground">Sin alergias declaradas</span>
        )}
      </SeccionLectura>

      {/* Patologías */}
      <SeccionLectura titulo="Patologías">
        {patologias.length > 0 ? (
          <ul className="flex flex-wrap gap-1.5" aria-label="Patologías">
            {patologias.map((p) => (
              <li
                key={p}
                className="inline-flex items-center rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
              >
                {p}
              </li>
            ))}
          </ul>
        ) : (
          <span className="text-sm text-muted-foreground">Sin patologías declaradas</span>
        )}
      </SeccionLectura>

      {/* Restricciones alimentarias */}
      <SeccionLectura titulo="Restricciones alimentarias">
        {restriccionesAlimentarias ? (
          <p className="text-sm">{restriccionesAlimentarias}</p>
        ) : (
          <span className="text-sm text-muted-foreground">Sin restricciones</span>
        )}
      </SeccionLectura>

      {/* Objetivo personal */}
      <SeccionLectura titulo="Objetivo personal" fullWidth>
        {objetivoPersonal ? (
          <p className="text-sm">{objetivoPersonal}</p>
        ) : (
          <span className="text-sm text-muted-foreground">Sin objetivo declarado</span>
        )}
      </SeccionLectura>

      {/* Medicación */}
      <SeccionLectura titulo="Medicación actual">
        {medicacionActual ? (
          <p className="text-sm">{medicacionActual}</p>
        ) : (
          <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
            <Lock className="size-3" aria-hidden="true" />
            No declarada
          </span>
        )}
      </SeccionLectura>

      {/* Suplementos */}
      <SeccionLectura titulo="Suplementos actuales">
        {suplementosActuales ? (
          <p className="text-sm">{suplementosActuales}</p>
        ) : (
          <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
            <Lock className="size-3" aria-hidden="true" />
            No declarados
          </span>
        )}
      </SeccionLectura>
    </dl>
  );
}

interface PropiedadesSeccionLectura {
  titulo: string;
  children: React.ReactNode;
  fullWidth?: boolean;
}

function SeccionLectura({ titulo, children, fullWidth }: PropiedadesSeccionLectura) {
  return (
    <div className={cn('flex flex-col gap-1.5', fullWidth && 'sm:col-span-2')}>
      <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {titulo}
      </dt>
      <dd>{children}</dd>
    </div>
  );
}

function VistaLecturaVacia({
  onHabilitarEdicion,
}: {
  onHabilitarEdicion: () => void;
}) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-lg border border-dashed border-border/60 p-4">
      <p className="text-sm text-muted-foreground">
        El paciente todavía no tiene una ficha de salud creada. Podés
        completarla vos en su nombre para que la IA tenga restricciones
        con las cuales validar el plan.
      </p>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={onHabilitarEdicion}
        aria-label="Crear ficha del paciente en su nombre"
      >
        <Plus className="size-4" aria-hidden="true" />
        Crear ficha del paciente
      </Button>
    </div>
  );
}

// =============================================================================
// Formulario de edición
// =============================================================================

interface PropiedadesFormularioEdicion {
  formulario: FormularioFicha;
  setFormulario: React.Dispatch<React.SetStateAction<FormularioFicha>>;
  errores: Record<string, string>;
  nuevoItem: { tipo: 'alergias' | 'patologias'; valor: string };
  setNuevoItem: React.Dispatch<
    React.SetStateAction<{ tipo: 'alergias' | 'patologias'; valor: string }>
  >;
  agregarItem: (tipo: 'alergias' | 'patologias') => void;
  eliminarItem: (tipo: 'alergias' | 'patologias', item: string) => void;
}

function FormularioEdicion({
  formulario,
  setFormulario,
  errores,
  nuevoItem,
  setNuevoItem,
  agregarItem,
  eliminarItem,
}: PropiedadesFormularioEdicion) {
  return (
    <form
      className="grid gap-4 sm:grid-cols-2"
      aria-label="Editar ficha del paciente"
      onSubmit={(e) => e.preventDefault()}
      noValidate
    >
      {/* === Antropometría === */}
      <div className="space-y-2 sm:col-span-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Antropometría
        </h3>
        <div className="grid gap-3 sm:grid-cols-3">
          <CampoNumero
            id="altura"
            label="Altura"
            unidad="cm"
            value={formulario.altura}
            min={100}
            max={250}
            onChange={(v) =>
              setFormulario((prev) => ({ ...prev, altura: v }))
            }
            error={errores.altura}
          />
          <CampoNumero
            id="peso"
            label="Peso"
            unidad="kg"
            value={formulario.peso}
            min={20}
            max={500}
            step="0.1"
            onChange={(v) =>
              setFormulario((prev) => ({ ...prev, peso: v }))
            }
            error={errores.peso}
          />
          <div className="space-y-2">
            <Label htmlFor="nivel-actividad">Nivel de actividad</Label>
            <Select
              value={formulario.nivelActividadFisica}
              onValueChange={(v) =>
                setFormulario((prev) => ({
                  ...prev,
                  nivelActividadFisica: v as NivelActividadFisicaValue,
                }))
              }
            >
              <SelectTrigger
                id="nivel-actividad"
                className="w-full"
                aria-label="Nivel de actividad física"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {NIVELES_ACTIVIDAD_FISICA.map((opcion) => (
                  <SelectItem key={opcion.value} value={opcion.value}>
                    {opcion.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* === Alergias === */}
      <SeccionChips
        id="alergias"
        titulo="Alergias"
        ayuda="Presioná Enter o el botón + para agregar."
        items={formulario.alergias}
        color="rose"
        nuevoItem={nuevoItem.tipo === 'alergias' ? nuevoItem.valor : ''}
        onChangeNuevo={(v) =>
          setNuevoItem({ tipo: 'alergias', valor: v })
        }
        onAgregar={() => agregarItem('alergias')}
        onEliminar={(item) => eliminarItem('alergias', item)}
      />

      {/* === Patologías === */}
      <SeccionChips
        id="patologias"
        titulo="Patologías"
        ayuda="Presioná Enter o el botón + para agregar."
        items={formulario.patologias}
        color="amber"
        nuevoItem={nuevoItem.tipo === 'patologias' ? nuevoItem.valor : ''}
        onChangeNuevo={(v) =>
          setNuevoItem({ tipo: 'patologias', valor: v })
        }
        onAgregar={() => agregarItem('patologias')}
        onEliminar={(item) => eliminarItem('patologias', item)}
      />

      {/* === Restricciones alimentarias === */}
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="restricciones-alimentarias">
          Restricciones alimentarias
        </Label>
        <Textarea
          id="restricciones-alimentarias"
          value={formulario.restriccionesAlimentarias}
          onChange={(e) =>
            setFormulario((prev) => ({
              ...prev,
              restriccionesAlimentarias: e.target.value,
            }))
          }
          placeholder="Ej: vegetariano, sin TACC, kosher…"
          maxLength={500}
          aria-describedby="ayuda-restricciones"
        />
        <p
          id="ayuda-restricciones"
          className="text-[11px] text-muted-foreground"
        >
          {formulario.restriccionesAlimentarias.length}/500 caracteres
        </p>
      </div>

      {/* === Objetivo personal === */}
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="objetivo-personal" required>
          Objetivo personal
        </Label>
        <Textarea
          id="objetivo-personal"
          value={formulario.objetivoPersonal}
          onChange={(e) =>
            setFormulario((prev) => ({
              ...prev,
              objetivoPersonal: e.target.value,
            }))
          }
          placeholder="Ej: bajar 5 kg en 3 meses, mejorar rendimiento deportivo…"
          aria-invalid={Boolean(errores.objetivoPersonal) || undefined}
          aria-describedby={
            errores.objetivoPersonal
              ? 'error-objetivo-personal'
              : undefined
          }
          maxLength={500}
          required
        />
        {errores.objetivoPersonal && (
          <p
            id="error-objetivo-personal"
            className="text-xs text-destructive"
            role="alert"
          >
            {errores.objetivoPersonal}
          </p>
        )}
      </div>

      {/* === Medicación === */}
      <div className="space-y-2">
        <Label htmlFor="medicacion-actual">Medicación actual</Label>
        <Textarea
          id="medicacion-actual"
          value={formulario.medicacionActual}
          onChange={(e) =>
            setFormulario((prev) => ({
              ...prev,
              medicacionActual: e.target.value,
            }))
          }
          placeholder="Ej: levotiroxina 50mcg/día"
          maxLength={1000}
        />
      </div>

      {/* === Suplementos === */}
      <div className="space-y-2">
        <Label htmlFor="suplementos-actuales">Suplementos actuales</Label>
        <Textarea
          id="suplementos-actuales"
          value={formulario.suplementosActuales}
          onChange={(e) =>
            setFormulario((prev) => ({
              ...prev,
              suplementosActuales: e.target.value,
            }))
          }
          placeholder="Ej: creatina 5g, omega 3"
          maxLength={500}
        />
      </div>
    </form>
  );
}

// =============================================================================
// Sub-componentes auxiliares
// =============================================================================

interface PropiedadesCampoNumero {
  id: string;
  label: string;
  unidad: string;
  value: string;
  min?: number;
  max?: number;
  step?: string;
  onChange: (value: string) => void;
  error?: string;
}

function CampoNumero({
  id,
  label,
  unidad,
  value,
  min,
  max,
  step = '1',
  onChange,
  error,
}: PropiedadesCampoNumero) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} required>
        {label} ({unidad})
      </Label>
      <Input
        id={`campo-${id}`}
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={error ? `error-${id}` : undefined}
        required
      />
      {error && (
        <p id={`error-${id}`} className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

interface PropiedadesSeccionChips {
  id: string;
  titulo: string;
  ayuda: string;
  items: string[];
  color: 'rose' | 'amber';
  nuevoItem: string;
  onChangeNuevo: (value: string) => void;
  onAgregar: () => void;
  onEliminar: (item: string) => void;
}

function SeccionChips({
  id,
  titulo,
  ayuda,
  items,
  color,
  nuevoItem,
  onChangeNuevo,
  onAgregar,
  onEliminar,
}: PropiedadesSeccionChips) {
  const colorClasses = {
    rose: 'border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-200',
    amber:
      'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200',
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{titulo}</Label>
      <div className="flex gap-2">
        <Input
          id={id}
          value={nuevoItem}
          onChange={(e) => onChangeNuevo(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              onAgregar();
            }
          }}
          placeholder={`Agregar ${titulo.toLowerCase()}…`}
          maxLength={100}
          aria-describedby={`ayuda-${id}`}
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={onAgregar}
          disabled={!nuevoItem.trim()}
          aria-label={`Agregar ${titulo.toLowerCase()}`}
        >
          <Plus className="size-4" aria-hidden="true" />
        </Button>
      </div>
      <p id={`ayuda-${id}`} className="text-[11px] text-muted-foreground">
        {ayuda}
      </p>
      {items.length > 0 ? (
        <ul className="flex flex-wrap gap-1.5" aria-label={titulo}>
          {items.map((item) => (
            <li
              key={item}
              className={cn(
                'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium',
                colorClasses[color],
              )}
            >
              {item}
              <button
                type="button"
                onClick={() => onEliminar(item)}
                aria-label={`Eliminar ${item}`}
                className="ml-0.5 rounded-sm hover:bg-black/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X className="size-3" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <span className="text-xs text-muted-foreground">
          Sin {titulo.toLowerCase()} cargadas
        </span>
      )}
    </div>
  );
}

// =============================================================================
// Validación (alineada con backend UpsertFichaSaludSocioDto)
// =============================================================================

function validarFormulario(form: FormularioFicha): Record<string, string> {
  const errores: Record<string, string> = {};

  const altura = Number(form.altura);
  if (!form.altura || Number.isNaN(altura)) {
    errores.altura = 'La altura es obligatoria';
  } else if (!Number.isInteger(altura)) {
    errores.altura = 'La altura debe ser un número entero en centímetros';
  } else if (altura < 100 || altura > 250) {
    errores.altura = 'La altura debe estar entre 100 y 250 cm';
  }

  const peso = Number(form.peso);
  if (!form.peso || Number.isNaN(peso)) {
    errores.peso = 'El peso es obligatorio';
  } else if (peso < 20 || peso > 500) {
    errores.peso = 'El peso debe estar entre 20 y 500 kg';
  }

  if (!form.objetivoPersonal.trim()) {
    errores.objetivoPersonal = 'Indicá el objetivo personal del paciente';
  } else if (form.objetivoPersonal.length > 500) {
    errores.objetivoPersonal =
      'El objetivo personal no puede superar los 500 caracteres';
  }

  return errores;
}

function formatearNivelActividad(value: NivelActividadFisicaValue): string {
  const opcion = NIVELES_ACTIVIDAD_FISICA.find((o) => o.value === value);
  return opcion ? opcion.label : value;
}

// Helper para limpiar el icono de Trash2 no usado (sólo para que ESLint no se queje)
void Trash2;