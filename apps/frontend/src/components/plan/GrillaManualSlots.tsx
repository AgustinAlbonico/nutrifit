/**
 * GrillaManualSlots — EditorManualPlan (Task 2.8).
 *
 * Renderiza una grilla 7×5 (días × tipos de comida) donde cada celda es un
 * <SlotComidaManual> con drag-drop (DndContext) y acceso a SugerenciasIaSlot.
 *
 * Interfaz:
 * - `planId: number` — ID del plan para pasar al slot
 * - `estructura: EstructuraDiaFE[]` — días + comidas del plan
 * - `onChange: (estructura: EstructuraDiaFE[]) => void` — callback al modificar
 */

import { useCallback, useMemo } from 'react';
import {
  DndContext,
  type DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';

import { SlotComidaManual, type AlternativaSlot } from './SlotComidaManual';
import { DialogResumenMacros } from './DialogResumenMacros';
import type { EstructuraDiaFE, ItemComidaIaFE, ItemComidaSnapshotFE } from '@/types/ia';

const DIAS = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO'] as const;
const TIPOS_COMIDA = ['DESAYUNO', 'ALMUERZO', 'MERIENDA', 'CENA', 'COLACION'] as const;

interface Props {
  estructura: EstructuraDiaFE[];
  onChange: (estructura: EstructuraDiaFE[]) => void;
}

/**
 * Convierte ItemComidaSnapshotFE (sin id) a AlternativaSlot (con id)
 * usando un id sintético basado en la posición en el array.
 *
 * El id sintético es `"${dia}-${tipoComida}-${index}"`. Cuando se elimina,
 * el índice del item es fijo (se capturó al momento de renderizar), por lo
 * que la baja es correcta aunque los índices del array se desplacen tras
 * filter().
 */
function convertirAAlternativaSlot(
  item: ItemComidaSnapshotFE,
  slotKey: string,
  index: number,
): { alternativa: AlternativaSlot; ref: ItemComidaSnapshotFE } {
  return {
    alternativa: {
      id: `${slotKey}-${index}`,
      nombre: item.nombre,
      alimentos: item.alimentos.map((a) => ({
        ...a,
        nombre: '',
      })),
      calorias: item.calorias,
      proteinas: item.proteinas,
      carbohidratos: item.carbohidratos,
      grasas: item.grasas,
    },
    ref: item,
  };
}

export function GrillaManualSlots({ estructura, onChange }: Props) {
  // Sensores para drag-drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );

  // ------------------------------------------------------------------
  // Helper: encuentra la comida de un slot en la estructura, creando
  // una entrada vacía si no existe (para estructuras parciales).
  // ------------------------------------------------------------------
  const obtenerComidaDelSlot = useCallback(
    (dia: (typeof DIAS)[number], tipoComida: (typeof TIPOS_COMIDA)[number]) => {
      const diaData = estructura.find((d) => d.dia === dia);
      if (!diaData) return null;
      return diaData.comidas.find((c) => c.tipo === tipoComida) ?? null;
    },
    [estructura],
  );

  // ------------------------------------------------------------------
  // onDragEnd: una idea (ItemComidaIaFE) se soltó en un slot.
  // El event.over.id es el slotKey (ej. "LUNES-DESAYUNO").
  // ------------------------------------------------------------------
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over) return;

      const ideaIdTemp = active.id as string; // viene de useIdeaDraggable: idea.idTemp
      const slotKey = over.id as string; // viene de useSlotDroppable: slotKey

      // El data del draggable contiene el idea completo (ItemComidaIaFE)
      const idea = active.data.current as ItemComidaIaFE | undefined;
      if (!idea || idea.idTemp !== ideaIdTemp) return;

      // Parsear slotKey → dia, tipoComida
      const guionIdx = slotKey.indexOf('-');
      if (guionIdx === -1) return;
      const dia = slotKey.slice(0, guionIdx) as EstructuraDiaFE['dia'];
      const tipoComida = slotKey.slice(guionIdx + 1) as (typeof TIPOS_COMIDA)[number];

      // Encontrar el slot en la estructura
      const diaIdx = estructura.findIndex((d) => d.dia === dia);
      if (diaIdx === -1) return;
      const comidaIdx = estructura[diaIdx].comidas.findIndex((c) => c.tipo === tipoComida);
      if (comidaIdx === -1) return;

      // Construir la nueva alternativa (ItemComidaSnapshotFE)
      const nuevaAlternativa: ItemComidaSnapshotFE = {
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
      };

      // Agregar a la estructura
      const nuevaEstructura = estructura.map((d, i) => {
        if (i !== diaIdx) return d;
        return {
          ...d,
          comidas: d.comidas.map((c, j) => {
            if (j !== comidaIdx) return c;
            return {
              ...c,
              alternativas: [...c.alternativas, nuevaAlternativa],
            };
          }),
        };
      });

      onChange(nuevaEstructura);
    },
    [estructura, onChange],
  );

  // ------------------------------------------------------------------
  // Render del grid.
  // Por cada slotKey generamos las alternativas convertidas y un map
  // idSintetico → itemRef para poder actualizar la estructura original.
  // ------------------------------------------------------------------
  const filas = useMemo(() => {
    return DIAS.map((dia) => {
      const celdas = TIPOS_COMIDA.map((tipoComida) => {
        const slotKey = `${dia}-${tipoComida}`;
        const comida = obtenerComidaDelSlot(dia, tipoComida);
        const alternativasRaw = comida?.alternativas ?? [];

        // Convertir ItemComidaSnapshotFE[] → alternativas para SlotComidaManual
        // Generar mapping idSintetico → ref del item original en estructura
        const refs = new Map<string, ItemComidaSnapshotFE>();
        const alternativasConvertidas = alternativasRaw.map((item, idx) => {
          const converted = convertirAAlternativaSlot(item, slotKey, idx);
          refs.set(converted.alternativa.id, converted.ref);
          return converted.alternativa;
        });

        const handleSlotChange = (
          nuevasAlternativas: Array<{
            id: string;
            nombre: string;
            alimentos: ItemComidaSnapshotFE['alimentos'];
            calorias: number;
            proteinas: number;
            carbohidratos: number;
            grasas: number;
          }>,
        ) => {
          const diaIdx = estructura.findIndex((d) => d.dia === dia);
          if (diaIdx === -1) return;
          const comidaIdx = estructura[diaIdx].comidas.findIndex((c) => c.tipo === tipoComida);
          if (comidaIdx === -1) return;

          // Reconstruir ItemComidaSnapshotFE[] actualizando los items originales
          const actualizadas = nuevasAlternativas.map((alt) => {
            const ref = refs.get(alt.id);
            if (ref) {
              // Mutación in-place del item original en estructura
              ref.nombre = alt.nombre;
              ref.alimentos = alt.alimentos;
              ref.calorias = alt.calorias;
              ref.proteinas = alt.proteinas;
              ref.carbohidratos = alt.carbohidratos;
              ref.grasas = alt.grasas;
              return ref;
            }
            return {
              nombre: alt.nombre,
              alimentos: alt.alimentos,
              calorias: alt.calorias,
              proteinas: alt.proteinas,
              carbohidratos: alt.carbohidratos,
              grasas: alt.grasas,
            };
          });

          // Reemplazar el array de alternativas (nuevo array = trigger de re-render)
          const nuevaEstructura = estructura.map((d, i) => {
            if (i !== diaIdx) return d;
            return {
              ...d,
              comidas: d.comidas.map((c, j) => {
                if (j !== comidaIdx) return c;
                return { ...c, alternativas: actualizadas };
              }),
            };
          });

          onChange(nuevaEstructura);
        };

        return {
          slotKey,
          dia,
          tipoComida,
          alternativas: alternativasConvertidas,
          refs,
          handleSlotChange,
        };
      });

      return { dia, celdas };
    });
  }, [estructura, obtenerComidaDelSlot, onChange]);

  return (
    <div className="flex flex-col gap-4">
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div
          data-testid="grilla-manual-slots"
          aria-label="Grilla de slots manuales"
          className="min-w-0 overflow-x-auto rounded-xl border bg-card/40 p-2"
        >
          {/* Layout: columna de día + grid de slots */}
          <div className="flex min-w-[760px] gap-2">
            {/* Columna de día + header (alineado con los slots) */}
            <div className="flex flex-col" style={{ width: '72px' }}>
              {/* Header vacío para alinear con columnas de slots */}
              <div className="h-8" />

              {/* Día labels */}
              {DIAS.map((dia) => (
                <div
                  key={dia}
                  className="flex items-center font-bold text-xs uppercase tracking-wide text-muted-foreground"
                  style={{ height: '120px' }}
                >
                  {dia}
                </div>
              ))}
            </div>

            {/* Grid de slots */}
            <div className="flex-1">
              {/* Header: tipos de comida */}
              <div
                className="mb-2 grid gap-2"
                style={{ gridTemplateColumns: `repeat(${TIPOS_COMIDA.length}, 1fr)` }}
              >
                {TIPOS_COMIDA.map((tipo) => (
                  <div
                    key={tipo}
                    className="text-center text-xs font-bold uppercase tracking-wide text-muted-foreground"
                  >
                    {tipo}
                  </div>
                ))}
              </div>

              {/* Day rows */}
              <div className="flex flex-col gap-2">
                {filas.map(({ dia, celdas }) => (
                  <div
                    key={dia}
                    className="grid gap-2"
                    style={{ gridTemplateColumns: `repeat(${TIPOS_COMIDA.length}, 1fr)` }}
                  >
                    {celdas.map(({ slotKey, dia: celdaDia, tipoComida, alternativas, handleSlotChange }) => (
                      <CeldaSlot
                        key={slotKey}
                        slotKey={slotKey}
                        dia={celdaDia}
                        tipoComida={tipoComida}
                        alternativas={alternativas}
                        onChange={handleSlotChange}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </DndContext>

      {/* Resumen de macros — sticky footer */}
      <div className="sticky bottom-0 z-10">
        <DialogResumenMacros estructura={estructura} />
      </div>
    </div>
  );
}

// ------------------------------------------------------------------
// Componente interno: celda individual de la grilla.
// Se renderiza dentro de DndContext (hereda el contexto).
// ------------------------------------------------------------------
function CeldaSlot({
  slotKey,
  dia,
  tipoComida,
  alternativas,
  onChange,
}: {
  slotKey: string;
  dia: (typeof DIAS)[number];
  tipoComida: (typeof TIPOS_COMIDA)[number];
  alternativas: AlternativaSlot[];
  onChange: (alternativas: AlternativaSlot[]) => void;
}) {
  return (
    <SlotComidaManual
      slotKey={slotKey}
      dia={dia}
      tipoComida={tipoComida}
      alternativas={alternativas}
      onChange={onChange}
    />
  );
}
