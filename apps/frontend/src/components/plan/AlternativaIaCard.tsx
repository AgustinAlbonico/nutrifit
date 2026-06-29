import { Plus, AlertTriangle, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useIdeaDraggable } from '@/hooks/useDragDropSlot';
import type { ItemComidaIaFE } from '@/types/ia';

export function AlternativaIaCard({
  idea,
  onAdd,
}: {
  idea: ItemComidaIaFE;
  onAdd: (i: ItemComidaIaFE) => void;
}) {
  const { setNodeRef, attributes, listeners, transform } = useIdeaDraggable(idea);
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="rounded-lg border border-border/50 bg-card p-3 hover:shadow-md transition-shadow"
      data-testid={`alternativa-card-${idea.idTemp}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <button
            {...attributes}
            {...listeners}
            aria-label="Arrastrar idea"
            className="cursor-grab text-muted-foreground hover:text-foreground"
          >
            <GripVertical className="size-4" aria-hidden="true" />
          </button>
          <div className="flex-1">
            <p className="text-sm font-semibold leading-tight">{idea.nombre}</p>
            <p className="mt-1 text-xs text-muted-foreground tabular-nums">
              {idea.calorias} kcal · P {idea.proteinas}g · C{' '}
              {idea.carbohidratos}g · G {idea.grasas}g
            </p>
            {idea.etiquetas.length > 0 && (
              <div className="mt-1 flex flex-wrap gap-1">
                {idea.etiquetas.map((et) => (
                  <Badge key={et} variant="secondary" className="text-[10px]">
                    {et}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onAdd(idea)}
          data-testid="boton-agregar-idea"
        >
          <Plus className="size-3" aria-hidden="true" /> Agregar al slot
        </Button>
      </div>
      {idea.warnings.length > 0 && (
        <div
          role="status"
          className="mt-2 flex items-start gap-1.5 rounded-md border border-amber-300/60 bg-amber-50/80 px-2 py-1.5 text-xs text-amber-900 dark:border-amber-600/40 dark:bg-amber-900/20 dark:text-amber-200"
        >
          <AlertTriangle className="size-3 shrink-0" aria-hidden="true" />
          <ul className="space-y-0.5">
            {idea.warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
