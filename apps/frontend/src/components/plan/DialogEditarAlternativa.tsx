import { useState, useEffect } from 'react';
import { Plus, Trash2, Search, Loader2, ArrowLeft, Save } from 'lucide-react';
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
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
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

interface AlimentoResponseDto {
  idAlimento: number;
  nombre: string;
  cantidad: number;
  calorias: number | null;
  proteinas: number | null;
  carbohidratos: number | null;
  grasas: number | null;
  unidadMedida: string;
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
  const [searchResults, setSearchResults] = useState<AlimentoResponseDto[]>([]);
  const [searching, setSearching] = useState(false);

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
      setMostrandoCrearAlimento(false);
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
        const res = await apiRequest<AlimentoResponseDto | null>(
          `/alimentos/${item.alimentoId}`,
          { token }
        );
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

  // Buscar alimentos al cambiar la query (debounce de 400ms)
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await apiRequest<{ data: AlimentoResponseDto[] }>(
          `/alimentos?search=${encodeURIComponent(searchQuery)}&limit=8`,
          { token }
        );
        setSearchResults(res.data || []);
      } catch (err) {
        toast.error('Error al buscar alimentos');
      } finally {
        setSearching(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery, token]);

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

  const agregarAlimento = (a: AlimentoResponseDto) => {
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
      const res = await apiRequest<AlimentoResponseDto>(
        '/alimentos',
        {
          method: 'POST',
          body: {
            nombre: nuevoAlimentoNombre.trim(),
            cantidad: nuevoAlimentoCantidad,
            unidadMedida: nuevoAlimentoUnidad,
            calorias: nuevoAlimentoCalorias,
            proteinas: nuevoAlimentoProteinas,
            carbohidratos: nuevoAlimentoCarbohidratos,
            grasas: nuevoAlimentoGrasas,
            hidratosDeCarbono: nuevoAlimentoCarbohidratos,
          },
          token,
        }
      );
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

  const guardarCambios = () => {
    if (!nombre.trim()) {
      toast.error('El nombre de la comida es obligatorio.');
      return;
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
      <DialogContent className="max-w-2xl rounded-2xl border bg-background p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
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
          /* Formulario de creación de alimento */
          <div className="space-y-4 py-4">
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
          /* Formulario principal de alternativa */
          <div className="space-y-6 py-4">
            {/* Nombre */}
            <div className="space-y-1.5">
              <Label htmlFor="nombre-comida" className="text-sm font-semibold">
                Nombre de la comida/preparación
              </Label>
              <Input
                id="nombre-comida"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Pollo al horno con puré de calabaza"
                className="rounded-xl h-10"
                data-testid="input-nombre-comida"
              />
            </div>

            {/* Buscador de Alimentos */}
            <div className="space-y-2 relative">
              <Label className="text-sm font-semibold">Agregar ingredientes</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 size-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar ingrediente (ej: pechuga de pollo, arroz)..."
                  className="pl-9 rounded-xl h-10"
                  data-testid="search-alimentos-input"
                />
                {searching && (
                  <Loader2 className="absolute right-3 top-3 size-4 animate-spin text-muted-foreground" />
                )}
              </div>

              {/* Botón para crear nuevo alimento si no existe */}
              {!searching && searchQuery.trim().length > 1 && (
                <div className="mt-1 flex justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={abrirCrearAlimento}
                    className="text-xs gap-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 h-8 rounded-lg"
                  >
                    <Plus className="size-3.5" />
                    ¿No encontrás "{searchQuery}"? Crear alimento nuevo
                  </Button>
                </div>
              )}

              {/* Resultados de búsqueda */}
              {searchResults.length > 0 && (
                <div className="absolute z-20 w-full rounded-xl border bg-popover text-popover-foreground shadow-lg mt-1 max-h-56 overflow-y-auto divide-y divide-border/60">
                  {searchResults.map((a) => (
                    <button
                      key={a.idAlimento}
                      onClick={() => agregarAlimento(a)}
                      className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-accent/60 transition-colors"
                    >
                      <div>
                        <p className="font-semibold text-xs text-foreground">{a.nombre}</p>
                        <p className="text-[10px] text-muted-foreground">
                          Base: {a.cantidad} {a.unidadMedida === 'gramo' ? 'g' : a.unidadMedida === 'mililitro' ? 'ml' : a.unidadMedida === 'unidad' ? 'un' : a.unidadMedida} · {a.calorias} kcal · P {a.proteinas}g · C {a.carbohidratos}g · G {a.grasas}g
                        </p>
                      </div>
                      <Plus className="size-4 text-emerald-500 shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Ingredientes Agregados */}
            {alimentos.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Ingredientes seleccionados</Label>
                <div className="rounded-xl border divide-y overflow-hidden bg-muted/20">
                  {alimentos.map((a) => (
                    <div key={a.alimentoId} className="flex items-center justify-between p-3 gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate text-foreground">{a.nombre}</p>
                        <p className="text-[10px] text-muted-foreground tabular-nums">
                          Contribuido: {Math.round(a.baseCalorias * (a.cantidad / a.baseCantidad))} kcal
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={a.cantidad}
                          onChange={(e) => cambiarCantidad(a.alimentoId, Number(e.target.value))}
                          className="w-16 h-8 text-xs text-center rounded-lg focus-visible:ring-emerald-500/50"
                        />
                        <span className="text-xs text-muted-foreground w-8">{a.unidad}</span>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => removerAlimento(a.alimentoId)}
                          className="size-8 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-lg"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Resumen nutricional (editable para corrección manual) */}
            <div className="space-y-3 p-4 rounded-xl border bg-muted/30">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Aporte Nutricional de esta opción
              </h4>
              <div className="grid grid-cols-4 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="kcal-total" className="text-[10px] font-bold uppercase text-muted-foreground">Calorías</Label>
                  <Input
                    id="kcal-total"
                    type="number"
                    value={calorias}
                    onChange={(e) => setCalorias(Number(e.target.value))}
                    className="rounded-lg h-9 text-xs focus-visible:ring-emerald-500/50"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="pro-total" className="text-[10px] font-bold uppercase text-muted-foreground">Prots (g)</Label>
                  <Input
                    id="pro-total"
                    type="number"
                    value={proteinas}
                    onChange={(e) => setProteinas(Number(e.target.value))}
                    className="rounded-lg h-9 text-xs focus-visible:ring-emerald-500/50"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="carb-total" className="text-[10px] font-bold uppercase text-muted-foreground">Carbs (g)</Label>
                  <Input
                    id="carb-total"
                    type="number"
                    value={carbohidratos}
                    onChange={(e) => setCarbohidratos(Number(e.target.value))}
                    className="rounded-lg h-9 text-xs focus-visible:ring-emerald-500/50"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="gras-total" className="text-[10px] font-bold uppercase text-muted-foreground">Grasas (g)</Label>
                  <Input
                    id="gras-total"
                    type="number"
                    value={grasas}
                    onChange={(e) => setGrasas(Number(e.target.value))}
                    className="rounded-lg h-9 text-xs focus-visible:ring-emerald-500/50"
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="mt-4 gap-2">
              <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl">
                Cancelar
              </Button>
              <Button onClick={guardarCambios} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold">
                Guardar comida
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
