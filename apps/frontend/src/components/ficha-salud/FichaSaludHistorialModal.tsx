/**
 * Modal con la lista de versiones históricas de la ficha de salud.
 *
 * Layout: split panel — lista a la izquierda, detalle a la derecha.
 * - Lista con `<ScrollArea>` de shadcn.
 * - Click (o Enter) en un item llama a `onSeleccionarVersion(n)`.
 * - Navegación con flechas y Enter funciona (roving tabindex + handlers).
 *
 * Accesibilidad:
 * - `role="dialog"` lo provee shadcn.
 * - Lista implementa `role="listbox"` con `role="option"` y `aria-selected`.
 *
 * RBs: RB50 (UI).
 */

import { useEffect, useRef, useState } from 'react';
import { History, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { formatFechaCorta } from '@/lib/fechas';
import { cn } from '@/lib/utils';

import { FichaSaludVersionDetalle } from './FichaSaludVersionDetalle';
import type { DatosVersion, HistorialItem } from '@/types/ficha-salud';

interface PropiedadesModalHistorial {
  open: boolean;
  onClose: () => void;
  versiones: HistorialItem[] | undefined;
  cargando: boolean;
  error?: string | null;
  versionSeleccionada: number | null;
  datosVersion: DatosVersion | undefined;
  cargandoVersion: boolean;
  errorVersion?: string | null;
  onSeleccionarVersion: (n: number) => void;
}

export function FichaSaludHistorialModal({
  open,
  onClose,
  versiones,
  cargando,
  error,
  versionSeleccionada,
  datosVersion,
  cargandoVersion,
  errorVersion,
  onSeleccionarVersion,
}: PropiedadesModalHistorial) {
  const contenedorListaRef = useRef<HTMLDivElement | null>(null);
  const [indiceFoco, setIndiceFoco] = useState<number>(0);

  useEffect(() => {
    if (open && versionSeleccionada == null && versiones && versiones.length > 0) {
      onSeleccionarVersion(versiones[0]!.version);
    }
  }, [open, versionSeleccionada, versiones, onSeleccionarVersion]);

  const manejarTeclado = (evento: React.KeyboardEvent<HTMLDivElement>) => {
    if (!versiones || versiones.length === 0) return;
    if (evento.key === 'ArrowDown') {
      evento.preventDefault();
      setIndiceFoco((prev) => Math.min(prev + 1, versiones.length - 1));
    } else if (evento.key === 'ArrowUp') {
      evento.preventDefault();
      setIndiceFoco((prev) => Math.max(prev - 1, 0));
    } else if (evento.key === 'Enter' || evento.key === ' ') {
      evento.preventDefault();
      const item = versiones[indiceFoco];
      if (item) onSeleccionarVersion(item.version);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(abierto) => !abierto && onClose()}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" aria-hidden="true" />
            <span>
              Historial de versiones
            </span>
          </DialogTitle>
          <DialogDescription>
            Cada cambio en tu ficha de salud genera una nueva versión. Hacé
            clic en una para ver los datos que contenía.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-[220px_1fr]">
          <div className="space-y-2">
            <p
              className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
              id="etiqueta-lista-versiones"
            >
              Versiones
            </p>
            <ScrollArea
              className="h-72 rounded-md border border-border/60"
              aria-labelledby="etiqueta-lista-versiones"
            >
              <div
                ref={contenedorListaRef}
                role="listbox"
                aria-label="Lista de versiones de la ficha"
                aria-activedescendant={
                  versiones && versiones[indiceFoco]
                    ? `version-${versiones[indiceFoco]!.version}`
                    : undefined
                }
                tabIndex={0}
                onKeyDown={manejarTeclado}
                className="flex flex-col gap-1 p-2 outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
              >
                {cargando && (
                  <div
                    className="space-y-2 p-2"
                    aria-busy="true"
                    aria-live="polite"
                  >
                    {Array.from({ length: 3 }).map((_, idx) => (
                      <Skeleton key={idx} className="h-12 w-full" />
                    ))}
                  </div>
                )}

                {error && !cargando && (
                  <p
                    className="rounded-md border border-destructive/30 bg-destructive/5 p-2 text-xs text-destructive"
                    role="alert"
                  >
                    {error}
                  </p>
                )}

                {!cargando && !error && versiones && versiones.length === 0 && (
                  <p className="p-2 text-sm text-muted-foreground">
                    Todavía no tenés versiones registradas.
                  </p>
                )}

                {!cargando &&
                  !error &&
                  versiones?.map((item, indice) => {
                    const seleccionada = versionSeleccionada === item.version;
                    return (
                      <button
                        type="button"
                        key={item.version}
                        id={`version-${item.version}`}
                        role="option"
                        aria-selected={seleccionada}
                        onClick={() => {
                          setIndiceFoco(indice);
                          onSeleccionarVersion(item.version);
                        }}
                        onFocus={() => setIndiceFoco(indice)}
                        className={cn(
                          'flex flex-col items-start gap-0.5 rounded-md border p-2 text-left text-sm transition-colors',
                          seleccionada
                            ? 'border-primary bg-primary/10 text-foreground'
                            : 'border-transparent hover:border-border hover:bg-muted',
                          indiceFoco === indice && 'ring-2 ring-ring/30',
                        )}
                      >
                        <span className="font-semibold">v{item.version}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatFechaCorta(item.createdAt)}
                        </span>
                      </button>
                    );
                  })}
              </div>
            </ScrollArea>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Detalle
            </p>
            <div className="min-h-72 rounded-md border border-border/60 bg-muted/20 p-3">
              {versionSeleccionada == null && (
                <p className="text-sm text-muted-foreground">
                  Seleccioná una versión de la lista para ver su contenido.
                </p>
              )}
              {versionSeleccionada != null && cargandoVersion && (
                <div
                  className="flex items-center gap-2 text-sm text-muted-foreground"
                  aria-busy="true"
                  aria-live="polite"
                >
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Cargando versión {versionSeleccionada}…
                </div>
              )}
              {versionSeleccionada != null && errorVersion && (
                <p
                  className="rounded-md border border-destructive/30 bg-destructive/5 p-2 text-sm text-destructive"
                  role="alert"
                >
                  {errorVersion}
                </p>
              )}
              {versionSeleccionada != null &&
                !cargandoVersion &&
                !errorVersion &&
                datosVersion && (
                  <FichaSaludVersionDetalle
                    version={datosVersion.version}
                    fecha={datosVersion.createdAt}
                    datos={datosVersion.datos}
                  />
                )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
