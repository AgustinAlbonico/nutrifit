import { useState } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Building2,
  Pencil,
  Trash2,
  UserCheck,
  Loader2,
  ArrowLeft,
  Users,
} from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import {
  obtenerGimnasio,
  actualizarGimnasio,
  eliminarGimnasio,
  impersonarGimnasio,
  listarAdminsDeGimnasio,
} from '@/services/gimnasio.service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import type { Gimnasio, AdminUser, ActualizarGimnasioRequest } from '@/types/gimnasio';

const editarSchema = z.object({
  nombre: z.string().min(3).max(100),
  direccion: z.string().min(5).max(200),
  telefono: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
});

type EditarFormData = z.infer<typeof editarSchema>;

function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function GimnasioDetailPage() {
  const { id } = useParams({ strict: false }) as { id: string };
  const { token, rol } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [modoEditar, setModoEditar] = useState(false);
  const [mostrarModalEliminar, setMostrarModalEliminar] = useState(false);

  const gimnasioId = Number(id);

  const {
    data: gimnasio,
    isLoading,
    isError,
    error,
  } = useQuery<Gimnasio>({
    queryKey: ['gimnasios', gimnasioId, token],
    queryFn: () => obtenerGimnasio(gimnasioId, token!),
    enabled: !!token && !isNaN(gimnasioId),
  });

  const {
    data: admins,
  } = useQuery<AdminUser[]>({
    queryKey: ['gimnasios', gimnasioId, 'admins', token],
    queryFn: () => listarAdminsDeGimnasio(gimnasioId, token!),
    enabled: !!token && !isNaN(gimnasioId) && modoEditar,
  });

  const editarForm = useForm<EditarFormData>({
    resolver: zodResolver(editarSchema),
    values: gimnasio ? {
      nombre: gimnasio.nombre,
      direccion: gimnasio.direccion,
      telefono: gimnasio.telefono ?? '',
      email: gimnasio.email ?? '',
    } : undefined,
  });

  const mutationEditar = useMutation({
    mutationFn: (data: ActualizarGimnasioRequest) =>
      actualizarGimnasio(gimnasioId, data, token!),
    onSuccess: () => {
      toast.success('Gimnasio actualizado correctamente');
      queryClient.invalidateQueries({ queryKey: ['gimnasios', gimnasioId] });
      setModoEditar(false);
    },
    onError: (err: Error) => {
      toast.error(err.message || 'No se pudo actualizar el gimnasio');
    },
  });

  const mutationEliminar = useMutation({
    mutationFn: () => eliminarGimnasio(gimnasioId, token!),
    onSuccess: () => {
      toast.success('Gimnasio eliminado correctamente');
      navigate({ to: '/admin/gimnasios' });
    },
    onError: (err: Error) => {
      toast.error(err.message || 'No se pudo eliminar el gimnasio');
    },
  });

  const mutationImpersonar = useMutation({
    mutationFn: () => impersonarGimnasio(gimnasioId, token!),
    onSuccess: (result) => {
      toast.success(`Ahora operás como ADMIN de "${result.gimnasio.nombre}"`);
      localStorage.setItem(
        'nutrifit.auth.impersonated',
        JSON.stringify({
          token: result.token,
          gimnasioId: result.gimnasio.id,
          gimnasioNombre: result.gimnasio.nombre,
        }),
      );
      window.location.reload();
    },
    onError: (err: Error) => {
      toast.error(err.message || 'No se pudo impersonar el gimnasio');
    },
  });

  const handleGuardarEdicion = editarForm.handleSubmit((data) => {
    mutationEditar.mutate({
      nombre: data.nombre,
      direccion: data.direccion,
      telefono: data.telefono || undefined,
      email: data.email || undefined,
    });
  });

  const handleCancelarEdicion = () => {
    setModoEditar(false);
    editarForm.reset();
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-10 w-48" />
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <Skeleton className="h-8 w-1/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isError || !gimnasio) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Building2 className="h-12 w-12 text-destructive mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Gimnasio no encontrado
        </h3>
        <p className="text-muted-foreground mb-4">
          {error instanceof Error ? error.message : 'Error al cargar el gimnasio'}
        </p>
        <Button variant="outline" onClick={() => navigate({ to: '/admin/gimnasios' })}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a la lista
        </Button>
      </div>
    );
  }

  const esSuperadmin = rol === 'SUPERADMIN';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate({ to: '/admin/gimnasios' })}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              {gimnasio.nombre}
              <Badge variant={gimnasio.activo ? 'default' : 'secondary'}>
                {gimnasio.activo ? 'Activo' : 'Inactivo'}
              </Badge>
            </h1>
            <p className="text-sm text-muted-foreground">
              ID #{gimnasio.id} — Creado el {formatDate(gimnasio.fechaCreacion)}
            </p>
          </div>
        </div>
        {esSuperadmin && (
          <div className="flex items-center gap-2">
            {!modoEditar && (
              <>
                <Button
                  variant="outline"
                  onClick={() => mutationImpersonar.mutate()}
                  disabled={mutationImpersonar.isPending}
                >
                  {mutationImpersonar.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <UserCheck className="h-4 w-4 mr-2" />
                  )}
                  Impersonar
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setModoEditar(true)}
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Editar
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setMostrarModalEliminar(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      {modoEditar ? (
        <Card>
          <CardHeader>
            <CardTitle>Editar gimnasio</CardTitle>
            <CardDescription>
              Modificá los datos del gimnasio
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleGuardarEdicion} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre *</Label>
                <Input
                  id="nombre"
                  {...editarForm.register('nombre')}
                  aria-invalid={!!editarForm.formState.errors.nombre}
                />
                {editarForm.formState.errors.nombre && (
                  <p className="text-sm text-destructive">
                    {editarForm.formState.errors.nombre.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="direccion">Dirección *</Label>
                <Input
                  id="direccion"
                  {...editarForm.register('direccion')}
                  aria-invalid={!!editarForm.formState.errors.direccion}
                />
                {editarForm.formState.errors.direccion && (
                  <p className="text-sm text-destructive">
                    {editarForm.formState.errors.direccion.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefono">Teléfono</Label>
                <Input
                  id="telefono"
                  {...editarForm.register('telefono')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  {...editarForm.register('email')}
                  aria-invalid={!!editarForm.formState.errors.email}
                />
                {editarForm.formState.errors.email && (
                  <p className="text-sm text-destructive">
                    {editarForm.formState.errors.email.message}
                  </p>
                )}
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancelarEdicion}
                  disabled={mutationEditar.isPending}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={mutationEditar.isPending}
                >
                  {mutationEditar.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Guardando...
                    </>
                  ) : (
                    'Guardar cambios'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                Información del gimnasio
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground">Nombre</p>
                <p className="font-medium">{gimnasio.nombre}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Dirección</p>
                <p className="font-medium">{gimnasio.direccion}</p>
              </div>
              {gimnasio.telefono && (
                <div>
                  <p className="text-xs text-muted-foreground">Teléfono</p>
                  <p className="font-medium">{gimnasio.telefono}</p>
                </div>
              )}
              {gimnasio.email && (
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="font-medium">{gimnasio.email}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Admins del gimnasio
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {admins && admins.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {admins.map((admin) => (
                      <TableRow key={admin.id}>
                        <TableCell className="font-medium">
                          {admin.nombre} {admin.apellido}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {admin.email}
                        </TableCell>
                        <TableCell>
                          <Badge variant={admin.activo ? 'default' : 'secondary'}>
                            {admin.activo ? 'Activo' : 'Inactivo'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  No hay admins para este gimnasio
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal de confirmación de eliminación */}
      <Dialog
        open={mostrarModalEliminar}
        onOpenChange={setMostrarModalEliminar}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar gimnasio?</DialogTitle>
            <DialogDescription>
              Esta acción deshabilitará el gimnasio &quot;{gimnasio.nombre}&quot; y no podrá
              ser usado. Los datos no se perderán.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setMostrarModalEliminar(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => mutationEliminar.mutate()}
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