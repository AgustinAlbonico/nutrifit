import { useState } from 'react';
import { Copy, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSlotDroppable } from '@/hooks/useDragDropSlot';

export interface AlternativaSlot {
  /** Temporary id for FE-only items (e.g. `tmp-1`). */
  id: string;
  nombre: string;
  alimentos: Array<{
    alimentoId: number;
    cantidad: number;
    unidad: string;
    nombre: string;
  }>;
  calorias: number;
  proteinas: number;
  carbohidratos: number;
  grasas: number;
}

export interface SlotComidaManualProps {
  slotKey: string;
  dia: string;
  tipoComida: string;
  /** Alternativas already in this slot (may be empty). */
  alternativas: AlternativaSlot[];
  onChange: (alternativas: AlternativaSlot[]) => void;
}

export function SlotComidaManual({
  slotKey,
  dia,
  tipoComida,
  alternativas,
  onChange,
}: SlotComidaManualProps) {
  const { setNodeRef, isOver } = useSlotDroppable(slotKey);

  const eliminarAlternativa = (id: string) => {
    onChange(alternativas.filter((a) => a.id !== id));
  };

  const duplicarAlternativa = (alternativa: AlternativaSlot) => {
    const dup: AlternativaSlot = {
      ...alternativa,
      id: `tmp-${Date.now()}`,
      nombre: `${alternativa.nombre} (copia)`,
    };
    onChange([...alternativas, dup]);
  };

  const editarAlternativa = (id: string, nombre: string) => {
    onChange(
      alternativas.map((a) =>
        a.id === id ? { ...a, nombre } : a,
      ),
    );
  };

  return (
    <div
      ref={setNodeRef}
      className={[
        'rounded-lg border p-3 transition-colors',
        isOver
          ? 'border-primary bg-primary/5'
          : 'border-border bg-card',
      ].join(' ')}
      data-testid={`slot-comida-${slotKey}`}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {dia} · {tipoComida}
        </span>
      </div>

      {alternativas.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          Arrastrá ideas acá o usá el botón "Generar ideas IA"
        </p>
      ) : (
        <div className="space-y-2">
          {alternativas.map((alt) => (
            <SlotAlternativaItem
              key={alt.id}
              alternativa={alt}
              onDelete={eliminarAlternativa}
              onDuplicate={duplicarAlternativa}
              onEdit={editarAlternativa}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SlotAlternativaItem({
  alternativa,
  onDelete,
  onDuplicate,
  onEdit,
}: {
  alternativa: AlternativaSlot;
  onDelete: (id: string) => void;
  onDuplicate: (alt: AlternativaSlot) => void;
  onEdit: (id: string, nombre: string) => void;
}) {
  const [editando, setEditando] = useState(false);
  const [nombreEditado, setNombreEditado] = useState(alternativa.nombre);

  const guardar = () => {
    onEdit(alternativa.id, nombreEditado);
    setEditando(false);
  };

  const cancelar = () => {
    setNombreEditado(alternativa.nombre);
    setEditando(false);
  };

  return (
    <div
      className="rounded-md border border-border/50 bg-muted/30 p-2"
      data-testid={`alternativa-slot-${alternativa.id}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          {editando ? (
            <input
              className="w-full rounded border border-input bg-background px-2 py-1 text-sm"
              value={nombreEditado}
              onChange={(e) => setNombreEditado(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') guardar();
                if (e.key === 'Escape') cancelar();
              }}
              data-testid="input-editar-nombre"
            />
          ) : (
            <>
              <p className="text-sm font-medium">{alternativa.nombre}</p>
              <p className="text-xs text-muted-foreground tabular-nums">
                {alternativa.calorias} kcal · P {alternativa.proteinas}g · C{' '}
                {alternativa.carbohidratos}g · G {alternativa.grasas}g
              </p>
            </>
          )}
        </div>
        <div className="flex items-center gap-1">
          {editando ? (
            <>
              <Button size="sm" variant="ghost" onClick={guardar} data-testid="btn-guardar-nombre">
                Guardar
              </Button>
              <Button size="sm" variant="ghost" onClick={cancelar} data-testid="btn-cancelar-edicion">
                Cancelar
              </Button>
            </>
          ) : (
            <>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setEditando(true)}
                aria-label="Editar nombre"
                data-testid="btn-editar"
              >
                <Pencil className="size-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onDuplicate(alternativa)}
                aria-label="Duplicar alternativa"
                data-testid="btn-duplicar"
              >
                <Copy className="size-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onDelete(alternativa.id)}
                aria-label="Eliminar alternativa"
                data-testid="btn-eliminar"
              >
                <Trash2 className="size-3 text-destructive" />
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
