import { useState, useEffect } from 'react';
import { Plus, Search, Loader2, ArrowLeft, Save, BookOpen, ChevronDown, ChevronRight, Flame, Droplet, Circle, Activity, X, ChevronsUpDown, Check } from 'lucide-react';
import { toast } from 'sonner';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { apiRequest } from '@/lib/api';

const quitarAcentos = (s: string): string =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const filtroSinAcentos = (value: string, search: string): number => {
  const v = quitarAcentos(value.toLowerCase());
  const s = quitarAcentos(search.toLowerCase());
  return v.includes(s) ? 1 : 0;
};
import { useAuth } from '@/contexts/AuthContext';
import {
  buscarAlimentos,
  obtenerGruposAlimenticios,
  obtenerAlimento,
  crearAlimento,
  type Alimento as AlimentoCatalogo,
  type GrupoAlimenticio,
  type CrearAlimentoDto,
} from '@/lib/api/alimentos';
import type { AlternativaSlot } from './SlotComidaManual';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  alternativaInicial?: AlternativaSlot | null;
  onSave: (alt: AlternativaSlot) => void;
}

interface AlimentoSeleccionado {
  alimentoId: number;
  nombre: string;
  cantidad: number;
  unidad: string;
  // Valores base para el recálculo
  baseCantidad: number;
  baseCalorias: number;
  baseProteinas: number;
  baseCarbohidratos: number;
  baseGrasas: number;
}

interface PreparacionItemResponse {
  idPreparacionItem: number;
  alimentoId: number;
  alimentoNombre: string;
  cantidadDefault: number;
  unidadDefault: string;
  calorias: number;
  proteinas: number;
  carbohidratos: number;
  grasas: number;
}

interface PreparacionResponse {
  idPreparacion: number;
  nombre: string;
  items: PreparacionItemResponse[];
  totalCalorias: number;
  totalProteinas: number;
  totalCarbohidratos: number;
  totalGrasas: number;
}

