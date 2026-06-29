import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SlotEditorAlimentos } from './SlotEditorAlimentos';

const alimentosMock = [
  { id: 1, nombre: 'Manzana' },
  { id: 2, nombre: 'Pollo' },
  { id: 3, nombre: 'Arroz' },
  { id: 4, nombre: 'Avena' },
];

describe('SlotEditorAlimentos', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('abre el dialog y muestra el selector de alimentos', () => {
    render(
      <SlotEditorAlimentos
        open={true}
        onOpenChange={vi.fn()}
        onSave={vi.fn()}
        alimentosDisponibles={alimentosMock}
      />,
    );

    expect(screen.getByTestId('alimento-select')).toBeInTheDocument();
    expect(screen.getByText('Agregar Alimentos')).toBeInTheDocument();
    expect(screen.getByText('Cantidad')).toBeInTheDocument();
    expect(screen.getByText('Unidad')).toBeInTheDocument();
  });

  it('el boton agregar esta deshabilitado cuando falta alimento o cantidad', async () => {
    const user = userEvent.setup();
    render(
      <SlotEditorAlimentos
        open={true}
        onOpenChange={vi.fn()}
        onSave={vi.fn()}
        alimentosDisponibles={alimentosMock}
      />,
    );

    // Sin seleccionar alimento ni ingresar cantidad, debe estar disabled
    expect(screen.getByTestId('boton-agregar')).toBeDisabled();

    // Ingresar cantidad sin seleccionar alimento → sigue disabled
    await user.type(screen.getByTestId('cantidad-input'), '100');
    expect(screen.getByTestId('boton-agregar')).toBeDisabled();
  });

  it('agrega un alimento y llama a onSave con los items correctos al guardar', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    const onOpenChange = vi.fn();

    render(
      <SlotEditorAlimentos
        open={true}
        onOpenChange={onOpenChange}
        onSave={onSave}
        alimentosDisponibles={alimentosMock}
      />,
    );

    // 1. Abrir el dropdown del Select
    await user.click(screen.getByTestId('alimento-select'));

    // 2. Esperar a que el portal del Select se abra
    // Radix Select portal tiene role="listbox" y aria-hidden="true"
    let portal: Element | null = null;
    await waitFor(() => {
      // querySelector DOM method encuentra elementos aunque tengan aria-hidden
      portal = document.querySelector('[role="listbox"]');
      expect(portal).not.toBeNull();
    });
    expect(portal).not.toBeNull();

    // 3. Dentro del portal abierto, buscar las opciones con querySelector nativo
    // (no usa testing-library, así que ignora aria-hidden)
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const portalEl = portal! as HTMLElement;
    const options = portalEl.querySelectorAll('[role="option"]');
    expect(options.length).toBe(4);

    // 4. Click en Manzana
    const manzanaOption = Array.from(options).find((opt) => opt.textContent?.includes('Manzana'));
    expect(manzanaOption).toBeDefined();
    await user.click(manzanaOption!);

    // 5. Verificar que el Select muestra Manzana como valor
    expect(screen.getByTestId('alimento-select')).toHaveTextContent('Manzana');

    // 6. Ingresar cantidad
    await user.type(screen.getByTestId('cantidad-input'), '150');

    // 7. Agregar debe estar habilitado ahora
    expect(screen.getByTestId('boton-agregar')).not.toBeDisabled();

    // 8. Click en agregar
    await user.click(screen.getByTestId('boton-agregar'));

    // 9. Verificar que el item aparece en la lista
    const lista = screen.getByTestId('lista-alimentos');
    expect(lista).toHaveTextContent('Manzana');
    expect(lista).toHaveTextContent('150g');

    // 10. Guardar debe estar habilitado
    expect(screen.getByTestId('boton-guardar')).not.toBeDisabled();

    // 11. Click en guardar
    await user.click(screen.getByTestId('boton-guardar'));

    // 12. Verificar onSave fue llamado con los items correctos
    expect(onSave).toHaveBeenCalledWith([
      {
        alimentoId: 1,
        cantidad: 150,
        unidad: 'g',
        nombre: 'Manzana',
      },
    ]);

    // 13. Dialog cierra
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('no permite duplicados - mismo alimento no se puede agregar dos veces', async () => {
    const user = userEvent.setup();

    render(
      <SlotEditorAlimentos
        open={true}
        onOpenChange={vi.fn()}
        onSave={vi.fn()}
        alimentosDisponibles={alimentosMock}
      />,
    );

    // Agregar Manzana
    await user.click(screen.getByTestId('alimento-select'));
    const portal = await waitFor(() => document.querySelector('[role="listbox"]'));
    const options = (portal as HTMLElement).querySelectorAll('[role="option"]');
    const manzanaOption = Array.from(options).find((opt) => opt.textContent?.includes('Manzana'));
    expect(manzanaOption).toBeDefined();
    await user.click(manzanaOption!);
    await user.type(screen.getByTestId('cantidad-input'), '100');
    await user.click(screen.getByTestId('boton-agregar'));

    // Intentar agregar Manzana de nuevo
    await user.click(screen.getByTestId('alimento-select'));
    const portal2 = await waitFor(() => document.querySelector('[role="listbox"]'));
    const options2 = (portal2 as HTMLElement).querySelectorAll('[role="option"]');
    const manzanaOption2 = Array.from(options2).find((opt) => opt.textContent?.includes('Manzana'));
    expect(manzanaOption2).toBeDefined();
    await user.click(manzanaOption2!);
    await user.clear(screen.getByTestId('cantidad-input'));
    await user.type(screen.getByTestId('cantidad-input'), '200');
    await user.click(screen.getByTestId('boton-agregar'));

    // Debe seguir habiendo solo un item
    const items = screen.getAllByTestId('boton-quitar');
    expect(items).toHaveLength(1);
  });
});
