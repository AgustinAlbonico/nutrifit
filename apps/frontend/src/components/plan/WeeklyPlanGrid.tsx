/**
 * Grilla semanal de plan de alimentación.
 *
 * Soporta DOS formatos de entrada:
 * - **V1 (legacy)**: array plano de `ComidaEnPlan[]` con alimentos editables
 *   uno a uno. Es lo que se usa en el editor "manual" donde el nutricionista
 *   agrega/edita/elimina alimentos slot por slot.
 * - **V2 (plan-alimentacion-ia-v2)**: `PlanAlimentacionDatosJsonFE` con
 *   `estructura` (días → comidas → alternativas) generada por la IA.
 *   Renderiza las alternativas como tabs por slot y permite regeneración
 *   granular (PLAN / DÍA / ALTERNATIVA).
 *
 * Si se pasa `planV2`, se renderiza la vista V2 (read-only + botones regen).
 * Si NO se pasa, se renderiza la vista V1 (editor con callbacks).
 *
 * Mobile-first: la vista mobile apila días en cards, la desktop muestra
 * la grilla 7×5 tradicional.
 *
 * Accesibilidad:
 * - Botones con aria-label descriptivo (regen, etc.)
 * - Estados de carga comunicados via aria-busy / aria-live
 * - Confirm dialog antes de regenerar una comida editada manualmente
 */

