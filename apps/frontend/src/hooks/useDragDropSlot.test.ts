import { renderHook } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import type { ItemComidaIaFE } from '@/types/ia';
import { useIdeaDraggable, useSlotDroppable } from './useDragDropSlot';

describe('useDragDropSlot', () => {
  it('expone setNodeRef draggable y droppable', () => {
    const ideaMock = {
      idTemp: 'tmp1',
      nombre: 'Avena con frutas',
      alimentos: [{ alimentoId: 1, cantidad: 100, unidad: 'g', nombre: 'Avena' }],
      calorias: 300,
      proteinas: 10,
      carbohidratos: 50,
      grasas: 5,
      etiquetas: [],
      warnings: [],
    } satisfies ItemComidaIaFE;

    const { result } = renderHook(() => useIdeaDraggable(ideaMock));
    expect(typeof result.current.setNodeRef).toBe('function');
    expect(result.current.attributes).toBeDefined();
  });

  it('useSlotDroppable expone setNodeRef e isOver', () => {
    const { result } = renderHook(() => useSlotDroppable('slot-desayuno'));
    expect(typeof result.current.setNodeRef).toBe('function');
    expect(typeof result.current.isOver).toBe('boolean');
  });
});
