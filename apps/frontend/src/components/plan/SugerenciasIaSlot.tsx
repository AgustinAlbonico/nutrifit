import { useState, useTransition, useEffect } from 'react';
import { Sparkles, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { traducirErrorApi } from '@/lib/error-messages';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { AlternativaIaCard } from './AlternativaIaCard';
import type { IdeaComidaIa, GenerarIdeasComidaArgs } from '@/types/ia';

export function SugerenciasIaSlot({
  planId,
  dia,
  tipoComida,
  onAdd,
}: {
  planId: number;
  dia: string;
  tipoComida: string;
  onAdd: (idea: IdeaComidaIa) => void;
}) {
  const [ideas, setIdeas] = useState<IdeaComidaIa[]>([]);
  const [pagina, setPagina] = useState(0);
  const [loading, setLoading] = useState(false);
  const [, startTransition] = useTransition();

  const cargar = async () => {
    setLoading(true);
    try {
      const cuerpo: GenerarIdeasComidaArgs = {
        planAlimentacionId: planId,
        dia: dia as GenerarIdeasComidaArgs['dia'],
        tipoComida: tipoComida as GenerarIdeasComidaArgs['tipoComida'],
      };
      const res = await apiRequest<{ promptUsado: string; alternativas: IdeaComidaIa[] }>(
        `/planes-alimentacion/${planId}/ideas-comida`,
        { method: 'POST', body: { ...cuerpo, cantidadAlternativas: 10 } },
      );
      startTransition(() => setIdeas(res.alternativas));
    } catch (err) {
      const errorTraducido = traducirErrorApi(err);
      toast.error(errorTraducido.titulo, {
        description: errorTraducido.descripcion,
      });
    } finally {
      setLoading(false);
    }
  };

  // Auto-fetch on mount
  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const inicio = pagina * 3;
  const visibles = ideas.slice(inicio, inicio + 3);

  return (
    <div className="space-y-2">
      {ideas.length === 0 ? (
        <Button
          onClick={cargar}
          disabled={loading}
          data-testid="boton-sugerir-ideas"
        >
          <Sparkles className="mr-1.5 size-3.5" aria-hidden="true" />
          {loading ? 'Pensando…' : 'Sugerir ideas IA'}
        </Button>
      ) : (
        <>
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">
              Página {pagina + 1} de {Math.ceil(ideas.length / 3)}
            </span>
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setPagina(Math.max(0, pagina - 1))}
                disabled={pagina === 0}
                aria-label="Página anterior"
              >
                <ChevronLeft className="size-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() =>
                  setPagina(Math.min(Math.ceil(ideas.length / 3) - 1, pagina + 1))
                }
                disabled={inicio + 3 >= ideas.length}
                aria-label="Página siguiente"
              >
                <ChevronRight className="size-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={cargar}
                disabled={loading}
              >
                <RefreshCw className="size-3" />
              </Button>
            </div>
          </div>
          <div className="grid gap-2">
            {visibles.map((idea) => (
              <AlternativaIaCard
                key={idea.idTemp}
                idea={idea}
                onAdd={onAdd}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
