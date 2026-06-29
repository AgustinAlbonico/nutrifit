import { useState } from 'react';
import { Sparkles, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { useAuth } from '@/contexts/AuthContext';
import { desenvolverRespuestaApi } from '@/lib/api-response';
import type { ApiResponse } from '@/types/api';

const DIAS: DiaSemana[] = [
  'LUNES',
  'MARTES',
  'MIERCOLES',
  'JUEVES',
  'VIERNES',
  'SABADO',
  'DOMINGO',
];

const TIPOS_COMIDA: TipoComidaPlan[] = [
  'DESAYUNO',
  'ALMUERZO',
  'MERIENDA',
  'CENA',
  'COLACION',
];

interface Props {
  planId: number;
  onAddIdea: (dia: DiaSemana, tipoComida: TipoComidaPlan, idea: IdeaComidaIa) => void;
  diaSeleccionado: DiaSemana;
  comidaSeleccionada: TipoComidaPlan;
  onSelectSlot: (dia: DiaSemana, tipoComida: TipoComidaPlan) => void;
}

export function PanelIdeasIa({
  planId,
  onAddIdea,
  diaSeleccionado,
  comidaSeleccionada,
  onSelectSlot,
}: Props) {
  const { token } = useAuth();
  const [cantidadAlternativas, setCantidadAlternativas] = useState(5);
  const [ideas, setIdeas] = useState<IdeaComidaIa[]>([]);
  const [pagina, setPagina] = useState(0);
  const [loading, setLoading] = useState(false);

  const generar = async () => {
    if (!planId) return;
    setLoading(true);
    setIdeas([]);
    setPagina(0);
    try {
      const res = await apiRequest<ApiResponse<{ alternativas: IdeaComidaIa[] }>>(
        `/planes-alimentacion/${planId}/ideas-comida`,
        {
          method: 'POST',
          body: {
            dia: diaSeleccionado,
            tipoComida: comidaSeleccionada,
            cantidadAlternativas,
          },
          token,
        },
      );
      const data = desenvolverRespuestaApi(res);
      setIdeas(data.alternativas || []);
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
    onAddIdea(diaSeleccionado, comidaSeleccionada, idea);
    toast.success(`"${idea.nombre}" agregado a ${diaSeleccionado} · ${comidaSeleccionada}`);
  };

  const limitePorPagina = 3;
  const inicio = pagina * limitePorPagina;
  const visibles = ideas.slice(inicio, inicio + limitePorPagina);
  const totalPaginas = Math.ceil(ideas.length / limitePorPagina);

  return (
    <Card className="rounded-2xl border-border/50 bg-card/40 backdrop-blur-sm" data-testid="panel-ideas-ia">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-md">
          <Sparkles className="size-4 text-fuchsia-500 animate-pulse" aria-hidden="true" />
          Sugerencias de Comida IA
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Selectores de Slot */}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Día</label>
            <Select
              value={diaSeleccionado}
              onValueChange={(v) => onSelectSlot(v as DiaSemana, comidaSeleccionada)}
            >
              <SelectTrigger className="h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DIAS.map((d) => (
                  <SelectItem key={d} value={d} className="text-xs">
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Comida</label>
            <Select
              value={comidaSeleccionada}
              onValueChange={(v) => onSelectSlot(diaSeleccionado, v as TipoComidaPlan)}
            >
              <SelectTrigger className="h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIPOS_COMIDA.map((t) => (
                  <SelectItem key={t} value={t} className="text-xs">
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Selector de cantidad y botón */}
        <div className="flex items-end gap-2">
          <div className="flex-1 space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
              Alternativas a generar
            </label>
            <Select
              value={String(cantidadAlternativas)}
              onValueChange={(v) => setCantidadAlternativas(Number(v))}
            >
              <SelectTrigger className="h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[3, 5, 8, 10, 15].map((n) => (
                  <SelectItem key={n} value={String(n)} className="text-xs">
                    {n} alternativas
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={generar}
            disabled={loading}
            className="h-9 shrink-0 bg-gradient-to-r from-fuchsia-600 to-indigo-600 hover:from-fuchsia-700 hover:to-indigo-700 text-white font-medium"
            data-testid="btn-generar-ideas"
          >
            {loading ? (
              <RefreshCw className="size-3.5 animate-spin" />
            ) : (
              <Sparkles className="mr-1.5 size-3.5" aria-hidden="true" />
            )}
            Generar
          </Button>
        </div>

        {/* Listado de ideas generadas */}
        {ideas.length > 0 && (
          <div className="space-y-3 pt-2 border-t border-border/40">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {ideas.length} ideas · Pág. {pagina + 1} de {totalPaginas}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-7"
                  onClick={() => setPagina((p) => Math.max(0, p - 1))}
                  disabled={pagina === 0}
                  aria-label="Página anterior"
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-7"
                  onClick={() => setPagina((p) => Math.min(totalPaginas - 1, p + 1))}
                  disabled={pagina >= totalPaginas - 1}
                  aria-label="Página siguiente"
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
            <div className="flex flex-col gap-2 max-h-[350px] overflow-y-auto pr-1">
              {visibles.map((idea) => (
                <AlternativaIaCard
                  key={idea.idTemp}
                  idea={idea}
                  onAdd={agregar}
                />
              ))}
            </div>
          </div>
        )}

        {!loading && ideas.length === 0 && (
          <p className="text-center text-xs text-muted-foreground py-6 border-t border-border/30 border-dashed">
            Elegí día y comida, luego hacé clic en "Generar" para ver sugerencias que podés arrastrar directamente al plan.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
