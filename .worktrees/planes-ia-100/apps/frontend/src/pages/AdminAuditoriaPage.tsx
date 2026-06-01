import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Filter,
  Search,
  User,
  Clock,
  FileText,
  Shield,
  X,
} from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

interface RegistroAuditoria {
  idAuditoria: number;
  usuarioId: number | null;
  accion: string;
  entidad: string;
  entidadId: number | null;
  timestamp: string;
  ipOrigen: string | null;
  userAgent: string | null;
  metadata: Record<string, unknown> | null;
}

interface FiltrosAuditoria {
  fechaDesde?: string;
  fechaHasta?: string;
  accion?: string;
  entidad?: string;
}

const ACCIONES_COMUNES = [
  'LOGIN',
  'LOGOUT',
  'FICHA_SALUD_UPSERT',
  'TURNO_CHECK_IN',
  'TURNO_INICIAR_CONSULTA',
  'TURNO_FINALIZAR_CONSULTA',
  'MEDICIONES_GUARDAR',
  'OBSERVACIONES_GUARDAR',
  'ADJUNTO_SUBIR',
  'ADJUNTO_ELIMINAR',
];

const ENTIDADES_COMUNES = [
  'Usuario',
  'Turno',
  'FichaSalud',
  'Medicion',
  'ObservacionClinica',
  'AdjuntoClinico',
];

export function AdminAuditoriaPage() {
  const { token, rol } = useAuth();
  const navigate = useNavigate();

  const [registros, setRegistros] = useState<RegistroAuditoria[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [filtros, setFiltros] = useState<FiltrosAuditoria>({
    fechaDesde: '',
    fechaHasta: '',
    accion: '',
    entidad: '',
  });

  const [mostrarFiltros, setMostrarFiltros] = useState(false);

  // Verificar que sea admin
  const esAdmin = rol === 'ADMIN';

  const cargarAuditoria = useCallback(async () => {
    if (!token) return;

    try {
      setCargando(true);
      setError(null);

      const params = new URLSearchParams();
      if (filtros.fechaDesde) params.append('fechaDesde', filtros.fechaDesde);
      if (filtros.fechaHasta) params.append('fechaHasta', filtros.fechaHasta);
      if (filtros.accion) params.append('accion', filtros.accion);
      if (filtros.entidad) params.append('entidad', filtros.entidad);

      const queryString = params.toString();
      const url = `/admin/auditoria${queryString ? `?${queryString}` : ''}`;

      const response = await apiRequest<ApiResponse<RegistroAuditoria[]>>(url, {
        token,
      });

      setRegistros(response.data);
    } catch (requestError) {
      const mensaje =
        requestError instanceof Error
          ? requestError.message
          : 'No se pudo cargar el historial de auditoría.';
      setError(mensaje);
      toast.error(mensaje);
    } finally {
      setCargando(false);
    }
  }, [token, filtros]);

  const handleFilterChange = (campo: keyof FiltrosAuditoria, valor: string) => {
    setFiltros((prev) => ({ ...prev, [campo]: valor }));
  };

  const limpiarFiltros = () => {
    setFiltros({
      fechaDesde: '',
      fechaHasta: '',
      accion: '',
      entidad: '',
    });
  };

  const tieneFiltrosActivos = useMemo(() => {
    return Object.values(filtros).some((v) => v !== '');
  }, [filtros]);

  if (!esAdmin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Acceso denegado</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Shield className="h-12 w-12 text-destructive mb-4" />
            <p className="text-muted-foreground">
              Solo los administradores pueden acceder a esta sección.
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => navigate({ to: '/dashboard' })}
            >
              <ArrowLeft className="h-4 w-4" />
              Volver al dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl border border-blue-500/20 bg-gradient-to-r from-blue-500/10 via-cyan-500/10 to-transparent p-8 mb-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-500/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
        <div className="relative z-10 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Shield className="h-8 w-8 text-blue-500" />
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                Auditoría del Sistema
              </h1>
            </div>
            <p className="text-muted-foreground">
              Registro de acciones realizadas en el sistema
            </p>
          </div>

          <Button
              variant="outline"
              onClick={() => navigate({ to: '/dashboard' })}
            >
              <ArrowLeft className="h-4 w-4" />
              Volver al dashboard
            </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
            <div className="flex items-center gap-2">
              {tieneFiltrosActivos && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={limpiarFiltros}
                >
                  <X className="h-4 w-4" />
                  Limpiar
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMostrarFiltros(!mostrarFiltros)}
              >
                <Search className="h-4 w-4" />
                {mostrarFiltros ? 'Ocultar' : 'Mostrar'} filtros
              </Button>
            </div>
          </div>
        </CardHeader>
        {mostrarFiltros && (
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="fechaDesde">Fecha desde</Label>
                <Input
                  id="fechaDesde"
                  type="date"
                  value={filtros.fechaDesde}
                  onChange={(e) => handleFilterChange('fechaDesde', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fechaHasta">Fecha hasta</Label>
                <Input
                  id="fechaHasta"
                  type="date"
                  value={filtros.fechaHasta}
                  onChange={(e) => handleFilterChange('fechaHasta', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="accion">Acción</Label>
                <select
                  id="accion"
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                  value={filtros.accion}
                  onChange={(e) => handleFilterChange('accion', e.target.value)}
                >
                  <option value="">Todas</option>
                  {ACCIONES_COMUNES.map((acc) => (
                    <option key={acc} value={acc}>
                      {acc.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="entidad">Entidad</Label>
                <select
                  id="entidad"
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                  value={filtros.entidad}
                  onChange={(e) => handleFilterChange('entidad', e.target.value)}
                >
                  <option value="">Todas</option>
                  {ENTIDADES_COMUNES.map((ent) => (
                    <option key={ent} value={ent}>
                      {ent}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Botón de búsqueda */}
      <div className="flex justify-end">
        <Button
          onClick={() => void cargarAuditoria()}
          disabled={cargando}
        >
          {cargando ? (
            <>
              <Clock className="h-4 w-4 animate-spin" />
              Buscando...
            </>
          ) : (
            <>
              <Search className="h-4 w-4" />
              Buscar registros
            </>
          )}
        </Button>
      </div>

      {/* Lista de registros */}
      {error && (
        <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          <FileText className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {registros.length === 0 && !cargando && (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center text-center">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">Sin registros</h3>
              <p className="text-sm text-muted-foreground">
                No se encontraron registros de auditoría con los filtros seleccionados.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {registros.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Registros encontrados: {registros.length}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {registros.map((registro) => (
                <div
                  key={registro.idAuditoria}
                  className="flex items-start gap-4 rounded-lg border p-4 hover:bg-muted/50"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted shrink-0">
                    <User className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="font-mono text-xs">
                        {registro.accion}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {registro.entidad}
                        {registro.entidadId && ` #${registro.entidadId}`}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(registro.timestamp).toLocaleString('es-AR', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </span>
                      {registro.usuarioId && (
                        <span>Usuario #{registro.usuarioId}</span>
                      )}
                      {registro.ipOrigen && (
                        <span>IP: {registro.ipOrigen}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}