/**
 * GrillaManualSlots — EditorManualPlan (Task 2.8).
 *
 * Renderiza una grilla 7×5 (días × tipos de comida) donde cada celda es un
 * <SlotComidaManual> con acceso a SugerenciasIaSlot.
 *
 * Interfaz:
 * - `estructura: EstructuraDiaFE[]` — días + comidas del plan
 * - `onChange: (estructura: EstructuraDiaFE[]) => void` — callback al modificar
 * - `onSelectSlot?: (dia: string, tipoComida: string) => void` — callback para seleccionar slot para ideas IA
 */

import { useCallback, useMemo } from 'react';

import { SlotComidaManual, type AlternativaSlot } from './SlotComidaManual';
import { DialogResumenMacros } from './DialogResumenMacros';
import type { EstructuraDiaFE, ItemComidaSnapshotFE } from '@/types/ia';

const DIAS = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO'] as const;
const TIPOS_COMIDA = ['DESAYUNO', 'ALMUERZO', 'MERIENDA', 'CENA', 'COLACION'] as const;

interface Props {
  estructura: EstructuraDiaFE[];
  onChange: (estructura: EstructuraDiaFE[]) => void;
  onSelectSlot?: (dia: any, tipoComida: any) => void;
}

/**
 * Convierte ItemComidaSnapshotFE (sin id) a AlternativaSlot (con id)
 * usando un id sintético basado en la posición en el array.
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

export function GrillaManualSlots({ estructura, onChange, onSelectSlot }: Props) {
  // ------------------------------------------------------------------
  // Helper: encuentra la comida de un slot en la estructura, creando
  // una entrada vacía si no existe.
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
  // Render del grid.
  // ------------------------------------------------------------------
  const filas = useMemo(() => {
    return DIAS.map((dia) => {
      const celdas = TIPOS_COMIDA.map((tipoComida) => {
        const slotKey = `${dia}-${tipoComida}`;
        const comida = obtenerComidaDelSlot(dia, tipoComida);
        const alternativasRaw = comida?.alternativas ?? [];

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

          const actualizadas = nuevasAlternativas.map((alt) => {
            const ref = refs.get(alt.id);
            if (ref) {
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
      <div
        data-testid="grilla-manual-slots"
        aria-label="Grilla de slots manuales"
        className="min-w-0 overflow-x-auto rounded-xl border bg-card/40 p-2"
      >
        <div className="flex min-w-[760px] gap-2">
          <div className="flex flex-col" style={{ width: '72px' }}>
            <div className="h-8" />
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

          <div className="flex-1">
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
                      onSelectForIa={() => onSelectSlot?.(celdaDia, tipoComida)}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="sticky bottom-0 z-10">
        <DialogResumenMacros estructura={estructura} />
      </div>
    </div>
  );
}

function CeldaSlot({
  slotKey,
  dia,
  tipoComida,
  alternativas,
  onChange,
  onSelectForIa,
}: {
  slotKey: string;
  dia: (typeof DIAS)[number];
  tipoComida: (typeof TIPOS_COMIDA)[number];
  alternativas: AlternativaSlot[];
  onChange: (alternativas: AlternativaSlot[]) => void;
  onSelectForIa?: () => void;
}) {
  return (
    <SlotComidaManual
      slotKey={slotKey}
      dia={dia}
      tipoComida={tipoComida}
      alternativas={alternativas}
      onChange={onChange}
      onSelectForIa={onSelectForIa}
    />
  );
}
