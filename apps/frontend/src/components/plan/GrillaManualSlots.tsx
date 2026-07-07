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
import { ResumenMacrosPorDia } from './ResumenMacrosPorDia';
import type { EstructuraDiaFE, ItemComidaSnapshotFE } from '@/types/ia';

const DIAS = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO'] as const;
const TIPOS_COMIDA = ['DESAYUNO', 'ALMUERZO', 'MERIENDA', 'CENA', 'COLACION'] as const;

interface Props {
  estructura: EstructuraDiaFE[];
  onChange: (estructura: EstructuraDiaFE[]) => void;
  onSelectSlot?: (dia: any, tipoComida: any) => void;
  deshabilitado?: boolean;
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

export function GrillaManualSlots({
  estructura,
  onChange,
  onSelectSlot,
  deshabilitado = false,
}: Props) {
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
          if (deshabilitado) return;

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
  }, [deshabilitado, estructura, obtenerComidaDelSlot, onChange]);

  return (
    <div className="flex flex-col gap-4">
      <div
        data-testid="grilla-manual-slots"
        aria-label="Grilla de slots manuales"
        className="min-w-0 overflow-x-auto rounded-xl border bg-card/40 p-2"
      >
        {/* Layout en una sola grilla CSS Grid de 6 columnas (1 label + 5 comidas).
            Cada día es una fila → el label de día y sus celdas comparten altura
            automáticamente. Ya no hay altura fija de 120px que se desalinee. */}
        <div
          className="min-w-[760px]"
          style={{
            display: 'grid',
            gridTemplateColumns: `72px repeat(${TIPOS_COMIDA.length}, minmax(0, 1fr))`,
            gap: '8px',
          }}
        >
          {/* Header: primera celda vacía + 5 labels de tipo de comida */}
          <div className="h-8" aria-hidden="true" />
          {TIPOS_COMIDA.map((tipo) => (
            <div
              key={tipo}
              className="flex h-8 items-center justify-center text-center text-xs font-bold uppercase tracking-wide text-muted-foreground"
            >
              {tipo}
            </div>
          ))}

          {/* Filas: una por día */}
          {filas.map(({ dia, celdas }) => (
            <FilaDia
              key={dia}
              dia={dia}
              celdas={celdas}
              onSelectSlot={onSelectSlot}
              deshabilitado={deshabilitado}
            />
          ))}
        </div>
      </div>

      {/* Resumen por día (reemplaza al antiguo DialogResumenMacros fijo) */}
      <ResumenMacrosPorDia estructura={estructura} />
    </div>
  );
}

function FilaDia({
  dia,
  celdas,
  onSelectSlot,
  deshabilitado,
}: {
  dia: (typeof DIAS)[number];
  celdas: Array<{
    slotKey: string;
    dia: (typeof DIAS)[number];
    tipoComida: (typeof TIPOS_COMIDA)[number];
    alternativas: AlternativaSlot[];
    handleSlotChange: (alternativas: AlternativaSlot[]) => void;
  }>;
  onSelectSlot?: (dia: string, tipoComida: string) => void;
  deshabilitado?: boolean;
}) {
  return (
    <>
      {/* Label de día: sticky left para que sea visible al scrollear horizontal */}
      <div
        className="flex items-center justify-center rounded-md bg-muted/40 px-1 py-2 text-xs font-bold uppercase tracking-wide text-muted-foreground"
        aria-label={`Día ${dia}`}
      >
        <span className="[writing-mode:vertical-rl] [transform:rotate(180deg)]">
          {dia}
        </span>
      </div>

      {celdas.map(({ slotKey, dia: celdaDia, tipoComida, alternativas, handleSlotChange }) => (
        <CeldaSlot
          key={slotKey}
          slotKey={slotKey}
          dia={celdaDia}
          tipoComida={tipoComida}
          alternativas={alternativas}
          onChange={handleSlotChange}
          onSelectForIa={
            deshabilitado ? undefined : () => onSelectSlot?.(celdaDia, tipoComida)
          }
          deshabilitado={deshabilitado}
        />
      ))}
    </>
  );
}

function CeldaSlot({
  slotKey,
  dia,
  tipoComida,
  alternativas,
  onChange,
  onSelectForIa,
  deshabilitado,
}: {
  slotKey: string;
  dia: (typeof DIAS)[number];
  tipoComida: (typeof TIPOS_COMIDA)[number];
  alternativas: AlternativaSlot[];
  onChange: (alternativas: AlternativaSlot[]) => void;
  onSelectForIa?: () => void;
  deshabilitado?: boolean;
}) {
  return (
    <SlotComidaManual
      slotKey={slotKey}
      dia={dia}
      tipoComida={tipoComida}
      alternativas={alternativas}
      onChange={onChange}
      onSelectForIa={onSelectForIa}
      deshabilitado={deshabilitado}
    />
  );
}
