import { useState, useEffect } from 'react';
import { Search, Plus, X, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FoodInfoCard } from './FoodInfoCard';
import { cn } from '@/lib/utils';
import { 
  obtenerGruposAlimenticios, 
  buscarAlimentosPorGrupo, 
  buscarAlimentosPorTexto,
  type GrupoAlimenticio, 
  type Alimento 
} from '@/lib/api/alimentos';

interface PropsDialogoBusquedaAlimentos {
  abierto: boolean;
  alCerrar: () => void;
  alSeleccionar: (alimento: Alimento) => void;
}

const COLORES_GRUPO: Record<string, string> = {
  'Lácteos': 'bg-sky-500/10 text-sky-700 dark:text-sky-300 hover:bg-sky-500/20',
  'Carnes': 'bg-rose-500/10 text-rose-700 dark:text-rose-300 hover:bg-rose-500/20',
  'Vegetales': 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20',
  'Frutas': 'bg-orange-500/10 text-orange-700 dark:text-orange-300 hover:bg-orange-500/20',
  'Cereales y derivados': 'bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20',
  'Legumbres': 'bg-lime-500/10 text-lime-700 dark:text-lime-300 hover:bg-lime-500/20',
  'Aceites y grasas': 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-300 hover:bg-yellow-500/20',
  'Azúcares y dulces': 'bg-pink-500/10 text-pink-700 dark:text-pink-300 hover:bg-pink-500/20',
  'Bebidas': 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-500/20',
  'Otros': 'bg-slate-500/10 text-slate-700 dark:text-slate-300 hover:bg-slate-500/20',
};

export function FoodSearchDialog({ abierto, alCerrar, alSeleccionar }: PropsDialogoBusquedaAlimentos) {
  const { token } = useAuth();
  const [grupos, establecerGrupos] = useState<GrupoAlimenticio[]>([]);
  const [grupoActivo, establecerGrupoActivo] = useState<string>('todos');
  const [alimentos, establecerAlimentos] = useState<Alimento[]>([]);
  const [busquedaTexto, establecerBusquedaTexto] = useState('');
  const [cargando, establecerCargando] = useState(false);

  useEffect(() => {
    if (!token || !abierto) return;
    
    const cargarGrupos = async () => {
      try {
        const datos = await obtenerGruposAlimenticios(token);
        establecerGrupos(datos);
      } catch {
        // Error silencioso
      }
    };
    
    void cargarGrupos();
  }, [token, abierto]);

  useEffect(() => {
    if (!token || !abierto) return;

    const cargarAlimentos = async () => {
      establecerCargando(true);
      try {
        if (busquedaTexto.length >= 2) {
          const datos = await buscarAlimentosPorTexto(token, busquedaTexto);
          establecerAlimentos(datos);
        } else if (grupoActivo !== 'todos') {
          const grupoId = parseInt(grupoActivo, 10);
          const datos = await buscarAlimentosPorGrupo(token, grupoId);
          establecerAlimentos(datos);
        } else {
          establecerAlimentos([]);
        }
      } catch {
        establecerAlimentos([]);
      } finally {
        establecerCargando(false);
      }
    };

    const timer = setTimeout(() => void cargarAlimentos(), 300);
    return () => clearTimeout(timer);
  }, [token, abierto, grupoActivo, busquedaTexto]);

  const manejarSeleccion = (alimento: Alimento) => {
    alSeleccionar(alimento);
    alCerrar();
  };

  const obtenerColorGrupo = (descripcion: string): string => {
    return COLORES_GRUPO[descripcion] || COLORES_GRUPO['Otros'];
  };

  return (
    <Dialog open={abierto} onOpenChange={alCerrar}>
      <DialogContent className="max-w-3xl max-h-[85vh] p-0 gap-0 overflow-hidden">
        {/* Header con gradiente */}
        <div className="bg-gradient-to-r from-orange-500/10 via-rose-500/5 to-sky-500/10 dark:from-orange-500/20 dark:via-rose-500/10 dark:to-sky-500/20 px-6 py-4 border-b border-border/50">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-rose-500 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-xl">Buscar Alimento</DialogTitle>
                <p className="text-sm text-muted-foreground">
                  Encontrá el alimento perfecto para tu plan
                </p>
              </div>
            </div>
          </DialogHeader>
          
          {/* Search Input */}
          <div className="relative mt-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Buscá por nombre (ej: leche, pollo, arroz...)"
              value={busquedaTexto}
              onChange={(e) => {
                establecerBusquedaTexto(e.target.value);
                if (e.target.value.length > 0) {
                  establecerGrupoActivo('todos');
                }
              }}
              className="pl-12 h-12 text-base bg-background/80 border-border/50 focus:border-orange-500/50 focus:ring-orange-500/20"
            />
            {busquedaTexto && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                onClick={() => establecerBusquedaTexto('')}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <div className="flex flex-col h-[500px]">
          {/* Category Pills */}
          <div className="px-6 py-3 border-b border-border/30 bg-muted/20">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => {
                  establecerGrupoActivo('todos');
                  establecerBusquedaTexto('');
                }}
                className={cn(
                  "px-3 py-1.5 rounded-full text-sm font-medium transition-all",
                  grupoActivo === 'todos' && busquedaTexto === ''
                    ? "bg-foreground text-background"
                    : "bg-background/60 hover:bg-background text-foreground"
                )}
              >
                Todos
              </button>
              {grupos.map((grupo) => (
                <button
                  key={grupo.idGrupoAlimenticio}
                  onClick={() => {
                    establecerGrupoActivo(String(grupo.idGrupoAlimenticio));
                    establecerBusquedaTexto('');
                  }}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-sm font-medium transition-all",
                    grupoActivo === String(grupo.idGrupoAlimenticio)
                      ? "ring-2 ring-foreground/20 scale-105"
                      : "",
                    obtenerColorGrupo(grupo.descripcion)
                  )}
                >
                  {grupo.descripcion}
                </button>
              ))}
            </div>
          </div>

          {/* Results */}
          <ScrollArea className="flex-1 px-6 py-4">
            {cargando ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <div className="w-8 h-8 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin mb-3" />
                <span className="text-sm">Buscando alimentos...</span>
              </div>
            ) : alimentos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                  <Search className="h-8 w-8 text-muted-foreground/50" />
                </div>
                <p className="text-muted-foreground">
                  {busquedaTexto.length < 2 && grupoActivo === 'todos'
                    ? 'Seleccioná una categoría o escribí para buscar'
                    : 'No se encontraron alimentos'}
                </p>
                {busquedaTexto.length === 1 && (
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    Escribí al menos 2 caracteres
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {alimentos.map((alimento) => (
                  <div 
                    key={alimento.idAlimento} 
                    className="group flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-background to-muted/20 border border-border/30 hover:border-border hover:shadow-sm transition-all"
                  >
                    <div className="flex-1 min-w-0">
                      <FoodInfoCard alimento={alimento} variante="default" />
                    </div>
                    <Button
                      size="sm"
                      className="shrink-0 bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white opacity-70 group-hover:opacity-100 transition-opacity"
                      onClick={() => manejarSeleccion(alimento)}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Agregar
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
