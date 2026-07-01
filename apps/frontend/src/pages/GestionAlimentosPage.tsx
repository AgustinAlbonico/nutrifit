import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from '@tanstack/react-router';
import {
  Search,
  Apple,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Flame,
  Droplet,
  Circle,
  Activity,
  BookOpen,
  Scale,
  Database,
  Info,
  HeartPulse,
  Check,
  ChevronsUpDown,
} from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import {
  listarAlimentosPaginado,
  crearAlimento,
  actualizarAlimento,
  eliminarAlimento,
  obtenerGruposAlimenticios,
  type Alimento,
  type GrupoAlimenticio,
  type CrearAlimentoDto,
  type ActualizarAlimentoDto,
} from '@/lib/api/alimentos';
import { usePaginacion } from '@/hooks/usePaginacion';
import { ControlesPaginacion } from '@/components/ui/ControlesPaginacion';
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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

// ── Tipos ───────────────────────────────────────────────────────────────

interface FormularioAlimento {
  nombre: string;
  cantidad: string;
  unidadMedida: string;
  calorias: string;
  proteinas: string;
  carbohidratos: string;
  grasas: string;
  grupoAlimenticioId: string;
  colesterol: string;
  fibraAlimentaria: string;
  sodio: string;
  agua: string;
  vitaminaA: string;
  vitaminaB6: string;
  vitaminaB12: string;
  vitaminaC: string;
  vitaminaD: string;
  vitaminaE: string;
  vitaminaK: string;
  almidon: string;
  lactosa: string;
  alcohol: string;
  cafeina: string;
  azucares: string;
  calcio: string;
  hierro: string;
  magnesio: string;
  fosforo: string;
  potasio: string;
  cinc: string;
  cobre: string;
  fluor: string;
  manganeso: string;
  selenio: string;
  tiamina: string;
  riboflavina: string;
  niacina: string;
  acidoPantotenico: string;
  folato: string;
  acidoFolico: string;
  grasasTrans: string;
  grasasSaturadas: string;
  grasasMonoinsaturadas: string;
  grasasPoliinsaturadas: string;
  cloruro: string;
}

const UNIDADES_MEDIDA = [
  { valor: 'gramo', etiqueta: 'gramos' },
  { valor: 'kilogramo', etiqueta: 'kilogramos' },
  { valor: 'mililitro', etiqueta: 'mililitros' },
  { valor: 'litro', etiqueta: 'litros' },
  { valor: 'miligramo', etiqueta: 'miligramos' },
  { valor: 'taza', etiqueta: 'tazas' },
  { valor: 'cucharada', etiqueta: 'cucharadas' },
  { valor: 'cucharadita', etiqueta: 'cucharaditas' },
  { valor: 'unidad', etiqueta: 'unidades' },
];

// ── Componente Principal ────────────────────────────────────────────────

