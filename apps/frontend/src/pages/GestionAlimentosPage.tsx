import { useState, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import {
  Search,
  Apple,
  Plus,
  Pencil,
  Trash2,
  Loader2,
} from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import {
  listarAlimentos,
  crearAlimento,
  actualizarAlimento,
  eliminarAlimento,
  obtenerGruposAlimenticios,
  type Alimento,
  type GrupoAlimenticio,
  type CrearAlimentoDto,
  type ActualizarAlimentoDto,
} from '@/lib/api/alimentos';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
}

const UNIDADES_MEDIDA = [
  { valor: 'gramo', etiqueta: 'Gramos (g)' },
  { valor: 'kilogramo', etiqueta: 'Kilogramos (kg)' },
  { valor: 'mililitro', etiqueta: 'Mililitros (ml)' },
  { valor: 'litro', etiqueta: 'Litros (l)' },
  { valor: 'miligramo', etiqueta: 'Miligramos (mg)' },
  { valor: 'taza', etiqueta: 'Taza' },
  { valor: 'cucharada', etiqueta: 'Cucharada' },
  { valor: 'cucharadita', etiqueta: 'Cucharadita' },
];

// ── Componente Principal ────────────────────────────────────────────────

export function GestionAlimentosPage() {
  const { token, rol } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [busqueda, setBusqueda] = useState('');
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
  });

  // Verificar permisos
  const tieneAcceso = rol === 'NUTRICIONISTA' || rol === 'ADMIN';
  const { data: alimentos, isLoading, isError } = useQuery<Alimento[]>({
    queryKey: ['alimentos', token],
    queryFn: () => listarAlimentos(token!),
    enabled: !!token,
  });
  // Query para obtener grupos alimenticios
  const { data: grupos } = useQuery<GrupoAlimenticio[]>({
    queryKey: ['grupos-alimenticios', token],
    queryFn: () => obtenerGruposAlimenticios(token!),
    enabled: !!token,
  });

  // Función para cerrar diálogo (definida antes de las mutaciones)
  const cerrarDialogo = () => {
    setDialogoAbierto(false);
    setAlimentoEditando(null);
  };
  // Mutación para crear alimento
  const crearMutation = useMutation({
    mutationFn: (data: CrearAlimentoDto) => crearAlimento(token!, data),
    onSuccess: () => {
      toast.success('Alimento creado correctamente');
      queryClient.invalidateQueries({ queryKey: ['alimentos'] });
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
      queryClient.invalidateQueries({ queryKey: ['alimentos'] });
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
      queryClient.invalidateQueries({ queryKey: ['alimentos'] });
      setAlimentoAEliminar(null);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Error al eliminar el alimento');
    },
  });

  // Efecto para redirigir si no tiene acceso (después de todos los hooks)
  useEffect(() => {
    if (!tieneAcceso) {
      navigate({ to: '/dashboard' });
    }
  }, [tieneAcceso, navigate]);
  // Retornar null si no tiene acceso (después de todos los hooks)
  if (!tieneAcceso) {
    return null;
  }

  // Filtrar alimentos por búsqueda
  const alimentosFiltrados = alimentos?.filter((alimento) => {
    if (!busqueda) return true;
    const termino = busqueda.toLowerCase();
    return (
      alimento.nombre.toLowerCase().includes(termino) ||
      alimento.grupoAlimenticio?.descripcion?.toLowerCase().includes(termino)
    );
  });

  const abrirDialogoCrear = () => {
    setAlimentoEditando(null);
    setFormulario({
      nombre: '',
      cantidad: '',
      unidadMedida: 'gramo',
      calorias: '',
      proteinas: '',
      carbohidratos: '',
      grasas: '',
      grupoAlimenticioId: '',
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
      cantidad: parseInt(formulario.cantidad, 10),
      unidadMedida: formulario.unidadMedida,
      calorias: formulario.calorias ? parseInt(formulario.calorias, 10) : null,
      proteinas: formulario.proteinas ? parseInt(formulario.proteinas, 10) : null,
      carbohidratos: formulario.carbohidratos ? parseInt(formulario.carbohidratos, 10) : null,
      grasas: formulario.grasas ? parseInt(formulario.grasas, 10) : null,
      grupoAlimenticioId: formulario.grupoAlimenticioId
        ? parseInt(formulario.grupoAlimenticioId, 10)
        : null,
    };

    if (alimentoEditando) {
      actualizarMutation.mutate({ id: alimentoEditando.idAlimento, data: datos });
    } else {
      crearMutation.mutate(datos as CrearAlimentoDto);
    }
  };

  if (isError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Alimentos</h1>
          <p className="text-muted-foreground">
            Error al cargar los alimentos. Intenta nuevamente.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-green-500/10 via-emerald-500/10 to-transparent p-8 border border-green-500/20 shadow-sm">
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent flex items-center gap-3">
              <Apple className="h-8 w-8 text-green-500" />
              Alimentos
            </h1>
            <p className="mt-2 text-muted-foreground max-w-2xl text-base">
              Gestiona el catálogo de alimentos del sistema
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar alimentos..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="pl-10 bg-white/50 border-green-200 focus:border-green-400"
              />
            </div>
            <Button onClick={abrirDialogoCrear} className="bg-green-600 hover:bg-green-700">
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Alimento
            </Button>
          </div>
        </div>
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-green-500/10 blur-3xl" />
        <div className="absolute -bottom-10 right-20 h-32 w-32 rounded-full bg-emerald-500/10 blur-3xl" />
      </div>

      {/* Estadísticas */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Alimentos</CardTitle>
            <Apple className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <Skeleton className="h-8 w-12" /> : alimentos?.length ?? 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Grupos Alimenticios</CardTitle>
            <Apple className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <Skeleton className="h-8 w-12" /> : grupos?.length ?? 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de alimentos */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Cantidad</TableHead>
                <TableHead>Unidad</TableHead>
                <TableHead>Calorías</TableHead>
                <TableHead>Grupo</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : alimentosFiltrados && alimentosFiltrados.length > 0 ? (
                alimentosFiltrados.map((alimento) => (
                  <TableRow key={alimento.idAlimento}>
                    <TableCell className="font-medium">{alimento.nombre}</TableCell>
                    <TableCell>{alimento.cantidad}</TableCell>
                    <TableCell className="capitalize">{alimento.unidadMedida}</TableCell>
                    <TableCell>{alimento.calorias ?? '-'}</TableCell>
                    <TableCell>
                      {alimento.grupoAlimenticio ? (
                        <Badge variant="secondary">
                          {alimento.grupoAlimenticio.descripcion}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">Sin grupo</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => abrirDialogoEditar(alimento)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setAlimentoAEliminar(alimento.idAlimento)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <Apple className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 font-semibold">No hay alimentos</h3>
                    <p className="text-sm text-muted-foreground">
                      {busqueda ? 'No se encontraron resultados' : 'Agrega el primer alimento al catálogo'}
                    </p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Diálogo para crear/editar */}
      <Dialog open={dialogoAbierto} onOpenChange={setDialogoAbierto}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {alimentoEditando ? 'Editar Alimento' : 'Nuevo Alimento'}
            </DialogTitle>
            <DialogDescription>
              {alimentoEditando
                ? 'Modifica los datos del alimento'
                : 'Completa los datos para agregar un nuevo alimento'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="nombre">Nombre *</Label>
              <Input
                id="nombre"
                value={formulario.nombre}
                onChange={(e) => setFormulario({ ...formulario, nombre: e.target.value })}
                placeholder="Ej: Aceite de oliva"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="cantidad">Cantidad *</Label>
                <Input
                  id="cantidad"
                  type="number"
                  value={formulario.cantidad}
                  onChange={(e) => setFormulario({ ...formulario, cantidad: e.target.value })}
                  placeholder="100"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="unidad">Unidad *</Label>
                <Select
                  value={formulario.unidadMedida}
                  onValueChange={(value) => setFormulario({ ...formulario, unidadMedida: value })}
                >
                  <SelectTrigger>
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
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="calorias">Calorías</Label>
                <Input
                  id="calorias"
                  type="number"
                  value={formulario.calorias}
                  onChange={(e) => setFormulario({ ...formulario, calorias: e.target.value })}
                  placeholder="kcal"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="proteinas">Proteínas</Label>
                <Input
                  id="proteinas"
                  type="number"
                  value={formulario.proteinas}
                  onChange={(e) => setFormulario({ ...formulario, proteinas: e.target.value })}
                  placeholder="g"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="carbohidratos">Carbohidratos</Label>
                <Input
                  id="carbohidratos"
                  type="number"
                  value={formulario.carbohidratos}
                  onChange={(e) => setFormulario({ ...formulario, carbohidratos: e.target.value })}
                  placeholder="g"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="grasas">Grasas</Label>
                <Input
                  id="grasas"
                  type="number"
                  value={formulario.grasas}
                  onChange={(e) => setFormulario({ ...formulario, grasas: e.target.value })}
                  placeholder="g"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="grupo">Grupo Alimenticio</Label>
              <Select
                value={formulario.grupoAlimenticioId}
                onValueChange={(value) => setFormulario({ ...formulario, grupoAlimenticioId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar grupo" />
                </SelectTrigger>
                <SelectContent>
                  {grupos?.map((grupo) => (
                    <SelectItem key={grupo.idGrupoAlimenticio} value={grupo.idGrupoAlimenticio.toString()}>
                      {grupo.descripcion}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={cerrarDialogo}>
              Cancelar
            </Button>
            <Button
              onClick={manejarSubmit}
              disabled={crearMutation.isPending || actualizarMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {(crearMutation.isPending || actualizarMutation.isPending) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {alimentoEditando ? 'Guardar Cambios' : 'Crear Alimento'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de confirmación para eliminar */}
      <Dialog open={alimentoAEliminar !== null} onOpenChange={() => setAlimentoAEliminar(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar alimento?</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. El alimento será eliminado
              permanentemente del catálogo.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAlimentoAEliminar(null)}>
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
