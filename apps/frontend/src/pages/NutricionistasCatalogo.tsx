import { useEffect, useState, useMemo, useCallback } from 'react';
import { Link } from '@tanstack/react-router';
import {
  Calendar,
  Search,
  UserCircle,
  Users,
  ArrowLeft,
  MapPin,
  Award,
  Sparkles,
  Filter,
  ChevronLeft,
  ChevronRight,
  Clock,
} from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import { apiRequest, obtenerUrlFoto } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from '@/components/ui/avatar';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error: string | null;
  meta: {
    timestamp: string;
    pagination?: {
      total: number;
      page: number;
      per_page: number;
      total_pages: number;
    };
  } | null;
}

interface NutricionistaCard {
  idPersona: number;
  nombre: string;
  apellido: string;
  especialidad: string;
  matricula: string;
  ciudad: string;
  provincia: string;
  aniosExperiencia: number;
  tarifaSesion: number;
  fotoUrl: string | null;
  presentacion: string | null;
  duracionTurnoMin: number;
  agendaConfigurada: boolean;
  slotsProximos7Dias: number;
}

interface CatalogoResponse {
  items: NutricionistaCard[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

type SortCatalogo = 'nombre' | 'disponible' | 'recientes';

function obtenerIniciales(nombre: string, apellido: string): string {
  const inicialN = nombre.trim().charAt(0).toUpperCase();
  const inicialA = apellido.trim().charAt(0).toUpperCase();
  return `${inicialN}${inicialA}`;
}

function formatearTarifa(tarifa: number): { texto: string; esGratis: boolean } {
  if (tarifa <= 0) {
    return { texto: 'A convenir', esGratis: true };
  }
  return {
    texto: `$${tarifa.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    esGratis: false,
  };
}

export function NutricionistasCatalogo() {
  const { token, rol } = useAuth();

  const [catalogo, setCatalogo] = useState<CatalogoResponse | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [nombre, setNombre] = useState('');
  const [disponible, setDisponible] = useState(false);
  const [sort, setSort] = useState<SortCatalogo>('nombre');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(12);

  const cargarCatalogo = useCallback(async () => {
    if (!token) return;

    try {
      setCargando(true);
      setError(null);

      const params = new URLSearchParams();
      if (nombre.trim()) params.set('nombre', nombre.trim());
      if (disponible) params.set('disponible', 'true');
      params.set('sort', sort);
      params.set('page', String(page));
      params.set('limit', String(limit));

      const qs = params.toString();
      const response = await apiRequest<ApiResponse<NutricionistaCard[]>>(
        `/profesional/publico/disponibles${qs ? `?${qs}` : ''}`,
        { token },
      );

      const pag = response.meta?.pagination;
      setCatalogo({
        items: response.data,
        total: pag?.total ?? 0,
        page: pag?.page ?? 1,
        limit: pag?.per_page ?? 0,
        totalPages: pag?.total_pages ?? 0,
      });
    } catch (err) {
      const mensaje =
        err instanceof Error
          ? err.message
          : 'No se pudo cargar el catálogo de nutricionistas.';
      setError(mensaje);
    } finally {
      setCargando(false);
    }
  }, [token, nombre, disponible, sort, page, limit]);

  useEffect(() => {
    void cargarCatalogo();
  }, [cargarCatalogo]);

  // Reset a página 1 cuando cambian filtros
  useEffect(() => {
    setPage(1);
  }, [nombre, disponible, sort, limit]);

  const filtrosAplicados = useMemo(
    () => ({
      nombre: nombre.trim(),
      disponible,
      sort,
    }),
    [nombre, disponible, sort],
  );

  const limpiarFiltros = () => {
    setNombre('');
    setDisponible(false);
    setSort('nombre');
    setPage(1);
    setLimit(12);
  };

  if (rol !== 'SOCIO') {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">
          Esta pantalla solo está disponible para socios.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      {/* Header con gradiente */}
      <div className="relative overflow-hidden rounded-2xl border border-orange-500/20 bg-gradient-to-r from-orange-500/10 via-rose-500/10 to-transparent p-8 shadow-sm">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-orange-500/10 blur-3xl" />
        <div className="absolute -bottom-10 right-20 h-32 w-32 rounded-full bg-rose-500/10 blur-3xl" />
        <div className="relative z-10 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="flex items-center gap-3 bg-gradient-to-r from-orange-600 to-rose-600 bg-clip-text text-3xl font-bold tracking-tight text-transparent">
              <Users className="h-8 w-8 text-orange-500" />
              Catálogo de Nutricionistas
            </h1>
            <p className="mt-2 max-w-2xl text-base text-muted-foreground">
              Elegí tu nutricionista según disponibilidad, ciudad y tarifa.
            </p>
            {catalogo && (
              <p className="mt-2 text-sm font-medium text-foreground">
                Mostrando {catalogo.items.length} de {catalogo.total} profesionales
              </p>
            )}
          </div>
          <Button asChild variant="outline">
            <Link to="/turnos">
              <ArrowLeft className="h-4 w-4" />
              Volver a mis turnos
            </Link>
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="grid gap-3 pt-6 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Buscar por nombre</p>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Ej: María Pérez"
                value={nombre}
                onChange={(event) => setNombre(event.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Ordenar por</p>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={sort}
              onChange={(event) => setSort(event.target.value as SortCatalogo)}
            >
              <option value="nombre">Nombre (A-Z)</option>
              <option value="disponible">Más disponibilidad</option>
              <option value="recientes">Recientes</option>
            </select>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Por página</p>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={limit}
              onChange={(event) => setLimit(Number(event.target.value))}
            >
              <option value={6}>6</option>
              <option value={12}>12</option>
              <option value={24}>24</option>
            </select>
          </div>

          <div className="flex items-end gap-2">
            <div className="flex flex-1 items-center gap-2 rounded-md border border-input bg-background px-3 py-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="flex-1 text-sm">Con disponibilidad próxima</span>
              <Switch
                checked={disponible}
                onCheckedChange={setDisponible}
                aria-label="Filtrar por disponibilidad próxima"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="py-6 text-center text-destructive">
            {error}
          </CardContent>
        </Card>
      )}

      {/* Grid de cards */}
      {cargando ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div
              key={`skeleton-${idx}`}
              className="h-56 animate-pulse rounded-lg border bg-muted/30"
            />
          ))}
        </div>
      ) : !catalogo || catalogo.items.length === 0 ? (
        <EmptyState
          filtrosAplicados={filtrosAplicados}
          limpiarFiltros={limpiarFiltros}
        />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {catalogo.items.map((nutri) => (
              <NutricionistaCardItem key={nutri.idPersona} nutri={nutri} />
            ))}
          </div>

          {/* Paginación */}
          {catalogo.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </Button>
              <span className="text-sm text-muted-foreground">
                Página {page} de {catalogo.totalPages}
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPage((p) => Math.min(catalogo.totalPages, p + 1))}
                disabled={page === catalogo.totalPages}
              >
                Siguiente
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function NutricionistaCardItem({ nutri }: { nutri: NutricionistaCard }) {
  const tarifa = formatearTarifa(nutri.tarifaSesion);

  return (
    <Card className="flex flex-col transition-shadow hover:shadow-lg">
      <CardContent className="flex flex-1 flex-col gap-3 pt-6">
        <div className="flex items-start gap-3">
          <Avatar className="size-20 ring-1 ring-border/60">
            {nutri.fotoUrl && (
              <AvatarImage
                src={obtenerUrlFoto(nutri.fotoUrl) ?? undefined}
                alt={`${nutri.nombre} ${nutri.apellido}`}
                className="object-cover object-center"
              />
            )}
            <AvatarFallback className="bg-primary/10 text-base font-medium text-primary">
              {obtenerIniciales(nutri.nombre, nutri.apellido)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="truncate text-base font-semibold">
              {nutri.nombre} {nutri.apellido}
            </h3>
            <p className="text-xs text-muted-foreground">{nutri.especialidad}</p>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Award className="h-3 w-3" />
                {nutri.matricula}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {nutri.ciudad}, {nutri.provincia}
              </span>
            </div>
          </div>
        </div>

        {nutri.presentacion && (
          <p className="line-clamp-3 text-sm text-muted-foreground">
            {nutri.presentacion}
          </p>
        )}

        <div className="mt-auto flex flex-wrap items-center gap-2 pt-2">
          <Badge variant="secondary" className="gap-1">
            <Award className="h-3 w-3" />
            {nutri.aniosExperiencia} años
          </Badge>
          {nutri.agendaConfigurada && nutri.slotsProximos7Dias > 0 && (
            <Badge
              variant="default"
              className="gap-1 bg-emerald-600 hover:bg-emerald-700"
            >
              <Sparkles className="h-3 w-3" />
              {nutri.slotsProximos7Dias} slots esta semana
            </Badge>
          )}
          <Badge variant="outline" className="gap-1">
            <Clock className="h-3 w-3" />
            {nutri.duracionTurnoMin} min
          </Badge>
          <Badge
            variant={tarifa.esGratis ? 'outline' : 'secondary'}
            className={tarifa.esGratis ? 'text-muted-foreground' : ''}
          >
            {tarifa.texto}
          </Badge>
        </div>

        <div className="flex gap-2 pt-2">
          <Button asChild variant="outline" size="sm" className="flex-1">
            <Link
              to="/nutricionistas/$id/perfil"
              params={{ id: String(nutri.idPersona) }}
            >
              <UserCircle className="h-4 w-4" />
              Ver perfil
            </Link>
          </Button>
          {nutri.agendaConfigurada ? (
            <Button asChild size="sm" className="flex-1">
              <Link
                to="/turnos/agendar"
                search={{ nutricionistaId: nutri.idPersona }}
              >
                <Calendar className="h-4 w-4" />
                Reservar
              </Link>
            </Button>
          ) : (
            <Button size="sm" className="flex-1" disabled>
              <Calendar className="h-4 w-4" />
              Sin agenda
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState({
  filtrosAplicados,
  limpiarFiltros,
}: {
  filtrosAplicados: { nombre: string; disponible: boolean; sort: SortCatalogo };
  limpiarFiltros: () => void;
}) {
  const hayFiltros =
    filtrosAplicados.nombre !== '' ||
    filtrosAplicados.disponible ||
    filtrosAplicados.sort !== 'nombre';

  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
        <UserCircle className="h-12 w-12 text-muted-foreground" />
        {hayFiltros ? (
          <>
            <p className="font-medium">Filtros sin resultados</p>
            <p className="max-w-md text-sm text-muted-foreground">
              No hay profesionales que coincidan con tu búsqueda. Probá quitar
              algunos filtros.
            </p>
            <Button variant="outline" onClick={limpiarFiltros}>
              Limpiar filtros
            </Button>
          </>
        ) : (
          <>
            <p className="font-medium">No hay nutricionistas</p>
            <p className="max-w-md text-sm text-muted-foreground">
              Tu gimnasio todavía no tiene profesionales publicados.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
