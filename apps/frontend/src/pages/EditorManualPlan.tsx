/**
 * EditorManualPlan — página del editor de plan manual coexistente con IA.
 *
 * Implementa Task 2.9 del plan `editor-plan-manual-ia-ideas`.
 *
 * Responsabilidades:
 * - Carga la versión V2 actual del plan (GET /planes-alimentacion/:id)
 * - Mantiene estado local de `estructura` (EstructuraDiaFE[])
 * - Auto-save debounced 800ms via useDebounce → mutation silenciosa
 * - "Guardar borrador" → POST /planes-alimentacion/:id/persistir-manual
 *   → crea nueva versión inmutable con motivoCambio='edicion_manual'
 * - Orchestra: GrillaManualSlots + DialogResumenMacros + Button
 *
 * Accesibilidad:
 * - aria-live en mensajes de carga/error
 * - landmark <main>
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { GrillaManualSlots } from '@/components/plan/GrillaManualSlots';
import { DialogResumenMacros } from '@/components/plan/DialogResumenMacros';

import { apiRequest } from '@/lib/api';
import { useDebounce } from '@/hooks/useDebounce';
import type { EstructuraDiaFE, PlanAlimentacionDatosJsonFE } from '@/types/ia';
import type { ApiResponse } from '@/types/api';

interface Props {
  /** ID del plan de alimentación a editar. */
  planId: number;
  /** Nombre del paciente para mostrar en el header. */
  pacienteNombre: string;
}

/** Estructura inicial vacía: 7 días sin comidas. */
function crearEstructuraInicial(): EstructuraDiaFE[] {
  const dias: EstructuraDiaFE['dia'][] = [
    'LUNES',
    'MARTES',
    'MIERCOLES',
    'JUEVES',
    'VIERNES',
    'SABADO',
    'DOMINGO',
  ];
  return dias.map((dia) => ({
    dia,
    comidas: [
      { tipo: 'DESAYUNO', alternativas: [] },
      { tipo: 'ALMUERZO', alternativas: [] },
      { tipo: 'MERIENDA', alternativas: [] },
      { tipo: 'CENA', alternativas: [] },
    ],
  }));
}

/** Payload para POST /planes-alimentacion/:id/persistir-manual. */
interface PersistirManualPayload {
  dias: Array<{
    dia: string;
    orden: number;
    comidas: Array<{
      tipoComida: string;
      alternativas: Array<{
        nombre?: string;
        alimentos: Array<{
          alimentoId: number;
          cantidad: number;
          unidad?: string;
        }>;
      }>;
    }>;
  }>;
  notas?: string;
}

function estructuraToPayload(estructura: EstructuraDiaFE[]): PersistirManualPayload {
  return {
    dias: estructura.map((dia, orden) => ({
      dia: dia.dia,
      orden,
      comidas: dia.comidas.map((comida) => ({
        tipoComida: comida.tipo,
        alternativas: comida.alternativas.map((alt) => ({
          nombre: alt.nombre,
          alimentos: alt.alimentos,
        })),
      })),
    })),
  };
}

export function EditorManualPlan({ planId, pacienteNombre }: Props) {
  const [estructura, setEstructura] = useState<EstructuraDiaFE[]>(crearEstructuraInicial);
  const [cargandoVersion, setCargandoVersion] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [ultimoGuardado, setUltimoGuardado] = useState<Date | null>(null);
  const isMountedRef = useRef(true);

  // Carga versión V2 activa del plan al montar
  useEffect(() => {
    isMountedRef.current = true;
    setCargandoVersion(true);

    apiRequest<ApiResponse<{ datosJson: PlanAlimentacionDatosJsonFE; idPlanAlimentacionVersion: number }>>(
      `/planes-alimentacion/${planId}/versiones`,
    )
      .then((res) => {
        if (!isMountedRef.current) return;
        // Si el backend devuelve datosJson en la respuesta directa
        const datos = (res as { datosJson?: PlanAlimentacionDatosJsonFE }).datosJson;
        if (datos?.estructura) {
          setEstructura(datos.estructura);
        }
      })
      .catch(() => {
        // Si no hay versión previa, se trabaja con estructura vacía
        if (isMountedRef.current) {
          setEstructura(crearEstructuraInicial());
        }
      })
      .finally(() => {
        if (isMountedRef.current) setCargandoVersion(false);
      });

    return () => {
      isMountedRef.current = false;
    };
  }, [planId]);

  // Auto-save debounced (800ms) — mutation silenciosa sin toast
  const debouncedEstructura = useDebounce(estructura, 800);
  const persistirSilencioso = useCallback(
    async (estructuraParaGuardar: EstructuraDiaFE[]) => {
      try {
        await apiRequest(
          `/planes-alimentacion/${planId}/persistir-manual`,
          {
            method: 'POST',
            body: estructuraToPayload(estructuraParaGuardar),
          },
        );
        if (isMountedRef.current) setUltimoGuardado(new Date());
      } catch {
        // Auto-save silencioso — no molestar al usuario con toast en cada cambio
      }
    },
    [planId],
  );

  useEffect(() => {
    if (debouncedEstructura) {
      persistirSilencioso(debouncedEstructura);
    }
  }, [debouncedEstructura, persistirSilencioso]);

  // Guardado manual (botón "Guardar borrador")
  const guardarBorrador = async () => {
    setGuardando(true);
    try {
      await apiRequest<{ versionId: number }>(
        `/planes-alimentacion/${planId}/persistir-manual`,
        {
          method: 'POST',
          body: estructuraToPayload(estructura),
        },
      );
      setUltimoGuardado(new Date());
      toast.success('Borrador guardado correctamente');
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : 'Error al guardar borrador';
      toast.error(mensaje);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <main className="flex flex-col gap-4" data-testid="editor-manual-plan">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Editor Manual</h1>
          <p className="text-sm text-muted-foreground">{pacienteNombre}</p>
        </div>
        {ultimoGuardado && (
          <p className="text-xs text-muted-foreground" aria-live="polite">
            Guardado {ultimoGuardado.toLocaleTimeString()}
          </p>
        )}
      </div>

      {/* Loading state */}
      {cargandoVersion && (
        <p className="text-sm text-muted-foreground" aria-live="polite">
          Cargando versión del plan…
        </p>
      )}

      {/* Grilla de slots manuales */}
      <GrillaManualSlots planId={planId} estructura={estructura} onChange={setEstructura} />

      {/* Diálogo de resumen de macros (sticky bottom-right) */}
      <DialogResumenMacros estructura={estructura} />

      {/* Footer sticky con botón guardar */}
      <div
        className="fixed bottom-0 left-0 right-0 z-20 border-t bg-background/95 p-4 backdrop-blur"
        data-testid="editor-manual-plan-footer"
      >
        <div className="mx-auto max-w-5xl flex justify-end">
          <Button
            onClick={guardarBorrador}
            disabled={guardando}
            data-testid="btn-guardar-borrador"
          >
            {guardando ? 'Guardando…' : 'Guardar borrador'}
          </Button>
        </div>
      </div>
    </main>
  );
}
