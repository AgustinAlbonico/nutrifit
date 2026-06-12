import { useEffect, useState } from 'react';
import { CheckCircle2, FileWarning, Loader2, Search, User, XCircle } from 'lucide-react';

import { useSociosParaAsignar } from '@/hooks/useSociosParaAsignar';
import type { SocioConFicha } from '@/types/asignar-turno';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface BuscadorSocioProps {
  /** Rol del actor: determina si los socios sin ficha se muestran bloqueados o como aviso. */
  rolActor: 'RECEPCIONISTA' | 'ADMIN' | 'NUTRICIONISTA' | null;
  /** Socio actualmente seleccionado. `null` si no hay ninguno. */
  socioSeleccionado: SocioConFicha | null;
  /** Callback al seleccionar un socio. */
  onSeleccionar: (socio: SocioConFicha) => void;
  /** Callback al limpiar la seleccion. */
  onLimpiar: () => void;
}

/**
 * Input con busqueda debounced + lista de resultados.
 *
 * Comportamiento diferencial por rol (politica RB14):
 *  - `RECEPCION` / `ADMIN`: el item de socio sin ficha se muestra
 *    con badge ambar "Ficha incompleta" y SE PUEDE seleccionar.
 *  - `NUTRICIONISTA`: el item de socio sin ficha se renderiza
 *    `disabled` con `cursor-not-allowed` y un overlay ambar; NO
 *    se puede seleccionar.
 */
export function BuscadorSocio({
  rolActor,
  socioSeleccionado,
  onSeleccionar,
  onLimpiar,
}: BuscadorSocioProps) {
  const [busqueda, setBusqueda] = useState('');
  const { data: socios, isLoading, error } = useSociosParaAsignar(busqueda);

  // Si cambia el socio seleccionado externamente, vaciamos el input
  // para que la lista no muestre resultados obsoletos.
  useEffect(() => {
    if (!socioSeleccionado && busqueda.length > 0) {
      // mantiene la busqueda actual; la lista se actualiza sola
    }
  }, [socioSeleccionado, busqueda]);

  const esNutricionista = rolActor === 'NUTRICIONISTA';

  return (
    <div className="space-y-3" data-testid="buscador-socio">
      {socioSeleccionado ? (
        <div
          className="flex items-center justify-between gap-2 rounded-md border border-orange-300 bg-orange-50 p-3"
          data-testid="socio-seleccionado"
        >
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-orange-600" />
            <div>
              <p className="text-sm font-medium">
                {socioSeleccionado.nombreCompleto ??
                  `${socioSeleccionado.nombre} ${socioSeleccionado.apellido}`.trim()}
              </p>
              {socioSeleccionado.dni && (
                <p className="text-xs text-muted-foreground">
                  DNI: {socioSeleccionado.dni}
                </p>
              )}
              <p className="mt-1 text-xs">
                {socioSeleccionado.tieneFichaSalud ? (
                  <span className="inline-flex items-center gap-1 text-emerald-600">
                    <CheckCircle2 className="h-3 w-3" /> Ficha completa
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-amber-600">
                    <FileWarning className="h-3 w-3" /> Ficha incompleta
                  </span>
                )}
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={onLimpiar}>
            Cambiar socio
          </Button>
        </div>
      ) : (
        <>
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              aria-label="Buscar socio"
              aria-required="true"
              data-testid="input-buscar-socio"
              placeholder="Buscar por nombre, apellido, DNI o email..."
              className="pl-10"
              value={busqueda}
              onChange={(evento) => setBusqueda(evento.target.value)}
            />
          </div>

          {error && (
            <p className="text-sm text-destructive" role="alert">
              No se pudo buscar el socio. Intentá nuevamente.
            </p>
          )}

          {busqueda.trim().length < 2 ? (
            <p className="text-sm text-muted-foreground">
              Escribí al menos 2 caracteres para buscar.
            </p>
          ) : isLoading ? (
            <div
              className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground"
              role="status"
              aria-live="polite"
            >
              <Loader2 className="h-4 w-4 animate-spin" /> Buscando socios...
            </div>
          ) : socios.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No se encontraron socios con esa busqueda.
            </p>
          ) : (
            <div
              className="max-h-64 space-y-2 overflow-y-auto pr-1"
              role="listbox"
              aria-label="Resultados de busqueda de socios"
            >
              {socios.map((socio) => {
                const fichaIncompleta = !socio.tieneFichaSalud;
                const bloqueadoPorRol = esNutricionista && fichaIncompleta;
                const nombreCompleto =
                  socio.nombreCompleto ??
                  `${socio.nombre} ${socio.apellido}`.trim();

                return (
                  <button
                    key={socio.idPersona}
                    type="button"
                    role="option"
                    aria-selected={false}
                    aria-disabled={bloqueadoPorRol}
                    data-testid={`socio-item-${socio.idPersona}`}
                    data-ficha-incompleta={fichaIncompleta}
                    disabled={bloqueadoPorRol}
                    onClick={() => {
                      if (!bloqueadoPorRol) {
                        onSeleccionar(socio);
                      }
                    }}
                    className={cn(
                      'relative flex w-full items-center justify-between gap-2 rounded-lg border p-3 text-left transition-colors',
                      bloqueadoPorRol
                        ? 'cursor-not-allowed border-border bg-muted/30 opacity-60'
                        : 'border-border hover:bg-muted/50',
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <User className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{nombreCompleto}</p>
                        {socio.dni && (
                          <p className="text-xs text-muted-foreground">
                            DNI: {socio.dni}
                          </p>
                        )}
                      </div>
                    </div>
                    {fichaIncompleta ? (
                      esNutricionista ? (
                        <div className="flex flex-col items-end gap-1 text-right">
                          <span
                            className="inline-flex items-center gap-1 text-xs font-medium text-amber-600"
                            data-testid="badge-ficha-bloqueada"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            Ficha incompleta: no se puede asignar
                          </span>
                        </div>
                      ) : (
                        <span
                          className="inline-flex items-center gap-1 text-xs font-medium text-amber-600"
                          data-testid="badge-ficha-advertencia"
                        >
                          <FileWarning className="h-3.5 w-3.5" />
                          Ficha incompleta
                        </span>
                      )
                    ) : (
                      <CheckCircle2
                        className="h-5 w-5 text-emerald-500"
                        aria-label="Ficha completa"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
