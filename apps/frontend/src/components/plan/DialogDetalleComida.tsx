import { useQueries } from '@tanstack/react-query';
import {
  Flame,
  Activity,
  Droplet,
  Circle,
  ChefHat,
  Loader2,
  X,
} from 'lucide-react';

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { obtenerAlimento } from '@/lib/api/alimentos';

export interface AlternativaDetalle {
  nombre: string;
  alimentos: Array<{
    alimentoId: number;
    cantidad: number;
    unidad: string;
    nombre?: string;
  }>;
  calorias: number;
  proteinas: number;
  carbohidratos: number;
  grasas: number;
  preparacionId?: number | null;
}

interface DialogDetalleComidaProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  alternativa: AlternativaDetalle | null;
  diaLabel: string;
  tipoComidaLabel: string;
}

const formatearCantidad = (cantidad: number, unidad: string): string => {
  const numero = Number.isInteger(cantidad) ? cantidad.toString() : cantidad.toFixed(1);
  return `${numero} ${unidad}`;
};

export function DialogDetalleComida({
  open,
  onOpenChange,
  alternativa,
  diaLabel,
  tipoComidaLabel,
}: DialogDetalleComidaProps) {
  const { token } = useAuth();

  const alimentosSinNombre = (alternativa?.alimentos ?? []).filter(
    (a) => !a.nombre || a.nombre.trim().length === 0,
  );

  const consultasNombre = useQueries({
    queries: alimentosSinNombre.map((a) => ({
      queryKey: ['alimento', a.alimentoId, token ?? null] as const,
      queryFn: async () => {
        if (!token) return null;
        return obtenerAlimento(token, a.alimentoId);
      },
      enabled: Boolean(token) && open,
      staleTime: 5 * 60 * 1000,
    })),
  });

  const mapaNombres = new Map<number, string>();
  consultasNombre.forEach((consulta, idx) => {
    const alimentoOriginal = alimentosSinNombre[idx];
    if (!alimentoOriginal) return;
    if (consulta.data?.nombre) {
      mapaNombres.set(alimentoOriginal.alimentoId, consulta.data.nombre);
    }
  });

  const cargandoNombres = consultasNombre.some((c) => c.isLoading);

  const resolverNombre = (ali: AlternativaDetalle['alimentos'][number]): string => {
    if (ali.nombre && ali.nombre.trim().length > 0) return ali.nombre;
    return mapaNombres.get(ali.alimentoId) ?? '';
  };

  return (
    <Dialog
      open={open && alternativa !== null}
      onOpenChange={onOpenChange}
    >
      <DialogContent
        className="sm:max-w-2xl gap-0 overflow-hidden p-0"
        data-testid="dialog-detalle-comida"
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        {alternativa && (
          <>
            <DialogHeader className="border-b bg-gradient-to-br from-emerald-50/60 via-background to-background px-6 py-4 dark:from-emerald-950/20">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <DialogTitle className="flex items-center gap-2 text-lg">
                    {alternativa.preparacionId && (
                      <ChefHat className="size-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    )}
                    <span className="truncate">{alternativa.nombre || 'Comida sin nombre'}</span>
                  </DialogTitle>
                  <DialogDescription className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">
                    {diaLabel} · {tipoComidaLabel}
                  </DialogDescription>
                </div>
                <DialogClose asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 shrink-0 rounded-full"
                    aria-label="Cerrar"
                  >
                    <X className="size-4" />
                  </Button>
                </DialogClose>
              </div>
            </DialogHeader>

            <div className="max-h-[60vh] overflow-y-auto px-6 py-4">
              {/* Sección Ingredientes */}
              <section className="mb-5">
                <header className="mb-2 flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    Ingredientes
                  </h3>
                  <span className="text-[10px] font-semibold text-muted-foreground tabular-nums">
                    {alternativa.alimentos.length}
                  </span>
                </header>
                <ul className="divide-y divide-border/60 rounded-xl border border-border/60 bg-card/50">
                  {alternativa.alimentos.map((ali, idx) => {
                    const nombreResuelto = resolverNombre(ali);
                    const estaCargando =
                      cargandoNombres &&
                      (!ali.nombre || ali.nombre.trim().length === 0) &&
                      !mapaNombres.has(ali.alimentoId);

                    return (
                      <li
                        key={`${ali.alimentoId}-${idx}`}
                        className="flex items-center justify-between gap-3 px-3 py-2.5"
                        data-testid={`detalle-ingrediente-${idx}`}
                      >
                        <div className="flex min-w-0 flex-1 items-center gap-2">
                          <span className="size-1.5 shrink-0 rounded-full bg-emerald-500/70" />
                          {estaCargando ? (
                            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Loader2 className="size-3 animate-spin" />
                              <span>Cargando nombre…</span>
                            </span>
                          ) : nombreResuelto ? (
                            <span className="truncate text-sm font-medium text-foreground">
                              {nombreResuelto}
                            </span>
                          ) : (
                            <span className="truncate text-sm italic text-muted-foreground">
                              Alimento #{ali.alimentoId}
                            </span>
                          )}
                        </div>
                        <span className="shrink-0 rounded-md bg-muted/60 px-2 py-0.5 text-xs font-semibold tabular-nums text-foreground">
                          {formatearCantidad(ali.cantidad, ali.unidad)}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </section>

              {/* Sección Macros totales */}
              <section data-testid="detalle-macros">
                <header className="mb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    Macros totales
                  </h3>
                </header>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <div className="flex flex-col items-center justify-center rounded-xl border border-orange-200 bg-orange-50 px-3 py-3 dark:border-orange-900/30 dark:bg-orange-950/20">
                    <Flame className="mb-1 size-4 text-orange-500" />
                    <span className="text-xl font-bold tabular-nums text-orange-600 dark:text-orange-400">
                      {Math.round(alternativa.calorias)}
                    </span>
                    <span className="mt-0.5 text-[9px] font-semibold uppercase text-orange-500/80">
                      kcal
                    </span>
                  </div>
                  <div className="flex flex-col items-center justify-center rounded-xl border border-green-200 bg-green-50 px-3 py-3 dark:border-green-900/30 dark:bg-green-950/20">
                    <Activity className="mb-1 size-4 text-green-500" />
                    <span className="text-xl font-bold tabular-nums text-green-600 dark:text-green-400">
                      {Math.round(alternativa.proteinas)}g
                    </span>
                    <span className="mt-0.5 text-[9px] font-semibold uppercase text-green-500/80">
                      Proteínas
                    </span>
                  </div>
                  <div className="flex flex-col items-center justify-center rounded-xl border border-blue-200 bg-blue-50 px-3 py-3 dark:border-blue-900/30 dark:bg-blue-950/20">
                    <Droplet className="mb-1 size-4 text-blue-500" />
                    <span className="text-xl font-bold tabular-nums text-blue-600 dark:text-blue-400">
                      {Math.round(alternativa.carbohidratos)}g
                    </span>
                    <span className="mt-0.5 text-[9px] font-semibold uppercase text-blue-500/80">
                      Carbohidratos
                    </span>
                  </div>
                  <div className="flex flex-col items-center justify-center rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 dark:border-amber-900/30 dark:bg-amber-950/20">
                    <Circle className="mb-1 size-4 text-amber-500" />
                    <span className="text-xl font-bold tabular-nums text-amber-600 dark:text-amber-400">
                      {Math.round(alternativa.grasas)}g
                    </span>
                    <span className="mt-0.5 text-[9px] font-semibold uppercase text-amber-500/80">
                      Grasas
                    </span>
                  </div>
                </div>
              </section>
            </div>

            <DialogFooter className="border-t bg-background/80 px-6 py-3">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                data-testid="detalle-cerrar"
                className="rounded-xl"
              >
                Cerrar
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}