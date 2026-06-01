import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { useParams, useNavigate } from '@tanstack/react-router';
import {
  Shield,
  ArrowLeft,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Users,
  KeyRound,
} from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import { permisosService } from '@/services/permisos.service';
import type { GroupDto, ActionDto } from '@/types/permissions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';

interface GrupoAsignado {
  grupo: GroupDto;
  seleccionado: boolean;
}

export function UsuarioPermisosPage() {
  const { id } = useParams({ from: '/auth/usuarios/$id/permisos' });
  const navigate = useNavigate();
  const { token, rol } = useAuth();

  const usuarioId = parseInt(id as string, 10);

  // Estados
  const [cargandoGrupos, setCargandoGrupos] = useState(false);
  const [cargandoUsuario, setCargandoUsuario] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [gruposAsignados, setGruposAsignados] = useState<GrupoAsignado[]>([]);
  const [, setTodasLasAcciones] = useState<ActionDto[]>([]);

  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);

  // Cargar grupos disponibles y permisos actuales del usuario
  const cargarDatos = useCallback(async () => {
    if (!token || isNaN(usuarioId)) return;

    try {
      setCargandoGrupos(true);
      setError(null);

      // Cargar grupos disponibles
      const grupos = await permisosService.obtenerGrupos();

      // Cargar acciones disponibles
      const acciones = await permisosService.obtenerAcciones();
      setTodasLasAcciones(acciones);

      // Cargar permisos actuales del usuario
      setCargandoUsuario(true);
      const permisosUsuario = await permisosService.obtenerPermisosUsuario(usuarioId);

      // Mapear grupos con su estado de seleccion
      const gruposConEstado = grupos.map((grupo) => ({
        grupo,
        seleccionado: permisosUsuario.grupos.some((g) => g.id === grupo.id),
      }));

      setGruposAsignados(gruposConEstado);
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : 'No se pudieron cargar los datos';
      setError(mensaje);
      toast.error(mensaje);
    } finally {
      setCargandoGrupos(false);
      setCargandoUsuario(false);
    }
  }, [token, usuarioId]);

  useEffect(() => {
    void cargarDatos();
  }, [cargarDatos]);

  // Toggle de seleccion de grupo
  const toggleGrupo = (grupoId: number) => {
    setGruposAsignados((prev) =>
      prev.map((item) =>
        item.grupo.id === grupoId ? { ...item, seleccionado: !item.seleccionado } : item,
      ),
    );
  };

  // Obtener acciones resultantes (union de acciones de grupos seleccionados)
  const accionesResultantes = () => {
    const accionesSet = new Set<string>();

    gruposAsignados
      .filter((item) => item.seleccionado)
      .forEach((item) => {
        item.grupo.acciones.forEach((accion) => {
          accionesSet.add(accion.clave);
        });
      });

    return Array.from(accionesSet).sort();
  };

  // Obtener grupos seleccionados
  const gruposSeleccionados = () => {
    return gruposAsignados.filter((item) => item.seleccionado);
  };

  // Guardar cambios
  const guardarCambios = async () => {
    if (!token) return;

    try {
      setGuardando(true);

      const gruposActual = gruposAsignados.filter((item) => item.seleccionado).map((item) => item.grupo.id);

      // Obtener grupos actualmente asignados al usuario
      const permisosUsuario = await permisosService.obtenerPermisosUsuario(usuarioId);
      const gruposOriginalesIds = permisosUsuario.grupos.map((g) => g.id);

      // Asignar nuevos grupos (los que estan seleccionados pero no estaban antes)
      for (const grupoId of gruposActual) {
        if (!gruposOriginalesIds.includes(grupoId)) {
          await permisosService.asignarGrupo(usuarioId, grupoId);
        }
      }

      // Quitar grupos (los que estaban antes pero ya no estan seleccionados)
      for (const grupoId of gruposOriginalesIds) {
        if (!gruposActual.includes(grupoId)) {
          await permisosService.quitarGrupo(usuarioId, grupoId);
        }
      }

      toast.success('Permisos actualizados correctamente');
      setMostrarConfirmacion(false);
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : 'No se pudieron guardar los cambios';
      toast.error(mensaje);
    } finally {
      setGuardando(false);
    }
  };

  // Verificar acceso (solo ADMIN o SUPERADMIN)
  if (rol !== 'ADMIN' && rol !== 'SUPERADMIN') {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Acceso denegado</AlertTitle>
          <AlertDescription>No tienes permisos para gestionar permisos de usuarios.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl border border-indigo-500/20 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-transparent p-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
        <div className="relative z-10 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => void navigate({ to: '/permisos' })}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Shield className="h-8 w-8 text-indigo-500" />
                <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Gestion de Permisos
                </h1>
              </div>
              <p className="text-muted-foreground">
                Asigna o remueve grupos de permisos para el usuario
              </p>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Columna izquierda: Grupos */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Grupos de Permisos
              </CardTitle>
              <CardDescription>
                Selecciona los grupos que se asignaran al usuario
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {cargandoGrupos ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : gruposAsignados.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No hay grupos de permisos disponibles
                </div>
              ) : (
                <div className="space-y-3">
                  {gruposAsignados.map((item) => (
                    <div
                      key={item.grupo.id}
                      className={`flex items-start gap-4 p-4 rounded-lg border transition-colors ${
                        item.seleccionado
                          ? 'border-indigo-500/50 bg-indigo-500/5'
                          : 'border-border'
                      }`}
                    >
                      <Switch
                        checked={item.seleccionado}
                        onCheckedChange={() => toggleGrupo(item.grupo.id)}
                        className="mt-1"
                      />
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <Label className="text-base font-medium cursor-pointer" onClick={() => toggleGrupo(item.grupo.id)}>
                            {item.grupo.nombre}
                          </Label>
                          <Badge variant="secondary" className="text-xs">
                            {item.grupo.acciones.length} acciones
                          </Badge>
                        </div>
                        {item.grupo.descripcion && (
                          <p className="text-sm text-muted-foreground">
                            {item.grupo.descripcion}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-1 mt-2">
                          {item.grupo.acciones.slice(0, 6).map((accion) => (
                            <Badge key={accion.id} variant="outline" className="text-xs">
                              {accion.clave}
                            </Badge>
                          ))}
                          {item.grupo.acciones.length > 6 && (
                            <Badge variant="outline" className="text-xs">
                              +{item.grupo.acciones.length - 6}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Columna derecha: Preview */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <KeyRound className="h-5 w-5" />
                Acciones Resultantes
              </CardTitle>
              <CardDescription>
                Vista previa de las acciones que tendra el usuario
              </CardDescription>
            </CardHeader>
            <CardContent>
              {cargandoUsuario ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="space-y-4">
                  {gruposSeleccionados().length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Selecciona grupos para ver las acciones resultantes
                    </p>
                  ) : (
                    <>
                      <div className="flex flex-wrap gap-1">
                        {accionesResultantes().map((accion) => (
                          <Badge
                            key={accion}
                            variant="default"
                            className="bg-emerald-600"
                          >
                            {accion}
                          </Badge>
                        ))}
                      </div>
                      <Separator />
                      <div className="text-sm text-muted-foreground">
                        <p>{accionesResultantes().length} acciones en total</p>
                        <p>{gruposSeleccionados().length} grupos seleccionados</p>
                      </div>
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Grupos Seleccionados</CardTitle>
            </CardHeader>
            <CardContent>
              {gruposSeleccionados().length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Ningun grupo seleccionado
                </p>
              ) : (
                <ul className="space-y-2">
                  {gruposSeleccionados().map((item) => (
                    <li key={item.grupo.id} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      {item.grupo.nombre}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Button
            className="w-full"
            onClick={() => setMostrarConfirmacion(true)}
            disabled={guardando}
          >
            {guardando ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Guardar Cambios
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Dialogo de confirmacion */}
      <Dialog open={mostrarConfirmacion} onOpenChange={setMostrarConfirmacion}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar cambios</DialogTitle>
            <DialogDescription>
              Estas seguro de que queres actualizar los permisos de este usuario?
              Se {gruposSeleccionados().length === 0 ? 'removeran todos los grupos' : `asignaran ${gruposSeleccionados().length} grupo(s)`}.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMostrarConfirmacion(false)}>
              Cancelar
            </Button>
            <Button onClick={() => void guardarCambios()}>
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}