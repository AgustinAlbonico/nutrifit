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
import { Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { GrillaManualSlots } from '@/components/plan/GrillaManualSlots';
import { DialogGenerarIdeasIa } from '@/components/plan/DialogGenerarIdeasIa';

import { apiRequest } from '@/lib/api';
import { desenvolverRespuestaApi } from '@/lib/api-response';
import { useDebounce } from '@/hooks/useDebounce';
import { normalizarVersionesPlan } from '@/hooks/useVersionesPlan';
import type { EstructuraDiaFE, PlanAlimentacionDatosJsonFE, DiaSemana, TipoComidaPlan, IdeaComidaIa, VersionPlanFE } from '@/types/ia';
import type { ApiResponse } from '@/types/api';

interface Props {
  /** ID del plan de alimentación a editar. */
  planId: number;
  /** Nombre del paciente para mostrar en el header. */
  pacienteNombre: string;
}

const DIAS_PLAN: DiaSemana[] = [
  'LUNES',
  'MARTES',
  'MIERCOLES',
  'JUEVES',
  'VIERNES',
  'SABADO',
  'DOMINGO',
];

const TIPOS_COMIDA_PLAN: TipoComidaPlan[] = [
  'DESAYUNO',
  'ALMUERZO',
  'MERIENDA',
  'CENA',
  'COLACION',
];

interface VersionPlanCompletaFE {
  id: number;
  planAlimentacionId: number;
  numeroVersion: number;
  datosJson: PlanAlimentacionDatosJsonFE;
}

/** Estructura inicial vacía: 7 días x 5 comidas. */
function crearEstructuraInicial(): EstructuraDiaFE[] {
  return DIAS_PLAN.map((dia) => ({
    dia,
    comidas: TIPOS_COMIDA_PLAN.map((tipo) => ({ tipo, alternativas: [] })),
  }));
}

function completarEstructuraManual(
  estructuraPersistida?: EstructuraDiaFE[],
): EstructuraDiaFE[] {
  const estructuraBase = crearEstructuraInicial();
  if (!estructuraPersistida || estructuraPersistida.length === 0) {
    return estructuraBase;
  }

  return estructuraBase.map((diaBase) => {
    const diaPersistido = estructuraPersistida.find((dia) => dia.dia === diaBase.dia);
    if (!diaPersistido) return diaBase;

    return {
      dia: diaBase.dia,
      comidas: diaBase.comidas.map((comidaBase) => {
        const comidaPersistida = diaPersistido.comidas.find(
          (comida) => comida.tipo === comidaBase.tipo,
        );
        return comidaPersistida
          ? { ...comidaPersistida, alternativas: comidaPersistida.alternativas ?? [] }
          : comidaBase;
      }),
    };
  });
}

function elegirVersionEditable(versiones: VersionPlanFE[]): VersionPlanFE | null {
  return versiones.find((version) => version.activa) ?? versiones[0] ?? null;
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
  const [guardando, setGuardando] = useState(false);
  const [ultimoGuardado, setUltimoGuardado] = useState<Date | null>(null);
  const [dialogoAbierto, setDialogoAbierto] = useState(false);
  const haSidoModificadoRef = useRef(false);
  const isMountedRef = useRef(true);

  // Carga el listado resumido y luego el snapshot completo de la versión activa.
  useEffect(() => {
    isMountedRef.current = true;

    const cargarVersion = async () => {
      try {
        const respuestaVersiones = await apiRequest<Parameters<typeof normalizarVersionesPlan>[0]>(
          `/planes-alimentacion/${planId}/versiones`,
        );
        const versionSeleccionada = elegirVersionEditable(
          normalizarVersionesPlan(respuestaVersiones, planId),
        );

        if (!isMountedRef.current) return;
        if (!versionSeleccionada) {
          setEstructura(crearEstructuraInicial());
          return;
        }

        const respuestaVersion = await apiRequest<
          VersionPlanCompletaFE | ApiResponse<VersionPlanCompletaFE>
        >(`/planes-alimentacion/version/${versionSeleccionada.idPlanAlimentacionVersion}`);
        const versionCompleta = desenvolverRespuestaApi(respuestaVersion);

        if (!isMountedRef.current) return;
        setEstructura(completarEstructuraManual(versionCompleta.datosJson?.estructura));
      } catch {
        // Si no hay versión previa, se trabaja con estructura vacía
        if (isMountedRef.current) {
          setEstructura(crearEstructuraInicial());
        }
      }
    };

    void cargarVersion();

    return () => {
      isMountedRef.current = false;
    };
  }, [planId]);

  const handleEstructuraChange = useCallback((nueva: EstructuraDiaFE[]) => {
    setEstructura(nueva);
    haSidoModificadoRef.current = true;
  }, []);

  const handleAddIdea = useCallback(
    (dia: DiaSemana, tipoComida: TipoComidaPlan, idea: IdeaComidaIa) => {
      setEstructura((prev) =>
        prev.map((d) => {
          if (d.dia !== dia) return d;
          return {
            ...d,
            comidas: d.comidas.map((c) => {
              if (c.tipo !== tipoComida) return c;
              return {
                ...c,
                alternativas: [
                  ...c.alternativas,
                  {
                    nombre: idea.nombre,
                    alimentos: idea.alimentos.map((a) => ({
                      alimentoId: a.alimentoId,
                      cantidad: a.cantidad,
                      unidad: a.unidad,
                    })),
                    calorias: idea.calorias,
                    proteinas: idea.proteinas,
                    carbohidratos: idea.carbohidratos,
                    grasas: idea.grasas,
                  },
                ],
              };
            }),
          };
        }),
      );
      haSidoModificadoRef.current = true;
    },
    [],
  );

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

  const tieneContenido = estructura.some((dia) =>
    dia.comidas.some((c) => c.alternativas.length > 0),
  );

  useEffect(() => {
    if (debouncedEstructura && haSidoModificadoRef.current && tieneContenido) {
      persistirSilencioso(debouncedEstructura);
    }
  }, [debouncedEstructura, tieneContenido, persistirSilencioso]);

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
    <main className="flex min-w-0 flex-col gap-4 pb-4" data-testid="editor-manual-plan">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold">Editor Manual</h1>
          <p className="text-sm text-muted-foreground">{pacienteNombre}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {ultimoGuardado && (
            <p className="text-xs text-muted-foreground" aria-live="polite">
              Guardado {ultimoGuardado.toLocaleTimeString()}
            </p>
          )}
          <Button variant="outline" onClick={() => setDialogoAbierto(true)}>
            <Sparkles className="mr-1.5 size-4" aria-hidden="true" />
            Sugerencias IA
          </Button>
        </div>
      </div>

      {/* Grilla de slots manuales */}
      <GrillaManualSlots estructura={estructura} onChange={handleEstructuraChange} />

      {/* Diálogo de generación de ideas IA */}
      <DialogGenerarIdeasIa
        open={dialogoAbierto}
        onOpenChange={setDialogoAbierto}
        planId={planId}
        onAddIdea={handleAddIdea}
      />

      {/* Footer sticky con botón guardar */}
      <div
        className="sticky bottom-0 z-20 rounded-2xl border bg-background/95 p-3 shadow-lg backdrop-blur sm:p-4"
        data-testid="editor-manual-plan-footer"
      >
        <div className="flex justify-end">
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
