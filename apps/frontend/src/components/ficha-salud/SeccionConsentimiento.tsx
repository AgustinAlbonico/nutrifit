/**
 * Sección de consentimiento RGPD para el formulario de ficha de salud.
 *
 * Comportamiento:
 * - En modo creación (`required` y NO `disabled`): checkbox editable con
 *   asterisco y label "Acepto almacenar mi información de salud conforme a
 *   la política de privacidad." + link "Ver detalle" que abre el modal RGPD.
 * - En modo edición (`disabled`): checkbox no editable, label muestra
 *   "Consentimiento expresado el DD/MM/YYYY HH:mm" (de `fechaConsentimiento`).
 *
 * Accesibilidad:
 * - `aria-required` cuando es obligatorio.
 * - `aria-disabled` cuando está deshabilitado.
 * - Label asociado al checkbox vía `<label htmlFor>`.
 *
 * RBs: RB44.
 */

import { useId } from 'react';

import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { formatFechaCorta } from '@/lib/fechas';
import { cn } from '@/lib/utils';

interface PropiedadesSeccionConsentimiento {
  checked: boolean;
  onChange: (valor: boolean) => void;
  disabled?: boolean;
  required?: boolean;
  fechaConsentimiento?: Date | string | null;
  idError?: string;
  onAbrirModalRGPD: () => void;
  className?: string;
}

export function SeccionConsentimiento({
  checked,
  onChange,
  disabled = false,
  required = false,
  fechaConsentimiento,
  idError,
  onAbrirModalRGPD,
  className,
}: PropiedadesSeccionConsentimiento) {
  const idCheckbox = useId();

  const labelTexto = disabled
    ? fechaConsentimiento
      ? `Consentimiento expresado el ${formatFechaCorta(fechaConsentimiento)}.`
      : 'Consentimiento expresado anteriormente.'
    : 'Acepto almacenar mi información de salud conforme a la política de privacidad.';

  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-md border border-border/60 bg-muted/30 p-4',
        className,
      )}
    >
      <Checkbox
        id={idCheckbox}
        checked={checked}
        onCheckedChange={(valor) => onChange(valor === true)}
        disabled={disabled}
        aria-required={required || undefined}
        aria-disabled={disabled || undefined}
        aria-invalid={Boolean(idError) || undefined}
        aria-describedby={idError}
      />
      <div className="flex-1 space-y-1 text-sm">
        <Label
          htmlFor={idCheckbox}
          className="cursor-pointer text-foreground/90"
        >
          {labelTexto}
          {required && !disabled && (
            <span className="ml-1 text-destructive" aria-hidden="true">
              *
            </span>
          )}
          {required && !disabled && <span className="sr-only"> (obligatorio)</span>}
        </Label>
        <div>
          <button
            type="button"
            onClick={onAbrirModalRGPD}
            className="text-xs font-medium text-primary underline-offset-4 hover:underline focus-visible:underline focus-visible:outline-none"
          >
            Ver detalle
          </button>
        </div>
        {idError && (
          <p id={idError} className="text-xs text-destructive" role="alert">
            {idError}
          </p>
        )}
      </div>
    </div>
  );
}
