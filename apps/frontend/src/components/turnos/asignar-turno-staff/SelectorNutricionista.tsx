import { Loader2, UserCog } from 'lucide-react';

import { useNutricionistasParaAsignar } from '@/hooks/useNutricionistasParaAsignar';
import type { NutricionistaActivo } from '@/types/asignar-turno';
import { Label } from '@/components/ui/label';

interface SelectorNutricionistaProps {
  /** Valor seleccionado. `null` si no hay ninguno. */
  value: number | null;
  /** Callback al cambiar el nutricionista seleccionado. */
  onChange: (id: number) => void;
  /** Si el selector debe estar deshabilitado (e.g. nutri autocompletado). */
  disabled?: boolean;
  /** ID del test (opcional). */
  testId?: string;
}

/**
 * Selector de nutricionista para recepcion / admin.
 *
 * Para `NUTRICIONISTA` el componente no se renderiza: el padre
 * (la page) auto-setea `nutricionistaId = personaId` y oculta este
 * selector. Ver `AsignarTurnoPage` para el flujo completo.
 *
 * El selector usa el hook `useNutricionistasParaAsignar` y muestra
 * un select nativo accesible (combobox simple sin shadcn
 * `<Command>` para evitar acoplar el feature a un componente
 * pesado que no es necesario para una lista pequena).
 */
export function SelectorNutricionista({
  value,
  onChange,
  disabled = false,
  testId = 'selector-nutricionista',
}: SelectorNutricionistaProps) {
  const { data: nutricionistas, isLoading, error } = useNutricionistasParaAsignar();

  return (
    <div className="space-y-2" data-testid={testId}>
      <Label htmlFor="select-nutricionista" className="flex items-center gap-2">
        <UserCog className="h-4 w-4 text-orange-500" />
        Nutricionista
        <span className="text-destructive" aria-label="obligatorio">
          *
        </span>
      </Label>

      {isLoading ? (
        <div
          className="flex items-center gap-2 text-sm text-muted-foreground"
          role="status"
          aria-live="polite"
        >
          <Loader2 className="h-4 w-4 animate-spin" /> Cargando profesionales...
        </div>
      ) : error ? (
        <p className="text-sm text-destructive" role="alert">
          No se pudieron cargar los profesionales. Intentá recargar la pagina.
        </p>
      ) : nutricionistas.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No hay profesionales activos en este gimnasio.
        </p>
      ) : (
        <select
          id="select-nutricionista"
          aria-label="Seleccionar nutricionista"
          aria-required="true"
          data-testid="select-nutricionista"
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
          value={value ?? ''}
          onChange={(evento) => {
            const id = Number(evento.target.value);
            if (Number.isFinite(id) && id > 0) {
              onChange(id);
            }
          }}
          disabled={disabled}
        >
          <option value="" disabled>
            Selecciona un profesional
          </option>
          {nutricionistas.map((nutri: NutricionistaActivo) => (
            <option key={nutri.idPersona} value={nutri.idPersona}>
              {nutri.nombreCompleto ??
                `${nutri.nombre} ${nutri.apellido}`.trim()}
              {nutri.matricula ? ` (Mat. ${nutri.matricula})` : ''}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
