import { useState } from 'react';
import { Copy, Pencil, Trash2, Sparkles, Plus, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSlotDroppable } from '@/hooks/useDragDropSlot';
import { DialogEditarAlternativa } from './DialogEditarAlternativa';
import {
  DialogDetalleComida,
  type AlternativaDetalle,
} from './DialogDetalleComida';

export interface AlternativaSlot {
  /** Temporary id for FE-only items (e.g. `tmp-1`). */
  id: string;
  nombre: string;
  preparacionId?: number | null;
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
  onSelectForIa?: () => void;
  deshabilitado?: boolean;
}

export function SlotComidaManual({
  slotKey,
  dia,
  tipoComida,
  alternativas,
  onChange,
  onSelectForIa,
  deshabilitado = false,
}: SlotComidaManualProps) {
  const { setNodeRef, isOver } = useSlotDroppable(slotKey);
  const [dialogoEdicionAbierto, setDialogoEdicionAbierto] = useState(false);
  const [alternativaEnEdicion, setAlternativaEnEdicion] = useState<AlternativaSlot | null>(null);
  const [detalleAbierto, setDetalleAbierto] = useState(false);
  const [detalleComida, setDetalleComida] = useState<AlternativaDetalle | null>(null);

  const eliminarAlternativa = (id: string) => {
    if (deshabilitado) return;
    onChange(alternativas.filter((a) => a.id !== id));
  };

  const duplicarAlternativa = (alternativa: AlternativaSlot) => {
    if (deshabilitado) return;
    const dup: AlternativaSlot = {
      ...alternativa,
      id: `tmp-${Date.now()}`,
      nombre: `${alternativa.nombre} (copia)`,
    };
    onChange([...alternativas, dup]);
  };

  const abrirEdicionNueva = () => {
    if (deshabilitado) return;
    setAlternativaEnEdicion(null);
    setDialogoEdicionAbierto(true);
  };

  const abrirEdicionExistente = (alt: AlternativaSlot) => {
    if (deshabilitado) return;
    setAlternativaEnEdicion(alt);
    setDialogoEdicionAbierto(true);
  };

  const abrirDetalle = (alt: AlternativaSlot) => {
    if (deshabilitado) return;
    setDetalleComida({
      nombre: alt.nombre,
      alimentos: alt.alimentos,
      calorias: alt.calorias,
      proteinas: alt.proteinas,
      carbohidratos: alt.carbohidratos,
      grasas: alt.grasas,
      preparacionId: alt.preparacionId ?? null,
    });
    setDetalleAbierto(true);
  };

  const alGuardarAlternativa = (alt: AlternativaSlot) => {
    if (deshabilitado) return;
    if (alternativaEnEdicion) {
      // Editando existente
      onChange(
        alternativas.map((a) => (a.id === alternativaEnEdicion.id ? alt : a)),
      );
    } else {
      // Nueva
      onChange([...alternativas, alt]);
    }
  };

  return (
    <div
      ref={setNodeRef}
      className={[
        'rounded-lg border p-2.5 transition-all duration-200 group/slot min-h-[110px] flex flex-col',
        deshabilitado ? 'opacity-60' : '',
        isOver
          ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20'
          : 'border-border/60 bg-card/50 hover:bg-card/90 hover:border-border',
      ].join(' ')}
      data-testid={`slot-comida-${slotKey}`}
      aria-disabled={deshabilitado}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
          {dia} · {tipoComida}
        </span>
        <div className="flex items-center gap-0.5 opacity-60 group-hover/slot:opacity-100 transition-opacity">
          <Button
            size="icon"
            variant="ghost"
            className="size-5 text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10 rounded-md"
            onClick={abrirEdicionNueva}
            disabled={deshabilitado}
            aria-label={`Agregar comida manual en ${dia} ${tipoComida}`}
            data-testid={`add-manual-${slotKey}`}
          >
            <Plus className="size-3.5" />
          </Button>
          {onSelectForIa && (
            <Button
              size="icon"
              variant="ghost"
              className="size-5 text-fuchsia-500 hover:text-fuchsia-600 hover:bg-fuchsia-500/10 rounded-md"
              onClick={onSelectForIa}
              disabled={deshabilitado}
              aria-label={`Generar sugerencias para ${dia} ${tipoComida}`}
              data-testid={`select-ia-${slotKey}`}
            >
              <Sparkles className="size-3" />
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center">
        {alternativas.length === 0 ? (
          <p className="text-[10px] text-center text-muted-foreground/60 py-2 border border-dashed rounded-lg border-muted-foreground/20">
            Vacío
          </p>
        ) : (
          <div className="space-y-1.5">
            {alternativas.map((alt) => (
              <SlotAlternativaItem
                key={alt.id}
                alternativa={alt}
                onDelete={eliminarAlternativa}
                onDuplicate={duplicarAlternativa}
                onEdit={abrirEdicionExistente}
                onVerDetalle={abrirDetalle}
                deshabilitado={deshabilitado}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal Dialog para añadir/editar alternativa */}
      <DialogEditarAlternativa
        open={dialogoEdicionAbierto && !deshabilitado}
        onOpenChange={(open) => setDialogoEdicionAbierto(deshabilitado ? false : open)}
        alternativaInicial={alternativaEnEdicion}
        onSave={alGuardarAlternativa}
      />

      {/* Modal read-only con el detalle de la comida seleccionada */}
      <DialogDetalleComida
        open={detalleAbierto && !deshabilitado}
        onOpenChange={(open) => setDetalleAbierto(deshabilitado ? false : open)}
        alternativa={detalleComida}
        diaLabel={dia}
        tipoComidaLabel={tipoComida}
      />
    </div>
  );
}

function SlotAlternativaItem({
  alternativa,
  onDelete,
  onDuplicate,
  onEdit,
  onVerDetalle,
  deshabilitado,
}: {
  alternativa: AlternativaSlot;
  onDelete: (id: string) => void;
  onDuplicate: (alt: AlternativaSlot) => void;
  onEdit: (alt: AlternativaSlot) => void;
  onVerDetalle: (alt: AlternativaSlot) => void;
  deshabilitado?: boolean;
}) {
  return (
    <div
      className="rounded-lg border border-border/50 bg-muted/40 p-2 group/item hover:border-border hover:bg-muted/80 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
      data-testid={`alternativa-slot-${alternativa.id}`}
      role="button"
      tabIndex={deshabilitado ? -1 : 0}
      aria-label={`Ver detalle de ${alternativa.nombre}`}
      onClick={() => onVerDetalle(alternativa)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onVerDetalle(alternativa);
        }
      }}
    >
      <div className="flex items-start justify-between gap-1">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-foreground truncate flex items-center gap-1" title={alternativa.nombre}>
            {alternativa.preparacionId && (
              <BookOpen className="size-3 text-emerald-600 shrink-0" />
            )}
            {alternativa.nombre}
          </p>
          <p className="text-[9px] text-muted-foreground tabular-nums">
            {alternativa.calorias} kcal · P {alternativa.proteinas}g · C{' '}
            {alternativa.carbohidratos}g · G {alternativa.grasas}g
          </p>
        </div>
        <div className="flex items-center gap-0.5 opacity-40 group-hover/item:opacity-100 transition-opacity shrink-0">
          <Button
            size="icon"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(alternativa);
            }}
            disabled={deshabilitado}
            aria-label="Editar comida"
            className="size-5 rounded-md hover:bg-background"
            data-testid="btn-editar"
          >
            <Pencil className="size-2.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate(alternativa);
            }}
            disabled={deshabilitado}
            aria-label="Duplicar comida"
            className="size-5 rounded-md hover:bg-background"
            data-testid="btn-duplicar"
          >
            <Copy className="size-2.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(alternativa.id);
            }}
            disabled={deshabilitado}
            aria-label="Eliminar comida"
            className="size-5 rounded-md hover:bg-destructive/10 text-destructive"
            data-testid="btn-eliminar"
          >
            <Trash2 className="size-2.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
