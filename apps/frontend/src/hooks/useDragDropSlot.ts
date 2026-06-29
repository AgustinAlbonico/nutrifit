import { useDraggable, useDroppable } from '@dnd-kit/core';
import type { ItemComidaIaFE } from '@/types/ia';

/**
 * Hace draggable una idea de comida sugiera por IA.
 * Expone los props necesarios para conectar al DndContext.
 */
export function useIdeaDraggable(idea: ItemComidaIaFE) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: `idea-${idea.idTemp}`,
    data: idea,
  });
  return {
    setNodeRef,
    attributes,
    listeners,
    transform,
  };
}

/**
 * Marca un slot del plan como droppable.
 * `isOver` permite cambiar el estilo visual cuando una idea se arrastra sobre el slot.
 */
export function useSlotDroppable(slotKey: string) {
  const { setNodeRef, isOver } = useDroppable({ id: slotKey });
  return {
    setNodeRef,
    isOver,
  };
}
