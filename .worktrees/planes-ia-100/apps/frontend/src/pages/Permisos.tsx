import { useState, useMemo, useEffect, useCallback, type FormEvent } from 'react';
import { toast } from 'sonner';
import {
  Shield,
  Plus,
  Search,
  Edit2,
  Lock,
  ChevronLeft,
  ChevronRight,
  Users as UsersIcon,
  Loader2,
  KeyRound,
} from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import { useUsuarios, type Usuario } from '@/hooks/useUsuarios';
import type { ActionDto, GroupDto } from '@/types/permissions';
import { apiRequest } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Card,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface RespuestaApi<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export function Permisos() {
  const { token, rol, hasPermission } = useAuth();

  // Estados de carga y datos
  const [cargando, setCargando] = useState(false);
  const [acciones, setAcciones] = useState<ActionDto[]>([]);
  const [grupos, setGrupos] = useState<GroupDto[]>([]);

  // Estados de formulario (Creación)
  const [grupoClave, setGrupoClave] = useState('');
  const [grupoNombre, setGrupoNombre] = useState('');
  const [mostrarCrearGrupo, setMostrarCrearGrupo] = useState(false);

  // Estados de formulario (Asignación)
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [search, setSearch] = useState('');
  const [isActiveFilter, setIsActiveFilter] = useState<string>('');
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<Usuario | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [idsAccionesSeleccionadas, setIdsAccionesSeleccionadas] = useState<number[]>([]);
  const [idsGruposSeleccionados, setIdsGruposSeleccionados] = useState<number[]>([]);

  // Query de usuarios con paginación y filtros
  const { usuarios, pagination, isLoading } = useUsuarios({
    token,
    page,
    limit,
    search: search || undefined,
    isActive: isActiveFilter ? isActiveFilter === 'true' : undefined,
  });

  // Estados de Edición
  const [accionEditando, setAccionEditando] = useState<ActionDto | null>(null);
  const [grupoEditando, setGrupoEditando] = useState<GroupDto | null>(null);
  const [accionClaveEdicion, setAccionClaveEdicion] = useState('');
  const [accionNombreEdicion, setAccionNombreEdicion] = useState('');
  const [accionDescripcionEdicion, setAccionDescripcionEdicion] = useState('');
  const [grupoClaveEdicion, setGrupoClaveEdicion] = useState('');
  const [grupoNombreEdicion, setGrupoNombreEdicion] = useState('');
  const [grupoDescripcionEdicion, setGrupoDescripcionEdicion] = useState('');
  const [grupoAccionesEdicion, setGrupoAccionesEdicion] = useState<number[]>([]);

  // Filtros de búsqueda
  const [busquedaGrupos, setBusquedaGrupos] = useState('');
  const [busquedaAcciones, setBusquedaAcciones] = useState('');

  // Permisos derivados
  const puedeGestionarPermisos = useMemo(
    () => rol === 'ADMIN' && hasPermission('auth.permissions.write'),
    [hasPermission, rol],
  );

  const puedeLeerPermisos = useMemo(
    () => rol === 'ADMIN' && hasPermission('auth.permissions.read'),
    [hasPermission, rol],
  );

  // Calcular acciones heredadas de los grupos seleccionados
  const accionesHeredadas = useMemo(() => {
    if (!grupos || !idsGruposSeleccionados.length) return [];

    const accionesHeredadasMap = new Map<number, ActionDto>();
    const gruposSeleccionados = grupos.filter((g) => idsGruposSeleccionados.includes(g.id));

    for (const grupo of gruposSeleccionados) {
      if (grupo.acciones) {
        for (const accion of grupo.acciones) {
          accionesHeredadasMap.set(accion.id, accion);
        }
      }
    }

    return Array.from(accionesHeredadasMap.values());
  }, [grupos, idsGruposSeleccionados]);

  // Filtrar acciones disponibles: excluir las que ya están heredadas de los grupos seleccionados
  const accionesDisponibles = useMemo(() => {
    if (!acciones || !accionesHeredadas.length) return acciones;

    const idsHeredadas = new Set(accionesHeredadas.map((a) => a.id));
    return acciones.filter((accion) => !idsHeredadas.has(accion.id));
  }, [acciones, accionesHeredadas]);

  // Limpiar acciones directas que ahora están heredadas cuando cambian los grupos seleccionados
  useEffect(() => {
    if (accionesHeredadas.length > 0) {
      const idsHeredadas = new Set(accionesHeredadas.map((a) => a.id));
      setIdsAccionesSeleccionadas((prev) => prev.filter((id) => !idsHeredadas.has(id)));
    }
  }, [accionesHeredadas]);

  // Carga inicial
  const cargarCatalogos = useCallback(async () => {
    if (!token) return;
    setCargando(true);

    try {
      const [respuestaAcciones, respuestaGrupos] = await Promise.all([
        apiRequest<ActionDto[] | RespuestaApi<ActionDto[]>>('/permissions/actions', { token }),
        apiRequest<GroupDto[] | RespuestaApi<GroupDto[]>>('/permissions/groups', { token }),
      ]);

      const datosAcciones = Array.isArray(respuestaAcciones)
        ? respuestaAcciones
        : (respuestaAcciones.data ?? []);

      const datosGrupos = Array.isArray(respuestaGrupos)
        ? respuestaGrupos
        : (respuestaGrupos.data ?? []);

      setAcciones(Array.isArray(datosAcciones) ? datosAcciones : []);
      setGrupos(Array.isArray(datosGrupos) ? datosGrupos : []);
    } catch {
      toast.error('No se pudieron cargar los catálogos');
    } finally {
      setCargando(false);
    }
  }, [token]);

  useEffect(() => {
    if (puedeLeerPermisos) {
      void cargarCatalogos();
    }
  }, [puedeLeerPermisos, cargarCatalogos]);

  // Manejadores de API
  const obtenerMensajeError = (err: unknown, fallback: string) =>
    err instanceof Error ? err.message : fallback;

  const crearGrupo = async (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    if (!token) return;

    try {
      await apiRequest<GroupDto>('/permissions/groups', {
        method: 'POST',
        token,
        body: { clave: grupoClave, nombre: grupoNombre },
      });

      setGrupoClave('');
      setGrupoNombre('');
      setMostrarCrearGrupo(false);
      toast.success('Grupo creado exitosamente');
      await cargarCatalogos();
    } catch (err) {
      toast.error(obtenerMensajeError(err, 'No se pudo crear el grupo'));
    }
  };

  const asignarAUsuario = async () => {
    if (!token || !usuarioSeleccionado) {
      toast.warning('Seleccioná un usuario');
      return;
    }

    try {
      setIsSaving(true);

      await apiRequest(`/permissions/users/${usuarioSeleccionado.idUsuario}/groups`, {
        method: 'PUT',
        token,
        body: { groupIds: idsGruposSeleccionados },
      });

      await apiRequest(`/permissions/users/${usuarioSeleccionado.idUsuario}/actions`, {
        method: 'PUT',
        token,
        body: { actionIds: idsAccionesSeleccionadas },
      });

      toast.success(`Permisos asignados exitosamente a ${usuarioSeleccionado.persona?.nombre || usuarioSeleccionado.email}`);
      // Reset del formulario
      setUsuarioSeleccionado(null);
      setIdsAccionesSeleccionadas([]);
      setIdsGruposSeleccionados([]);
    } catch (err) {
      toast.error(obtenerMensajeError(err, 'No se pudo asignar los permisos'));
    } finally {
      setIsSaving(false);
    }
  };

  const guardarEdicionAccion = async (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    if (!token || !accionEditando) return;

    try {
      await apiRequest<ActionDto>(`/permissions/actions/${accionEditando.id}`, {
        method: 'PUT',
        token,
        body: {
          clave: accionClaveEdicion,
          nombre: accionNombreEdicion,
          descripcion: accionDescripcionEdicion || undefined,
        },
      });

      toast.success('Acción actualizada');
      setAccionEditando(null);
      await cargarCatalogos();
    } catch (err) {
      toast.error(obtenerMensajeError(err, 'No se pudo editar la acción'));
    }
  };

  const guardarEdicionGrupo = async (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    if (!token || !grupoEditando) return;

    try {
      await apiRequest<GroupDto>(`/permissions/groups/${grupoEditando.id}`, {
        method: 'PUT',
        token,
        body: {
          clave: grupoClaveEdicion,
          nombre: grupoNombreEdicion,
          descripcion: grupoDescripcionEdicion || undefined,
        },
      });

      await apiRequest<GroupDto>(`/permissions/groups/${grupoEditando.id}/actions`, {
        method: 'PUT',
        token,
        body: {
          actionIds: grupoAccionesEdicion,
        },
      });

      toast.success('Grupo actualizado');
      setGrupoEditando(null);
      await cargarCatalogos();
    } catch (err) {
      toast.error(obtenerMensajeError(err, 'No se pudo editar el grupo'));
    }
  };

  // Funciones de UI
  const abrirEdicionAccion = (accion: ActionDto) => {
    setAccionEditando(accion);
    setAccionClaveEdicion(accion.clave);
    setAccionNombreEdicion(accion.nombre);
    setAccionDescripcionEdicion(accion.descripcion ?? '');
  };

  const abrirEdicionGrupo = (grupo: GroupDto) => {
    setGrupoEditando(grupo);
    setGrupoClaveEdicion(grupo.clave);
    setGrupoNombreEdicion(grupo.nombre);
    setGrupoDescripcionEdicion(grupo.descripcion ?? '');
    setGrupoAccionesEdicion((grupo.acciones ?? []).map((accion) => accion.id));
  };

  // Filtrado
  const gruposFiltrados = useMemo(
    () =>
      grupos.filter(
        (g) =>
          g.nombre.toLowerCase().includes(busquedaGrupos.toLowerCase()) ||
          g.clave.toLowerCase().includes(busquedaGrupos.toLowerCase()),
      ),
    [grupos, busquedaGrupos],
  );

  const accionesFiltradas = useMemo(
    () =>
      acciones.filter(
        (a) =>
          a.nombre.toLowerCase().includes(busquedaAcciones.toLowerCase()) ||
          a.clave.toLowerCase().includes(busquedaAcciones.toLowerCase()),
      ),
    [acciones, busquedaAcciones],
  );

  if (!puedeLeerPermisos) {
    return (
      <Alert variant="destructive">
        <Shield className="h-4 w-4" />
        <AlertTitle>Acceso Denegado</AlertTitle>
        <AlertDescription>
          Tu rol actual no tiene permiso para administrar acciones y grupos.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl border border-orange-500/20 bg-gradient-to-r from-orange-500/10 via-rose-500/10 to-transparent p-8 mb-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-rose-500/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <KeyRound className="h-8 w-8 text-orange-500" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-rose-600 bg-clip-text text-transparent">
              Permisos y Roles
            </h1>
          </div>
          <p className="text-muted-foreground">
            Gestioná los grupos de permisos, acciones del sistema y asignaciones a usuarios.
          </p>
        </div>
      </div>

      <Tabs defaultValue="grupos" className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
          <TabsTrigger value="grupos">Grupos</TabsTrigger>
          <TabsTrigger value="acciones">Acciones</TabsTrigger>
          <TabsTrigger value="asignacion">Asignación</TabsTrigger>
        </TabsList>

        {/* TAB: GRUPOS */}
        <TabsContent value="grupos" className="mt-6 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 md:max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar grupos..."
                className="pl-9"
                value={busquedaGrupos}
                onChange={(e) => setBusquedaGrupos(e.target.value)}
              />
            </div>
            {puedeGestionarPermisos && (
              <Button onClick={() => setMostrarCrearGrupo(true)}>
                <Plus className="mr-2 h-4 w-4" /> Nuevo Grupo
              </Button>
            )}
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Clave</TableHead>
                  <TableHead className="hidden md:table-cell">Descripción</TableHead>
                  <TableHead>Acciones</TableHead>
                  <TableHead className="text-right">Opciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cargando ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      Cargando grupos...
                    </TableCell>
                  </TableRow>
                ) : gruposFiltrados.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                      No se encontraron grupos.
                    </TableCell>
                  </TableRow>
                ) : (
                  gruposFiltrados.map((grupo) => (
                    <TableRow key={grupo.id}>
                      <TableCell className="font-medium">{grupo.nombre}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono text-xs">
                          {grupo.clave}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden text-muted-foreground md:table-cell">
                        {grupo.descripcion || '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {grupo.acciones?.slice(0, 3).map((a) => (
                            <Badge key={a.id} variant="secondary" className="text-[10px]">
                              {a.clave}
                            </Badge>
                          ))}
                          {(grupo.acciones?.length || 0) > 3 && (
                            <Badge variant="secondary" className="text-[10px]">
                              +{grupo.acciones!.length - 3} más
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {puedeGestionarPermisos && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => abrirEdicionGrupo(grupo)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* TAB: ACCIONES */}
        <TabsContent value="acciones" className="mt-6 space-y-4">
          <Alert className="bg-muted/50">
            <Lock className="h-4 w-4" />
            <AlertTitle>Solo Lectura</AlertTitle>
            <AlertDescription>
              Las acciones del sistema se definen por seed (código). Solo podés editar sus nombres o descripciones.
            </AlertDescription>
          </Alert>

          <div className="flex items-center gap-4">
            <div className="relative flex-1 md:max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar acciones..."
                className="pl-9"
                value={busquedaAcciones}
                onChange={(e) => setBusquedaAcciones(e.target.value)}
              />
            </div>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Clave</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead className="hidden md:table-cell">Descripción</TableHead>
                  <TableHead className="text-right">Opciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cargando ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      Cargando acciones...
                    </TableCell>
                  </TableRow>
                ) : accionesFiltradas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                      No se encontraron acciones.
                    </TableCell>
                  </TableRow>
                ) : (
                  accionesFiltradas.map((accion) => (
                    <TableRow key={accion.id}>
                      <TableCell>
                        <Badge variant="outline" className="font-mono text-xs">
                          {accion.clave}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{accion.nombre}</TableCell>
                      <TableCell className="hidden text-muted-foreground md:table-cell">
                        {accion.descripcion || '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        {puedeGestionarPermisos && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => abrirEdicionAccion(accion)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* TAB: ASIGNACIÓN */}
        <TabsContent value="asignacion" className="mt-6">
          <div className="px-4 py-8">
            {/* Filtros y búsqueda */}
            <Card className="p-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Búsqueda */}
                <div className="md:col-span-2">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="text-muted-foreground" size={20} />
                    </div>
                    <Input
                      placeholder="Buscar por usuario, email o nombre..."
                      value={search}
                      onChange={(e) => {
                        setSearch(e.target.value);
                        setPage(1);
                      }}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Filtro por estado */}
                <div>
                  <select
                    value={isActiveFilter}
                    onChange={(e) => {
                      setIsActiveFilter(e.target.value);
                      setPage(1);
                    }}
                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="">Todos</option>
                    <option value="true">Activos</option>
                    <option value="false">Inactivos</option>
                  </select>
                </div>
              </div>
            </Card>

            {/* Tabla de usuarios */}
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full divide-y">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase text-muted-foreground">
                        Nombre Completo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase text-muted-foreground">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase text-muted-foreground">
                        Rol
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase text-muted-foreground">
                        Grupos
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase text-muted-foreground">
                        Estado
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium uppercase text-muted-foreground">
                        Asignar
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td colSpan={6} className="p-6">
                          <TableSkeleton rows={limit} columns={6} />
                        </td>
                      </tr>
                    ) : usuarios && usuarios.length > 0 ? (
                      usuarios.map((usuario) => (
                        <tr key={usuario.idUsuario} className="hover:bg-muted/50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium">{usuario.persona?.nombre || 'Sin nombre'}</div>
                            <div className="text-sm text-muted-foreground">{usuario.persona?.apellido || ''}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm">{usuario.email}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge
                              variant={usuario.rol === 'ADMIN' ? 'default' : 'secondary'}
                              className="font-mono text-xs"
                            >
                              {usuario.rol}
                            </Badge>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-1">
                              {usuario.groups && usuario.groups.length > 0 ? (
                                usuario.groups.map((grupo) => (
                                  <Badge
                                    key={grupo.id}
                                    variant="outline"
                                    className="text-xs"
                                  >
                                    {grupo.nombre}
                                  </Badge>
                                ))
                              ) : (
                                <span className="text-sm text-muted-foreground">Sin grupos</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge
                              variant={usuario.isActive ? 'default' : 'destructive'}
                              className="text-xs"
                            >
                              {usuario.isActive ? 'Activo' : 'Inactivo'}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <Button
                              size="icon"
                              onClick={() => {
                                setUsuarioSeleccionado(usuario);
                                // Cargar grupos y acciones actuales del usuario
                                setIdsGruposSeleccionados(usuario.groups?.map(g => g.id) || []);
                                setIdsAccionesSeleccionadas(usuario.actions?.map(a => a.id) || []);
                              }}
                              title="Gestionar permisos"
                            >
                              <Shield size={18} />
                            </Button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6}>
                          {search || isActiveFilter ? (
                            <EmptyState
                              icon={<Search size={32} className="text-muted-foreground" />}
                              title="No se encontraron usuarios"
                              description="No hay resultados con los filtros aplicados. Intentá ajustar los criterios de búsqueda."
                            />
                          ) : (
                            <EmptyState
                              icon={<UsersIcon size={32} className="text-muted-foreground" />}
                              title="No hay usuarios registrados"
                              description="No hay usuarios en el sistema para asignar permisos."
                            />
                          )}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Paginación */}
              {pagination && pagination.totalPages > 1 && (
                <div className="bg-muted/50 px-6 py-4 border-t">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      Mostrando{' '}
                      <span className="font-medium">
                        {(pagination.page - 1) * pagination.limit + 1}
                      </span>
                      {' - '}
                      <span className="font-medium">
                        {Math.min(pagination.page * pagination.limit, pagination.total)}
                      </span>
                      {' de '}
                      <span className="font-medium">{pagination.total}</span> usuarios
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                        disabled={!pagination.hasPreviousPage}
                      >
                        <ChevronLeft size={16} />
                        Anterior
                      </Button>

                      <div className="flex items-center gap-1">
                        {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                          .filter((pageNum) => {
                            return (
                              pageNum === 1 ||
                              pageNum === pagination.totalPages ||
                              Math.abs(pageNum - pagination.page) <= 1
                            );
                          })
                          .map((pageNum, idx, arr) => {
                            const prevPageNum = arr[idx - 1];
                            const showEllipsis = prevPageNum && pageNum - prevPageNum > 1;

                            return (
                              <Button
                                key={pageNum}
                                size="sm"
                                variant={pageNum === pagination.page ? 'default' : 'outline'}
                                onClick={() => setPage(pageNum)}
                                className="min-w-8"
                              >
                                {showEllipsis && <span>...</span>}
                                {!showEllipsis && <span>{pageNum}</span>}
                              </Button>
                            );
                          })}
                      </div>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setPage((prev) => prev + 1)}
                        disabled={!pagination.hasNextPage}
                      >
                        Siguiente
                        <ChevronRight size={16} />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </Card>

            {/* Formulario de asignación de permisos (modal o tarjeta separada) */}
            {usuarioSeleccionado && (
              <div className="mt-6">
                <Card className="p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-semibold">Asignar Permisos</h2>
                      <p className="text-sm text-muted-foreground mt-1">
                        Usuario: <strong>{usuarioSeleccionado.persona?.nombre || usuarioSeleccionado.email}</strong>
                      </p>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => setUsuarioSeleccionado(null)}>
                      Cerrar
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Grupos */}
                    <div>
                      <h3 className="text-lg font-medium mb-3">Grupos</h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        Seleccioná los grupos a los que pertenece el usuario
                      </p>

                      {grupos && grupos.length > 0 ? (
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                          {grupos.map((grupo) => (
                            <label
                              key={grupo.id}
                              className="flex items-start p-3 border rounded-md hover:bg-muted cursor-pointer transition-colors"
                            >
                              <input
                                type="checkbox"
                                checked={idsGruposSeleccionados.includes(grupo.id)}
                                onChange={() => {
                                  setIdsGruposSeleccionados((prev) =>
                                    prev.includes(grupo.id)
                                      ? prev.filter((id) => id !== grupo.id)
                                      : [...prev, grupo.id],
                                  );
                                }}
                                className="mt-1"
                              />
                              <div className="ml-3 flex-1">
                                <div className="font-medium">{grupo.nombre}</div>
                                <div className="text-sm text-muted-foreground">{grupo.clave}</div>
                                {grupo.descripcion && (
                                  <div className="text-sm text-muted-foreground mt-1">{grupo.descripcion}</div>
                                )}
                              </div>
                            </label>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No hay grupos disponibles</p>
                      )}
                    </div>

                    {/* Acciones */}
                    <div>
                      <h3 className="text-lg font-medium mb-3">Acciones Directas</h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        Seleccioná acciones específicas para el usuario
                      </p>
                      {accionesHeredadas && accionesHeredadas.length > 0 && (
                        <Alert className="mb-3">
                          <Shield className="h-4 w-4" />
                          <AlertTitle>Acciones heredadas</AlertTitle>
                          <AlertDescription>
                            El usuario ya tiene <strong>{accionesHeredadas.length}</strong> acción(es) desde sus grupos.
                            Las acciones heredadas no se muestran aquí para evitar duplicados.
                          </AlertDescription>
                        </Alert>
                      )}

                      {accionesDisponibles && accionesDisponibles.length > 0 ? (
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                          {accionesDisponibles.map((accion) => (
                            <label
                              key={accion.id}
                              className="flex items-start p-3 border rounded-md hover:bg-muted cursor-pointer transition-colors"
                            >
                              <input
                                type="checkbox"
                                checked={idsAccionesSeleccionadas.includes(accion.id)}
                                onChange={() => {
                                  setIdsAccionesSeleccionadas((prev) =>
                                    prev.includes(accion.id)
                                      ? prev.filter((id) => id !== accion.id)
                                      : [...prev, accion.id],
                                  );
                                }}
                                className="mt-1"
                              />
                              <div className="ml-3 flex-1">
                                <div className="font-medium">{accion.nombre}</div>
                                <div className="text-sm text-muted-foreground">{accion.clave}</div>
                                {accion.descripcion && (
                                  <div className="text-sm text-muted-foreground mt-1">{accion.descripcion}</div>
                                )}
                              </div>
                            </label>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          {accionesHeredadas && accionesHeredadas.length > 0
                            ? 'Todas las acciones ya están cubiertas por los grupos del usuario'
                            : 'No hay acciones disponibles'}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Botones */}
                  <div className="flex gap-3 mt-6">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setUsuarioSeleccionado(null);
                        setIdsGruposSeleccionados([]);
                        setIdsAccionesSeleccionadas([]);
                      }}
                      className="flex-1"
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={asignarAUsuario}
                      disabled={isSaving}
                      className="flex-1 flex items-center justify-center gap-2"
                    >
                      {isSaving && <Loader2 size={18} className="animate-spin" />}
                      Guardar Permisos
                    </Button>
                  </div>
                </Card>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* MODAL: CREAR GRUPO */}
      <Dialog open={mostrarCrearGrupo} onOpenChange={setMostrarCrearGrupo}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Nuevo Grupo de Permisos</DialogTitle>
            <DialogDescription>
              Creá un nuevo rol para agrupar acciones. La clave debe ser única (ej: 'profesional').
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={crearGrupo} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="clave" required>Clave</Label>
              <Input
                id="clave"
                placeholder="ej: administrativo"
                value={grupoClave}
                onChange={(e) => setGrupoClave(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nombre" required>Nombre Visible</Label>
              <Input
                id="nombre"
                placeholder="ej: Administrativo"
                value={grupoNombre}
                onChange={(e) => setGrupoNombre(e.target.value)}
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setMostrarCrearGrupo(false)}>
                Cancelar
              </Button>
              <Button type="submit">Crear Grupo</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL: EDITAR ACCIÓN */}
      <Dialog open={Boolean(accionEditando)} onOpenChange={(open) => !open && setAccionEditando(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Editar Acción</DialogTitle>
            <DialogDescription>
              Modificá los detalles de la acción <strong>{accionEditando?.clave}</strong>.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={guardarEdicionAccion} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="clave-edicion" required>Clave</Label>
              <Input
                id="clave-edicion"
                value={accionClaveEdicion}
                onChange={(e) => setAccionClaveEdicion(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nombre-edicion" required>Nombre</Label>
              <Input
                id="nombre-edicion"
                value={accionNombreEdicion}
                onChange={(e) => setAccionNombreEdicion(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="descripcion-edicion">Descripción</Label>
              <Input
                id="descripcion-edicion"
                value={accionDescripcionEdicion}
                onChange={(e) => setAccionDescripcionEdicion(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAccionEditando(null)}>
                Cancelar
              </Button>
              <Button type="submit">Guardar Cambios</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL: EDITAR GRUPO */}
      <Dialog open={Boolean(grupoEditando)} onOpenChange={(open) => !open && setGrupoEditando(null)}>
        <DialogContent className="max-w-3xl p-0">
          <form onSubmit={guardarEdicionGrupo} className="flex max-h-[85vh] flex-col">
            <DialogHeader className="border-b px-6 pt-6 pb-4">
              <DialogTitle>Editar Grupo</DialogTitle>
              <DialogDescription>
                Configurá los detalles y acciones asociadas al grupo <strong>{grupoEditando?.nombre}</strong>.
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="grupo-clave-edicion" className="text-sm font-medium">Clave</label>
                    <Input
                      id="grupo-clave-edicion"
                      value={grupoClaveEdicion}
                      onChange={(e) => setGrupoClaveEdicion(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="grupo-nombre-edicion" className="text-sm font-medium">Nombre</label>
                    <Input
                      id="grupo-nombre-edicion"
                      value={grupoNombreEdicion}
                      onChange={(e) => setGrupoNombreEdicion(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="grupo-descripcion-edicion" className="text-sm font-medium">Descripción</label>
                    <Input
                      id="grupo-descripcion-edicion"
                      value={grupoDescripcionEdicion}
                      onChange={(e) => setGrupoDescripcionEdicion(e.target.value)}
                    />
                  </div>
                </div>

                <div className="rounded-md border p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <h4 className="font-medium">Acciones Asociadas</h4>
                    <Badge variant="secondary">{grupoAccionesEdicion.length} seleccionadas</Badge>
                  </div>
                  <div className="h-[200px] space-y-2 overflow-y-auto pr-2">
                    {acciones.map((accion) => (
                      <label
                        key={accion.id}
                        htmlFor={`accion-${accion.id}`}
                        className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 hover:bg-muted"
                      >
                        <Checkbox
                          id={`accion-${accion.id}`}
                          checked={grupoAccionesEdicion.includes(accion.id)}
                          onCheckedChange={(checked) => {
                            setGrupoAccionesEdicion((prev) =>
                              checked
                                ? [...prev, accion.id]
                                : prev.filter((id) => id !== accion.id),
                            );
                          }}
                        />
                        <div className="grid gap-0.5">
                          <span className="text-sm font-medium leading-none">{accion.clave}</span>
                          <span className="text-xs text-muted-foreground">{accion.nombre}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="border-t px-6 py-4">
              <Button type="button" variant="outline" onClick={() => setGrupoEditando(null)}>
                Cancelar
              </Button>
              <Button type="submit">Guardar Cambios</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
