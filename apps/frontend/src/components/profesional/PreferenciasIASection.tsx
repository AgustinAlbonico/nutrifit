/**
 * Sección de preferencias IA persistentes del nutricionista.
 * Se monta dentro de `MiPerfilPage`. Permite editar las directrices privadas
 * que la IA usa para generar los planes del nutricionista.
 *
 * Usa `usePreferenciasIa()` para cargar y guardar.
 * Validación cliente: max 2000 caracteres (también validado en backend).
 *
 * Accesibilidad:
 * - Textarea con Label asociado
 * - Contador en vivo (aria-live="polite")
 * - Estado de guardado comunicado visualmente + aria-live
 */

import { useState } from 'react';
import { CheckCircle2, Loader2, Save, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { usePreferenciasIa } from '@/hooks/usePreferenciasIa';
import { cn } from '@/lib/utils';

const MAX_CARACTERES = 2000;

export function PreferenciasIASection() {
  const {
    preferencias,
    isLoading,
    guardar,
    isSaving,
    errorGuardado,
    guardadoOk,
  } = usePreferenciasIa();

  // Patrón "edición diferida": mantenemos un buffer de edición separado del
// valor fuente. El textarea muestra `edicion ?? preferencias` y solo escribe
// cuando el usuario interactúa. Esto evita sincronizar useEffect→setState.
  const [edicion, setEdicion] = useState<string | null>(null);
  const textoLocal = edicion ?? preferencias;

  const caracteresRestantes = MAX_CARACTERES - textoLocal.length;
  const excedido = caracteresRestantes < 0;
  const hayCambios = edicion !== null && edicion !== preferencias;
  const puedeGuardar =
    hayCambios && !excedido && !isSaving && textoLocal.trim().length > 0;

  const handleGuardar = () => {
    if (!puedeGuardar) return;
    guardar(textoLocal, {
      onSuccess: () => {
        setEdicion(null);
      },
    });
  };

  if (isLoading) {
    return (
      <section
        aria-labelledby="preferencias-ia-titulo"
        className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/30 px-4 py-6 text-sm text-muted-foreground"
      >
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        Cargando tus preferencias IA…
      </section>
    );
  }

  return (
    <section
      aria-labelledby="preferencias-ia-titulo"
      className="flex flex-col gap-3 rounded-lg border border-border/50 bg-card p-4"
    >
      <header className="flex items-start gap-2">
        <Sparkles
          className="mt-0.5 size-5 shrink-0 text-primary"
          aria-hidden="true"
        />
        <div>
          <h3
            id="preferencias-ia-titulo"
            className="text-base font-semibold text-foreground"
          >
            Preferencias IA
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Estas directrices se inyectan en cada plan generado. La IA las
            trata como preferencias blandas (no como restricciones duras).
          </p>
        </div>
      </header>

      <div className="flex flex-col gap-2">
        <Label htmlFor="preferencias-ia-textarea">
          Tus directrices para la IA
        </Label>
        <Textarea
          id="preferencias-ia-textarea"
          value={textoLocal}
          onChange={(e) => setEdicion(e.target.value)}
          maxLength={MAX_CARACTERES}
          placeholder="Ej: Soy deportóloga. Priorizar proteínas de alto valor biológico, evitar ultraprocesados, predominio de fibra."
          rows={6}
          disabled={isSaving}
          aria-describedby="preferencias-ia-contador"
          className="resize-y"
        />
        <div
          id="preferencias-ia-contador"
          aria-live="polite"
          className={cn(
            'self-end text-xs tabular-nums',
            excedido
              ? 'text-destructive'
              : caracteresRestantes < 100
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-muted-foreground',
          )}
        >
          {textoLocal.length} / {MAX_CARACTERES} caracteres
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <EstadoGuardado
          isSaving={isSaving}
          guardadoOk={guardadoOk}
          errorGuardado={errorGuardado}
        />
        <Button
          type="button"
          onClick={handleGuardar}
          disabled={!puedeGuardar}
          aria-label="Guardar preferencias IA"
          data-testid="preferencias-guardar"
        >
          {isSaving ? (
            <>
              <Loader2 className="animate-spin" aria-hidden="true" />
              Guardando…
            </>
          ) : (
            <>
              <Save aria-hidden="true" />
              Guardar
            </>
          )}
        </Button>
      </div>
    </section>
  );
}

interface PropiedadesEstadoGuardado {
  isSaving: boolean;
  guardadoOk: boolean;
  errorGuardado: unknown;
}

function EstadoGuardado({
  isSaving,
  guardadoOk,
  errorGuardado,
}: PropiedadesEstadoGuardado) {
  if (isSaving) {
    return (
      <p
        aria-live="polite"
        className="flex items-center gap-1.5 text-sm text-muted-foreground"
      >
        <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
        Guardando…
      </p>
    );
  }

  if (guardadoOk) {
    return (
      <p
        aria-live="polite"
        className="flex items-center gap-1.5 text-sm text-emerald-700 dark:text-emerald-300"
      >
        <CheckCircle2 className="size-4" aria-hidden="true" />
        Preferencias guardadas
      </p>
    );
  }

  if (errorGuardado) {
    const mensaje =
      errorGuardado instanceof Error
        ? errorGuardado.message
        : 'Error al guardar';
    return (
      <p
        role="alert"
        className="text-sm text-destructive"
      >
        {mensaje}
      </p>
    );
  }

  return (
    <p className="text-xs text-muted-foreground">
      Los cambios aplican solo a futuras generaciones.
    </p>
  );
}