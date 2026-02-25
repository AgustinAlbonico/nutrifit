import { useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import {
  Search,
  Utensils,
  Calendar,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  Plus,
  User,
  Eraser,
  Mail,
  Phone,
  CreditCard,
} from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import { apiRequest, obtenerUrlFoto } from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

// ── Tipos ─────────────────────────────────────────────────────────────

interface Paciente {
  socioId: number;
  nombreCompleto: string;
  ultimoTurno: string | null;
  objetivo: string | null;
}

interface PlanAlimentacion {
  idPlanAlimentacion: number;
  objetivoNutricional: string | null;
  activo: boolean;
  fechaCreacion: string;
  socioId: number;
  socio?: {
    idPersona: number;
    nombre: string;
    apellido: string;
    dni: string;
    email: string;
    telefono: string;
    fechaNacimiento: string;
    fotoPerfilUrl: string | null;
  };
  dias?: Array<{
    dia: string;
    orden: number;
  }>;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

// ── Componente Principal ──────────────────────────────────────────────

export function GestionPlanesPage() {
  const { token, personaId } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [busqueda, setBusqueda] = useState('');
  const [planAEliminar, setPlanAEliminar] = useState<number | null>(null);
  const [planAVaciar, setPlanAVaciar] = useState<number | null>(null);
  const [modalCrearPlanAbierto, setModalCrearPlanAbierto] = useState(false);
  const [busquedaPaciente, setBusquedaPaciente] = useState('');

  // Query para obtener planes del nutricionista
  const { data: planes, isLoading, isError } = useQuery<PlanAlimentacion[]>({
    queryKey: ['planes-nutricionista', personaId, token],
    queryFn: async () => {
      const response = await apiRequest<ApiResponse<PlanAlimentacion[]>>(
        `/planes-alimentacion/nutricionista/${personaId}`,
        { token },
      );
      return response.data;
    },
    enabled: !!token && !!personaId,
  });

  // Mutación para eliminar plan
  const eliminarPlanMutation = useMutation({
    mutationFn: async (idPlan: number) => {
      await apiRequest(`/planes-alimentacion/${idPlan}`, {
        method: 'DELETE',
        token,
      });
    },
    onSuccess: () => {
      toast.success('Plan eliminado correctamente');
      queryClient.invalidateQueries({ queryKey: ['planes-nutricionista'] });
      setPlanAEliminar(null);
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : 'Error al eliminar el plan',
      );
    },
  });

  // Mutación para vaciar contenido del plan
  const vaciarContenidoMutation = useMutation({
    mutationFn: async (idPlan: number) => {
      await apiRequest(`/planes-alimentacion/${idPlan}/contenido`, {
        method: 'DELETE',
        token,
      });
    },
    onSuccess: () => {
      toast.success('Contenido del plan vaciado correctamente');
      queryClient.invalidateQueries({ queryKey: ['planes-nutricionista'] });
      setPlanAVaciar(null);
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Error al vaciar el contenido del plan',
      );
    },
  });
  // Query para obtener pacientes del nutricionista (para el modal de crear plan)
  const { data: pacientes, isLoading: cargandoPacientes } = useQuery<Paciente[]>({
    queryKey: ['pacientes-nutricionista-modal', personaId, token],
    queryFn: async () => {
      const response = await apiRequest<ApiResponse<Paciente[]>>(
        `/turnos/profesional/${personaId}/pacientes`,
        { token },
      );
      return response.data ?? [];
    },
    enabled: !!token && !!personaId,
  });

  // IDs de socios que ya tienen plan activo (para filtrar en el modal)
  const sociosConPlanActivo = new Set(
    planes?.filter((p) => p.activo).map((p) => p.socioId) ?? []
  );

  // Filtrar pacientes por búsqueda y excluir los que ya tienen plan activo
  const pacientesFiltrados = pacientes?.filter((paciente) => {
    // Excluir pacientes que ya tienen plan activo
    if (sociosConPlanActivo.has(paciente.socioId)) {
      return false;
    }
    // Filtrar por búsqueda
    if (!busquedaPaciente) return true;
    const termino = busquedaPaciente.toLowerCase();
    return paciente.nombreCompleto.toLowerCase().includes(termino);
  });

  // Manejar selección de paciente para crear plan
  const manejarSeleccionarPaciente = (socioId: number) => {
    setModalCrearPlanAbierto(false);
    setBusquedaPaciente('');
    navigate({ to: `/profesional/plan/${socioId}/editar` });
  };
  // Filtrar planes por búsqueda
  const planesFiltrados = planes?.filter((plan) => {
    if (!busqueda) return true;
    const termino = busqueda.toLowerCase();
    const objetivo = (plan.objetivoNutricional || '').toLowerCase();
    const nombre = (plan.socio?.nombre || '').toLowerCase();
    const apellido = (plan.socio?.apellido || '').toLowerCase();
    const dni = plan.socio?.dni || '';
    return (
      objetivo.includes(termino) ||
      nombre.includes(termino) ||
      apellido.includes(termino) ||
      dni.includes(termino)
    );
  });

  // Agrupar por activo/inactivo
  const planesActivos = planesFiltrados?.filter((p) => p.activo) ?? [];
  const planesInactivos = planesFiltrados?.filter((p) => !p.activo) ?? [];

  if (isError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Planes de Alimentación</h1>
          <p className="text-muted-foreground">
            Error al cargar los planes. Intenta nuevamente.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-orange-500/10 via-rose-500/10 to-transparent p-8 border border-orange-500/20 shadow-sm">
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-orange-600 to-rose-600 bg-clip-text text-transparent flex items-center gap-3">
              <Utensils className="h-8 w-8 text-orange-500" />
              Planes de Alimentación
            </h1>
            <p className="mt-2 text-muted-foreground max-w-2xl text-base">
              Gestiona los planes de tus pacientes
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por paciente u objetivo..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="pl-10 bg-white/50 border-orange-200 focus:border-orange-400"
              />
            </div>
            <Button
              onClick={() => setModalCrearPlanAbierto(true)}
              className="bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white whitespace-nowrap"
            >
              <Plus className="mr-2 h-4 w-4" />
              Crear Plan
            </Button>
          </div>
        </div>
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-orange-500/10 blur-3xl" />
        <div className="absolute -bottom-10 right-20 h-32 w-32 rounded-full bg-rose-500/10 blur-3xl" />
      </div>

      {/* Estadísticas */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Planes</CardTitle>
            <Utensils className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <Skeleton className="h-8 w-12" /> : planes?.length ?? 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Planes Activos</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {isLoading ? <Skeleton className="h-8 w-12" /> : planesActivos.length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Planes Inactivos</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">
              {isLoading ? <Skeleton className="h-8 w-12" /> : planesInactivos.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de planes activos */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">Planes Activos</h2>
        <div className="grid gap-4">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : planesActivos.length > 0 ? (
            planesActivos.map((plan) => (
              <PlanCard
                key={plan.idPlanAlimentacion}
                plan={plan}
                onEliminar={() => setPlanAEliminar(plan.idPlanAlimentacion)}
                onVaciar={() => setPlanAVaciar(plan.idPlanAlimentacion)}
              />
            ))
          ) : (
            <Card className="border-dashed">
              <CardContent className="p-8 text-center">
                <Utensils className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 font-semibold">No hay planes activos</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Crea un plan para uno de tus pacientes
                </p>
                <Button
                  onClick={() => setModalCrearPlanAbierto(true)}
                  className="bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Crear Plan
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Lista de planes inactivos (colapsado por defecto) */}
      {planesInactivos.length > 0 && (
        <div>
          <h2 className="mb-4 text-lg font-semibold text-muted-foreground">
            Historial de Planes ({planesInactivos.length})
          </h2>
          <div className="grid gap-4 opacity-75">
            {planesInactivos.map((plan) => (
              <PlanCard
                key={plan.idPlanAlimentacion}
                plan={plan}
                onEliminar={() => setPlanAEliminar(plan.idPlanAlimentacion)}
                onVaciar={() => setPlanAVaciar(plan.idPlanAlimentacion)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Diálogo de confirmación para eliminar */}
      <Dialog open={planAEliminar !== null} onOpenChange={() => setPlanAEliminar(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar plan?</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. El plan será eliminado
              permanentemente.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPlanAEliminar(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (planAEliminar) {
                  eliminarPlanMutation.mutate(planAEliminar);
                }
              }}
            >
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de confirmación para vaciar contenido */}
      <Dialog open={planAVaciar !== null} onOpenChange={() => setPlanAVaciar(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Vaciar contenido del plan?</DialogTitle>
            <DialogDescription>
              Esta acción eliminará todos los días y comidas del plan, pero mantendrá
              el plan activo. Podrás volver a cargar el contenido desde cero.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPlanAVaciar(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (planAVaciar) {
                  vaciarContenidoMutation.mutate(planAVaciar);
                }
              }}
            >
              Vaciar plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal para seleccionar paciente y crear plan */}
      <Dialog open={modalCrearPlanAbierto} onOpenChange={setModalCrearPlanAbierto}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-orange-500" />
              Crear Nuevo Plan
            </DialogTitle>
            <DialogDescription>
              Seleccioná el paciente para el cual querés crear el plan de alimentación.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar paciente..."
                value={busquedaPaciente}
                onChange={(e) => setBusquedaPaciente(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="max-h-[300px] overflow-y-auto space-y-2">
              {cargandoPacientes ? (
                <div className="text-center py-8 text-muted-foreground">
                  Cargando pacientes...
                </div>
              ) : pacientesFiltrados && pacientesFiltrados.length > 0 ? (
                pacientesFiltrados.map((paciente) => (
                  <button
                    key={paciente.socioId}
                    onClick={() => manejarSeleccionarPaciente(paciente.socioId)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-orange-50 hover:border-orange-200 border border-transparent transition-colors text-left"
                  >
                    <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                      <User className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="font-medium">{paciente.nombreCompleto}</p>
                      {paciente.objetivo && (
                        <p className="text-xs text-muted-foreground">{paciente.objetivo}</p>
                      )}
                    </div>
                  </button>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  {busquedaPaciente 
                    ? 'No se encontraron pacientes' 
                    : pacientes && pacientes.length > 0
                      ? 'Todos tus pacientes ya tienen un plan de alimentación activo'
                      : 'No tienes pacientes registrados'}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Componente PlanCard ───────────────────────────────────────────────

function PlanCard({
  plan,
  onEliminar,
  onVaciar,
}: {
  plan: PlanAlimentacion;
  onEliminar: () => void;
  onVaciar: () => void;
}) {
  // Calcular edad a partir de fechaNacimiento
  const calcularEdad = (fechaNacimiento: string): number | null => {
    if (!fechaNacimiento) return null;
    const fecha = new Date(fechaNacimiento);
    const hoy = new Date();
    let edad = hoy.getFullYear() - fecha.getFullYear();
    const mes = hoy.getMonth() - fecha.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < fecha.getDate())) {
      edad--;
    }
    return edad;
  };

  const edad = plan.socio?.fechaNacimiento
    ? calcularEdad(plan.socio.fechaNacimiento)
    : null;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Avatar del paciente con foto */}
          {obtenerUrlFoto(plan.socio?.fotoPerfilUrl ?? null) ? (
            <img
              src={obtenerUrlFoto(plan.socio?.fotoPerfilUrl ?? null) ?? ''}
              alt={`Foto de ${plan.socio?.nombre ?? 'Paciente'} ${plan.socio?.apellido ?? ''}`}
              className="h-14 w-14 rounded-full object-cover border-2 border-primary/20"
            />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-lg">
              {plan.socio?.nombre?.charAt(0) ?? '?'}
              {plan.socio?.apellido?.charAt(0) ?? '?'}
            </div>
          )}

          {/* Info principal */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">
                {plan.socio
                  ? `${plan.socio.nombre || 'Paciente'} ${plan.socio.apellido || ''}`
                  : `Plan #${plan.idPlanAlimentacion}`}
              </h3>
              <Badge variant={plan.activo ? 'default' : 'secondary'}>
                {plan.activo ? 'Activo' : 'Inactivo'}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground truncate">
              {plan.objetivoNutricional || 'Sin objetivo definido'}
            </p>

            {/* Datos del socio */}
            {plan.socio && (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground mt-2">
                {plan.socio.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {plan.socio.email}
                  </span>
                )}
                {plan.socio.telefono && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {plan.socio.telefono}
                  </span>
                )}
                {plan.socio.dni && (
                  <span className="flex items-center gap-1">
                    <CreditCard className="h-3 w-3" />
                    DNI: {plan.socio.dni}
                  </span>
                )}
                {edad !== null && (
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {edad} años
                  </span>
                )}
              </div>
            )}

            <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {new Date(plan.fechaCreacion).toLocaleDateString('es-AR')}
              </span>
              {plan.dias && (
                <span>{plan.dias.length} días configurados</span>
              )}
            </div>
          </div>

          {/* Acciones */}
          <div className="flex items-center gap-2">
            <Link
              to="/profesional/plan/$socioId/editar"
              params={{ socioId: plan.socioId.toString() }}
            >
              <Button variant="outline" size="sm">
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </Button>
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link
                    to="/profesional/plan/$socioId/editar"
                    params={{ socioId: plan.socioId.toString() }}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Editar plan
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    to="/profesional/paciente/$socioId/progreso"
                    params={{ socioId: plan.socioId.toString() }}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Ver progreso del paciente
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-orange-600 focus:text-orange-600"
                  onClick={onVaciar}
                >
                  <Eraser className="mr-2 h-4 w-4" />
                  Vaciar plan
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={onEliminar}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Eliminar plan
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