export function DialogEditarAlternativa({
  open,
  onOpenChange,
  alternativaInicial,
  onSave,
}: Props) {
  const { token } = useAuth();
  const [nombre, setNombre] = useState('');
  const [alimentos, setAlimentos] = useState<AlimentoSeleccionado[]>([]);
  
  // Macros manuales overrides
  const [calorias, setCalorias] = useState(0);
  const [proteinas, setProteinas] = useState(0);
  const [carbohidratos, setCarbohidratos] = useState(0);
  const [grasas, setGrasas] = useState(0);

  // Buscador de alimentos
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<AlimentoCatalogo[]>([]);
  const [searching, setSearching] = useState(false);
  const [filtroGrupoId, setFiltroGrupoId] = useState<number | null>(null);
  const [grupos, setGrupos] = useState<GrupoAlimenticio[]>([]);

  // Buscador de preparaciones reutilizables
  const [prepSearchQuery, setPrepSearchQuery] = useState('');
  const [prepSearchResults, setPrepSearchResults] = useState<PreparacionResponse[]>([]);
  const [searchingPreps, setSearchingPreps] = useState(false);
  const [guardarComoPreparacion, setGuardarComoPreparacion] = useState(false);
  const [guardandoPreparacion, setGuardandoPreparacion] = useState(false);

  // Secciones colapsables
  const [mostrarPreparaciones, setMostrarPreparaciones] = useState(false);

  // Formulario para CREAR nuevo alimento en la base de datos
  const [mostrandoCrearAlimento, setMostrandoCrearAlimento] = useState(false);
  const [nuevoAlimentoNombre, setNuevoAlimentoNombre] = useState('');
  const [nuevoAlimentoCantidad, setNuevoAlimentoCantidad] = useState(100);
  const [nuevoAlimentoUnidad, setNuevoAlimentoUnidad] = useState('gramo');
  const [nuevoAlimentoCalorias, setNuevoAlimentoCalorias] = useState(0);
  const [nuevoAlimentoProteinas, setNuevoAlimentoProteinas] = useState(0);
  const [nuevoAlimentoCarbohidratos, setNuevoAlimentoCarbohidratos] = useState(0);
  const [nuevoAlimentoGrasas, setNuevoAlimentoGrasas] = useState(0);
  const [creandoAlimento, setCreandoAlimento] = useState(false);

  // Inicializar estado al abrir o cambiar la alternativa inicial
  useEffect(() => {
    if (open) {
      if (alternativaInicial) {
        setNombre(alternativaInicial.nombre);
        setCalorias(alternativaInicial.calorias);
        setProteinas(alternativaInicial.proteinas);
        setCarbohidratos(alternativaInicial.carbohidratos);
        setGrasas(alternativaInicial.grasas);

        // Mapear alimentos
        const mapeados = alternativaInicial.alimentos.map((al) => ({
          alimentoId: al.alimentoId,
          nombre: al.nombre,
          cantidad: al.cantidad,
          unidad: al.unidad || 'g',
          baseCantidad: al.cantidad || 100,
          baseCalorias: 0,
          baseProteinas: 0,
          baseCarbohidratos: 0,
          baseGrasas: 0,
        }));
        setAlimentos(mapeados);
        
        // Cargar los macros base reales de cada alimento
        void cargarMacrosBase(alternativaInicial.alimentos, mapeados);
      } else {
        setNombre('');
        setAlimentos([]);
        setCalorias(0);
        setProteinas(0);
        setCarbohidratos(0);
        setGrasas(0);
      }
      setSearchQuery('');
      setSearchResults([]);
      setFiltroGrupoId(null);
      setPrepSearchQuery('');
      setPrepSearchResults([]);
      setGuardarComoPreparacion(false);
      setMostrandoCrearAlimento(false);

      // Cargar grupos alimenticios para el filtro (solo la primera vez)
      if (grupos.length === 0) {
        void (async () => {
          try {
            const g = await obtenerGruposAlimenticios(token!);
            setGrupos(g);
          } catch {
            // Silencioso: el filtro es opcional
          }
        })();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, alternativaInicial]);

  const cargarMacrosBase = async (
    alimentosOriginales: AlternativaSlot['alimentos'],
    mapeados: AlimentoSeleccionado[],
  ) => {
    try {
      const actualizados = [...mapeados];
      for (let i = 0; i < alimentosOriginales.length; i++) {
        const item = alimentosOriginales[i];
        const res = await obtenerAlimento(token!, item.alimentoId);
        if (res) {
          actualizados[i] = {
            ...actualizados[i],
            baseCantidad: res.cantidad || 100,
            baseCalorias: res.calorias || 0,
            baseProteinas: res.proteinas || 0,
            baseCarbohidratos: res.carbohidratos || 0,
            baseGrasas: res.grasas || 0,
          };
        }
      }
      setAlimentos(actualizados);
    } catch {
      // Ignorar errores base
    }
  };

  // Buscar alimentos al cambiar la query o el filtro de grupo (debounce 400ms)
  useEffect(() => {
    if (!searchQuery.trim() && !filtroGrupoId) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const resultados = await buscarAlimentos(token!, {
          search: searchQuery.trim() || undefined,
          grupoId: filtroGrupoId,
          limit: 8,
        });
        setSearchResults(resultados);
      } catch {
        toast.error('Error al buscar alimentos');
      } finally {
        setSearching(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery, filtroGrupoId, token]);

  // Recalcular macros acumulados a partir de los alimentos
  const recalcularMacros = (listaAlimentos: AlimentoSeleccionado[]) => {
    let cals = 0;
    let prots = 0;
    let carbs = 0;
    let fats = 0;

    listaAlimentos.forEach((a) => {
      const factor = a.cantidad / (a.baseCantidad || 100);
      cals += a.baseCalorias * factor;
      prots += a.baseProteinas * factor;
      carbs += a.baseCarbohidratos * factor;
      fats += a.baseGrasas * factor;
    });

    setCalorias(Math.round(cals));
    setProteinas(Math.round(prots * 10) / 10);
    setCarbohidratos(Math.round(carbs * 10) / 10);
    setGrasas(Math.round(fats * 10) / 10);
  };

  const agregarAlimento = (a: AlimentoCatalogo) => {
    // Evitar duplicados en el listado
    if (alimentos.some((item) => item.alimentoId === a.idAlimento)) {
      toast.info(`${a.nombre} ya fue agregado.`);
      return;
    }

    const nuevo: AlimentoSeleccionado = {
      alimentoId: a.idAlimento,
      nombre: a.nombre,
      cantidad: a.cantidad || 100,
      unidad: a.unidadMedida === 'gramo' ? 'g' : a.unidadMedida === 'mililitro' ? 'ml' : a.unidadMedida === 'unidad' ? 'un' : a.unidadMedida,
      baseCantidad: a.cantidad || 100,
      baseCalorias: a.calorias || 0,
      baseProteinas: a.proteinas || 0,
      baseCarbohidratos: a.carbohidratos || 0,
      baseGrasas: a.grasas || 0,
    };

    const nuevaLista = [...alimentos, nuevo];
    setAlimentos(nuevaLista);
    recalcularMacros(nuevaLista);
    setSearchQuery('');
    setSearchResults([]);
  };

  const removerAlimento = (id: number) => {
    const nuevaLista = alimentos.filter((item) => item.alimentoId !== id);
    setAlimentos(nuevaLista);
    recalcularMacros(nuevaLista);
  };

  const cambiarCantidad = (id: number, cant: number) => {
    const nuevaLista = alimentos.map((item) =>
      item.alimentoId === id ? { ...item, cantidad: Math.max(1, cant) } : item,
    );
    setAlimentos(nuevaLista);
    recalcularMacros(nuevaLista);
  };

  const abrirCrearAlimento = () => {
    setNuevoAlimentoNombre(searchQuery);
    setNuevoAlimentoCantidad(100);
    setNuevoAlimentoUnidad('gramo');
    setNuevoAlimentoCalorias(0);
    setNuevoAlimentoProteinas(0);
    setNuevoAlimentoCarbohidratos(0);
    setNuevoAlimentoGrasas(0);
    setMostrandoCrearAlimento(true);
  };

  const guardarNuevoAlimentoBaseDatos = async () => {
    if (!nuevoAlimentoNombre.trim()) {
      toast.error('El nombre del alimento es obligatorio.');
      return;
    }

    setCreandoAlimento(true);
    try {
      const dto: CrearAlimentoDto = {
        nombre: nuevoAlimentoNombre.trim(),
        cantidad: nuevoAlimentoCantidad,
        unidadMedida: nuevoAlimentoUnidad,
        calorias: nuevoAlimentoCalorias,
        proteinas: nuevoAlimentoProteinas,
        carbohidratos: nuevoAlimentoCarbohidratos,
        grasas: nuevoAlimentoGrasas,
      };
      const res = await crearAlimento(token!, dto);
      toast.success('Alimento creado en la base de datos');

      // Auto-agregar a la preparación
      agregarAlimento(res);
      setMostrandoCrearAlimento(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al guardar el alimento';
      toast.error(msg);
    } finally {
      setCreandoAlimento(false);
    }
  };

  // Buscar preparaciones (debounce 400ms)
  useEffect(() => {
    if (!prepSearchQuery.trim()) {
      setPrepSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearchingPreps(true);
      try {
        const res = await apiRequest<PreparacionResponse[] | { data: PreparacionResponse[] }>(
          `/preparaciones?search=${encodeURIComponent(prepSearchQuery)}&limit=8`,
          { token }
        );
        const lista = Array.isArray(res) ? res : (res?.data ?? []);
        setPrepSearchResults(lista);
      } catch {
        toast.error('Error al buscar preparaciones');
      } finally {
        setSearchingPreps(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [prepSearchQuery, token]);

  const cargarDesdePreparacion = (prep: PreparacionResponse) => {
    setNombre(prep.nombre);
    const nuevosAlimentos: AlimentoSeleccionado[] = prep.items.map((item) => ({
      alimentoId: item.alimentoId,
      nombre: item.alimentoNombre,
      cantidad: item.cantidadDefault,
      unidad: item.unidadDefault === 'gramo' ? 'g' : item.unidadDefault === 'mililitro' ? 'ml' : item.unidadDefault === 'unidad' ? 'un' : item.unidadDefault,
      baseCantidad: item.cantidadDefault,
      baseCalorias: item.calorias,
      baseProteinas: item.proteinas,
      baseCarbohidratos: item.carbohidratos,
      baseGrasas: item.grasas,
    }));
    setAlimentos(nuevosAlimentos);
    setCalorias(Math.round(prep.totalCalorias));
    setProteinas(Math.round(prep.totalProteinas * 10) / 10);
    setCarbohidratos(Math.round(prep.totalCarbohidratos * 10) / 10);
    setGrasas(Math.round(prep.totalGrasas * 10) / 10);
    setPrepSearchQuery('');
    setPrepSearchResults([]);
    toast.success(`Preparación "${prep.nombre}" cargada`);
  };

  const guardarCambios = async () => {
    if (!nombre.trim()) {
      toast.error('El nombre de la comida es obligatorio.');
      return;
    }

    // Opcionalmente guardar como preparación reutilizable
    if (guardarComoPreparacion && alimentos.length > 0) {
      setGuardandoPreparacion(true);
      try {
        await apiRequest('/preparaciones', {
          method: 'POST',
          body: {
            nombre: nombre.trim(),
            items: alimentos.map((a) => ({
              alimentoId: a.alimentoId,
              cantidadDefault: a.cantidad,
              unidadDefault: a.unidad === 'g' ? 'gramo' : a.unidad === 'ml' ? 'mililitro' : a.unidad === 'un' ? 'unidad' : a.unidad,
            })),
          },
          token,
        });
        toast.success('Preparación guardada para reutilizar');
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error al guardar la preparación';
        toast.error(msg);
      } finally {
        setGuardandoPreparacion(false);
      }
    }

    const altGuardada: AlternativaSlot = {
      id: alternativaInicial?.id ?? `tmp-${Date.now()}`,
      nombre: nombre.trim(),
      alimentos: alimentos.map((a) => ({
        alimentoId: a.alimentoId,
        cantidad: a.cantidad,
        unidad: a.unidad,
        nombre: a.nombre,
      })),
      calorias,
      proteinas,
      carbohidratos,
      grasas,
    };

    onSave(altGuardada);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl rounded-2xl border bg-background shadow-xl max-h-[90vh] flex flex-col overflow-hidden p-0">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b bg-muted/20 shrink-0">
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            {mostrandoCrearAlimento ? (
              <button
                onClick={() => setMostrandoCrearAlimento(false)}
                className="flex items-center gap-1 text-sm font-semibold text-emerald-600 hover:text-emerald-700 mr-2"
              >
                <ArrowLeft className="size-4" />
                Volver
              </button>
            ) : null}
            {mostrandoCrearAlimento ? 'Crear alimento nuevo' : alternativaInicial ? 'Editar comida manual' : 'Nueva comida manual'}
          </DialogTitle>
        </DialogHeader>

        {mostrandoCrearAlimento ? (
          /* ─── Formulario de creación de alimento (sin cambios) ─── */
          <div className="space-y-4 py-4 px-6 overflow-y-auto">
            <p className="text-xs text-muted-foreground bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-200 p-3 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
              Registrá el alimento con sus macros base (ej: cada 100 gramos o por unidad). Esto quedará guardado para futuros planes.
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="nuevo-nombre" className="text-xs font-semibold">Nombre del alimento</Label>
                <Input
                  id="nuevo-nombre"
                  value={nuevoAlimentoNombre}
                  onChange={(e) => setNuevoAlimentoNombre(e.target.value)}
                  placeholder="Ej: Carne de cuadril"
                  className="rounded-xl h-10"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="nuevo-cantidad" className="text-xs font-semibold">Cantidad base</Label>
                <Input
                  id="nuevo-cantidad"
                  type="number"
                  value={nuevoAlimentoCantidad}
                  onChange={(e) => setNuevoAlimentoCantidad(Number(e.target.value))}
                  className="rounded-xl h-10"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="nuevo-unidad" className="text-xs font-semibold">Unidad de medida</Label>
                <select
                  id="nuevo-unidad"
                  value={nuevoAlimentoUnidad}
                  onChange={(e) => setNuevoAlimentoUnidad(e.target.value)}
                  className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="gramo">Gramo (g)</option>
                  <option value="mililitro">Mililitro (ml)</option>
                  <option value="unidad">Unidad (un)</option>
                  <option value="taza">Taza</option>
                  <option value="cucharada">Cucharada</option>
                  <option value="cucharadita">Cucharadita</option>
                </select>
              </div>
            </div>

            <div className="space-y-3 p-4 rounded-xl border bg-muted/30">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Información Nutricional (para la cantidad base especificada)
              </h4>
              <div className="grid grid-cols-4 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="nuevo-kcal" className="text-[10px] font-bold uppercase text-muted-foreground">Calorías</Label>
                  <Input
                    id="nuevo-kcal"
                    type="number"
                    value={nuevoAlimentoCalorias}
                    onChange={(e) => setNuevoAlimentoCalorias(Number(e.target.value))}
                    className="rounded-lg h-9 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="nuevo-pro" className="text-[10px] font-bold uppercase text-muted-foreground">Prots (g)</Label>
                  <Input
                    id="nuevo-pro"
                    type="number"
                    value={nuevoAlimentoProteinas}
                    onChange={(e) => setNuevoAlimentoProteinas(Number(e.target.value))}
                    className="rounded-lg h-9 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="nuevo-carb" className="text-[10px] font-bold uppercase text-muted-foreground">Carbs (g)</Label>
                  <Input
                    id="nuevo-carb"
                    type="number"
                    value={nuevoAlimentoCarbohidratos}
                    onChange={(e) => setNuevoAlimentoCarbohidratos(Number(e.target.value))}
                    className="rounded-lg h-9 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="nuevo-gras" className="text-[10px] font-bold uppercase text-muted-foreground">Grasas (g)</Label>
                  <Input
                    id="nuevo-gras"
                    type="number"
                    value={nuevoAlimentoGrasas}
                    onChange={(e) => setNuevoAlimentoGrasas(Number(e.target.value))}
                    className="rounded-lg h-9 text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setMostrandoCrearAlimento(false)} className="rounded-xl">
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={guardarNuevoAlimentoBaseDatos}
                disabled={creandoAlimento}
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold gap-1.5"
              >
                {creandoAlimento ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                Guardar y agregar
              </Button>
            </div>
          </div>
        ) : (
          /* ─── Formulario principal de alternativa ─── */
          <>
            {/* Scrollable body */}
            <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

              {/* 1. Nombre de la comida */}
              <div className="space-y-1.5">
                <Label htmlFor="nombre-comida" className="text-sm font-semibold text-muted-foreground">
                  Nombre de la comida
                </Label>
                <Input
                  id="nombre-comida"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej: Pollo al horno con puré de calabaza"
                  className="rounded-xl h-11 bg-card/60"
                  data-testid="input-nombre-comida"
                />
              </div>

              {/* 2. Buscador de ingredientes — EL PROTAGONISTA */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  {/* Input de búsqueda — flex-1 */}
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Buscar ingrediente por nombre..."
                      className="pl-9 pr-9 rounded-xl h-10 bg-card/60"
                      data-testid="search-alimentos-input"
                    />
                    {searching && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 size-4 animate-spin text-muted-foreground" />
                    )}
                  </div>

                  {/* Filtro de categoría — combobox buscable */}
                  {grupos.length > 0 && (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          className="w-[200px] h-10 rounded-xl bg-card/60 border-border/50 text-xs font-medium justify-between shrink-0"
                          data-testid="filtro-categoria-alimento"
                        >
                          {filtroGrupoId
                            ? grupos.find((g) => g.idGrupoAlimenticio === filtroGrupoId)?.descripcion
                            : 'Todas las categorías'}
                          <ChevronsUpDown className="ml-1 h-3.5 w-3.5 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[220px] p-0 rounded-xl" align="end">
                        <Command filter={filtroSinAcentos}>
                          <CommandInput placeholder="Buscar categoría..." />
                          <CommandList>
                            <CommandEmpty>Sin resultados</CommandEmpty>
                            <CommandGroup>
                              <CommandItem
                                value="todas las categorias"
                                onSelect={() => setFiltroGrupoId(null)}
                              >
                                <Check
                                  className={cn(
                                    'mr-2 h-4 w-4',
                                    filtroGrupoId === null ? 'opacity-100' : 'opacity-0',
                                  )}
                                />
                                Todas las categorías
                              </CommandItem>
                              {grupos.map((g) => (
                                <CommandItem
                                  key={g.idGrupoAlimenticio}
                                  value={g.descripcion}
                                  onSelect={() => setFiltroGrupoId(g.idGrupoAlimenticio)}
                                >
                                  <Check
                                    className={cn(
                                      'mr-2 h-4 w-4',
                                      filtroGrupoId === g.idGrupoAlimenticio ? 'opacity-100' : 'opacity-0',
                                    )}
                                  />
                                  {g.descripcion}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  )}
                </div>

                {/* Resultados de búsqueda — inline, NO absolute */}
                {searchResults.length > 0 && (
                  <div className="rounded-xl border border-border/60 bg-popover/95 shadow-sm overflow-y-auto max-h-52 divide-y divide-border/50">
                    {searchResults.map((a) => (
                      <button
                        key={a.idAlimento}
                        onClick={() => agregarAlimento(a)}
                        className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-accent/70 transition-colors"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-sm text-foreground truncate pr-2">{a.nombre}</p>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <span className="text-[10px] text-muted-foreground tabular-nums">
                              {a.cantidad} {a.unidadMedida === 'gramo' ? 'g' : a.unidadMedida === 'mililitro' ? 'ml' : a.unidadMedida === 'unidad' ? 'un' : a.unidadMedida}
                              &nbsp;·&nbsp;
                              <Flame className="inline size-2.5 text-orange-500" /> {a.calorias ?? 0} kcal
                              &nbsp;·&nbsp;
                              <Activity className="inline size-2.5 text-green-500" /> P {a.proteinas ?? 0}g
                              &nbsp;·&nbsp;
                              <Droplet className="inline size-2.5 text-blue-500" /> C {a.carbohidratos ?? 0}g
                              &nbsp;·&nbsp;
                              <Circle className="inline size-2.5 text-amber-500 fill-amber-500" /> G {a.grasas ?? 0}g
                            </span>
                            {a.grupoAlimenticio && (
                              <span className="inline-block text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                {a.grupoAlimenticio.descripcion}
                              </span>
                            )}
                          </div>
                        </div>
                        <Plus className="size-4 text-emerald-500 shrink-0 ml-2" />
                      </button>
                    ))}
                  </div>
                )}

                {/* Link para crear alimento si no existe */}
                {!searching && searchQuery.trim().length > 1 && (
                  <button
                    onClick={abrirCrearAlimento}
                    className="flex items-center gap-1.5 text-xs text-emerald-600 hover:text-emerald-700 hover:underline underline-offset-2 transition-colors mt-1"
                  >
                    <Plus className="size-3" />
                    {searchResults.length === 0
                      ? `Crear "${searchQuery.trim()}" como alimento nuevo`
                      : 'No está en la lista? Crear alimento nuevo'}
                  </button>
                )}
              </div>

              {/* 3. Ingredientes seleccionados */}
              {alimentos.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Ingredientes seleccionados
                    </span>
                    <span className="text-xs text-muted-foreground">{alimentos.length} item{alimentos.length !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="rounded-xl border border-border/50 bg-card/40 overflow-hidden divide-y divide-border/50">
                    {alimentos.map((a) => (
                      <div key={a.alimentoId} className="flex items-center justify-between px-4 py-2.5 gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{a.nombre}</p>
                          <p className="text-[10px] text-muted-foreground tabular-nums">
                            {Math.round(a.baseCalorias * (a.cantidad / a.baseCantidad))} kcal aportados
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Input
                            type="number"
                            value={a.cantidad}
                            onChange={(e) => cambiarCantidad(a.alimentoId, Number(e.target.value))}
                            className="w-16 h-8 text-xs text-center rounded-lg"
                          />
                          <span className="text-xs text-muted-foreground w-7 text-center">{a.unidad}</span>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => removerAlimento(a.alimentoId)}
                            className="size-7 text-destructive/70 hover:text-destructive hover:bg-destructive/10 rounded-lg"
                          >
                            <X className="size-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 4. Preparaciones — colapsable */}
              <div className="space-y-2">
                <button
                  onClick={() => setMostrarPreparaciones((v) => !v)}
                  className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors w-full"
                >
                  <BookOpen className="size-4 text-emerald-600" />
                  <span>Cargar desde preparación guardada</span>
                  {mostrarPreparaciones ? (
                    <ChevronDown className="size-4 ml-auto" />
                  ) : (
                    <ChevronRight className="size-4 ml-auto" />
                  )}
                </button>

                {mostrarPreparaciones && (
                  <div className="space-y-2 pl-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                      <Input
                        value={prepSearchQuery}
                        onChange={(e) => setPrepSearchQuery(e.target.value)}
                        placeholder="Buscar preparación (ej: Pollo con puré)..."
                        className="pl-9 pr-9 rounded-xl h-10 bg-card/60"
                        data-testid="search-preparaciones-input"
                      />
                      {searchingPreps && (
                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 size-4 animate-spin text-muted-foreground" />
                      )}
                    </div>

                    {prepSearchResults.length > 0 && (
                      <div className="rounded-xl border border-border/60 bg-popover/95 shadow-sm overflow-y-auto max-h-48 divide-y divide-border/50">
                        {prepSearchResults.map((p) => (
                          <button
                            key={p.idPreparacion}
                            onClick={() => cargarDesdePreparacion(p)}
                            className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-accent/70 transition-colors"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-sm text-foreground truncate pr-2">{p.nombre}</p>
                              <p className="text-[10px] text-muted-foreground tabular-nums mt-0.5">
                                <Flame className="inline size-2.5 text-orange-500" /> {p.totalCalorias} kcal
                                &nbsp;·&nbsp;
                                <Activity className="inline size-2.5 text-green-500" /> P {p.totalProteinas}g
                                &nbsp;·&nbsp;
                                <Droplet className="inline size-2.5 text-blue-500" /> C {p.totalCarbohidratos}g
                                &nbsp;·&nbsp;
                                <Circle className="inline size-2.5 text-amber-500 fill-amber-500" /> G {p.totalGrasas}g
                              </p>
                            </div>
                            <Plus className="size-4 text-emerald-500 shrink-0 ml-2" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 5. Checkbox guardar como preparación */}
              {alimentos.length > 0 && (
                <div className="flex items-center gap-2.5 px-1 py-0.5">
                  <input
                    type="checkbox"
                    id="guardar-como-prep"
                    checked={guardarComoPreparacion}
                    onChange={(e) => setGuardarComoPreparacion(e.target.checked)}
                    disabled={guardandoPreparacion}
                    className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 size-4 cursor-pointer disabled:opacity-50"
                  />
                  <Label htmlFor="guardar-como-prep" className="text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors select-none">
                    {guardandoPreparacion ? 'Guardando preparación...' : 'Guardar como preparación reutilizable'}
                  </Label>
                </div>
              )}
            </div>

            {/* ─── Macros summary — STICKY bottom ─── */}
            <div className="shrink-0 border-t bg-muted/30 backdrop-blur-sm">
              <div className="px-6 py-3">
                <div className="grid grid-cols-4 gap-2">
                  {/* Calorías */}
                  <div className="flex flex-col items-center justify-center rounded-xl bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/30 px-3 py-2">
                    <Flame className="size-3.5 text-orange-500 mb-0.5" />
                    <span className="text-lg font-bold text-orange-600 dark:text-orange-400 leading-none tabular-nums">{calorias}</span>
                    <span className="text-[9px] font-semibold uppercase text-orange-500/80 mt-0.5">kcal</span>
                  </div>
                  {/* Proteínas */}
                  <div className="flex flex-col items-center justify-center rounded-xl bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/30 px-3 py-2">
                    <Activity className="size-3.5 text-green-500 mb-0.5" />
                    <span className="text-lg font-bold text-green-600 dark:text-green-400 leading-none tabular-nums">{proteinas}g</span>
                    <span className="text-[9px] font-semibold uppercase text-green-500/80 mt-0.5">Prots</span>
                  </div>
                  {/* Carbohidratos */}
                  <div className="flex flex-col items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/30 px-3 py-2">
                    <Droplet className="size-3.5 text-blue-500 mb-0.5" />
                    <span className="text-lg font-bold text-blue-600 dark:text-blue-400 leading-none tabular-nums">{carbohidratos}g</span>
                    <span className="text-[9px] font-semibold uppercase text-blue-500/80 mt-0.5">Carbs</span>
                  </div>
                  {/* Grasas */}
                  <div className="flex flex-col items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 px-3 py-2">
                    <Circle className="size-3.5 text-amber-500 mb-0.5" />
                    <span className="text-lg font-bold text-amber-600 dark:text-amber-400 leading-none tabular-nums">{grasas}g</span>
                    <span className="text-[9px] font-semibold uppercase text-amber-500/80 mt-0.5">Grasas</span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <DialogFooter className="px-6 py-3 border-t bg-background/80 gap-2 shrink-0">
                <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl" disabled={guardandoPreparacion}>
                  Cancelar
                </Button>
                <Button onClick={guardarCambios} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold gap-1.5" disabled={guardandoPreparacion}>
                  {guardandoPreparacion ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                  Guardar comida
                </Button>
              </DialogFooter>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
