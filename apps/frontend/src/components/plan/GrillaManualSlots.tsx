/**
 * GrillaManualSlots — stub mínimo para Task 2.9 (EditorManualPlan).
 *
 * Task 2.8 creará la implementación real con drag-drop y toolbar.
 * Este stub implementa la interfaz esperada por los tests existentes de Task 2.8
 * y permite que EditorManualPlan renderice correctamente.
 *
 * Interfaz:
 * - `planId: number` — ID del plan para pasar al slot
 * - `estructura: EstructuraDiaFE[]` — días + comidas del plan
 * - `onChange: (estructura: EstructuraDiaFE[]) => void` — callback al modificar
 */

import type { EstructuraDiaFE } from '@/types/ia';

const TIPOS_COMIDA = ['DESAYUNO', 'ALMUERZO', 'MERIENDA', 'CENA', 'COLACION'] as const;

interface Props {
  planId: number;
  estructura: EstructuraDiaFE[];
  onChange: (estructura: EstructuraDiaFE[]) => void;
}

export function GrillaManualSlots({ estructura, onChange: _onChange }: Props) {
  const dias = estructura.length > 0
    ? estructura.map((d) => d.dia)
    : (['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO'] as const);

  return (
    <div data-testid="grilla-manual-slots" aria-label="Grilla de slots manuales">
      {/* Header row: días */}
      <div style={{ display: 'grid', gridTemplateColumns: 'auto repeat(5, 1fr)', gap: '4px' }}>
        {/* Corner cell */}
        <div />

        {/* Meal type headers */}
        {TIPOS_COMIDA.map((tipo) => (
          <div key={tipo} style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '12px' }}>
            {tipo}
          </div>
        ))}

        {/* Day rows */}
        {dias.map((dia) => (
          <div key={dia} style={{ display: 'contents' }}>
            {/* Day label */}
            <div style={{ fontWeight: 'bold', fontSize: '12px', display: 'flex', alignItems: 'center' }}>
              {dia}
            </div>

            {/* Slots for each meal type */}
            {TIPOS_COMIDA.map((tipo) => {
              const diaData = estructura.find((d) => d.dia === dia);
              const comidaData = diaData?.comidas.find((c) => c.tipo === tipo);
              const alternativas = comidaData?.alternativas ?? [];
              const tieneDatos = alternativas.length > 0;

              return (
                <div
                  key={`${dia}-${tipo}`}
                  data-testid={`slot-comida-${dia}-${tipo}`}
                  style={{
                    border: '1px solid #e5e5e5',
                    borderRadius: '4px',
                    padding: '4px',
                    minHeight: '48px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px',
                  }}
                >
                  {tieneDatos ? (
                    alternativas.map((alt, idx) => (
                      <div key={idx} style={{ fontSize: '12px', position: 'relative' }}>
                        <span>{alt.nombre ?? 'Alternativa'}</span>
                        <button
                          data-testid="btn-eliminar"
                          onClick={() => {
                            // Stub: elimina la alternativa del slot
                            const nuevaEstructura = estructura.map((d) => {
                              if (d.dia !== dia) return d;
                              return {
                                ...d,
                                comidas: d.comidas.map((c) => {
                                  if (c.tipo !== tipo) return c;
                                  return {
                                    ...c,
                                    alternativas: c.alternativas.filter((_, i) => i !== idx),
                                  };
                                }),
                              };
                            });
                            _onChange(nuevaEstructura);
                          }}
                          style={{
                            position: 'absolute',
                            top: '-2px',
                            right: '0',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '10px',
                            color: '#999',
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ))
                  ) : (
                    <span style={{ fontSize: '11px', color: '#aaa' }}>arrastrá ideas</span>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
