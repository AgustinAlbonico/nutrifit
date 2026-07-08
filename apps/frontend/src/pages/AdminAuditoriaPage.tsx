import { useCallback, useMemo, useRef, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import {
  ArrowDownToLine,
  ArrowLeft,
  Clock,
  FileText,
  Filter,
  Search,
  Shield,
  User,
  X,
} from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import { API_BASE_URL, apiRequest } from '@/lib/api';
import type { ApiResponse } from '@/types/api';
import { usePaginacion } from '@/hooks/usePaginacion';
import { ControlesPaginacion } from '@/components/ui/ControlesPaginacion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { PaginatedData } from '@nutrifit/shared';

interface CambioAuditoria {
  campo: string;
  antes: unknown;
  despues: unknown;
}

interface ValoresAuditoriaConCambios {
  cambios: CambioAuditoria[];
}

interface RegistroAuditoria {
  id: string;
  fecha: string;
  usuarioId: string | null;
  modulo: string;
  entidad: string;
  entidadId: string | null;
  accion: string;
  descripcion: string | null;
  ip: string | null;
  userAgent: string | null;
  valoresAntes: ValoresAuditoriaConCambios | null;
  valoresDespues: ValoresAuditoriaConCambios | null;
  metadataLegacy?: Record<string, unknown> | null;
}

interface FiltrosAuditoria {
  fechaDesde?: string;
  fechaHasta?: string;
  accion?: string;
  modulo?: string;
  entidad?: string;
  entidadId?: string;
  usuarioId?: string;
  gimnasioId?: string;
}

type FormatoExportacion = 'csv' | 'json';

const ACCIONES_COMUNES = [
  'CANCELACION',
  'CHECKIN',
  'REVERT_CHECKIN',
  'AUSENCIA_AUTO',
  'CIERRE_AUTO',
  'REABRIR_CIERRE_AUTO',
  'INICIAR_CONSULTA',
  'FINALIZAR_CONSULTA',
  'RESERVA',
  'BLOQUEO',
  'DESBLOQUEO',
  'CONFIRMAR',
  'REPROGRAMACION',
  'ASIGNAR_MANUAL',
  'MARCAR_AUSENTE_MANUAL',
  'REVERTIR_AUSENTE',
  'LOGIN_SUCCESS',
  'LOGIN_FAILURE',
  'LOGIN_BLOCKED',
  'LOGOUT',
];

const MODULOS_COMUNES = [
  'turnos',
  'auth',
  'planes-alimentacion',
  'fichas-clinicas',
  'socios',
  'nutricionistas',
  'gimnasios',
  'usuarios',
];

const ENTIDADES_COMUNES = [
  'Turno',
  'Usuario',
  'PlanAlimentacion',
  'FichaClinica',
  'Socio',
  'Nutricionista',
  'Gimnasio',
];

const CAMPOS_EXPORTACION: Array<keyof RegistroAuditoria> = [
  'id',
  'fecha',
  'usuarioId',
  'modulo',
  'entidad',
  'entidadId',
  'accion',
  'descripcion',
  'ip',
  'userAgent',
  'valoresAntes',
  'valoresDespues',
  'metadataLegacy',
];

const VALOR_TODOS = '__todos__';

function valorFiltro(valor: string | undefined): string {
  return valor && valor !== VALOR_TODOS ? valor : '';
}

function crearFiltrosIniciales(): FiltrosAuditoria {
  return {
    fechaDesde: '',
    fechaHasta: '',
    accion: '',
    modulo: 'auth',
    entidad: '',
    entidadId: '',
    usuarioId: '',
    gimnasioId: '',
  };
}

function agregarFiltrosAParams(params: URLSearchParams, filtros: FiltrosAuditoria) {
  if (filtros.fechaDesde) params.append('fechaDesde', filtros.fechaDesde);
  if (filtros.fechaHasta) params.append('fechaHasta', filtros.fechaHasta);
  if (filtros.accion) params.append('accion', filtros.accion);
  if (filtros.modulo) params.append('modulo', filtros.modulo);
  if (filtros.entidad) params.append('entidad', filtros.entidad);
  if (filtros.entidadId) params.append('entidadId', filtros.entidadId);
  if (filtros.usuarioId) params.append('usuarioId', filtros.usuarioId);
  if (filtros.gimnasioId) params.append('gimnasioId', filtros.gimnasioId);
}

function formatearValorAuditoria(valor: unknown): string {
  if (valor === null) return 'null';
  if (valor === undefined) return 'sin valor';

  const texto = typeof valor === 'string' ? valor : JSON.stringify(valor);
  if (!texto) return String(valor);

  return texto.length > 60 ? `${texto.slice(0, 57)}...` : texto;
}

function formatearFechaAuditoria(fecha: string): string {
  return new Date(fecha).toLocaleString('es-AR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function escaparCsv(valor: unknown): string {
  const texto = valor === null || valor === undefined
    ? ''
    : typeof valor === 'string'
      ? valor
      : JSON.stringify(valor);

  return `"${texto.replace(/"/g, '""')}"`;
}

function crearCsvAuditoria(registros: RegistroAuditoria[]): string {
  const encabezado = CAMPOS_EXPORTACION.join(',');
  const filas = registros.map((registro) =>
    CAMPOS_EXPORTACION.map((campo) => escaparCsv(registro[campo])).join(','),
  );

  return [encabezado, ...filas].join('\n');
}

function crearBlobCliente(registros: RegistroAuditoria[], formato: FormatoExportacion): Blob {
  if (formato === 'json') {
    return new Blob([JSON.stringify(registros, null, 2)], {
      type: 'application/json;charset=utf-8',
    });
  }

  return new Blob([crearCsvAuditoria(registros)], {
    type: 'text/csv;charset=utf-8',
  });
}

function descargarBlob(blob: Blob, nombreArchivo: string) {
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombreArchivo;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  URL.revokeObjectURL(url);
}

function obtenerGimnasioIdAlmacenado(): string | null {
  const raw = localStorage.getItem('nutrifit.auth');
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as { gimnasioId?: number | string | null };
    return parsed.gimnasioId == null ? null : String(parsed.gimnasioId);
  } catch {
    return null;
  }
}

function RenderDiffAuditoria({ registro }: { registro: RegistroAuditoria }) {
  const cambios = registro.valoresDespues?.cambios;

  if (cambios && cambios.length > 0) {
    return (
      <div className="mt-3 flex flex-col gap-2 rounded-md bg-muted/40 p-3 text-xs">
        {cambios.map((cambio) => (
          <div key={cambio.campo} className="grid gap-1 md:grid-cols-[9rem_1fr]">
            <span className="font-medium text-muted-foreground">{cambio.campo}</span>
            <span className="min-w-0">
              <span className="text-muted-foreground">Anterior </span>
              <code className="rounded bg-background px-1 py-0.5 font-mono text-[11px]">
                {formatearValorAuditoria(cambio.antes)}
              </code>
              <span className="mx-2 text-muted-foreground">→</span>
              <span className="text-muted-foreground">Nuevo </span>
              <code className="rounded bg-background px-1 py-0.5 font-mono text-[11px]">
                {formatearValorAuditoria(cambio.despues)}
              </code>
            </span>
          </div>
        ))}
      </div>
    );
  }

  if (!registro.valoresAntes && registro.valoresDespues) {
    return (
      <Badge variant="secondary" className="mt-3">
        Creado
      </Badge>
    );
  }

  if (registro.valoresAntes && !registro.valoresDespues) {
    return (
      <Badge variant="destructive" className="mt-3">
        Eliminado
      </Badge>
    );
  }

  return null;
}

export function AdminAuditoriaPage() {
  const { token, rol } = useAuth();
  const navigate = useNavigate();

  const [filtros, setFiltros] = useState<FiltrosAuditoria>(crearFiltrosIniciales);
  const filtrosRef = useRef(filtros);
  filtrosRef.current = filtros;

  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [exportando, setExportando] = useState<FormatoExportacion | null>(null);
  const [errorExportacion, setErrorExportacion] = useState<string | null>(null);

  const esAdmin = rol === 'ADMIN' || rol === 'SUPERADMIN';

  const fetcherAuditoria = useCallback(async ({ page, limit }: { page: number; limit: number }) => {
    const params = new URLSearchParams();
    const filtrosActuales = filtrosRef.current;
    agregarFiltrosAParams(params, filtrosActuales);
    params.set('page', String(page));
    params.set('pageSize', String(limit));
    params.set('orden', 'DESC');

    const res = await apiRequest<ApiResponse<PaginatedData<RegistroAuditoria>>>(
      `/admin/auditoria?${params.toString()}`,
      { token },
    );
    return res.data;
  }, [token]);

  const {
    data: registros,
    pagination,
    setPagina,
    setLimite,
    recargar,
    error,
  } = usePaginacion<RegistroAuditoria>(fetcherAuditoria, { defaultLimit: 50 });

  const ejecutarBusqueda = () => {
    if (pagination.page === 1) {
      recargar();
      return;
    }

    setPagina(1);
  };

  const handleFilterChange = (campo: keyof FiltrosAuditoria, valor: string) => {
    setFiltros((prev) => ({ ...prev, [campo]: valorFiltro(valor) }));
  };

  const limpiarFiltros = () => {
    setFiltros(crearFiltrosIniciales());
  };

  const exportarAuditoria = async (formato: FormatoExportacion) => {
    setExportando(formato);
    setErrorExportacion(null);

    try {
      const params = new URLSearchParams();
      agregarFiltrosAParams(params, filtrosRef.current);
      params.set('formato', formato);
      params.set('orden', 'DESC');

      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;
      const gimnasioIdAlmacenado = obtenerGimnasioIdAlmacenado();
      if (gimnasioIdAlmacenado) headers['X-Gimnasio-Id'] = gimnasioIdAlmacenado;

      const response = await fetch(`${API_BASE_URL}/admin/auditoria/export?${params.toString()}`, {
        headers,
      });

      if (response.ok) {
        const blob = await response.blob();
        descargarBlob(blob, `auditoria.${formato}`);
        return;
      }

      if (response.status !== 404) {
        throw new Error('No se pudo exportar desde el servidor.');
      }

      const blob = crearBlobCliente(registros, formato);
      descargarBlob(blob, `auditoria.${formato}`);
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : 'No se pudo exportar la auditoría.';
      setErrorExportacion(mensaje);
    } finally {
      setExportando(null);
    }
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
            <Shield className="mb-4 h-12 w-12 text-destructive" />
            <p className="text-muted-foreground">
              Solo los administradores pueden ver la auditoría del sistema.
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
    <div className="flex flex-col gap-6">
      <div className="relative mb-2 overflow-hidden rounded-2xl border border-blue-500/20 bg-gradient-to-r from-blue-500/10 via-cyan-500/10 to-transparent p-8">
        <div className="absolute right-0 top-0 h-64 w-64 translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500/30 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-48 w-48 -translate-x-1/2 translate-y-1/2 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="relative z-10 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-3">
              <Shield className="h-8 w-8 text-blue-500" />
              <h1 className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-3xl font-bold text-transparent">
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

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
            <div className="flex flex-wrap items-center justify-end gap-2">
              {tieneFiltrosActivos && (
                <Button variant="ghost" size="sm" onClick={limpiarFiltros}>
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
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="fechaDesde">Desde</Label>
                <Input
                  id="fechaDesde"
                  type="date"
                  value={filtros.fechaDesde}
                  onChange={(e) => handleFilterChange('fechaDesde', e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="fechaHasta">Hasta</Label>
                <Input
                  id="fechaHasta"
                  type="date"
                  value={filtros.fechaHasta}
                  onChange={(e) => handleFilterChange('fechaHasta', e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="modulo">Módulo</Label>
                <Select
                  value={filtros.modulo || VALOR_TODOS}
                  onValueChange={(value) => handleFilterChange('modulo', value)}
                >
                  <SelectTrigger id="modulo" className="w-full">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value={VALOR_TODOS}>Todos</SelectItem>
                      {MODULOS_COMUNES.map((modulo) => (
                        <SelectItem key={modulo} value={modulo}>
                          {modulo}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="accion">Acción</Label>
                <Select
                  value={filtros.accion || VALOR_TODOS}
                  onValueChange={(value) => handleFilterChange('accion', value)}
                >
                  <SelectTrigger id="accion" className="w-full">
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value={VALOR_TODOS}>Todas</SelectItem>
                      {ACCIONES_COMUNES.map((accion) => (
                        <SelectItem key={accion} value={accion}>
                          {accion.replace(/_/g, ' ')}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="usuarioId">Usuario</Label>
                <Input
                  id="usuarioId"
                  value={filtros.usuarioId}
                  onChange={(e) => handleFilterChange('usuarioId', e.target.value)}
                  placeholder="ID de usuario"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="gimnasioId">Gimnasio</Label>
                <Input
                  id="gimnasioId"
                  value={filtros.gimnasioId}
                  onChange={(e) => handleFilterChange('gimnasioId', e.target.value)}
                  placeholder="ID de gimnasio"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="entidad">Entidad</Label>
                <Select
                  value={filtros.entidad || VALOR_TODOS}
                  onValueChange={(value) => handleFilterChange('entidad', value)}
                >
                  <SelectTrigger id="entidad" className="w-full">
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value={VALOR_TODOS}>Todas</SelectItem>
                      {ENTIDADES_COMUNES.map((entidad) => (
                        <SelectItem key={entidad} value={entidad}>
                          {entidad}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="entidadId">ID Entidad</Label>
                <Input
                  id="entidadId"
                  value={filtros.entidadId}
                  onChange={(e) => handleFilterChange('entidadId', e.target.value)}
                  placeholder="ID de entidad"
                />
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      <div className="flex flex-wrap justify-end gap-2">
        <Button
          onClick={ejecutarBusqueda}
          disabled={pagination.isLoading}
        >
          {pagination.isLoading ? (
            <>
              <Clock className="h-4 w-4 animate-spin" />
              Cargando…
            </>
          ) : (
            <>
              <Search className="h-4 w-4" />
              Aplicar filtros
            </>
          )}
        </Button>
        <Button
          variant="outline"
          onClick={limpiarFiltros}
          disabled={pagination.isLoading || !tieneFiltrosActivos}
        >
          <X className="h-4 w-4" />
          Limpiar
        </Button>
        <Button
          variant="outline"
          onClick={() => exportarAuditoria('csv')}
          disabled={exportando !== null || registros.length === 0}
        >
          <ArrowDownToLine className="h-4 w-4" />
          {exportando === 'csv' ? 'Exportando…' : 'Exportar CSV'}
        </Button>
        <Button
          variant="outline"
          onClick={() => exportarAuditoria('json')}
          disabled={exportando !== null || registros.length === 0}
        >
          <ArrowDownToLine className="h-4 w-4" />
          {exportando === 'json' ? 'Exportando…' : 'Exportar JSON'}
        </Button>
      </div>

      {error && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="flex items-start gap-2 pt-6 text-sm text-destructive" role="alert">
            <FileText className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{error}</p>
          </CardContent>
        </Card>
      )}

      {errorExportacion && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="flex items-start gap-2 pt-6 text-sm text-destructive" role="alert">
            <FileText className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{errorExportacion}</p>
          </CardContent>
        </Card>
      )}

      {pagination.isLoading && registros.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <div className="flex items-center justify-center">
              <Clock className="h-8 w-8 animate-spin text-muted-foreground" />
              <span className="ml-3 text-muted-foreground">Cargando…</span>
            </div>
          </CardContent>
        </Card>
      )}

      {!pagination.isLoading && registros.length === 0 && !error && (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center text-center">
              <FileText className="mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 font-semibold">Sin resultados</h3>
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
              Registros encontrados: {pagination.total}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              {registros.map((registro) => (
                <article
                  key={registro.id}
                  className="flex items-start gap-4 rounded-lg border p-4 transition-colors hover:bg-muted/50"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <User className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="font-mono text-xs">
                        {registro.accion}
                      </Badge>
                      <Badge variant="secondary" className="font-mono text-xs">
                        {registro.modulo}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {registro.entidad}
                        {registro.entidadId && ` #${registro.entidadId}`}
                      </span>
                    </div>
                    {registro.descripcion && (
                      <p className="mb-2 text-sm text-foreground">{registro.descripcion}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatearFechaAuditoria(registro.fecha)}
                      </span>
                      {registro.usuarioId && (
                        <span>Usuario #{registro.usuarioId}</span>
                      )}
                      {registro.ip && (
                        <span>IP: {registro.ip}</span>
                      )}
                    </div>
                    <RenderDiffAuditoria registro={registro} />
                  </div>
                </article>
              ))}
            </div>

            <div className="mt-4 text-sm text-muted-foreground">
              Página {pagination.page} de {pagination.totalPages}
            </div>
            <ControlesPaginacion
              pagina={pagination.page}
              totalPaginas={pagination.totalPages}
              total={pagination.total}
              limite={pagination.limit}
              cargando={pagination.isLoading}
              onCambiarPagina={setPagina}
              onCambiarLimite={(nuevoLimite) => {
                setLimite(nuevoLimite);
              }}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
