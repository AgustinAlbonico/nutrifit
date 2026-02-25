import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import {
  Search,
  User,
  FileText,
  TrendingUp,
  Utensils,
  Calendar,
  MoreVertical,
  Users,
} from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';

// ── Tipos ─────────────────────────────────────────────────────────────

interface Paciente {
  socioId: number;
  nombreCompleto: string;
  dni: string;
  objetivo: string | null;
  ultimoTurno: string | null;
  proximoTurno: string | null;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

// ── Componente Principal ──────────────────────────────────────────────

export function PacientesPage() {
  const { token, personaId } = useAuth();
  const [busqueda, setBusqueda] = useState('');

  // Query para obtener pacientes
  const { data: pacientes, isLoading, isError } = useQuery<Paciente[]>({
    queryKey: ['pacientes', personaId, token],
    queryFn: async () => {
      const response = await apiRequest<ApiResponse<Paciente[]>>(
        `/turnos/profesional/${personaId}/pacientes`,
        { token },
      );
      return response.data;
    },
    enabled: !!token && !!personaId,
  });

  // Filtrar pacientes por búsqueda
  const pacientesFiltrados = pacientes?.filter((paciente) => {
    if (!busqueda) return true;
    const termino = busqueda.toLowerCase();
    const nombreCompleto = (paciente.nombreCompleto || '').toLowerCase();
    const dni = paciente.dni || '';
    return (
      nombreCompleto.includes(termino) ||
      dni.includes(termino)
    );
  });

  if (isError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Mis Pacientes</h1>
          <p className="text-muted-foreground">
            Error al cargar los pacientes. Intenta nuevamente.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-orange-500/10 via-rose-500/10 to-transparent p-8 border border-orange-500/20 shadow-sm">
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-orange-600 to-rose-600 bg-clip-text text-transparent flex items-center gap-3">
              <Users className="h-8 w-8 text-orange-500" />
              Mis Pacientes
            </h1>
            <p className="mt-2 text-muted-foreground max-w-2xl text-base">
              Gestiona y accede a la información de tus pacientes
            </p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre o DNI..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="pl-10 bg-white/50 border-orange-200 focus:border-orange-400"
            />
          </div>
        </div>
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-orange-500/10 blur-3xl" />
        <div className="absolute -bottom-10 right-20 h-32 w-32 rounded-full bg-rose-500/10 blur-3xl" />
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Pacientes</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <Skeleton className="h-8 w-12" /> : pacientes?.length ?? 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Con Próximo Turno</CardTitle>
            <Utensils className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? (
                <Skeleton className="h-8 w-12" />
              ) : (
                pacientes?.filter((p) => p.proximoTurno).length ?? 0
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Consultados este mes
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? (
                <Skeleton className="h-8 w-12" />
              ) : (
                pacientes?.filter((p) => {
                  if (!p.ultimoTurno) return false;
                  const fecha = new Date(p.ultimoTurno);
                  const ahora = new Date();
                  return (
                    fecha.getMonth() === ahora.getMonth() &&
                    fecha.getFullYear() === ahora.getFullYear()
                  );
                }).length ?? 0
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de pacientes */}
      <div className="grid gap-4">
        {isLoading ? (
          // Skeletons
          Array.from({ length: 5 }).map((_, i) => (
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
        ) : pacientesFiltrados && pacientesFiltrados.length > 0 ? (
          pacientesFiltrados.map((paciente) => (
            <Card key={paciente.socioId} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                    {(paciente.nombreCompleto || 'S N').charAt(0)}
                    {(paciente.nombreCompleto || 'S N').split(' ')[1]?.charAt(0) || ''}
                  </div>
                  {/* Info principal */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold truncate">
                        {paciente.nombreCompleto || 'Sin nombre'}
                      </h3>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <span>DNI: {paciente.dni || 'Sin DNI'}</span>
                      {paciente.objetivo && (
                        <span className="truncate max-w-[200px]">
                          Objetivo: {paciente.objetivo}
                        </span>
                      )}
                    </div>
                    {paciente.ultimoTurno && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Última consulta:{' '}
                        {new Date(paciente.ultimoTurno).toLocaleDateString(
                          'es-AR',
                        )}
                      </p>
                    )}
                  </div>

                  {/* Acciones */}
                  <div className="flex items-center gap-2">
                    <Link
                      to="/profesional/paciente/$socioId/progreso"
                      params={{ socioId: String(paciente.socioId ?? '') }}
                    >
                      <Button variant="outline" size="sm">
                        <TrendingUp className="mr-2 h-4 w-4" />
                        Progreso
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
                            to="/profesional/paciente/$socioId/progreso"
                            params={{ socioId: String(paciente.socioId ?? '') }}
                          >
                            <TrendingUp className="mr-2 h-4 w-4" />
                            Ver progreso
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link
                            to="/profesional/plan/$socioId/editar"
                            params={{ socioId: String(paciente.socioId ?? '') }}
                          >
                            <Utensils className="mr-2 h-4 w-4" />
                            Ver plan alimenticio
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <FileText className="mr-2 h-4 w-4" />
                          Ver ficha de salud
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <User className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 font-semibold">No hay pacientes</h3>
              <p className="text-sm text-muted-foreground">
                {busqueda
                  ? 'No se encontraron pacientes con ese criterio'
                  : 'Aún no tienes pacientes asignados'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
