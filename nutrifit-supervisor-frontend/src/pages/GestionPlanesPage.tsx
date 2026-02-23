import { useState } from 'react';
import { Link } from '@tanstack/react-router';
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
} from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/api';
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
  const [busqueda, setBusqueda] = useState('');
  const [planAEliminar, setPlanAEliminar] = useState<number | null>(null);

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
    <div className="space-y-8 max-w-7xl mx-auto pb-10">
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
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por paciente u objetivo..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="pl-10 bg-white/50 border-orange-200 focus:border-orange-400"
            />
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
              />
            ))
          ) : (
            <Card className="border-dashed">
              <CardContent className="p-8 text-center">
                <Utensils className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 font-semibold">No hay planes activos</h3>
                <p className="text-sm text-muted-foreground">
                  Crea un plan desde la página de un paciente
                </p>
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
    </div>
  );
}

// ── Componente PlanCard ───────────────────────────────────────────────

function PlanCard({
  plan,
  onEliminar,
}: {
  plan: PlanAlimentacion;
  onEliminar: () => void;
}) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          {/* Avatar del paciente */}
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
            {plan.socio?.nombre?.charAt(0) ?? '?'}
            {plan.socio?.apellido?.charAt(0) ?? '?'}
          </div>

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
