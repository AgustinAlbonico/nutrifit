import { useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Building2,
  Plus,
  Pencil,
  Trash2,
  UserCheck,
  Loader2,
  AlertCircle,
} from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import {
  listarGimnasios,
  eliminarGimnasio,
} from '@/services/gimnasio.service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import type { Gimnasio } from '@/types/gimnasio';

function formatDate(date?: Date | string): string {
  if (!date) return '-';

  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '-';

  return d.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function GimnasiosListPage() {
  const { token, rol, impersonarGimnasio } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [mostrarModalEliminar, setMostrarModalEliminar] = useState(false);
  const [gimnasioAEliminar, setGimnasioAEliminar] = useState<Gimnasio | null>(null);

  const {
    data: gimnasios,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['gimnasios', token],
    queryFn: () => listarGimnasios(token!),
    enabled: !!token,
  });

  const mutationEliminar = useMutation({
    mutationFn: (id: number) => eliminarGimnasio(id, token!),
    onSuccess: () => {
      toast.success('Gimnasio eliminado correctamente');
      queryClient.invalidateQueries({ queryKey: ['gimnasios'] });
      setGimnasioAEliminar(null);
      setMostrarModalEliminar(false);
    },
    onError: (err: Error) => {
      toast.error(err.message || 'No se pudo eliminar el gimnasio');
    },
  });

  const mutationImpersonar = useMutation({
    mutationFn: async (id: number) => {
      await impersonarGimnasio(id);
      return gimnasios?.find((gimnasio) => gimnasio.id === id) ?? null;
    },
    onSuccess: (gimnasio) => {
      toast.success(
        `Ahora operás como ADMIN de "${gimnasio?.nombre ?? 'este gimnasio'}"`,
      );
      queryClient.invalidateQueries({ queryKey: ['gimnasios'] });
      window.location.reload();
    },
    onError: (err: Error) => {
      toast.error(err.message || 'No se pudo impersonar el gimnasio');
    },
  });

  const esSuperadmin = rol === 'SUPERADMIN';

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-40" />
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Error al cargar gimnasios
        </h3>
        <p className="text-muted-foreground">
          {error instanceof Error ? error.message : 'Error desconocido'}
        </p>
      </div>
    );
  }

  if (!gimnasios || gimnasios.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">
            Gimnasios
          </h1>
          {esSuperadmin && (
            <Button asChild>
              <Link to="/admin/gimnasios/nuevo">
                <Plus className="h-4 w-4" data-icon="inline-start" />
                Nuevo Gimnasio
              </Link>
            </Button>
          )}
        </div>
        <EmptyState
          icon={<Building2 size={32} className="text-muted-foreground" />}
          title="No hay gimnasios"
          description="Creá tu primer gimnasio para comenzar a operar"
          action={
            esSuperadmin
              ? {
                  label: 'Crear Gimnasio',
                  onClick: () => navigate({ to: '/admin/gimnasios/nuevo' }),
                  variant: 'primary',
                }
              : undefined
          }
        />
      </div>
    );
  }

  const handleConfirmarEliminar = () => {
    if (gimnasioAEliminar) {
      mutationEliminar.mutate(gimnasioAEliminar.id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Gimnasios</h1>
        {esSuperadmin && (
          <Button asChild>
            <Link to="/admin/gimnasios/nuevo">
              <Plus className="h-4 w-4" data-icon="inline-start" />
              Nuevo Gimnasio
            </Link>
          </Button>
        )}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Todos los gimnasios
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Dirección</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha Creación</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {gimnasios.map((gimnasio) => (
                <TableRow key={gimnasio.id}>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    #{gimnasio.id}
                  </TableCell>
                  <TableCell className="font-medium">
                    {gimnasio.nombre}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {gimnasio.direccion}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {gimnasio.email || '-'}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={gimnasio.activo ? 'default' : 'secondary'}
                    >
                      {gimnasio.activo ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(gimnasio.fechaCreacion)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        asChild
                        title="Ver detalle"
                      >
                        <Link
                          to="/admin/gimnasios/$id"
                          params={{ id: String(gimnasio.id) }}
                        >
                          <Building2 className="h-4 w-4" />
                        </Link>
                      </Button>
                      {esSuperadmin && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            asChild
                            title="Editar"
                          >
                            <Link
                              to="/admin/gimnasios/$id"
                              params={{ id: String(gimnasio.id) }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Eliminar"
                            onClick={() => {
                              setGimnasioAEliminar(gimnasio);
                              setMostrarModalEliminar(true);
                            }}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Impersonar"
                            onClick={() => mutationImpersonar.mutate(gimnasio.id)}
                            disabled={
                              mutationImpersonar.isPending &&
                              mutationImpersonar.variables === gimnasio.id
                            }
                            className="text-primary hover:text-primary"
                          >
                            {mutationImpersonar.isPending &&
                            mutationImpersonar.variables === gimnasio.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <UserCheck className="h-4 w-4" />
                            )}
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog
        open={mostrarModalEliminar}
        onOpenChange={(open: boolean) => {
          setMostrarModalEliminar(open);
          if (!open) setGimnasioAEliminar(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar gimnasio?</DialogTitle>
            <DialogDescription>
              Esta acción deshabilitará el gimnasio &quot;{gimnasioAEliminar?.nombre}&quot; y
              no podrá ser usado. Los datos no se perderán.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setMostrarModalEliminar(false);
                setGimnasioAEliminar(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmarEliminar}
              disabled={mutationEliminar.isPending}
            >
              {mutationEliminar.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Eliminando...
                </>
              ) : (
                'Eliminar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
