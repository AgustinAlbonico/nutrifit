import { useState, useEffect } from 'react';
import { Search, Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FoodInfoCard } from './FoodInfoCard';
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

  return (
    <Dialog open={abierto} onOpenChange={alCerrar}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Buscar Alimento</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre..."
              value={busquedaTexto}
              onChange={(e) => establecerBusquedaTexto(e.target.value)}
              className="pl-9"
            />
          </div>

          <Tabs value={grupoActivo} onValueChange={establecerGrupoActivo}>
            <TabsList className="flex-wrap h-auto gap-1">
              <TabsTrigger value="todos">Todos</TabsTrigger>
              {grupos.map((grupo) => (
                <TabsTrigger key={grupo.idGrupoAlimenticio} value={String(grupo.idGrupoAlimenticio)}>
                  {grupo.descripcion}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value={grupoActivo} className="mt-4">
              <ScrollArea className="h-[400px] pr-4">
                {cargando ? (
                  <p className="text-center text-muted-foreground py-8">Cargando...</p>
                ) : alimentos.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    {busquedaTexto.length < 2 && grupoActivo === 'todos'
                      ? 'Seleccioná una categoría o escribí para buscar'
                      : 'No se encontraron alimentos'}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {alimentos.map((alimento) => (
                      <div key={alimento.idAlimento} className="flex items-center gap-2">
                        <div className="flex-1">
                          <FoodInfoCard alimento={alimento} />
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => manejarSeleccion(alimento)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
