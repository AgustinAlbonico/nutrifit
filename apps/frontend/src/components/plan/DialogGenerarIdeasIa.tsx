import { useState } from 'react';
import { Sparkles, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { apiRequest } from '@/lib/api';
import { desenvolverRespuestaApi } from '@/lib/api-response';
import { traducirErrorApi } from '@/lib/error-messages';
import { AlternativaIaCard } from './AlternativaIaCard';
import type { ApiResponse } from '@/types/api';
import type { DiaSemana, TipoComidaPlan, IdeaComidaIa } from '@/types/ia';

const CANTIDADES_ALTERNATIVAS = [1, 2, 3, 5, 8, 10] as const;
const LIMITE_POR_PAGINA = 3;
const ESTADO_DIALOG_INICIAL = {
  cantidadAlternativas: 3,
  ideas: [] as IdeaComidaIa[],
  pagina: 0,
  loading: false,
};

interface SlotIdeasIa {
  dia: DiaSemana;
  tipoComida: TipoComidaPlan;
}

interface RespuestaIdeasIa {
  promptUsado: string;
  alternativas: IdeaComidaIa[];
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planId: number;
  slot: SlotIdeasIa | null;
  onAddIdea: (dia: DiaSemana, tipoComida: TipoComidaPlan, idea: IdeaComidaIa) => void;
}

export function DialogGenerarIdeasIa({
  open,
  onOpenChange,
  planId,
  slot,
  onAddIdea,
}: Props) {
  const [estado, setEstado] = useState({
    ...ESTADO_DIALOG_INICIAL,
    slotClave: null as string | null,
  });
  const slotClave = open && slot ? `${slot.dia}-${slot.tipoComida}` : null;

  if (estado.slotClave !== slotClave) {
    setEstado({ ...ESTADO_DIALOG_INICIAL, slotClave });
  }

  if (!slot) return null;

  const { cantidadAlternativas, ideas, pagina, loading } = estado;

  const generar = async () => {
    setEstado((prev) => ({ ...prev, loading: true, ideas: [], pagina: 0 }));

    try {
      const respuesta = await apiRequest<RespuestaIdeasIa | ApiResponse<RespuestaIdeasIa>>(
        `/planes-alimentacion/${planId}/ideas-comida`,
        {
          method: 'POST',
          body: {
            dia: slot.dia,
            tipoComida: slot.tipoComida,
            cantidadAlternativas,
          },
        },
      );
      const data = desenvolverRespuestaApi(respuesta);
      setEstado((prev) => ({ ...prev, ideas: data.alternativas ?? [] }));
    } catch (err) {
      const errorTraducido = traducirErrorApi(err);
      toast.error(errorTraducido.titulo, {
        description: errorTraducido.descripcion,
      });
    } finally {
      setEstado((prev) => ({ ...prev, loading: false }));
    }
  };

  const agregar = (idea: IdeaComidaIa) => {
    onAddIdea(slot.dia, slot.tipoComida, idea);
    setEstado((prev) => {
      const ideasRestantes = prev.ideas.filter((i) => i.idTemp !== idea.idTemp);
      const totalPaginasRestantes = Math.ceil(ideasRestantes.length / LIMITE_POR_PAGINA);
      const ultimaPaginaValida = Math.max(0, totalPaginasRestantes - 1);
      return {
        ...prev,
        ideas: ideasRestantes,
        pagina: Math.min(prev.pagina, ultimaPaginaValida),
      };
    });
    toast.success(`"${idea.nombre}" agregado a ${slot.dia} · ${slot.tipoComida}`);
  };

  const inicio = pagina * LIMITE_POR_PAGINA;
  const visibles = ideas.slice(inicio, inicio + LIMITE_POR_PAGINA);
  const totalPaginas = Math.ceil(ideas.length / LIMITE_POR_PAGINA);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[82vh] max-w-xl overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="size-5 text-fuchsia-500" aria-hidden="true" />
            Agregar alternativa con IA
          </DialogTitle>
          <DialogDescription>
            Generá ideas para este slot y agregá una directamente al plan.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-xl border bg-muted/40 p-3">
          <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
            Slot seleccionado
          </p>
          <p className="mt-1 text-sm font-semibold">
            {slot.dia} · {slot.tipoComida}
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex flex-1 flex-col gap-1.5">
            <span
              id="cantidad-alternativas-label"
              className="text-xs font-medium text-muted-foreground"
            >
              Alternativas a generar
            </span>
            <Select
              value={String(cantidadAlternativas)}
              onValueChange={(value) =>
                setEstado((prev) => ({
                  ...prev,
                  cantidadAlternativas: Number(value),
                }))
              }
            >
              <SelectTrigger
                aria-labelledby="cantidad-alternativas-label"
                className="w-full"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {CANTIDADES_ALTERNATIVAS.map((cantidad) => (
                    <SelectItem key={cantidad} value={String(cantidad)}>
                      {cantidad} alternativa{cantidad === 1 ? '' : 's'}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <Button type="button" onClick={generar} disabled={loading} className="shrink-0">
            {loading ? (
              <RefreshCw className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Sparkles className="mr-1.5 size-4" aria-hidden="true" />
            )}
            {loading ? 'Generando...' : 'Generar'}
          </Button>
        </div>

        {ideas.length > 0 && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
              <span>
                {ideas.length} alternativa{ideas.length === 1 ? '' : 's'} · Página{' '}
                {pagina + 1} de {totalPaginas}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    setEstado((prev) => ({
                      ...prev,
                      pagina: Math.max(0, prev.pagina - 1),
                    }))
                  }
                  disabled={pagina === 0}
                  aria-label="Página anterior"
                >
                  <ChevronLeft className="size-4" aria-hidden="true" />
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    setEstado((prev) => ({
                      ...prev,
                      pagina: Math.min(totalPaginas - 1, prev.pagina + 1),
                    }))
                  }
                  disabled={pagina >= totalPaginas - 1}
                  aria-label="Página siguiente"
                >
                  <ChevronRight className="size-4" aria-hidden="true" />
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={generar}
                  disabled={loading}
                  aria-label="Regenerar alternativas"
                >
                  <RefreshCw className="size-4" aria-hidden="true" />
                </Button>
              </div>
            </div>

            <div className="grid gap-2">
              {visibles.map((idea) => (
                <AlternativaIaCard
                  key={idea.idTemp}
                  idea={idea}
                  onAdd={agregar}
                  textoAccion="Agregar a este slot"
                />
              ))}
            </div>
          </div>
        )}

        {!loading && ideas.length === 0 && (
          <p className="rounded-xl border border-dashed py-6 text-center text-sm text-muted-foreground">
            Elegí una cantidad y generá alternativas para este slot.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
