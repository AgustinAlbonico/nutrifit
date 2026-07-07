/* eslint-disable react-refresh/only-export-components */
/**
 * GeneracionPlanIaContext — Provider global para el estado de generación IA
 * del plan de alimentación.
 *
 * ANTES: el polling y la visibilidad del badge vivían en `PlanEditorPage`.
 * Al navegar fuera de la página, el badge se desmontaba y el nutricionista
 * perdía la pista de la generación en curso.
 *
 * AHORA: este Provider se monta en `App.tsx` (por encima de RouterProvider).
 * Mantiene el último `{socioId, planAlimentacionId, generacionIdEspecifica}`
 * conocido y ejecuta los hooks de polling mientras haya un socio seteado.
 * Esto permite que el badge siga visible (y actualizado) al navegar entre
 * pantallas del módulo profesional.
 *
 * El efecto de "cierre" de la generación (cuando llega a COMPLETADO/ERROR)
 * también vive aquí, de forma que el estado se limpie de forma consistente
 * aunque el usuario no esté en el editor.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';

import {
  esGeneracionPlanIaActiva,
  useGeneracionPlanIa as useGeneracionPlanIaQuery,
  useGeneracionPlanIaActiva,
} from '@/hooks/useIa';
import type { GeneracionPlanIaFE } from '@/types/ia';

interface GeneracionPlanIaIds {
  socioId: number | null;
  planAlimentacionId: number | null;
  generacionIdEspecifica: number | null;
}

interface GeneracionPlanIaValor {
  /** Generación visible (específica o activa). null si no hay ninguna. */
  generacionVisible: GeneracionPlanIaFE | null;
  /** ID crudo de la generación específica que se está siguiendo. */
  generacionPlanIa: GeneracionPlanIaFE | null;
  /** ID crudo de la generación activa que devolvió el backend. */
  generacionActiva: GeneracionPlanIaFE | null;
  /** True si la generación visible está PENDIENTE o GENERANDO. */
  planBloqueadoPorIa: boolean;
  /** Setea los IDs del contexto (socio/plan/generación). */
  setIds: (ids: Partial<GeneracionPlanIaIds>) => void;
  /** Limpia la generación específica (mantiene socio/plan). */
  limpiarGeneracionEspecifica: () => void;
  /** Limpia todo el estado (al cerrar sesión o desmontar). */
  limpiar: () => void;
}

const GeneracionPlanIaContext = createContext<GeneracionPlanIaValor | undefined>(undefined);

export function GeneracionPlanIaProvider({ children }: { children: ReactNode }) {
  const [socioId, setSocioId] = useState<number | null>(null);
  const [planAlimentacionId, setPlanAlimentacionId] = useState<number | null>(null);
  const [generacionIdEspecifica, setGeneracionIdEspecifica] = useState<number | null>(null);

  const queryClient = useQueryClient();

  const { data: generacionActiva } = useGeneracionPlanIaActiva({
    socioId,
    planAlimentacionId,
    habilitado: socioId !== null,
  });

  const { data: generacionPlanIa } = useGeneracionPlanIaQuery({
    generacionId: generacionIdEspecifica,
    habilitado: generacionIdEspecifica !== null,
  });

  const generacionVisible = generacionPlanIa ?? generacionActiva ?? null;
  const planBloqueadoPorIa = esGeneracionPlanIaActiva(generacionVisible);

  // ----------------------------------------------------------------------
  // Sincroniza el ID específico si el backend reporta una activa distinta.
  // Evita que el usuario pierda el tracking cuando arranca otra generación
  // en paralelo (ej: otra pestaña/otro flujo).
  // ----------------------------------------------------------------------
  useEffect(() => {
    if (!generacionActiva?.id) return;
    if (generacionActiva.id === generacionIdEspecifica) return;
    setGeneracionIdEspecifica(generacionActiva.id);
  }, [generacionActiva?.id, generacionIdEspecifica]);

  // ----------------------------------------------------------------------
  // Limpieza cuando la generación llega a estado terminal.
  // Conservamos el último ID visto para no re-disparar el cleanup.
  // Al cerrar, invalidamos el query de la activa para que el próximo
  // `setIds` o un reinicio del provider detecte correctamente la ausencia
  // de una activa (sin esto, React Query serviría el dato cacheado).
  // ----------------------------------------------------------------------
  const ultimaGeneracionCerradaRef = useRef<number | null>(null);

  useEffect(() => {
    if (!generacionPlanIa?.id) return;
    if (ultimaGeneracionCerradaRef.current === generacionPlanIa.id) return;

    const estado = generacionPlanIa.estado;
    if (estado !== 'COMPLETADO' && estado !== 'ERROR') return;

    ultimaGeneracionCerradaRef.current = generacionPlanIa.id;
    // Limpiamos el ID específico; React Query mantendrá la data en caché
    // unos segundos para que el badge pueda renderizar el estado final,
    // pero el polling se detiene.
    setGeneracionIdEspecifica(null);
    if (socioId !== null) {
      void queryClient.invalidateQueries({
        queryKey: ['generacion-plan-ia-activa', socioId, planAlimentacionId ?? null],
      });
    }
  }, [
    generacionPlanIa?.id,
    generacionPlanIa?.estado,
    queryClient,
    socioId,
    planAlimentacionId,
  ]);

  const setIds = useCallback((ids: Partial<GeneracionPlanIaIds>) => {
    if (ids.socioId !== undefined) setSocioId(ids.socioId);
    if (ids.planAlimentacionId !== undefined) setPlanAlimentacionId(ids.planAlimentacionId);
    if (ids.generacionIdEspecifica !== undefined) {
      ultimaGeneracionCerradaRef.current = null;
      setGeneracionIdEspecifica(ids.generacionIdEspecifica);
    }
  }, []);

  const limpiarGeneracionEspecifica = useCallback(() => {
    ultimaGeneracionCerradaRef.current = null;
    setGeneracionIdEspecifica(null);
  }, []);

  const limpiar = useCallback(() => {
    ultimaGeneracionCerradaRef.current = null;
    setSocioId(null);
    setPlanAlimentacionId(null);
    setGeneracionIdEspecifica(null);
  }, []);

  const valor = useMemo<GeneracionPlanIaValor>(
    () => ({
      generacionVisible,
      generacionPlanIa: generacionPlanIa ?? null,
      generacionActiva: generacionActiva ?? null,
      planBloqueadoPorIa,
      setIds,
      limpiarGeneracionEspecifica,
      limpiar,
    }),
    [
      generacionVisible,
      generacionPlanIa,
      generacionActiva,
      planBloqueadoPorIa,
      setIds,
      limpiarGeneracionEspecifica,
      limpiar,
    ],
  );

  return (
    <GeneracionPlanIaContext.Provider value={valor}>
      {children}
    </GeneracionPlanIaContext.Provider>
  );
}

export function useGeneracionPlanIa(): GeneracionPlanIaValor {
  const ctx = useContext(GeneracionPlanIaContext);
  if (!ctx) {
    throw new Error('useGeneracionPlanIa debe usarse dentro de GeneracionPlanIaProvider');
  }
  return ctx;
}