export function GestionAlimentosPage() {
  const { token, rol } = useAuth();
  const navigate = useNavigate();
  const [busqueda, setBusqueda] = useState('');
  const busquedaRef = useRef(busqueda);
  busquedaRef.current = busqueda;
  const [filtroGrupoId, setFiltroGrupoId] = useState<number | null>(null);
  const filtroGrupoIdRef = useRef(filtroGrupoId);
  filtroGrupoIdRef.current = filtroGrupoId;
  const [searchTrigger, setSearchTrigger] = useState(0);
  const [dialogoAbierto, setDialogoAbierto] = useState(false);
  const [alimentoEditando, setAlimentoEditando] = useState<Alimento | null>(null);
  const [alimentoAEliminar, setAlimentoAEliminar] = useState<number | null>(null);
  
  const [formulario, setFormulario] = useState<FormularioAlimento>({
    nombre: '',
    cantidad: '',
    unidadMedida: 'gramo',
    calorias: '',
    proteinas: '',
    carbohidratos: '',
    grasas: '',
    grupoAlimenticioId: '',
    colesterol: '',
    fibraAlimentaria: '',
    sodio: '',
    agua: '',
    vitaminaA: '',
    vitaminaB6: '',
    vitaminaB12: '',
    vitaminaC: '',
    vitaminaD: '',
    vitaminaE: '',
    vitaminaK: '',
    almidon: '',
    lactosa: '',
    alcohol: '',
    cafeina: '',
    azucares: '',
    calcio: '',
    hierro: '',
    magnesio: '',
    fosforo: '',
    potasio: '',
    cinc: '',
    cobre: '',
    fluor: '',
    manganeso: '',
    selenio: '',
    tiamina: '',
    riboflavina: '',
    niacina: '',
    acidoPantotenico: '',
    folato: '',
    acidoFolico: '',
    grasasTrans: '',
    grasasSaturadas: '',
    grasasMonoinsaturadas: '',
    grasasPoliinsaturadas: '',
    cloruro: '',
  });

  // Verificar permisos
  const tieneAcceso = rol === 'NUTRICIONISTA' || rol === 'ADMIN';

  const fetcherAlimentos = useCallback(
    async ({ page, limit }: { page: number; limit: number }) => {
      return listarAlimentosPaginado(token!, {
        page,
        limit,
        search: busquedaRef.current || undefined,
        grupoId: filtroGrupoIdRef.current ?? undefined,
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [token, searchTrigger],
  );

  const {
    data: alimentos,
    pagination,
    setPagina,
    setLimite,
  } = usePaginacion<Alimento>(fetcherAlimentos, { defaultLimit: 20, enabled: !!token });

  // Query para obtener grupos alimenticios
  const { data: grupos } = useQuery<GrupoAlimenticio[]>({
    queryKey: ['grupos-alimenticios', token],
    queryFn: () => obtenerGruposAlimenticios(token!),
    enabled: !!token,
  });

  // Debounce: cuando cambia el texto de búsqueda, recargar con página 1
  useEffect(() => {
    if (!token) return;
    const timer = setTimeout(() => {
      setPagina(1);
      setSearchTrigger((v) => v + 1);
    }, 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busqueda, token]);

  // Recargar cuando cambia el filtro de grupo
  useEffect(() => {
    if (!token) return;
    setPagina(1);
    setSearchTrigger((v) => v + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroGrupoId, token]);

  // Función para cerrar diálogo
  const cerrarDialogo = () => {
    setDialogoAbierto(false);
    setAlimentoEditando(null);
  };

  // Mutación para crear alimento
  const crearMutation = useMutation({
    mutationFn: (data: CrearAlimentoDto) => crearAlimento(token!, data),
    onSuccess: () => {
      toast.success('Alimento creado correctamente');
      setPagina(1);
      setSearchTrigger((v) => v + 1);
      cerrarDialogo();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Error al crear el alimento');
    },
  });

  // Mutación para actualizar alimento
  const actualizarMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: ActualizarAlimentoDto }) =>
      actualizarAlimento(token!, id, data),
    onSuccess: () => {
      toast.success('Alimento actualizado correctamente');
      setSearchTrigger((v) => v + 1);
      cerrarDialogo();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Error al actualizar el alimento');
    },
  });

  // Mutación para eliminar alimento
  const eliminarMutation = useMutation({
    mutationFn: (id: number) => eliminarAlimento(token!, id),
    onSuccess: () => {
      toast.success('Alimento eliminado correctamente');
      setSearchTrigger((v) => v + 1);
      setAlimentoAEliminar(null);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Error al eliminar el alimento');
    },
  });

  // Efecto para redirigir si no tiene acceso
  useEffect(() => {
    if (!tieneAcceso) {
      navigate({ to: '/dashboard' });
    }
  }, [tieneAcceso, navigate]);

  if (!tieneAcceso) {
    return null;
  }

  const abrirDialogoCrear = () => {
    setAlimentoEditando(null);
    setFormulario({
      nombre: '',
      cantidad: '100',
      unidadMedida: 'gramo',
      calorias: '',
      proteinas: '',
      carbohidratos: '',
      grasas: '',
      grupoAlimenticioId: '',
      colesterol: '',
      fibraAlimentaria: '',
      sodio: '',
      agua: '',
      vitaminaA: '',
      vitaminaB6: '',
      vitaminaB12: '',
      vitaminaC: '',
      vitaminaD: '',
      vitaminaE: '',
      vitaminaK: '',
      almidon: '',
      lactosa: '',
      alcohol: '',
      cafeina: '',
      azucares: '',
      calcio: '',
      hierro: '',
      magnesio: '',
      fosforo: '',
      potasio: '',
      cinc: '',
      cobre: '',
      fluor: '',
      manganeso: '',
      selenio: '',
      tiamina: '',
      riboflavina: '',
      niacina: '',
      acidoPantotenico: '',
      folato: '',
      acidoFolico: '',
      grasasTrans: '',
      grasasSaturadas: '',
      grasasMonoinsaturadas: '',
      grasasPoliinsaturadas: '',
      cloruro: '',
    });
    setDialogoAbierto(true);
  };

  const abrirDialogoEditar = (alimento: Alimento) => {
    setAlimentoEditando(alimento);
    setFormulario({
      nombre: alimento.nombre,
      cantidad: String(alimento.cantidad),
      unidadMedida: alimento.unidadMedida,
      calorias: alimento.calorias?.toString() ?? '',
      proteinas: alimento.proteinas?.toString() ?? '',
      carbohidratos: alimento.carbohidratos?.toString() ?? '',
      grasas: alimento.grasas?.toString() ?? '',
      grupoAlimenticioId: alimento.grupoAlimenticio?.id?.toString() ?? '',
      colesterol: alimento.colesterol?.toString() ?? '',
      fibraAlimentaria: alimento.fibraAlimentaria?.toString() ?? '',
      sodio: alimento.sodio?.toString() ?? '',
      agua: alimento.agua?.toString() ?? '',
      vitaminaA: alimento.vitaminaA?.toString() ?? '',
      vitaminaB6: alimento.vitaminaB6?.toString() ?? '',
      vitaminaB12: alimento.vitaminaB12?.toString() ?? '',
      vitaminaC: alimento.vitaminaC?.toString() ?? '',
      vitaminaD: alimento.vitaminaD?.toString() ?? '',
      vitaminaE: alimento.vitaminaE?.toString() ?? '',
      vitaminaK: alimento.vitaminaK?.toString() ?? '',
      almidon: alimento.almidon?.toString() ?? '',
      lactosa: alimento.lactosa?.toString() ?? '',
      alcohol: alimento.alcohol?.toString() ?? '',
      cafeina: alimento.cafeina?.toString() ?? '',
      azucares: alimento.azucares?.toString() ?? '',
      calcio: alimento.calcio?.toString() ?? '',
      hierro: alimento.hierro?.toString() ?? '',
      magnesio: alimento.magnesio?.toString() ?? '',
      fosforo: alimento.fosforo?.toString() ?? '',
      potasio: alimento.potasio?.toString() ?? '',
      cinc: alimento.cinc?.toString() ?? '',
      cobre: alimento.cobre?.toString() ?? '',
      fluor: alimento.fluor?.toString() ?? '',
      manganeso: alimento.manganeso?.toString() ?? '',
      selenio: alimento.selenio?.toString() ?? '',
      tiamina: alimento.tiamina?.toString() ?? '',
      riboflavina: alimento.riboflavina?.toString() ?? '',
      niacina: alimento.niacina?.toString() ?? '',
      acidoPantotenico: alimento.acidoPantotenico?.toString() ?? '',
      folato: alimento.folato?.toString() ?? '',
      acidoFolico: alimento.acidoFolico?.toString() ?? '',
      grasasTrans: alimento.grasasTrans?.toString() ?? '',
      grasasSaturadas: alimento.grasasSaturadas?.toString() ?? '',
      grasasMonoinsaturadas: alimento.grasasMonoinsaturadas?.toString() ?? '',
      grasasPoliinsaturadas: alimento.grasasPoliinsaturadas?.toString() ?? '',
      cloruro: alimento.cloruro?.toString() ?? '',
    });
    setDialogoAbierto(true);
  };

  const manejarSubmit = () => {
    if (!formulario.nombre || !formulario.cantidad || !formulario.unidadMedida) {
      toast.error('Por favor completa los campos obligatorios');
      return;
    }

    const datos: CrearAlimentoDto | ActualizarAlimentoDto = {
      nombre: formulario.nombre,
      cantidad: parseFloat(formulario.cantidad),
      unidadMedida: formulario.unidadMedida,
      calorias: formulario.calorias ? parseFloat(formulario.calorias) : null,
      proteinas: formulario.proteinas ? parseFloat(formulario.proteinas) : null,
      carbohidratos: formulario.carbohidratos ? parseFloat(formulario.carbohidratos) : null,
      grasas: formulario.grasas ? parseFloat(formulario.grasas) : null,
      grupoAlimenticioId: formulario.grupoAlimenticioId
        ? parseInt(formulario.grupoAlimenticioId, 10)
        : null,
      colesterol: formulario.colesterol ? parseFloat(formulario.colesterol) : null,
      fibraAlimentaria: formulario.fibraAlimentaria ? parseFloat(formulario.fibraAlimentaria) : null,
      sodio: formulario.sodio ? parseFloat(formulario.sodio) : null,
      agua: formulario.agua ? parseFloat(formulario.agua) : null,
      vitaminaA: formulario.vitaminaA ? parseFloat(formulario.vitaminaA) : null,
      vitaminaB6: formulario.vitaminaB6 ? parseFloat(formulario.vitaminaB6) : null,
      vitaminaB12: formulario.vitaminaB12 ? parseFloat(formulario.vitaminaB12) : null,
      vitaminaC: formulario.vitaminaC ? parseFloat(formulario.vitaminaC) : null,
      vitaminaD: formulario.vitaminaD ? parseFloat(formulario.vitaminaD) : null,
      vitaminaE: formulario.vitaminaE ? parseFloat(formulario.vitaminaE) : null,
      vitaminaK: formulario.vitaminaK ? parseFloat(formulario.vitaminaK) : null,
      almidon: formulario.almidon ? parseFloat(formulario.almidon) : null,
      lactosa: formulario.lactosa ? parseFloat(formulario.lactosa) : null,
      alcohol: formulario.alcohol ? parseFloat(formulario.alcohol) : null,
      cafeina: formulario.cafeina ? parseFloat(formulario.cafeina) : null,
      azucares: formulario.azucares ? parseFloat(formulario.azucares) : null,
      calcio: formulario.calcio ? parseFloat(formulario.calcio) : null,
      hierro: formulario.hierro ? parseFloat(formulario.hierro) : null,
      magnesio: formulario.magnesio ? parseFloat(formulario.magnesio) : null,
      fosforo: formulario.fosforo ? parseFloat(formulario.fosforo) : null,
      potasio: formulario.potasio ? parseFloat(formulario.potasio) : null,
      cinc: formulario.cinc ? parseFloat(formulario.cinc) : null,
      cobre: formulario.cobre ? parseFloat(formulario.cobre) : null,
      fluor: formulario.fluor ? parseFloat(formulario.fluor) : null,
      manganeso: formulario.manganeso ? parseFloat(formulario.manganeso) : null,
      selenio: formulario.selenio ? parseFloat(formulario.selenio) : null,
      tiamina: formulario.tiamina ? parseFloat(formulario.tiamina) : null,
      riboflavina: formulario.riboflavina ? parseFloat(formulario.riboflavina) : null,
      niacina: formulario.niacina ? parseFloat(formulario.niacina) : null,
      acidoPantotenico: formulario.acidoPantotenico ? parseFloat(formulario.acidoPantotenico) : null,
      folato: formulario.folato ? parseFloat(formulario.folato) : null,
      acidoFolico: formulario.acidoFolico ? parseFloat(formulario.acidoFolico) : null,
      grasasTrans: formulario.grasasTrans ? parseFloat(formulario.grasasTrans) : null,
      grasasSaturadas: formulario.grasasSaturadas ? parseFloat(formulario.grasasSaturadas) : null,
      grasasMonoinsaturadas: formulario.grasasMonoinsaturadas ? parseFloat(formulario.grasasMonoinsaturadas) : null,
      grasasPoliinsaturadas: formulario.grasasPoliinsaturadas ? parseFloat(formulario.grasasPoliinsaturadas) : null,
      cloruro: formulario.cloruro ? parseFloat(formulario.cloruro) : null,
    };

    if (alimentoEditando) {
      actualizarMutation.mutate({ id: alimentoEditando.idAlimento, data: datos });
    } else {
      crearMutation.mutate(datos as CrearAlimentoDto);
    }
  };

  const alimentosFiltrados = alimentos || [];

  return (
    <div className="space-y-6 pb-10">
      {/* Cabecera Estilo Bases de datos de alimentos */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Database className="h-6 w-6 text-green-600" />
            Bases de datos de alimentos
          </h1>
          <p className="text-sm text-muted-foreground">
            Consultá o agregá alimentos con sus macronutrientes para los planes alimentarios.
          </p>
        </div>
        <Button onClick={abrirDialogoCrear} className="bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl gap-2 shadow">
          <Plus className="h-4 w-4" />
          Agregar nuevo alimento
        </Button>
      </div>

      {/* Panel Superior de Controles y Búsqueda */}
      <Card className="rounded-2xl border-border/50 bg-card/60 backdrop-blur-sm shadow-sm">
        <CardContent className="p-4 flex items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar alimento..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="pl-10 h-10 bg-white/50 border-border/50 focus:border-green-400 focus:ring-green-400 rounded-xl"
            />
          </div>
        </CardContent>
      </Card>

      {/* Filtro compacto por Grupo */}
      {grupos && grupos.length > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground shrink-0">Filtrar:</span>
          <Select
            value={filtroGrupoId !== null ? String(filtroGrupoId) : 'todos'}
            onValueChange={(v) => setFiltroGrupoId(v === 'todos' ? null : Number(v))}
          >
            <SelectTrigger className="w-[220px] h-9 rounded-xl border-border/50 text-xs">
              <SelectValue placeholder="Todos los grupos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los grupos</SelectItem>
              {grupos.map((g) => (
                <SelectItem key={g.idGrupoAlimenticio} value={String(g.idGrupoAlimenticio)}>
                  {g.descripcion}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Listado Directo de Alimentos */}
      <div className="space-y-3 mt-4">
        {pagination.isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl border border-border/50 bg-card/60">
              <div className="flex items-center gap-3 w-full sm:w-1/3">
                <Skeleton className="h-10 w-10 rounded-xl" />
                <div className="space-y-1.5 w-full">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
              <div className="flex gap-4 w-full sm:w-auto justify-end sm:ml-auto">
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-8 w-16" />
              </div>
            </div>
          ))
        ) : alimentosFiltrados.length > 0 ? (
          alimentosFiltrados.map((alimento) => (
            <div
              key={alimento.idAlimento}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl border border-border/50 bg-card/60 backdrop-blur-sm hover:bg-card hover:shadow-md transition-all duration-200"
            >
              {/* Nombre e info básica */}
              <div className="flex items-center gap-3.5">
                <div className="p-2.5 rounded-xl bg-green-500/10 text-green-600 dark:text-green-400">
                  <Apple className="size-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-foreground">{alimento.nombre}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-muted-foreground capitalize font-medium">
                      {alimento.cantidad} {alimento.unidadMedida === 'gramo' ? 'g' : alimento.unidadMedida === 'mililitro' ? 'ml' : alimento.unidadMedida === 'unidad' ? 'u.' : alimento.unidadMedida}
                    </span>
                    {alimento.grupoAlimenticio && (
                      <>
                        <span className="text-muted-foreground/30 text-[10px]">•</span>
                        <span className="inline-flex items-center text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                          {alimento.grupoAlimenticio.descripcion}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Macronutrientes estilo Nutrium */}
              <div className="flex flex-wrap items-center gap-6 text-xs sm:ml-auto">
                <div className="flex flex-col items-end min-w-[70px]">
                  <span className="text-muted-foreground font-normal text-[10px] uppercase tracking-wider">Energía</span>
                  <span className="flex items-center gap-1 text-orange-600 dark:text-orange-400 font-bold text-sm mt-0.5">
                    <Flame className="size-3.5" />
                    {alimento.calorias ?? 0} <span className="text-[10px] font-normal text-muted-foreground">kcal</span>
                  </span>
                </div>

                <div className="flex flex-col items-end min-w-[70px]">
                  <span className="text-muted-foreground font-normal text-[10px] uppercase tracking-wider">Grasa</span>
                  <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold text-sm mt-0.5">
                    <Droplet className="size-3.5" />
                    {alimento.grasas ?? 0} <span className="text-[10px] font-normal text-muted-foreground">g</span>
                  </span>
                </div>

                <div className="flex flex-col items-end min-w-[70px]">
                  <span className="text-muted-foreground font-normal text-[10px] uppercase tracking-wider">H. Carbono</span>
                  <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-bold text-sm mt-0.5">
                    <Circle className="size-3.5" />
                    {alimento.carbohidratos ?? 0} <span className="text-[10px] font-normal text-muted-foreground">g</span>
                  </span>
                </div>

                <div className="flex flex-col items-end min-w-[70px]">
                  <span className="text-muted-foreground font-normal text-[10px] uppercase tracking-wider">Proteína</span>
                  <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold text-sm mt-0.5">
                    <Activity className="size-3.5" />
                    {alimento.proteinas ?? 0} <span className="text-[10px] font-normal text-muted-foreground">g</span>
                  </span>
                </div>
              </div>

              {/* Acciones */}
              <div className="flex items-center gap-1.5 self-end sm:self-center border-t sm:border-t-0 pt-2 sm:pt-0 w-full sm:w-auto justify-end">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => abrirDialogoEditar(alimento)}
                  className="size-8 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg"
                >
                  <Pencil className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setAlimentoAEliminar(alimento.idAlimento)}
                  className="size-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          ))
        ) : (
          <Card className="rounded-2xl border-dashed border-border/50 py-12 text-center">
            <Apple className="mx-auto h-12 w-12 text-muted-foreground/30 animate-pulse" />
            <h3 className="mt-4 font-semibold text-lg">No hay alimentos</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
              {busqueda ? 'No se encontraron resultados de búsqueda' : 'Agregá el primer alimento al catálogo usando el botón superior.'}
            </p>
          </Card>
        )}
      </div>

      {/* Paginación */}
      {!pagination.isLoading && alimentosFiltrados.length > 0 && (
        <div className="mt-4 border-t pt-4">
          <ControlesPaginacion
            pagina={pagination.page}
            totalPaginas={pagination.totalPages}
            total={pagination.total}
            limite={pagination.limit}
            cargando={pagination.isLoading}
            onCambiarPagina={setPagina}
            onCambiarLimite={setLimite}
          />
        </div>
      )}

      {/* Diálogo Rediseñado Estilo Nutrium */}
      <Dialog open={dialogoAbierto} onOpenChange={setDialogoAbierto}>
        <DialogContent className="sm:max-w-[720px] max-h-[90vh] overflow-y-auto rounded-3xl border-border/50 p-6">
          <DialogHeader className="border-b pb-4 mb-4">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-green-600" />
              {alimentoEditando ? 'Editar alimento' : 'Agregar nuevo alimento'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Configurá el nombre, grupo, medidas y proporciones nutricionales del alimento.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Grid 1: Nombre */}
            <div className="grid gap-1.5">
              <Label htmlFor="nombre" className="text-xs font-semibold text-muted-foreground">Nombre del alimento *</Label>
              <Input
                id="nombre"
                value={formulario.nombre}
                onChange={(e) => setFormulario({ ...formulario, nombre: e.target.value })}
                placeholder="Ej: Aceite de oliva"
                className="rounded-xl border-border/50 h-10 w-full"
              />
            </div>

            {/* Grid 2: Grupo Alimenticio y Cantidad */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label htmlFor="grupo" className="text-xs font-semibold text-muted-foreground">Grupo</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="justify-between rounded-xl border-border/50 h-10 font-normal text-sm"
                    >
                      {formulario.grupoAlimenticioId
                        ? grupos?.find((g) => g.idGrupoAlimenticio.toString() === formulario.grupoAlimenticioId)?.descripcion
                        : 'Selecciona el grupo del alimento'}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 rounded-xl" align="start">
                    <Command>
                      <CommandInput placeholder="Buscar grupo..." />
                      <CommandList>
                        <CommandEmpty>Sin resultados</CommandEmpty>
                        <CommandGroup>
                          {grupos?.map((grupo) => (
                            <CommandItem
                              key={grupo.idGrupoAlimenticio}
                              value={grupo.descripcion}
                              onSelect={() => {
                                setFormulario({ ...formulario, grupoAlimenticioId: grupo.idGrupoAlimenticio.toString() });
                              }}
                            >
                              <Check
                                className={cn(
                                  'mr-2 h-4 w-4',
                                  formulario.grupoAlimenticioId === grupo.idGrupoAlimenticio.toString()
                                    ? 'opacity-100'
                                    : 'opacity-0',
                                )}
                              />
                              {grupo.descripcion}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="cantidad" className="text-xs font-semibold text-muted-foreground">Cantidad de referencia</Label>
                <div className="flex gap-2">
                  <Input
                    id="cantidad"
                    type="number"
                    value={formulario.cantidad}
                    onChange={(e) => setFormulario({ ...formulario, cantidad: e.target.value })}
                    placeholder="100"
                    className="w-24 rounded-xl border-border/50 h-10 text-center"
                  />
                  <Select
                    value={formulario.unidadMedida}
                    onValueChange={(value) => setFormulario({ ...formulario, unidadMedida: value })}
                  >
                    <SelectTrigger className="flex-1 rounded-xl border-border/50 h-10">
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {UNIDADES_MEDIDA.map((unidad) => (
                        <SelectItem key={unidad.valor} value={unidad.valor}>
                          {unidad.etiqueta}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Sub-tabs Tipo de Valor */}
            <div className="flex border-b border-border/50 pb-0.5">
              <button
                type="button"
                className="text-xs font-semibold px-4 py-2 border-b-2 border-green-600 text-green-600 transition-all"
              >
                Valor nutricional por {formulario.cantidad || '100'} {formulario.unidadMedida === 'gramo' ? 'g' : formulario.unidadMedida === 'mililitro' ? 'ml' : formulario.unidadMedida === 'unidad' ? 'u.' : formulario.unidadMedida}
              </button>
              <button
                type="button"
                disabled
                className="text-xs font-medium px-4 py-2 text-muted-foreground/50 cursor-not-allowed hover:bg-transparent"
              >
                Medidas caseras
              </button>
            </div>

            {/* Sección Macronutrientes */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <HeartPulse className="size-4 text-green-600" />
                Macronutrientes
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-muted/30 border border-border/30 rounded-2xl">
                <div className="grid gap-1 bg-white dark:bg-zinc-900 p-3 rounded-xl border border-border/40">
                  <Label htmlFor="calorias" className="text-[10px] font-bold text-orange-600 flex items-center gap-1">
                    <Flame className="size-3" /> Energía
                  </Label>
                  <div className="relative">
                    <Input
                      id="calorias"
                      type="number"
                      value={formulario.calorias}
                      onChange={(e) => setFormulario({ ...formulario, calorias: e.target.value })}
                      placeholder="0"
                      className="h-8 px-2 border-none shadow-none text-right font-semibold text-sm focus-visible:ring-0"
                    />
                    <span className="absolute right-0 bottom-1.5 text-[9px] text-muted-foreground font-normal">kcal</span>
                  </div>
                </div>

                <div className="grid gap-1 bg-white dark:bg-zinc-900 p-3 rounded-xl border border-border/40">
                  <Label htmlFor="grasas" className="text-[10px] font-bold text-amber-600 flex items-center gap-1">
                    <Droplet className="size-3" /> Grasa
                  </Label>
                  <div className="relative">
                    <Input
                      id="grasas"
                      type="number"
                      value={formulario.grasas}
                      onChange={(e) => setFormulario({ ...formulario, grasas: e.target.value })}
                      placeholder="0"
                      className="h-8 px-2 border-none shadow-none text-right font-semibold text-sm focus-visible:ring-0"
                    />
                    <span className="absolute right-0 bottom-1.5 text-[9px] text-muted-foreground font-normal">g</span>
                  </div>
                </div>

                <div className="grid gap-1 bg-white dark:bg-zinc-900 p-3 rounded-xl border border-border/40">
                  <Label htmlFor="carbohidratos" className="text-[10px] font-bold text-blue-600 flex items-center gap-1">
                    <Circle className="size-3" /> H. Carbono
                  </Label>
                  <div className="relative">
                    <Input
                      id="carbohidratos"
                      type="number"
                      value={formulario.carbohidratos}
                      onChange={(e) => setFormulario({ ...formulario, carbohidratos: e.target.value })}
                      placeholder="0"
                      className="h-8 px-2 border-none shadow-none text-right font-semibold text-sm focus-visible:ring-0"
                    />
                    <span className="absolute right-0 bottom-1.5 text-[9px] text-muted-foreground font-normal">g</span>
                  </div>
                </div>

                <div className="grid gap-1 bg-white dark:bg-zinc-900 p-3 rounded-xl border border-border/40">
                  <Label htmlFor="proteinas" className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                    <Activity className="size-3" /> Proteína
                  </Label>
                  <div className="relative">
                    <Input
                      id="proteinas"
                      type="number"
                      value={formulario.proteinas}
                      onChange={(e) => setFormulario({ ...formulario, proteinas: e.target.value })}
                      placeholder="0"
                      className="h-8 px-2 border-none shadow-none text-right font-semibold text-sm focus-visible:ring-0"
                    />
                    <span className="absolute right-0 bottom-1.5 text-[9px] text-muted-foreground font-normal">g</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Sección Micronutrientes y Grasas (Look Premium Nutrium) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Scale className="size-4 text-green-600" />
                  Composición Detallada (Micronutrientes y Grasas)
                </h3>
                <Badge variant="outline" className="text-[9px] font-normal border-border/50 text-muted-foreground bg-green-50/50 dark:bg-green-950/20 text-green-700 dark:text-green-400">Totalmente Interactivos</Badge>
              </div>

              {/* Composición Detallada — scroll manejado por el diálogo */}
              <div className="border border-border/30 p-4 rounded-2xl bg-muted/10 text-xs space-y-4">
                
                {/* Categoría: Grasas Específicas */}
                <div>
                  <h4 className="text-[10px] font-bold text-amber-600 uppercase tracking-wide mb-2">Lípidos y Grasas</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="flex flex-col gap-1">
                      <Label htmlFor="colesterol" className="text-[10px] text-muted-foreground">Colesterol</Label>
                      <div className="relative">
                        <Input
                          id="colesterol"
                          type="number"
                          placeholder="0"
                          value={formulario.colesterol}
                          onChange={(e) => setFormulario({ ...formulario, colesterol: e.target.value })}
                          className="h-8 text-right pr-8 bg-white dark:bg-zinc-950 border-border/30 rounded-lg text-xs"
                        />
                        <span className="absolute right-2 bottom-1.5 text-[8px] text-muted-foreground/60 font-semibold">mg</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label htmlFor="grasasSaturadas" className="text-[10px] text-muted-foreground">Grasas Saturadas</Label>
                      <div className="relative">
                        <Input
                          id="grasasSaturadas"
                          type="number"
                          placeholder="0"
                          value={formulario.grasasSaturadas}
                          onChange={(e) => setFormulario({ ...formulario, grasasSaturadas: e.target.value })}
                          className="h-8 text-right pr-6 bg-white dark:bg-zinc-950 border-border/30 rounded-lg text-xs"
                        />
                        <span className="absolute right-2 bottom-1.5 text-[8px] text-muted-foreground/60 font-semibold">g</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label htmlFor="grasasTrans" className="text-[10px] text-muted-foreground">Grasas Trans</Label>
                      <div className="relative">
                        <Input
                          id="grasasTrans"
                          type="number"
                          placeholder="0"
                          value={formulario.grasasTrans}
                          onChange={(e) => setFormulario({ ...formulario, grasasTrans: e.target.value })}
                          className="h-8 text-right pr-6 bg-white dark:bg-zinc-950 border-border/30 rounded-lg text-xs"
                        />
                        <span className="absolute right-2 bottom-1.5 text-[8px] text-muted-foreground/60 font-semibold">g</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label htmlFor="grasasMonoinsaturadas" className="text-[10px] text-muted-foreground">Monoinsaturadas</Label>
                      <div className="relative">
                        <Input
                          id="grasasMonoinsaturadas"
                          type="number"
                          placeholder="0"
                          value={formulario.grasasMonoinsaturadas}
                          onChange={(e) => setFormulario({ ...formulario, grasasMonoinsaturadas: e.target.value })}
                          className="h-8 text-right pr-6 bg-white dark:bg-zinc-950 border-border/30 rounded-lg text-xs"
                        />
                        <span className="absolute right-2 bottom-1.5 text-[8px] text-muted-foreground/60 font-semibold">g</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label htmlFor="grasasPoliinsaturadas" className="text-[10px] text-muted-foreground">Poliinsaturadas</Label>
                      <div className="relative">
                        <Input
                          id="grasasPoliinsaturadas"
                          type="number"
                          placeholder="0"
                          value={formulario.grasasPoliinsaturadas}
                          onChange={(e) => setFormulario({ ...formulario, grasasPoliinsaturadas: e.target.value })}
                          className="h-8 text-right pr-6 bg-white dark:bg-zinc-950 border-border/30 rounded-lg text-xs"
                        />
                        <span className="absolute right-2 bottom-1.5 text-[8px] text-muted-foreground/60 font-semibold">g</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Categoría: Carbohidratos Detallados */}
                <div>
                  <h4 className="text-[10px] font-bold text-blue-600 uppercase tracking-wide mb-2">Carbohidratos y Fibras</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="flex flex-col gap-1">
                      <Label htmlFor="fibraAlimentaria" className="text-[10px] text-muted-foreground">Fibra Alimentaria</Label>
                      <div className="relative">
                        <Input
                          id="fibraAlimentaria"
                          type="number"
                          placeholder="0"
                          value={formulario.fibraAlimentaria}
                          onChange={(e) => setFormulario({ ...formulario, fibraAlimentaria: e.target.value })}
                          className="h-8 text-right pr-6 bg-white dark:bg-zinc-950 border-border/30 rounded-lg text-xs"
                        />
                        <span className="absolute right-2 bottom-1.5 text-[8px] text-muted-foreground/60 font-semibold">g</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label htmlFor="azucares" className="text-[10px] text-muted-foreground">Azúcares</Label>
                      <div className="relative">
                        <Input
                          id="azucares"
                          type="number"
                          placeholder="0"
                          value={formulario.azucares}
                          onChange={(e) => setFormulario({ ...formulario, azucares: e.target.value })}
                          className="h-8 text-right pr-6 bg-white dark:bg-zinc-950 border-border/30 rounded-lg text-xs"
                        />
                        <span className="absolute right-2 bottom-1.5 text-[8px] text-muted-foreground/60 font-semibold">g</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label htmlFor="almidon" className="text-[10px] text-muted-foreground">Almidón</Label>
                      <div className="relative">
                        <Input
                          id="almidon"
                          type="number"
                          placeholder="0"
                          value={formulario.almidon}
                          onChange={(e) => setFormulario({ ...formulario, almidon: e.target.value })}
                          className="h-8 text-right pr-6 bg-white dark:bg-zinc-950 border-border/30 rounded-lg text-xs"
                        />
                        <span className="absolute right-2 bottom-1.5 text-[8px] text-muted-foreground/60 font-semibold">g</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label htmlFor="lactosa" className="text-[10px] text-muted-foreground">Lactosa</Label>
                      <div className="relative">
                        <Input
                          id="lactosa"
                          type="number"
                          placeholder="0"
                          value={formulario.lactosa}
                          onChange={(e) => setFormulario({ ...formulario, lactosa: e.target.value })}
                          className="h-8 text-right pr-6 bg-white dark:bg-zinc-950 border-border/30 rounded-lg text-xs"
                        />
                        <span className="absolute right-2 bottom-1.5 text-[8px] text-muted-foreground/60 font-semibold">g</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Categoría: Minerales */}
                <div>
                  <h4 className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide mb-2">Minerales</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="flex flex-col gap-1">
                      <Label htmlFor="sodio" className="text-[10px] text-muted-foreground">Sodio</Label>
                      <div className="relative">
                        <Input
                          id="sodio"
                          type="number"
                          placeholder="0"
                          value={formulario.sodio}
                          onChange={(e) => setFormulario({ ...formulario, sodio: e.target.value })}
                          className="h-8 text-right pr-8 bg-white dark:bg-zinc-950 border-border/30 rounded-lg text-xs"
                        />
                        <span className="absolute right-2 bottom-1.5 text-[8px] text-muted-foreground/60 font-semibold">mg</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label htmlFor="calcio" className="text-[10px] text-muted-foreground">Calcio</Label>
                      <div className="relative">
                        <Input
                          id="calcio"
                          type="number"
                          placeholder="0"
                          value={formulario.calcio}
                          onChange={(e) => setFormulario({ ...formulario, calcio: e.target.value })}
                          className="h-8 text-right pr-8 bg-white dark:bg-zinc-950 border-border/30 rounded-lg text-xs"
                        />
                        <span className="absolute right-2 bottom-1.5 text-[8px] text-muted-foreground/60 font-semibold">mg</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label htmlFor="hierro" className="text-[10px] text-muted-foreground">Hierro</Label>
                      <div className="relative">
                        <Input
                          id="hierro"
                          type="number"
                          placeholder="0"
                          value={formulario.hierro}
                          onChange={(e) => setFormulario({ ...formulario, hierro: e.target.value })}
                          className="h-8 text-right pr-8 bg-white dark:bg-zinc-950 border-border/30 rounded-lg text-xs"
                        />
                        <span className="absolute right-2 bottom-1.5 text-[8px] text-muted-foreground/60 font-semibold">mg</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label htmlFor="magnesio" className="text-[10px] text-muted-foreground">Magnesio</Label>
                      <div className="relative">
                        <Input
                          id="magnesio"
                          type="number"
                          placeholder="0"
                          value={formulario.magnesio}
                          onChange={(e) => setFormulario({ ...formulario, magnesio: e.target.value })}
                          className="h-8 text-right pr-8 bg-white dark:bg-zinc-950 border-border/30 rounded-lg text-xs"
                        />
                        <span className="absolute right-2 bottom-1.5 text-[8px] text-muted-foreground/60 font-semibold">mg</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label htmlFor="fosforo" className="text-[10px] text-muted-foreground">Fósforo</Label>
                      <div className="relative">
                        <Input
                          id="fosforo"
                          type="number"
                          placeholder="0"
                          value={formulario.fosforo}
                          onChange={(e) => setFormulario({ ...formulario, fosforo: e.target.value })}
                          className="h-8 text-right pr-8 bg-white dark:bg-zinc-950 border-border/30 rounded-lg text-xs"
                        />
                        <span className="absolute right-2 bottom-1.5 text-[8px] text-muted-foreground/60 font-semibold">mg</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label htmlFor="potasio" className="text-[10px] text-muted-foreground">Potasio</Label>
                      <div className="relative">
                        <Input
                          id="potasio"
                          type="number"
                          placeholder="0"
                          value={formulario.potasio}
                          onChange={(e) => setFormulario({ ...formulario, potasio: e.target.value })}
                          className="h-8 text-right pr-8 bg-white dark:bg-zinc-950 border-border/30 rounded-lg text-xs"
                        />
                        <span className="absolute right-2 bottom-1.5 text-[8px] text-muted-foreground/60 font-semibold">mg</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label htmlFor="cinc" className="text-[10px] text-muted-foreground">Cinc</Label>
                      <div className="relative">
                        <Input
                          id="cinc"
                          type="number"
                          placeholder="0"
                          value={formulario.cinc}
                          onChange={(e) => setFormulario({ ...formulario, cinc: e.target.value })}
                          className="h-8 text-right pr-8 bg-white dark:bg-zinc-950 border-border/30 rounded-lg text-xs"
                        />
                        <span className="absolute right-2 bottom-1.5 text-[8px] text-muted-foreground/60 font-semibold">mg</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label htmlFor="cobre" className="text-[10px] text-muted-foreground">Cobre</Label>
                      <div className="relative">
                        <Input
                          id="cobre"
                          type="number"
                          placeholder="0"
                          value={formulario.cobre}
                          onChange={(e) => setFormulario({ ...formulario, cobre: e.target.value })}
                          className="h-8 text-right pr-8 bg-white dark:bg-zinc-950 border-border/30 rounded-lg text-xs"
                        />
                        <span className="absolute right-2 bottom-1.5 text-[8px] text-muted-foreground/60 font-semibold">mg</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label htmlFor="fluor" className="text-[10px] text-muted-foreground">Flúor</Label>
                      <div className="relative">
                        <Input
                          id="fluor"
                          type="number"
                          placeholder="0"
                          value={formulario.fluor}
                          onChange={(e) => setFormulario({ ...formulario, fluor: e.target.value })}
                          className="h-8 text-right pr-8 bg-white dark:bg-zinc-950 border-border/30 rounded-lg text-xs"
                        />
                        <span className="absolute right-2 bottom-1.5 text-[8px] text-muted-foreground/60 font-semibold">µg</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label htmlFor="manganeso" className="text-[10px] text-muted-foreground">Manganeso</Label>
                      <div className="relative">
                        <Input
                          id="manganeso"
                          type="number"
                          placeholder="0"
                          value={formulario.manganeso}
                          onChange={(e) => setFormulario({ ...formulario, manganeso: e.target.value })}
                          className="h-8 text-right pr-8 bg-white dark:bg-zinc-950 border-border/30 rounded-lg text-xs"
                        />
                        <span className="absolute right-2 bottom-1.5 text-[8px] text-muted-foreground/60 font-semibold">mg</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label htmlFor="selenio" className="text-[10px] text-muted-foreground">Selenio</Label>
                      <div className="relative">
                        <Input
                          id="selenio"
                          type="number"
                          placeholder="0"
                          value={formulario.selenio}
                          onChange={(e) => setFormulario({ ...formulario, selenio: e.target.value })}
                          className="h-8 text-right pr-8 bg-white dark:bg-zinc-950 border-border/30 rounded-lg text-xs"
                        />
                        <span className="absolute right-2 bottom-1.5 text-[8px] text-muted-foreground/60 font-semibold">µg</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label htmlFor="cloruro" className="text-[10px] text-muted-foreground">Cloruro</Label>
                      <div className="relative">
                        <Input
                          id="cloruro"
                          type="number"
                          placeholder="0"
                          value={formulario.cloruro}
                          onChange={(e) => setFormulario({ ...formulario, cloruro: e.target.value })}
                          className="h-8 text-right pr-8 bg-white dark:bg-zinc-950 border-border/30 rounded-lg text-xs"
                        />
                        <span className="absolute right-2 bottom-1.5 text-[8px] text-muted-foreground/60 font-semibold">mg</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Categoría: Vitaminas */}
                <div>
                  <h4 className="text-[10px] font-bold text-purple-600 uppercase tracking-wide mb-2">Vitaminas</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="flex flex-col gap-1">
                      <Label htmlFor="vitaminaA" className="text-[10px] text-muted-foreground">Vitamina A</Label>
                      <div className="relative">
                        <Input
                          id="vitaminaA"
                          type="number"
                          placeholder="0"
                          value={formulario.vitaminaA}
                          onChange={(e) => setFormulario({ ...formulario, vitaminaA: e.target.value })}
                          className="h-8 text-right pr-8 bg-white dark:bg-zinc-950 border-border/30 rounded-lg text-xs"
                        />
                        <span className="absolute right-2 bottom-1.5 text-[8px] text-muted-foreground/60 font-semibold">µg</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label htmlFor="vitaminaB6" className="text-[10px] text-muted-foreground">Vitamina B6</Label>
                      <div className="relative">
                        <Input
                          id="vitaminaB6"
                          type="number"
                          placeholder="0"
                          value={formulario.vitaminaB6}
                          onChange={(e) => setFormulario({ ...formulario, vitaminaB6: e.target.value })}
                          className="h-8 text-right pr-8 bg-white dark:bg-zinc-950 border-border/30 rounded-lg text-xs"
                        />
                        <span className="absolute right-2 bottom-1.5 text-[8px] text-muted-foreground/60 font-semibold">mg</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label htmlFor="vitaminaB12" className="text-[10px] text-muted-foreground">Vitamina B12</Label>
                      <div className="relative">
                        <Input
                          id="vitaminaB12"
                          type="number"
                          placeholder="0"
                          value={formulario.vitaminaB12}
                          onChange={(e) => setFormulario({ ...formulario, vitaminaB12: e.target.value })}
                          className="h-8 text-right pr-8 bg-white dark:bg-zinc-950 border-border/30 rounded-lg text-xs"
                        />
                        <span className="absolute right-2 bottom-1.5 text-[8px] text-muted-foreground/60 font-semibold">µg</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label htmlFor="vitaminaC" className="text-[10px] text-muted-foreground">Vitamina C</Label>
                      <div className="relative">
                        <Input
                          id="vitaminaC"
                          type="number"
                          placeholder="0"
                          value={formulario.vitaminaC}
                          onChange={(e) => setFormulario({ ...formulario, vitaminaC: e.target.value })}
                          className="h-8 text-right pr-8 bg-white dark:bg-zinc-950 border-border/30 rounded-lg text-xs"
                        />
                        <span className="absolute right-2 bottom-1.5 text-[8px] text-muted-foreground/60 font-semibold">mg</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label htmlFor="vitaminaD" className="text-[10px] text-muted-foreground">Vitamina D</Label>
                      <div className="relative">
                        <Input
                          id="vitaminaD"
                          type="number"
                          placeholder="0"
                          value={formulario.vitaminaD}
                          onChange={(e) => setFormulario({ ...formulario, vitaminaD: e.target.value })}
                          className="h-8 text-right pr-8 bg-white dark:bg-zinc-950 border-border/30 rounded-lg text-xs"
                        />
                        <span className="absolute right-2 bottom-1.5 text-[8px] text-muted-foreground/60 font-semibold">µg</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label htmlFor="vitaminaE" className="text-[10px] text-muted-foreground">Vitamina E</Label>
                      <div className="relative">
                        <Input
                          id="vitaminaE"
                          type="number"
                          placeholder="0"
                          value={formulario.vitaminaE}
                          onChange={(e) => setFormulario({ ...formulario, vitaminaE: e.target.value })}
                          className="h-8 text-right pr-8 bg-white dark:bg-zinc-950 border-border/30 rounded-lg text-xs"
                        />
                        <span className="absolute right-2 bottom-1.5 text-[8px] text-muted-foreground/60 font-semibold">mg</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label htmlFor="vitaminaK" className="text-[10px] text-muted-foreground">Vitamina K</Label>
                      <div className="relative">
                        <Input
                          id="vitaminaK"
                          type="number"
                          placeholder="0"
                          value={formulario.vitaminaK}
                          onChange={(e) => setFormulario({ ...formulario, vitaminaK: e.target.value })}
                          className="h-8 text-right pr-8 bg-white dark:bg-zinc-950 border-border/30 rounded-lg text-xs"
                        />
                        <span className="absolute right-2 bottom-1.5 text-[8px] text-muted-foreground/60 font-semibold">µg</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label htmlFor="tiamina" className="text-[10px] text-muted-foreground">Tiamina (B1)</Label>
                      <div className="relative">
                        <Input
                          id="tiamina"
                          type="number"
                          placeholder="0"
                          value={formulario.tiamina}
                          onChange={(e) => setFormulario({ ...formulario, tiamina: e.target.value })}
                          className="h-8 text-right pr-8 bg-white dark:bg-zinc-950 border-border/30 rounded-lg text-xs"
                        />
                        <span className="absolute right-2 bottom-1.5 text-[8px] text-muted-foreground/60 font-semibold">mg</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label htmlFor="riboflavina" className="text-[10px] text-muted-foreground">Riboflavina (B2)</Label>
                      <div className="relative">
                        <Input
                          id="riboflavina"
                          type="number"
                          placeholder="0"
                          value={formulario.riboflavina}
                          onChange={(e) => setFormulario({ ...formulario, riboflavina: e.target.value })}
                          className="h-8 text-right pr-8 bg-white dark:bg-zinc-950 border-border/30 rounded-lg text-xs"
                        />
                        <span className="absolute right-2 bottom-1.5 text-[8px] text-muted-foreground/60 font-semibold">mg</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label htmlFor="niacina" className="text-[10px] text-muted-foreground">Niacina (B3)</Label>
                      <div className="relative">
                        <Input
                          id="niacina"
                          type="number"
                          placeholder="0"
                          value={formulario.niacina}
                          onChange={(e) => setFormulario({ ...formulario, niacina: e.target.value })}
                          className="h-8 text-right pr-8 bg-white dark:bg-zinc-950 border-border/30 rounded-lg text-xs"
                        />
                        <span className="absolute right-2 bottom-1.5 text-[8px] text-muted-foreground/60 font-semibold">mg</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label htmlFor="acidoPantotenico" className="text-[10px] text-muted-foreground">Ác. Pantoténico</Label>
                      <div className="relative">
                        <Input
                          id="acidoPantotenico"
                          type="number"
                          placeholder="0"
                          value={formulario.acidoPantotenico}
                          onChange={(e) => setFormulario({ ...formulario, acidoPantotenico: e.target.value })}
                          className="h-8 text-right pr-8 bg-white dark:bg-zinc-950 border-border/30 rounded-lg text-xs"
                        />
                        <span className="absolute right-2 bottom-1.5 text-[8px] text-muted-foreground/60 font-semibold">mg</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label htmlFor="folato" className="text-[10px] text-muted-foreground">Folato</Label>
                      <div className="relative">
                        <Input
                          id="folato"
                          type="number"
                          placeholder="0"
                          value={formulario.folato}
                          onChange={(e) => setFormulario({ ...formulario, folato: e.target.value })}
                          className="h-8 text-right pr-8 bg-white dark:bg-zinc-950 border-border/30 rounded-lg text-xs"
                        />
                        <span className="absolute right-2 bottom-1.5 text-[8px] text-muted-foreground/60 font-semibold">µg</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label htmlFor="acidoFolico" className="text-[10px] text-muted-foreground">Ácido Fólico</Label>
                      <div className="relative">
                        <Input
                          id="acidoFolico"
                          type="number"
                          placeholder="0"
                          value={formulario.acidoFolico}
                          onChange={(e) => setFormulario({ ...formulario, acidoFolico: e.target.value })}
                          className="h-8 text-right pr-8 bg-white dark:bg-zinc-950 border-border/30 rounded-lg text-xs"
                        />
                        <span className="absolute right-2 bottom-1.5 text-[8px] text-muted-foreground/60 font-semibold">µg</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Categoría: Otros e Hidratación */}
                <div>
                  <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-2">Hidratación y Otros</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="flex flex-col gap-1">
                      <Label htmlFor="agua" className="text-[10px] text-muted-foreground">Agua</Label>
                      <div className="relative">
                        <Input
                          id="agua"
                          type="number"
                          placeholder="0"
                          value={formulario.agua}
                          onChange={(e) => setFormulario({ ...formulario, agua: e.target.value })}
                          className="h-8 text-right pr-6 bg-white dark:bg-zinc-950 border-border/30 rounded-lg text-xs"
                        />
                        <span className="absolute right-2 bottom-1.5 text-[8px] text-muted-foreground/60 font-semibold">g</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label htmlFor="alcohol" className="text-[10px] text-muted-foreground">Alcohol</Label>
                      <div className="relative">
                        <Input
                          id="alcohol"
                          type="number"
                          placeholder="0"
                          value={formulario.alcohol}
                          onChange={(e) => setFormulario({ ...formulario, alcohol: e.target.value })}
                          className="h-8 text-right pr-6 bg-white dark:bg-zinc-950 border-border/30 rounded-lg text-xs"
                        />
                        <span className="absolute right-2 bottom-1.5 text-[8px] text-muted-foreground/60 font-semibold">g</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label htmlFor="cafeina" className="text-[10px] text-muted-foreground">Cafeína</Label>
                      <div className="relative">
                        <Input
                          id="cafeina"
                          type="number"
                          placeholder="0"
                          value={formulario.cafeina}
                          onChange={(e) => setFormulario({ ...formulario, cafeina: e.target.value })}
                          className="h-8 text-right pr-8 bg-white dark:bg-zinc-950 border-border/30 rounded-lg text-xs"
                        />
                        <span className="absolute right-2 bottom-1.5 text-[8px] text-muted-foreground/60 font-semibold">mg</span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/80 bg-green-500/5 p-2.5 rounded-xl border border-green-500/10">
                <Info className="size-4 text-green-600 shrink-0" />
                <span>Nota: Los valores guardados se consideran por cada {formulario.cantidad || '100'} {formulario.unidadMedida === 'gramo' ? 'g' : formulario.unidadMedida === 'mililitro' ? 'ml' : formulario.unidadMedida === 'unidad' ? 'u.' : formulario.unidadMedida} de alimento.</span>
              </div>
            </div>
          </div>

          <DialogFooter className="border-t pt-4 mt-6 gap-2">
            <Button variant="outline" onClick={cerrarDialogo} className="rounded-xl border-border/50 text-xs">
              Cancelar
            </Button>
            <Button
              onClick={manejarSubmit}
              disabled={crearMutation.isPending || actualizarMutation.isPending}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl text-xs gap-1.5 shadow"
            >
              {(crearMutation.isPending || actualizarMutation.isPending) && (
                <Loader2 className="h-3 w-3 animate-spin" />
              )}
              {alimentoEditando ? 'Guardar y cerrar' : 'Agregar alimento'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de confirmación para eliminar */}
      <Dialog open={alimentoAEliminar !== null} onOpenChange={() => setAlimentoAEliminar(null)}>
        <DialogContent className="rounded-2xl border-border/50">
          <DialogHeader>
            <DialogTitle>¿Eliminar alimento?</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. El alimento será eliminado
              permanentemente del catálogo.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setAlimentoAEliminar(null)} className="rounded-xl text-xs">
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (alimentoAEliminar) {
                  eliminarMutation.mutate(alimentoAEliminar);
                }
              }}
              disabled={eliminarMutation.isPending}
              className="rounded-xl text-xs font-semibold shadow"
            >
              {eliminarMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