import { useMemo, useState } from 'react';
import {
  Loader2,
  RefreshCw,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';
import { MealSlotCard, type AlimentoEnComida } from './MealSlotCard';
export type { AlimentoEnComida } from './MealSlotCard';
import { DailyTotalsCard } from './DailyTotalsCard';
import { MacrosBadge } from './MacrosBadge';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import {
  DialogDetalleComida,
  type AlternativaDetalle,
} from './DialogDetalleComida';
import type {
  DiaSemana,
  PlanAlimentacionDatosJsonFE,
  ResumenMacrosDiaFE,
  TipoComidaPlan,
} from '@/types/ia';

const DIAS_SEMANA = [
  'LUNES',
  'MARTES',
  'MIERCOLES',
  'JUEVES',
  'VIERNES',
  'SABADO',
  'DOMINGO',
] as const;
const TIPOS_COMIDA = [
  'DESAYUNO',
  'ALMUERZO',
  'MERIENDA',
  'CENA',
  'COLACION',
] as const;

type TipoComida = typeof TIPOS_COMIDA[number];

export interface ComidaEnPlan {
  dia: DiaSemana;
  tipoComida: TipoComida;
  alimentos: AlimentoEnComida[];
}

// ============================================================================
// V1 — Editor manual (legacy)
// ============================================================================

interface PropsGrillaPlanSemanalV1 {
  comidas: ComidaEnPlan[];
  alAgregarAlimento: (dia: DiaSemana, tipoComida: TipoComida) => void;
  alEditarCantidad: (
    dia: DiaSemana,
    tipoComida: TipoComida,
    indiceAlimento: number,
    cantidad: number,
  ) => void;
  alEliminarAlimento: (
    dia: DiaSemana,
    tipoComida: TipoComida,
    indiceAlimento: number,
  ) => void;
}

// ============================================================================
// V2 — Plan IA con regeneración granular
// ============================================================================

export interface ManejadoresRegeneracion {
  /** Regenera el plan completo (scope=PLAN). */
  alRegenerarPlan?: () => void;
  /** Regenera un día puntual (scope=DIA). */
  alRegenerarDia?: (dia: DiaSemana) => void;
  /** Regenera una alternativa puntual (scope=ALTERNATIVA). */
  alRegenerarAlternativa?: (params: {
    dia: DiaSemana;
    comidaSlot: TipoComidaPlan;
    alternativaIndex: number;
  }) => void;
  /** IDs de slots (formato `${dia}-${tipoComida}`) que fueron editados manualmente. */
  slotsEditadosManualmente?: Set<string>;
  /** Si está regenerando algo (loader global). */
  estaRegenerando?: boolean;
}

interface PropsGrillaPlanSemanalV2 {
  planV2: PlanAlimentacionDatosJsonFE;
  regen?: ManejadoresRegeneracion;
}

// ============================================================================
// Props unificadas (discriminated union)
// ============================================================================

type PropsGrillaPlanSemanal =
  | (PropsGrillaPlanSemanalV1 & { planV2?: never; regen?: ManejadoresRegeneracion })
  | (PropsGrillaPlanSemanalV2 & {
      comidas?: never;
      alAgregarAlimento?: never;
      alEditarCantidad?: never;
      alEliminarAlimento?: never;
    });

export function WeeklyPlanGrid(props: PropsGrillaPlanSemanal) {
  if ('planV2' in props && props.planV2) {
    return <WeeklyPlanGridV2 planV2={props.planV2} regen={props.regen} />;
  }
  return <WeeklyPlanGridV1 {...(props as PropsGrillaPlanSemanalV1)} />;
}

// ============================================================================
// Implementación V1 (legacy)
// ============================================================================

function WeeklyPlanGridV1({
  comidas,
  alAgregarAlimento,
  alEditarCantidad,
  alEliminarAlimento,
}: PropsGrillaPlanSemanalV1) {
  const obtenerComida = (dia: DiaSemana, tipoComida: TipoComida): AlimentoEnComida[] => {
    const comida = comidas.find((c) => c.dia === dia && c.tipoComida === tipoComida);
    return comida?.alimentos ?? [];
  };

  const calcularTotalesDia = (dia: DiaSemana) => {
    const comidasDelDia = TIPOS_COMIDA.map((tipo) => obtenerComida(dia, tipo));

    return comidasDelDia.reduce(
      (acc, alimentos) => {
        alimentos.forEach((item) => {
          const multiplicador = item.cantidad / (item.alimento.cantidad || 1);
          acc.calorias += (item.alimento.calorias ?? 0) * multiplicador;
          acc.proteinas += (item.alimento.proteinas ?? 0) * multiplicador;
          acc.carbohidratos +=
            (item.alimento.carbohidratos ?? 0) * multiplicador;
          acc.grasas += (item.alimento.grasas ?? 0) * multiplicador;
        });
        return acc;
      },
      { calorias: 0, proteinas: 0, carbohidratos: 0, grasas: 0 },
    );
  };

  const formatearDia = (dia: DiaSemana): { corto: string; completo: string } => {
    const nombres: Record<DiaSemana, { corto: string; completo: string }> = {
      LUNES: { corto: 'Lun', completo: 'Lunes' },
      MARTES: { corto: 'Mar', completo: 'Martes' },
      MIERCOLES: { corto: 'Mié', completo: 'Miércoles' },
      JUEVES: { corto: 'Jue', completo: 'Jueves' },
      VIERNES: { corto: 'Vie', completo: 'Viernes' },
      SABADO: { corto: 'Sáb', completo: 'Sábado' },
      DOMINGO: { corto: 'Dom', completo: 'Domingo' },
    };
    return nombres[dia];
  };

  const esFinde = (dia: DiaSemana): boolean => {
    return dia === 'SABADO' || dia === 'DOMINGO';
  };

  return (
    <div className="space-y-4" data-testid="weekly-plan-grid-v1">
      {/* Desktop Grid */}
      <div className="hidden lg:block">
        <div className="w-full">
          {/* Header Row */}
          <div
            className="mb-3 grid gap-1.5"
            style={{ gridTemplateColumns: '85px repeat(7, minmax(0, 1fr))' }}
          >
            <div className="p-2" />
            {DIAS_SEMANA.map((dia) => {
              const totales = calcularTotalesDia(dia);
              return (
                <div
                  key={dia}
                  className={cn(
                    'rounded-xl p-2 text-center transition-all',
                    esFinde(dia)
                      ? 'bg-gradient-to-br from-purple-500/5 to-pink-500/5 dark:from-purple-500/10 dark:to-pink-500/10'
                      : 'bg-muted/30',
                  )}
                >
                  <div
                    className={cn(
                      'mb-1 text-sm font-semibold',
                      esFinde(dia) ? 'text-purple-700 dark:text-purple-300' : '',
                    )}
                  >
                    {formatearDia(dia).corto}
                  </div>
                  <DailyTotalsCard
                    calorias={Math.round(totales.calorias)}
                    proteinas={Math.round(totales.proteinas)}
                    carbohidratos={Math.round(totales.carbohidratos)}
                    grasas={Math.round(totales.grasas)}
                    compacto
                  />
                </div>
              );
            })}
          </div>
          {/* Meal Rows */}
          {TIPOS_COMIDA.map((tipoComida) => (
            <div
              key={tipoComida}
              className="mb-1.5 grid gap-1.5"
              style={{ gridTemplateColumns: '85px repeat(7, minmax(0, 1fr))' }}
            >
              <div className="flex items-center justify-end pr-2">
                <span className="text-sm font-medium text-muted-foreground capitalize">
                  {tipoComida.charAt(0) + tipoComida.slice(1).toLowerCase()}
                </span>
              </div>
              {DIAS_SEMANA.map((dia) => (
                <div
                  key={`${dia}-${tipoComida}`}
                  className="min-h-[100px]"
                >
                  <MealSlotCard
                    tipoComida={tipoComida}
                    alimentos={obtenerComida(dia, tipoComida)}
                    alAgregarAlimento={() => alAgregarAlimento(dia, tipoComida)}
                    alEditarCantidad={(indice, cantidad) =>
                      alEditarCantidad(dia, tipoComida, indice, cantidad)
                    }
                    alEliminarAlimento={(indice) =>
                      alEliminarAlimento(dia, tipoComida, indice)
                    }
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Mobile Stacked View */}
      <div className="space-y-6 lg:hidden">
        {DIAS_SEMANA.map((dia) => {
          const totales = calcularTotalesDia(dia);
          return (
            <div
              key={dia}
              className={cn(
                'overflow-hidden rounded-2xl border border-border/50',
                esFinde(dia)
                  ? 'bg-gradient-to-br from-purple-500/5 to-pink-500/5 dark:from-purple-500/10 dark:to-pink-500/10'
                  : 'bg-muted/20',
              )}
            >
              <div
                className={cn(
                  'border-b border-border/30 px-4 py-3',
                  esFinde(dia)
                    ? 'bg-gradient-to-r from-purple-500/10 to-pink-500/10'
                    : 'bg-muted/30',
                )}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3
                      className={cn(
                        'font-semibold',
                        esFinde(dia) ? 'text-purple-700 dark:text-purple-300' : '',
                      )}
                    >
                      {formatearDia(dia).completo}
                    </h3>
                  </div>
                  <DailyTotalsCard
                    calorias={Math.round(totales.calorias)}
                    proteinas={Math.round(totales.proteinas)}
                    carbohidratos={Math.round(totales.carbohidratos)}
                    grasas={Math.round(totales.grasas)}
                    compacto
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-3">
                {TIPOS_COMIDA.map((tipoComida) => (
                  <MealSlotCard
                    key={`${dia}-${tipoComida}-mobile`}
                    tipoComida={tipoComida}
                    alimentos={obtenerComida(dia, tipoComida)}
                    alAgregarAlimento={() => alAgregarAlimento(dia, tipoComida)}
                    alEditarCantidad={(indice, cantidad) =>
                      alEditarCantidad(dia, tipoComida, indice, cantidad)
                    }
                    alEliminarAlimento={(indice) =>
                      alEliminarAlimento(dia, tipoComida, indice)
                    }
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// Implementación V2 — Plan IA con estructura + alternativas + regen
// ============================================================================

function WeeklyPlanGridV2({ planV2, regen }: PropsGrillaPlanSemanalV2) {
  const [slotActivo, setSlotActivo] = useState<{
    dia: DiaSemana;
    tipo: TipoComidaPlan;
    alternativaIndex: number;
  } | null>(null);

  // Confirmación cuando se regenera un slot editado manualmente
  const [confirmAbierto, setConfirmAbierto] = useState<{
    scope: 'DIA' | 'ALTERNATIVA';
    dia: DiaSemana;
    tipo?: TipoComidaPlan;
    alternativaIndex?: number;
  } | null>(null);

  const [detalleComida, setDetalleComida] = useState<{
    alt: AlternativaDetalle;
    dia: DiaSemana;
    tipo: TipoComidaPlan;
  } | null>(null);
  const [detalleAbierto, setDetalleAbierto] = useState(false);
  const abrirDetalle = (
    alt: AlternativaDetalle,
    dia: DiaSemana,
    tipo: TipoComidaPlan,
  ) => {
    setDetalleComida({ alt, dia, tipo });
    setDetalleAbierto(true);
  };

  // Index de días para lookup rápido de macros
  const macrosPorDia = useMemo(() => {
    return (planV2.macrosPorDia ?? {}) as Partial<
      Record<DiaSemana, ResumenMacrosDiaFE>
    >;
  }, [planV2.macrosPorDia]);

  const estructuraPorDia = useMemo(() => {
    const mapa = new Map<
      DiaSemana,
      PlanAlimentacionDatosJsonFE['estructura'][number] | undefined
    >();
    planV2.estructura.forEach((diaEstructura) => {
      mapa.set(diaEstructura.dia, diaEstructura);
    });
    return mapa;
  }, [planV2.estructura]);

  const intentarRegenerar = (
    scope: 'DIA' | 'ALTERNATIVA',
    dia: DiaSemana,
    tipo?: TipoComidaPlan,
    alternativaIndex?: number,
  ) => {
    const clave = `${dia}-${tipo ?? ''}`;
    const fueEditado = regen?.slotsEditadosManualmente?.has(clave) ?? false;
    if (fueEditado) {
      setConfirmAbierto({ scope, dia, tipo, alternativaIndex });
      return;
    }
    ejecutarRegeneracion(scope, dia, tipo, alternativaIndex);
  };

  const ejecutarRegeneracion = (
    scope: 'DIA' | 'ALTERNATIVA',
    dia: DiaSemana,
    tipo?: TipoComidaPlan,
    alternativaIndex?: number,
  ) => {
    if (!regen) return;
    if (scope === 'DIA') {
      regen.alRegenerarDia?.(dia);
    } else if (scope === 'ALTERNATIVA' && tipo !== undefined && alternativaIndex !== undefined) {
      regen.alRegenerarAlternativa?.({ dia, comidaSlot: tipo, alternativaIndex });
    }
  };

  return (
    <div className="space-y-4" data-testid="weekly-plan-grid-v2">
      {/* Toolbar global: regenerar plan completo */}
      {regen?.alRegenerarPlan && (
        <div className="flex items-center justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={regen.alRegenerarPlan}
            disabled={regen.estaRegenerando}
            aria-label="Regenerar plan completo con IA"
            data-testid="regen-plan-button"
          >
            {regen.estaRegenerando ? (
              <Loader2 className="animate-spin" aria-hidden="true" />
            ) : (
              <RefreshCw aria-hidden="true" />
            )}
            Regenerar plan completo
          </Button>
        </div>
      )}

      {/* Desktop: Grilla 7 días */}
      <div className="hidden space-y-3 lg:block">
        {/* Header de días con macros */}
        <div
          className="grid gap-2"
          style={{ gridTemplateColumns: '110px repeat(7, minmax(0, 1fr))' }}
        >
          <div /> {/* esquina vacía */}
          {DIAS_SEMANA.map((dia) => {
            const resumenMacros = macrosPorDia[dia];
            const diaEstructura = estructuraPorDia.get(dia);
            const totalComidas = diaEstructura?.comidas.length ?? 0;
            return (
              <div
                key={dia}
                className="rounded-xl border border-border/40 bg-card p-2.5"
                data-testid={`dia-header-${dia}`}
              >
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold">
                    {formatearDiaCorto(dia)}
                  </span>
                  {resumenMacros && (
                    <MacrosBadge
                      banda={resumenMacros.banda ?? 'VERDE'}
                      desvioPorcentaje={resumenMacros.desvioPorcentaje ?? 0}
                      detalle={{
                        real: Math.round(resumenMacros.calorias ?? 0),
                        objetivo: Math.round(
                          resumenMacros.detallePorMacro?.calorias?.objetivo ?? 0,
                        ),
                      }}
                    />
                  )}
                </div>
                <div className="text-[10px] text-muted-foreground">
                  {totalComidas} comida{totalComidas === 1 ? '' : 's'}
                </div>
                {regen?.alRegenerarDia && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => intentarRegenerar('DIA', dia)}
                    disabled={regen.estaRegenerando}
                    aria-label={`Regenerar día ${formatearDiaCompleto(dia)} con IA`}
                    data-testid={`regen-dia-${dia}`}
                    className="mt-1.5 h-7 w-full justify-center px-2 text-xs"
                  >
                    {regen.estaRegenerando ? (
                      <Loader2
                        className="size-3 animate-spin"
                        aria-hidden="true"
                      />
                    ) : (
                      <RefreshCw className="size-3" aria-hidden="true" />
                    )}
                    Regenerar día
                  </Button>
                )}
              </div>
            );
          })}
        </div>

        {/* Filas por tipo de comida */}
        {TIPOS_COMIDA.map((tipo) => (
          <div
            key={tipo}
            className="grid gap-2"
            style={{ gridTemplateColumns: '110px repeat(7, minmax(0, 1fr))' }}
          >
            <div className="flex items-center justify-end pr-2">
              <span className="text-sm font-medium text-muted-foreground">
                {formatearTipoComida(tipo)}
              </span>
            </div>
            {DIAS_SEMANA.map((dia) => {
              const diaEstructura = estructuraPorDia.get(dia);
              const comidaEstructura = diaEstructura?.comidas.find(
                (c) => c.tipo === tipo,
              );
              const alternativas = comidaEstructura?.alternativas ?? [];
              const slotKey = `${dia}-${tipo}`;
              const fueEditado =
                regen?.slotsEditadosManualmente?.has(slotKey) ?? false;

              return (
                <div
                  key={`${dia}-${tipo}`}
                  className="min-h-[120px]"
                  data-testid={`slot-${dia}-${tipo}`}
                >
                  <SlotAlternativasV2
                    nombre={formatearTipoComida(tipo)}
                    alternativas={alternativas}
                    alternativaActivaIndex={slotActivo?.dia === dia && slotActivo.tipo === tipo ? slotActivo.alternativaIndex : 0}
                    onSelectAlternativa={(idx) =>
                      setSlotActivo({ dia, tipo, alternativaIndex: idx })
                    }
                    onRegenerarAlternativa={(idx) =>
                      intentarRegenerar('ALTERNATIVA', dia, tipo, idx)
                    }
                    onVerDetalle={(alt) => abrirDetalle(alt, dia, tipo)}
                    regenerando={regen?.estaRegenerando ?? false}
                    puedeRegenerarAlternativa={
                      regen?.alRegenerarAlternativa !== undefined
                    }
                    fueEditado={fueEditado}
                  />
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Mobile: stacked por día */}
      <div className="space-y-4 lg:hidden">
        {DIAS_SEMANA.map((dia) => {
          const resumenMacros = macrosPorDia[dia];
          const diaEstructura = estructuraPorDia.get(dia);
          return (
            <section
              key={dia}
              aria-label={`Comidas del ${formatearDiaCompleto(dia)}`}
              className="rounded-2xl border border-border/50 bg-card p-3"
            >
              <header className="mb-3 flex items-center justify-between">
                <h3 className="text-base font-semibold">
                  {formatearDiaCompleto(dia)}
                </h3>
                {resumenMacros && (
                  <MacrosBadge
                    banda={resumenMacros.banda}
                    desvioPorcentaje={resumenMacros.desvioPorcentaje}
                  />
                )}
              </header>

              <div className="space-y-3">
                {(diaEstructura?.comidas ?? []).map((comida) => {
                  const slotKey = `${dia}-${comida.tipo}`;
                  const fueEditado =
                    regen?.slotsEditadosManualmente?.has(slotKey) ?? false;
                  return (
                    <SlotAlternativasV2
                      key={`${dia}-${comida.tipo}-mobile`}
                      nombre={formatearTipoComida(comida.tipo)}
                      alternativas={comida.alternativas}
                      alternativaActivaIndex={
                        slotActivo?.dia === dia && slotActivo.tipo === comida.tipo
                          ? slotActivo.alternativaIndex
                          : 0
                      }
                      onSelectAlternativa={(idx) =>
                        setSlotActivo({
                          dia,
                          tipo: comida.tipo,
                          alternativaIndex: idx,
                        })
                      }
                      onRegenerarAlternativa={(idx) =>
                        intentarRegenerar('ALTERNATIVA', dia, comida.tipo, idx)
                      }
                      onVerDetalle={(alt) => abrirDetalle(alt, dia, comida.tipo)}
                      regenerando={regen?.estaRegenerando ?? false}
                      puedeRegenerarAlternativa={
                        regen?.alRegenerarAlternativa !== undefined
                      }
                      fueEditado={fueEditado}
                    />
                  );
                })}
              </div>

              {regen?.alRegenerarDia && (
                <div className="mt-3 flex justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => intentarRegenerar('DIA', dia)}
                    disabled={regen.estaRegenerando}
                    aria-label={`Regenerar ${formatearDiaCompleto(dia)} con IA`}
                    data-testid={`regen-dia-mobile-${dia}`}
                  >
                    {regen.estaRegenerando ? (
                      <Loader2
                        className="animate-spin"
                        aria-hidden="true"
                      />
                    ) : (
                      <RefreshCw aria-hidden="true" />
                    )}
                    Regenerar este día
                  </Button>
                </div>
              )}
            </section>
          );
        })}
      </div>

      {/* Confirmación de pérdida de edición manual */}
      <Dialog
        open={confirmAbierto !== null}
        onOpenChange={(abierto) => {
          if (!abierto) setConfirmAbierto(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle
                className="size-5 text-amber-500"
                aria-hidden="true"
              />
              Edición manual detectada
            </DialogTitle>
            <DialogDescription>
              Esta comida fue editada manualmente después de generarse. Si
              regenerás ahora, vas a perder esos cambios.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-sm text-amber-900 dark:text-amber-100">
            <p className="font-medium">
              ¿Regenerar de todas formas y perder los cambios manuales?
            </p>
            {confirmAbierto?.scope === 'DIA' && (
              <p className="text-xs">
                Día completo: {confirmAbierto && formatearDiaCompleto(confirmAbierto.dia)}
              </p>
            )}
            {confirmAbierto?.scope === 'ALTERNATIVA' && confirmAbierto.tipo && (
              <p className="text-xs">
                Alternativa #{confirmAbierto.alternativaIndex! + 1} de{' '}
                {formatearTipoComida(confirmAbierto.tipo)} del{' '}
                {formatearDiaCompleto(confirmAbierto.dia)}
              </p>
            )}
          </div>

          <DialogFooter showCloseButton={false}>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancelar
              </Button>
            </DialogClose>
            <Button
              type="button"
              variant="destructive"
              data-testid="confirm-regen-perder-cambios"
              onClick={() => {
                if (!confirmAbierto) return;
                ejecutarRegeneracion(
                  confirmAbierto.scope,
                  confirmAbierto.dia,
                  confirmAbierto.tipo,
                  confirmAbierto.alternativaIndex,
                );
                setConfirmAbierto(null);
              }}
            >
              Regenerar igual
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DialogDetalleComida
        open={detalleAbierto}
        onOpenChange={setDetalleAbierto}
        alternativa={detalleComida?.alt ?? null}
        diaLabel={detalleComida ? formatearDiaCompleto(detalleComida.dia) : ''}
        tipoComidaLabel={
          detalleComida ? formatearTipoComida(detalleComida.tipo) : ''
        }
      />
    </div>
  );
}

// ============================================================================
// Sub-componente: Slot con tabs de alternativas (V2)
// ============================================================================

interface PropsSlotAlternativasV2 {
  nombre: string;
  alternativas: PlanAlimentacionDatosJsonFE['estructura'][number]['comidas'][number]['alternativas'];
  alternativaActivaIndex: number;
  onSelectAlternativa: (index: number) => void;
  onRegenerarAlternativa: (index: number) => void;
  onVerDetalle: (alt: AlternativaDetalle) => void;
  regenerando: boolean;
  puedeRegenerarAlternativa: boolean;
  fueEditado: boolean;
}

function SlotAlternativasV2({
  nombre,
  alternativas,
  alternativaActivaIndex,
  onSelectAlternativa,
  onRegenerarAlternativa,
  onVerDetalle,
  regenerando,
  puedeRegenerarAlternativa,
  fueEditado,
}: PropsSlotAlternativasV2) {
  if (alternativas.length === 0) {
    return (
      <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-border/40 bg-muted/20 p-3 text-center text-xs text-muted-foreground">
        Sin alternativas
      </div>
    );
  }

  const alternativaActiva =
    alternativas[alternativaActivaIndex] ?? alternativas[0];

  return (
    <div className="flex h-full flex-col gap-2 rounded-xl border border-border/40 bg-card p-2">
      <div className="flex items-center justify-between gap-1">
        <span className="truncate text-xs font-semibold">{nombre}</span>
        {fueEditado && (
          <Badge
            variant="secondary"
            aria-label="Comida editada manualmente"
            className="bg-amber-500/15 px-1 py-0 text-[9px] text-amber-700 dark:text-amber-300"
          >
            Editado
          </Badge>
        )}
      </div>

      {/* Tabs de alternativas */}
      <Tabs
        value={String(alternativaActivaIndex)}
        onValueChange={(v) => onSelectAlternativa(Number(v))}
      >
        <TabsList className="h-7 w-full">
          {alternativas.map((_alt, idx) => (
            <TabsTrigger
              key={idx}
              value={String(idx)}
              data-testid={`alt-tab-${idx}`}
              aria-label={`Alternativa ${idx + 1}`}
              className="h-5 flex-1 px-1 text-[10px]"
            >
              {idx + 1}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Detalle de la alternativa activa */}
      <div
        className="flex-1 space-y-1 overflow-hidden rounded-md p-1 -m-1 cursor-pointer transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
        role="button"
        tabIndex={0}
        aria-label={`Ver detalle de ${alternativaActiva.nombre}`}
        onClick={() => onVerDetalle(alternativaActiva as AlternativaDetalle)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onVerDetalle(alternativaActiva as AlternativaDetalle);
          }
        }}
      >
        <p
          className="truncate text-xs font-medium"
          title={alternativaActiva.nombre}
        >
          {alternativaActiva.nombre}
        </p>
        <ul className="space-y-0.5 text-[10px] text-muted-foreground">
          {alternativaActiva.alimentos.slice(0, 3).map((ali, idx) => (
            <li key={idx} className="truncate">
              • {ali.cantidad}
              {ali.unidad} de alimento #{ali.alimentoId}
            </li>
          ))}
          {alternativaActiva.alimentos.length > 3 && (
            <li className="text-[10px] italic">
              +{alternativaActiva.alimentos.length - 3} más
            </li>
          )}
        </ul>
        <div className="flex items-center gap-1.5 pt-1 text-[10px] tabular-nums text-muted-foreground">
          <span className="font-semibold text-foreground">
            {Math.round(alternativaActiva.calorias)}
          </span>
          <span>kcal</span>
          <span>·</span>
          <span>P{Math.round(alternativaActiva.proteinas)}g</span>
          <span>C{Math.round(alternativaActiva.carbohidratos)}g</span>
          <span>G{Math.round(alternativaActiva.grasas)}g</span>
        </div>
      </div>

      {/* Botón regen alternativa */}
      {puedeRegenerarAlternativa && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onRegenerarAlternativa(alternativaActivaIndex)}
          disabled={regenerando}
          aria-label={`Regenerar alternativa ${alternativaActivaIndex + 1} con IA`}
          data-testid={`regen-alt-${alternativaActivaIndex}`}
          className="h-6 w-full justify-center px-1 text-[10px]"
        >
          {regenerando ? (
            <Loader2 className="size-3 animate-spin" aria-hidden="true" />
          ) : (
            <Sparkles className="size-3" aria-hidden="true" />
          )}
          Regenerar alt.
        </Button>
      )}
    </div>
  );
}

// ============================================================================
// Helpers de formato
// ============================================================================

function formatearDiaCorto(dia: DiaSemana): string {
  const mapa: Record<DiaSemana, string> = {
    LUNES: 'Lun',
    MARTES: 'Mar',
    MIERCOLES: 'Mié',
    JUEVES: 'Jue',
    VIERNES: 'Vie',
    SABADO: 'Sáb',
    DOMINGO: 'Dom',
  };
  return mapa[dia];
}

function formatearDiaCompleto(dia: DiaSemana): string {
  const mapa: Record<DiaSemana, string> = {
    LUNES: 'Lunes',
    MARTES: 'Martes',
    MIERCOLES: 'Miércoles',
    JUEVES: 'Jueves',
    VIERNES: 'Viernes',
    SABADO: 'Sábado',
    DOMINGO: 'Domingo',
  };
  return mapa[dia];
}

function formatearTipoComida(tipo: TipoComidaPlan): string {
  const mapa: Record<TipoComidaPlan, string> = {
    DESAYUNO: 'Desayuno',
    ALMUERZO: 'Almuerzo',
    MERIENDA: 'Merienda',
    CENA: 'Cena',
    COLACION: 'Colación',
  };
  return mapa[tipo];
}
