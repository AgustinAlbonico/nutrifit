import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { AlimentoItem } from './SlotEditorAlimentos.types';

interface SlotEditorAlimentosProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (items: AlimentoItem[]) => void;
  alimentosDisponibles: Array<{ id: number; nombre: string }>;
}

export function SlotEditorAlimentos({
  open,
  onOpenChange,
  onSave,
  alimentosDisponibles,
}: SlotEditorAlimentosProps) {
  const [alimentosSeleccionados, setAlimentosSeleccionados] = useState<AlimentoItem[]>(
    [],
  );
  const [alimentoIdActual, setAlimentoIdActual] = useState<string>('');
  const [cantidadActual, setCantidadActual] = useState<string>('');
  const [unidadActual, setUnidadActual] = useState<string>('g');

  const limpiarFormulario = () => {
    setAlimentoIdActual('');
    setCantidadActual('');
    setUnidadActual('g');
    setAlimentosSeleccionados([]);
  };

  const manejarCierre = (cerrado: boolean) => {
    if (!cerrado) {
      limpiarFormulario();
    }
    onOpenChange(cerrado);
  };

  const agregarAlimento = () => {
    if (!alimentoIdActual || !cantidadActual) return;

    const cantidadNum = Number.parseInt(cantidadActual, 10);
    if (isNaN(cantidadNum) || cantidadNum < 1) return;

    const alimento = alimentosDisponibles.find(
      (a) => String(a.id) === alimentoIdActual,
    );
    if (!alimento) return;

    // Check for duplicates
    const existe = alimentosSeleccionados.some(
      (a) => a.alimentoId === Number(alimentoIdActual),
    );
    if (existe) return;

    setAlimentosSeleccionados((prev) => [
      ...prev,
      {
        alimentoId: Number(alimentoIdActual),
        cantidad: cantidadNum,
        unidad: unidadActual,
        nombre: alimento.nombre,
      },
    ]);

    // Reset individual inputs but keep selected food for quick re-add
    setCantidadActual('');
    setUnidadActual('g');
  };

  const quitarAlimento = (alimentoId: number) => {
    setAlimentosSeleccionados((prev) =>
      prev.filter((a) => a.alimentoId !== alimentoId),
    );
  };

  const guardar = () => {
    if (alimentosSeleccionados.length === 0) return;
    onSave(alimentosSeleccionados);
    limpiarFormulario();
    onOpenChange(false);
  };

  const puedeAgregar =
    alimentoIdActual !== '' &&
    cantidadActual !== '' &&
    !isNaN(Number(cantidadActual)) &&
    Number(cantidadActual) >= 1;

  return (
    <Dialog open={open} onOpenChange={manejarCierre}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Agregar Alimentos</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Food selector */}
          <div className="space-y-2">
            <Label htmlFor="alimento-select">Alimento</Label>
            <Select
              value={alimentoIdActual}
              onValueChange={setAlimentoIdActual}
            >
              <SelectTrigger id="alimento-select" data-testid="alimento-select">
                <SelectValue placeholder="Seleccionar alimento" />
              </SelectTrigger>
              <SelectContent>
                {alimentosDisponibles.map((alimento) => (
                  <SelectItem
                    key={alimento.id}
                    value={String(alimento.id)}
                  >
                    {alimento.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Cantidad y Unidad */}
          <div className="flex gap-3">
            <div className="flex-1 space-y-2">
              <Label htmlFor="cantidad-input">Cantidad</Label>
              <Input
                id="cantidad-input"
                type="number"
                min={1}
                placeholder="Ej: 100"
                value={cantidadActual}
                onChange={(e) => setCantidadActual(e.target.value)}
                data-testid="cantidad-input"
              />
            </div>
            <div className="w-28 space-y-2">
              <Label htmlFor="unidad-input">Unidad</Label>
              <Input
                id="unidad-input"
                placeholder="g"
                value={unidadActual}
                onChange={(e) => setUnidadActual(e.target.value)}
                data-testid="unidad-input"
              />
            </div>
          </div>

          <Button
            onClick={agregarAlimento}
            disabled={!puedeAgregar}
            variant="outline"
            size="sm"
            className="w-full"
            data-testid="boton-agregar"
          >
            <Plus className="size-4 mr-1" aria-hidden="true" />
            Agregar
          </Button>

          {/* Lista de alimentos agregados */}
          {alimentosSeleccionados.length > 0 && (
            <div className="space-y-2">
              <Label>Alimentos seleccionados</Label>
              <ul className="space-y-1" data-testid="lista-alimentos">
                {alimentosSeleccionados.map((item) => (
                  <li
                    key={item.alimentoId}
                    className="flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2 text-sm"
                  >
                    <span>
                      {item.nombre}{' '}
                      <span className="text-muted-foreground">
                        {item.cantidad}
                        {item.unidad}
                      </span>
                    </span>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => quitarAlimento(item.alimentoId)}
                      aria-label={`Quitar ${item.nombre}`}
                      data-testid="boton-quitar"
                    >
                      <Trash2 className="size-3 text-destructive" />
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Guardar */}
          <Button
            onClick={guardar}
            disabled={alimentosSeleccionados.length === 0}
            className="w-full"
            data-testid="boton-guardar"
          >
            Guardar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
