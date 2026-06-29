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
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { apiRequest } from '@/lib/api';
import { traducirErrorApi } from '@/lib/error-messages';
import { AlternativaIaCard } from './AlternativaIaCard';
import type { DiaSemana, TipoComidaPlan, IdeaComidaIa } from '@/types/ia';

const DIAS: DiaSemana[] = [
  'LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO',
];

const TIPOS_COMIDA: TipoComidaPlan[] = [
  'DESAYUNO', 'ALMUERZO', 'MERIENDA', 'CENA', 'COLACION',
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planId: number;
  onAddIdea: (dia: DiaSemana, tipoComida: TipoComidaPlan, idea: IdeaComidaIa) => void;
}

export function DialogGenerarIdeasIa({ open, onOpenChange, planId, onAddIdea }: Props) {
  const [dia, setDia] = useState<DiaSemana>('LUNES');
  const [tipoComida, setTipoComida] = useState<TipoComidaPlan>('DESAYUNO');
  const [ideas, setIdeas] = useState<IdeaComidaIa[]>([]);
  const [pagina, setPagina] = useState(0);
  const [loading, setLoading] = useState(false);

  const generar = async () => {
    setLoading(true);
    setIdeas([]);
    setPagina(0);
    try {
      const res = await apiRequest<{ alternativas: IdeaComidaIa[] }>(
        `/planes-alimentacion/${planId}/ideas-comida`,
        {
          method: 'POST',
          body: { dia, tipoComida, cantidadAlternativas: 10 },
        },
      );
      setIdeas(res.alternativas);
    } catch (err) {
      const errorTraducido = traducirErrorApi(err);
      toast.error(errorTraducido.titulo, {
        description: errorTraducido.descripcion,
      });
    } finally {
      setLoading(false);
    }
  };

  const agregar = (idea: IdeaComidaIa) => {
    onAddIdea(dia, tipoComida, idea);
    toast.success(`"${idea.nombre}" agregado a ${dia} · ${tipoComida}`);
  };

  const inicio = pagina * 3;
  const visibles = ideas.slice(inicio, inicio + 3);
  const totalPaginas = Math.ceil(ideas.length / 3);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generar ideas con IA</DialogTitle>
          <DialogDescription>
            Seleccioná el día y la comida, y generá alternativas para el plan.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-end gap-3">
          <div className="flex-1 space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Día</label>
            <Select value={dia} onValueChange={(v) => setDia(v as DiaSemana)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DIAS.map((d) => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1 space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Comida</label>
            <Select value={tipoComida} onValueChange={(v) => setTipoComida(v as TipoComidaPlan)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIPOS_COMIDA.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={generar} disabled={loading} className="shrink-0">
            <Sparkles className="mr-1.5 size-4" aria-hidden="true" />
            {loading ? 'Generando…' : 'Generar'}
          </Button>
        </div>

        {ideas.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {ideas.length} alternativas · Página {pagina + 1} de {totalPaginas}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setPagina((p) => Math.max(0, p - 1))}
                  disabled={pagina === 0}
                  aria-label="Página anterior"
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setPagina((p) => Math.min(totalPaginas - 1, p + 1))}
                  disabled={pagina >= totalPaginas - 1}
                  aria-label="Página siguiente"
                >
                  <ChevronRight className="size-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={generar}
                  disabled={loading}
                  aria-label="Regenerar"
                >
                  <RefreshCw className="size-4" />
                </Button>
              </div>
            </div>
            {visibles.map((idea) => (
              <AlternativaIaCard
                key={idea.idTemp}
                idea={idea}
                onAdd={agregar}
              />
            ))}
          </div>
        )}

        {!loading && ideas.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-4">
            Elegí día y comida, luego hacé clic en "Generar".
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
