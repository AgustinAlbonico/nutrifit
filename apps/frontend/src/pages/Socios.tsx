import { useState, useEffect, useCallback, useMemo, type FormEvent } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { AlertCircle, Search, Users, XIcon } from 'lucide-react';
import { format as formatearFechaIso } from 'date-fns';

import { useAuth } from '@/contexts/AuthContext';
import { Can } from '@/components/auth/Can';
import { ACCIONES } from '@nutrifit/shared';
import { apiRequest, obtenerUrlFoto } from '@/lib/api';
import { ModalContrasenaProvisional } from '@/components/ui/ModalContrasenaProvisional';
import {
  formatearFechaArgentinaCorta,
  formatearFechaArgentinaParaInput,
} from '@/lib/fechasArgentina';
import { REGEX_DNI, REGEX_TELEFONO, REGEX_EMAIL } from '@/lib/validaciones';
import type { Socio, CrearSocioDto, CrearSocioResponseDto, DesactivarSocioResultDto, Genero } from '@/types/socio';
import { Button } from '@/components/ui/button';
import { ControlesPaginacion } from '@/components/ui/ControlesPaginacion';
import type { PaginatedData } from '@nutrifit/shared';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from '@/components/ui/avatar';
import { SelectorImagen } from '@/components/imagen/SelectorImagen';
import type { ApiResponse } from '@/types/api';

type CampoFormularioCreacion = keyof CrearSocioDto;
type CampoFormularioEdicion = keyof CrearSocioDto;
type ErroresFormularioCreacion = Partial<Record<CampoFormularioCreacion, string>>;
type ErroresFormularioEdicion = Partial<Record<CampoFormularioEdicion, string>>;


const FORMULARIO_SOCIO_INICIAL: CrearSocioDto = {
  nombre: '',
  apellido: '',
  dni: '',
  fechaNacimiento: '',
  telefono: '',
  genero: 'MASCULINO',
  direccion: '',
  ciudad: '',
  provincia: '',
  email: '',
  observaciones: '',
  estado: 'ACTIVO',
};



const parsearFechaInput = (fecha: string): Date | undefined => {
  if (!fecha) {
    return undefined;
  }

  const fechaParseada = new Date(`${fecha}T00:00:00`);
  return Number.isNaN(fechaParseada.getTime()) ? undefined : fechaParseada;
};

const formatearFechaParaInput = (fecha: Date | undefined): string => {
  if (!fecha) {
    return '';
  }

  return formatearFechaIso(fecha, 'yyyy-MM-dd');
};

const obtenerIniciales = (nombre: string, apellido: string): string => {
  const inicialNombre = nombre.trim().charAt(0).toUpperCase();
  const inicialApellido = apellido.trim().charAt(0).toUpperCase();
  return `${inicialNombre}${inicialApellido}`;
};

export function Socios() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  const [busqueda, setBusqueda] = useState('');
  const [busquedaAplicada, setBusquedaAplicada] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<'TODOS' | 'ACTIVO' | 'INACTIVO'>('TODOS');
  const [filtroProvincia, setFiltroProvincia] = useState('TODAS');
  const [filtroCiudad, setFiltroCiudad] = useState('TODAS');
  const [campoOrden, setCampoOrden] = useState<'NOMBRE' | 'ESTADO'>('NOMBRE');
  const [direccionOrden, setDireccionOrden] = useState<'ASC' | 'DESC'>('ASC');
  const [limitePorPagina, setLimitePorPagina] = useState(9);
  const [paginaActual, setPaginaActual] = useState(1);

  const [mostrarFormularioSocio, setMostrarFormularioSocio] = useState(false);
  const [mostrarFormularioEdicion, setMostrarFormularioEdicion] = useState(false);
  const [idSocioEditando, setIdSocioEditando] = useState<number | null>(null);
  
  const [socioForm, setSocioForm] = useState<CrearSocioDto>(FORMULARIO_SOCIO_INICIAL);
  const [erroresCreacion, setErroresCreacion] = useState<ErroresFormularioCreacion>({});
  const [errorGeneralCreacion, setErrorGeneralCreacion] = useState<string | null>(null);
  const [enviandoCreacion, setEnviandoCreacion] = useState(false);

  const [socioFormEdicion, setSocioFormEdicion] = useState<CrearSocioDto>(FORMULARIO_SOCIO_INICIAL);
  const [erroresEdicion, setErroresEdicion] = useState<ErroresFormularioEdicion>({});

  const [mostrarConfirmacionEliminar, setMostrarConfirmacionEliminar] = useState(false);
  const [socioAEliminar, setSocioAEliminar] = useState<Socio | null>(null);

  type EstadoFoto = string | File | null;
  const [fotoCreacion, setFotoCreacion] = useState<EstadoFoto>(null);
  const [fotoEdicion, setFotoEdicion] = useState<EstadoFoto>(null);
  

  const [mostrarModalDetalles, setMostrarModalDetalles] = useState(false);
  const [mostrarModalContrasenaProvisional, setMostrarModalContrasenaProvisional] = useState(false);
  const [contrasenaProvisional, setContrasenaProvisional] = useState<string | null>(null);
  const [mostrarFotoAmpliada, setMostrarFotoAmpliada] = useState(false);
  const [socioSeleccionado, setSocioSeleccionado] = useState<Socio | null>(null);

  const [motivoDesactivacion, setMotivoDesactivacion] = useState('');
  const [desactivando, setDesactivando] = useState(false);
  const [resultadoDesactivacion, setResultadoDesactivacion] = useState<DesactivarSocioResultDto | null>(null);

  const recargarSocios = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ['socios-filtros'] });
    void queryClient.invalidateQueries({ queryKey: ['socios-pagina'] });
  }, [queryClient]);

  const { data: todosLosSocios = [] } = useQuery<Socio[]>({
    queryKey: ['socios-filtros', token],
    queryFn: async () => {
      if (!token) return [];
      const response = await apiRequest<ApiResponse<PaginatedData<Socio>>>(
        '/socio?page=1&limit=100',
        { token },
      );
      return response.data?.data ?? [];
    },
    enabled: !!token,
    staleTime: 60_000,
  });

  const paramsPagina = useMemo(() => {
    const params = new URLSearchParams();
    params.set('page', String(paginaActual));
    params.set('limit', String(limitePorPagina));
    if (busquedaAplicada) params.set('search', busquedaAplicada);
    if (filtroEstado !== 'TODOS') params.set('estado', filtroEstado);
    if (filtroProvincia !== 'TODAS') params.set('provincia', filtroProvincia);
    if (filtroCiudad !== 'TODAS') params.set('ciudad', filtroCiudad);
    params.set('ordenCampo', campoOrden);
    params.set('ordenDireccion', direccionOrden);
    return params.toString();
  }, [paginaActual, limitePorPagina, busquedaAplicada, filtroEstado, filtroProvincia, filtroCiudad, campoOrden, direccionOrden]);

  const { data: resultadoPagina, isLoading: cargandoSocios, error: queryError } = useQuery<PaginatedData<Socio> | null>({
    queryKey: ['socios-pagina', token, paramsPagina],
    queryFn: async () => {
      if (!token) return null;
      const response = await apiRequest<ApiResponse<PaginatedData<Socio>>>(
        `/socio?${paramsPagina}`,
        { token },
      );
      return response.data ?? null;
    },
    enabled: !!token,
  });

  const socios = resultadoPagina?.data ?? [];
  const totalServidor = resultadoPagina?.pagination?.total ?? 0;
  const errorSocios = queryError instanceof Error ? queryError.message : null;

  const abrirModalDetalles = (socio: Socio) => {
    setSocioSeleccionado(socio);
    setMostrarModalDetalles(true);
  };

  const provinciasDisponibles = useMemo(() => {
    return Array.from(
      new Set(todosLosSocios.map((s) => s.provincia.trim())),
    )
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));
  }, [todosLosSocios]);

  const ciudadesDisponibles = useMemo(() => {
    const sociosPorProvincia =
      filtroProvincia === 'TODAS'
        ? todosLosSocios
        : todosLosSocios.filter((s) => s.provincia === filtroProvincia);

    return Array.from(
      new Set(sociosPorProvincia.map((s) => s.ciudad.trim())),
    )
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));
  }, [todosLosSocios, filtroProvincia]);

  const totalPaginas = Math.max(1, resultadoPagina?.pagination?.totalPages ?? 1);

  const limpiarFiltros = () => {
    setBusqueda('');
    setBusquedaAplicada('');
    setFiltroEstado('TODOS');
    setFiltroProvincia('TODAS');
    setFiltroCiudad('TODAS');
    setCampoOrden('NOMBRE');
    setDireccionOrden('ASC');
    setLimitePorPagina(9);
    setPaginaActual(1);
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      setBusquedaAplicada(busqueda);
    }, 350);

    return () => clearTimeout(timeout);
  }, [busqueda]);

  useEffect(() => {
    setPaginaActual(1);
  }, [
    busquedaAplicada,
    campoOrden,
    direccionOrden,
    filtroCiudad,
    filtroEstado,
    filtroProvincia,
    limitePorPagina,
  ]);

  useEffect(() => {
    if (paginaActual > totalPaginas) {
      setPaginaActual(totalPaginas);
    }
  }, [paginaActual, totalPaginas]);

  useEffect(() => {
    if (filtroCiudad !== 'TODAS' && !ciudadesDisponibles.includes(filtroCiudad)) {
      setFiltroCiudad('TODAS');
    }
  }, [ciudadesDisponibles, filtroCiudad]);

  const validarFormularioCreacion = useCallback(
    (datos: CrearSocioDto): ErroresFormularioCreacion => {
      const errores: ErroresFormularioCreacion = {};

      if (!datos.nombre.trim()) errores.nombre = 'Ingresá el nombre.';
      if (!datos.apellido.trim()) errores.apellido = 'Ingresá el apellido.';
      if (!REGEX_DNI.test(datos.dni.trim())) errores.dni = 'El DNI debe tener exactamente 8 dígitos.';
      if (!datos.fechaNacimiento) errores.fechaNacimiento = 'Seleccioná la fecha de nacimiento.';
      if (!REGEX_TELEFONO.test(datos.telefono.trim())) errores.telefono = 'Ingresá un teléfono válido (8 a 20 caracteres).';
      if (!datos.direccion.trim()) errores.direccion = 'Ingresá la dirección.';
      if (!datos.ciudad.trim()) errores.ciudad = 'Ingresá la ciudad.';
      if (!datos.provincia.trim()) errores.provincia = 'Ingresá la provincia.';
      if (!REGEX_EMAIL.test(datos.email.trim())) errores.email = 'Ingresá un email válido.';

      return errores;
    },
    [],
  );

  const actualizarCampoCreacion = useCallback(
    <K extends CampoFormularioCreacion>(campo: K, valor: CrearSocioDto[K]) => {
      const nuevoForm = { ...socioForm, [campo]: valor };
      setSocioForm(nuevoForm);
      setErrorGeneralCreacion(null);

      const erroresCompletos = validarFormularioCreacion(nuevoForm);
      setErroresCreacion((prev) => {
        const resultado: ErroresFormularioCreacion = {};
        for (const key of Object.keys(prev) as CampoFormularioCreacion[]) {
          if (erroresCompletos[key]) resultado[key] = erroresCompletos[key];
        }
        if (erroresCompletos[campo]) resultado[campo] = erroresCompletos[campo];
        return resultado;
      });
    },
    [socioForm, validarFormularioCreacion],
  );

  const validarFormularioEdicion = useCallback((): ErroresFormularioEdicion => {
    const errores: ErroresFormularioEdicion = {};

    if (!socioFormEdicion.nombre.trim()) errores.nombre = 'Ingresá el nombre.';
    if (!socioFormEdicion.apellido.trim()) errores.apellido = 'Ingresá el apellido.';
    if (!REGEX_DNI.test(socioFormEdicion.dni.trim())) errores.dni = 'El DNI debe tener exactamente 8 dígitos.';
    if (!socioFormEdicion.fechaNacimiento) errores.fechaNacimiento = 'Seleccioná la fecha de nacimiento.';
    if (!REGEX_TELEFONO.test(socioFormEdicion.telefono.trim())) errores.telefono = 'Ingresá un teléfono válido (8 a 20 caracteres).';
    if (!socioFormEdicion.direccion.trim()) errores.direccion = 'Ingresá la dirección.';
    if (!socioFormEdicion.ciudad.trim()) errores.ciudad = 'Ingresá la ciudad.';
    if (!socioFormEdicion.provincia.trim()) errores.provincia = 'Ingresá la provincia.';
    if (!REGEX_EMAIL.test(socioFormEdicion.email.trim())) errores.email = 'Ingresá un email válido.';

    return errores;
  }, [socioFormEdicion]);

  const limpiarEstadoCreacion = useCallback(() => {
    setSocioForm(FORMULARIO_SOCIO_INICIAL);
    setErroresCreacion({});
    setErrorGeneralCreacion(null);
    setFotoCreacion(null);
    setEnviandoCreacion(false);
  }, []);

  const crearSocio = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token || enviandoCreacion) return;

    const errores = validarFormularioCreacion(socioForm);

    if (Object.keys(errores).length > 0) {
      setErroresCreacion(errores);
      setErrorGeneralCreacion('Revisá los campos marcados antes de continuar.');
      return;
    }

    setEnviandoCreacion(true);

    try {
      const body = { ...socioForm };
      if (!body.observaciones) delete body.observaciones;
      if (body.estado === 'ACTIVO') delete body.estado;

      let responseData: ApiResponse<CrearSocioResponseDto>;
      if (fotoCreacion instanceof File) {
        const formData = new FormData();
        formData.append('foto', fotoCreacion);
        Object.entries(body).forEach(([key, value]) => {
          if (value !== undefined) formData.append(key, String(value));
        });
        
        responseData = await apiRequest<ApiResponse<CrearSocioResponseDto>>('/socio', {
          method: 'POST',
          token,
          formData,
        });
      } else {
        responseData = await apiRequest<ApiResponse<CrearSocioResponseDto>>('/socio', {
          method: 'POST',
          token,
          body,
        });
      }
      
      const resultado = responseData.data;
      setMostrarFormularioSocio(false);
      limpiarEstadoCreacion();
      recargarSocios();
      setContrasenaProvisional(resultado.contrasenaProvisional);
      setMostrarModalContrasenaProvisional(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'No se pudo crear el socio';
      setErrorGeneralCreacion(errorMessage);
      toast.error(errorMessage);
    } finally {
      setEnviandoCreacion(false);
    }
  };

  const abrirModalEdicion = (socio: Socio) => {
    setIdSocioEditando(socio.idPersona);
    setSocioFormEdicion({
      nombre: socio.nombre,
      apellido: socio.apellido,
      dni: socio.dni,
      fechaNacimiento: socio.fechaNacimiento
        ? formatearFechaArgentinaParaInput(socio.fechaNacimiento)
        : '',
      telefono: socio.telefono,
      genero: socio.genero,
      direccion: socio.direccion,
      ciudad: socio.ciudad,
      provincia: socio.provincia,
      email: socio.email,
      observaciones: socio.observaciones ?? '',
      estado: socio.activo ? 'ACTIVO' : 'INACTIVO',
    });
    setErroresEdicion({});
    setFotoEdicion(socio.fotoPerfilUrl ?? null);
    setMostrarFormularioEdicion(true);
  };

  const editarSocio = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token || idSocioEditando === null) return;

    const errores = validarFormularioEdicion();
    if (Object.keys(errores).length > 0) {
      setErroresEdicion(errores);
      toast.error('Por favor, corregí los errores del formulario');
      return;
    }

    try {
      const payload = { ...socioFormEdicion };
      if (!payload.observaciones) delete payload.observaciones;
      delete payload.estado;

      // Usar FormData si hay foto nueva o eliminación, sino JSON normal
      const esFile = fotoEdicion instanceof File;
      const esNull = fotoEdicion === null;
      const socioSiendoEditado = socios.find(
        (s) => s.idPersona === idSocioEditando,
      );
      const socioTeniaFoto = socioSiendoEditado?.fotoPerfilUrl;

      if (esFile || (esNull && socioTeniaFoto)) {
        const formData = new FormData();
        if (esFile) {
          formData.append('foto', fotoEdicion);
        }
        if (esNull && socioTeniaFoto) {
          formData.append('eliminarFoto', 'true');
        }
        Object.entries(payload).forEach(([key, value]) => {
          if (value !== undefined) {
            formData.append(key, String(value));
          }
        });
        
        await apiRequest(`/socio/${idSocioEditando}`, {
          method: 'PUT',
          token,
          formData,
        });
      } else {
        await apiRequest(`/socio/${idSocioEditando}`, {
          method: 'PUT',
          token,
          body: payload,
        });
      }

      toast.success('Socio actualizado exitosamente');
      setMostrarFormularioEdicion(false);
      setIdSocioEditando(null);
      setErroresEdicion({});
      setFotoEdicion(null);
      recargarSocios();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'No se pudo editar el socio';
      toast.error(errorMessage);
    }
  };

  const confirmarEliminar = (socio: Socio) => {
    setSocioAEliminar(socio);
    setMotivoDesactivacion('');
    setResultadoDesactivacion(null);
    setMostrarConfirmacionEliminar(true);
  };

  const desactivarSocio = async () => {
    if (!token || !socioAEliminar) return;

    setDesactivando(true);
    try {
      const response = await apiRequest<ApiResponse<DesactivarSocioResultDto>>(`/socio/${socioAEliminar.idPersona}/desactivar`, {
        method: 'POST',
        token,
        body: { motivo: motivoDesactivacion.trim() },
      });

      setResultadoDesactivacion(response.data);
      recargarSocios();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'No se pudo dar de baja el socio';
      toast.error(errorMessage);
      setMostrarConfirmacionEliminar(false);
      setSocioAEliminar(null);
    } finally {
      setDesactivando(false);
    }
  };

  const reactivarSocio = async (socio: Socio) => {
    if (!token) return;

    try {
      await apiRequest(`/socio/${socio.idPersona}/reactivar`, {
        method: 'POST',
        token,
      });

      toast.success('Socio reactivado exitosamente');
      recargarSocios();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'No se pudo reactivar el socio';
      toast.error(errorMessage);
    }
  };

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl border border-orange-500/20 bg-gradient-to-r from-orange-500/10 via-rose-500/10 to-transparent p-8 mb-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-rose-500/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
        <div className="relative z-10 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Users className="h-8 w-8 text-orange-500" />
              <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-rose-600 bg-clip-text text-transparent">
                Gestión de Socios
              </h1>
            </div>
            <p className="text-muted-foreground">
              Administración profesional de altas, bajas y seguimiento de socios.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => recargarSocios()}
              type="button"
              disabled={cargandoSocios}
            >
              Refrescar
            </Button>
            <Button
              onClick={() => setMostrarFormularioSocio(true)}
              type="button"
            >
              Nuevo socio
            </Button>
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr_1fr]">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Buscar</p>
              <Input
                placeholder="Nombre, apellido, email, DNI o ubicación"
                value={busqueda}
                onChange={(event) => setBusqueda(event.target.value)}
              />
            </div>

            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Estado</p>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={filtroEstado}
                onChange={(event) => setFiltroEstado(event.target.value as 'TODOS' | 'ACTIVO' | 'INACTIVO')}
              >
                <option value="TODOS">Todos</option>
                <option value="ACTIVO">Activos</option>
                <option value="INACTIVO">Inactivos</option>
              </select>
            </div>

            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Provincia</p>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={filtroProvincia}
                onChange={(event) => setFiltroProvincia(event.target.value)}
              >
                <option value="TODAS">Todas</option>
                {provinciasDisponibles.map((provincia) => (
                  <option key={provincia} value={provincia}>
                    {provincia}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Ciudad</p>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={filtroCiudad}
                onChange={(event) => setFiltroCiudad(event.target.value)}
              >
                <option value="TODAS">Todas</option>
                {ciudadesDisponibles.map((ciudad) => (
                  <option key={ciudad} value={ciudad}>
                    {ciudad}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Orden</p>
              <div className="grid grid-cols-2 gap-2">
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={campoOrden}
                  onChange={(event) =>
                    setCampoOrden(
                      event.target.value as 'NOMBRE' | 'ESTADO',
                    )
                  }
                >
                  <option value="NOMBRE">Nombre</option>
                  <option value="ESTADO">Estado</option>
                </select>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={direccionOrden}
                  onChange={(event) =>
                    setDireccionOrden(event.target.value as 'ASC' | 'DESC')
                  }
                >
                  <option value="ASC">Asc</option>
                  <option value="DESC">Desc</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-4">
            <p className="text-sm text-muted-foreground">
              Resultados: <span className="font-medium text-foreground">{totalServidor}</span>
            </p>

            <Button variant="outline" size="sm" onClick={limpiarFiltros}>
              Limpiar filtros
            </Button>
          </div>

          {errorSocios && (
            <Alert variant="destructive" className="border-destructive/30 bg-destructive/5">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>No se pudo cargar el listado</AlertTitle>
              <AlertDescription>{errorSocios}</AlertDescription>
            </Alert>
          )}

          {cargandoSocios ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={`skeleton-${index}`} className="flex gap-4 rounded-md border p-4">
                  <div className="h-4 w-8 animate-pulse rounded bg-muted" />
                  <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                  <div className="h-4 w-48 animate-pulse rounded bg-muted" />
                  <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                  <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                </div>
              ))}
            </div>
          ) : socios.length === 0 ? (
            <div className="rounded-md border border-dashed p-10 text-center text-muted-foreground">
              No hay socios registrados.
            </div>
          ) : totalServidor === 0 ? (
            <div className="rounded-md border border-dashed p-10 text-center text-muted-foreground">
              No hay resultados para los filtros seleccionados.
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Teléfono</TableHead>
                      <TableHead>Ubicación</TableHead>
                      <TableHead className="w-24">Estado</TableHead>
                      <TableHead className="w-36 text-center">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {socios.map((socio) => (
                      <TableRow key={socio.idPersona} className={!socio.activo ? 'opacity-60' : ''}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar
                              size="default"
                              className="size-10 ring-1 ring-border/60"
                            >
                              {socio.fotoPerfilUrl && (
                                <AvatarImage
                                  src={
                                    obtenerUrlFoto(socio.fotoPerfilUrl) ??
                                    undefined
                                  }
                                  alt={`${socio.nombre} ${socio.apellido}`}
                                  className="object-cover object-center"
                                />
                              )}
                              <AvatarFallback className="text-xs font-medium bg-primary/10 text-primary">
                                {obtenerIniciales(socio.nombre, socio.apellido)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{socio.nombre} {socio.apellido}</p>
                              <p className="text-xs text-muted-foreground">DNI: {socio.dni || '-'}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{socio.email}</TableCell>
                        <TableCell className="text-sm">{socio.telefono}</TableCell>
                        <TableCell className="text-sm">
                          <p>{socio.ciudad}</p>
                          <p className="text-xs text-muted-foreground">{socio.provincia}</p>
                        </TableCell>
                        <TableCell>
                          {socio.activo ? (
                            <Badge variant="default" className="bg-emerald-600">Activo</Badge>
                          ) : (
                            <div className="space-y-1">
                              <Badge variant="destructive">Inactivo</Badge>
                              {socio.fechaBaja && (
                                <p className="text-xs text-muted-foreground">
                                  {formatearFechaArgentinaCorta(socio.fechaBaja)}
                                </p>
                              )}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-center gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => abrirModalDetalles(socio)}
                            >
                              Ver
                            </Button>
                            <Can accion={ACCIONES.SOCIOS_EDITAR}>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => abrirModalEdicion(socio)}
                                disabled={!socio.activo}
                              >
                                Editar
                              </Button>
                            </Can>
                            {socio.activo ? (
                              <Can accion={ACCIONES.SOCIOS_ELIMINAR}>
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => confirmarEliminar(socio)}
                                >
                                  Baja
                                </Button>
                              </Can>
                            ) : (
                              <Can accion={ACCIONES.SOCIOS_EDITAR}>
                                <Button
                                  type="button"
                                  variant="default"
                                  size="sm"
                                  className="bg-emerald-600 hover:bg-emerald-700"
                                  onClick={() => void reactivarSocio(socio)}
                                >
                                  Reactivar
                                </Button>
                              </Can>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="border-t pt-4">
                <ControlesPaginacion
                  pagina={paginaActual}
                  totalPaginas={totalPaginas}
                  total={totalServidor}
                  limite={limitePorPagina}
                  opcionesLimite={[6, 9, 12, 18]}
                  cargando={cargandoSocios}
                  onCambiarPagina={setPaginaActual}
                  onCambiarLimite={(nuevo) => {
                    setLimitePorPagina(nuevo);
                    setPaginaActual(1);
                  }}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={mostrarFormularioSocio}
        onOpenChange={(open) => {
          setMostrarFormularioSocio(open);
          if (!open) {
            limpiarEstadoCreacion();
          }
        }}
      >
        <DialogContent className="max-w-4xl p-0">
          <DialogHeader className="border-b px-6 py-4">
            <DialogTitle>Nuevo socio</DialogTitle>
            <DialogDescription>
              Completa los datos para registrar un nuevo socio.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={crearSocio} autoComplete="off">
            <div className="max-h-[68vh] space-y-6 overflow-y-auto px-6 py-5">
              {errorGeneralCreacion && (
                <Alert variant="destructive" className="border-destructive/30 bg-destructive/5">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>No se pudo crear el socio</AlertTitle>
                  <AlertDescription>{errorGeneralCreacion}</AlertDescription>
                </Alert>
              )}

              <section className="space-y-4">
                <h3 className="text-sm font-semibold text-foreground">Datos personales</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="crear-nombre" required>Nombre</Label>
                    <Input
                      id="crear-nombre"
                      value={socioForm.nombre}
                      onChange={(e) => actualizarCampoCreacion('nombre', e.target.value)}
                      aria-invalid={Boolean(erroresCreacion.nombre)}
                      required
                    />
                    {erroresCreacion.nombre && <p className="text-xs font-medium text-destructive">{erroresCreacion.nombre}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="crear-apellido" required>Apellido</Label>
                    <Input
                      id="crear-apellido"
                      value={socioForm.apellido}
                      onChange={(e) => actualizarCampoCreacion('apellido', e.target.value)}
                      aria-invalid={Boolean(erroresCreacion.apellido)}
                      required
                    />
                    {erroresCreacion.apellido && <p className="text-xs font-medium text-destructive">{erroresCreacion.apellido}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="crear-dni" required>DNI</Label>
                    <Input
                      id="crear-dni"
                      inputMode="numeric"
                      maxLength={8}
                      value={socioForm.dni}
                      onChange={(e) => actualizarCampoCreacion('dni', e.target.value)}
                      aria-invalid={Boolean(erroresCreacion.dni)}
                      required
                    />
                    {erroresCreacion.dni && <p className="text-xs font-medium text-destructive">{erroresCreacion.dni}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label required>Fecha de nacimiento</Label>
                    <DatePicker
                      date={parsearFechaInput(socioForm.fechaNacimiento)}
                      setDate={(fecha) =>
                        actualizarCampoCreacion(
                          'fechaNacimiento',
                          formatearFechaParaInput(fecha),
                        )
                      }
                      placeholder="Seleccionar fecha"
                      className="w-full"
                    />
                    {erroresCreacion.fechaNacimiento && <p className="text-xs font-medium text-destructive">{erroresCreacion.fechaNacimiento}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="crear-genero" required>Género</Label>
                    <select
                      id="crear-genero"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={socioForm.genero}
                      onChange={(e) => actualizarCampoCreacion('genero', e.target.value as Genero)}
                      required
                    >
                      <option value="MASCULINO">Masculino</option>
                      <option value="FEMENINO">Femenino</option>
                      <option value="OTRO">Otro</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="crear-telefono" required>Teléfono</Label>
                    <Input
                      id="crear-telefono"
                      value={socioForm.telefono}
                      onChange={(e) => actualizarCampoCreacion('telefono', e.target.value)}
                      aria-invalid={Boolean(erroresCreacion.telefono)}
                      required
                    />
                    {erroresCreacion.telefono && <p className="text-xs font-medium text-destructive">{erroresCreacion.telefono}</p>}
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <h3 className="text-sm font-semibold text-foreground">Foto de perfil</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2 md:col-span-2">
                    <SelectorImagen
                      etiqueta="Foto del Socio"
                      alCambiarFoto={setFotoCreacion}
                      deshabilitado={false}
                    />
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <h3 className="text-sm font-semibold text-foreground">Contacto y ubicación</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="crear-direccion" required>Dirección</Label>
                    <Input
                      id="crear-direccion"
                      value={socioForm.direccion}
                      onChange={(e) => actualizarCampoCreacion('direccion', e.target.value)}
                      aria-invalid={Boolean(erroresCreacion.direccion)}
                      required
                    />
                    {erroresCreacion.direccion && <p className="text-xs font-medium text-destructive">{erroresCreacion.direccion}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="crear-ciudad" required>Ciudad</Label>
                    <Input
                      id="crear-ciudad"
                      value={socioForm.ciudad}
                      onChange={(e) => actualizarCampoCreacion('ciudad', e.target.value)}
                      aria-invalid={Boolean(erroresCreacion.ciudad)}
                      required
                    />
                    {erroresCreacion.ciudad && <p className="text-xs font-medium text-destructive">{erroresCreacion.ciudad}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="crear-provincia" required>Provincia</Label>
                    <Input
                      id="crear-provincia"
                      value={socioForm.provincia}
                      onChange={(e) => actualizarCampoCreacion('provincia', e.target.value)}
                      aria-invalid={Boolean(erroresCreacion.provincia)}
                      required
                    />
                    {erroresCreacion.provincia && <p className="text-xs font-medium text-destructive">{erroresCreacion.provincia}</p>}
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="crear-email" required>Email</Label>
                    <Input
                      id="crear-email"
                      type="email"
                      autoComplete="off"
                      value={socioForm.email}
                      onChange={(e) => actualizarCampoCreacion('email', e.target.value)}
                      aria-invalid={Boolean(erroresCreacion.email)}
                      required
                    />
                    {erroresCreacion.email && <p className="text-xs font-medium text-destructive">{erroresCreacion.email}</p>}
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <h3 className="text-sm font-semibold text-foreground">Estado y observaciones</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="crear-estado">Estado inicial</Label>
                    <select
                      id="crear-estado"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={socioForm.estado ?? 'ACTIVO'}
                      onChange={(e) => actualizarCampoCreacion('estado', e.target.value as 'ACTIVO' | 'INACTIVO')}
                    >
                      <option value="ACTIVO">Activo</option>
                      <option value="INACTIVO">Inactivo</option>
                    </select>
                    <p className="text-xs text-muted-foreground">
                      Si seleccionás "Inactivo" el socio se creará con fecha de baja inmediata.
                    </p>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="crear-observaciones">Observaciones</Label>
                    <Textarea
                      id="crear-observaciones"
                      value={socioForm.observaciones ?? ''}
                      onChange={(e) => actualizarCampoCreacion('observaciones', e.target.value)}
                      placeholder="Notas internas sobre el socio (opcional)"
                      maxLength={2000}
                      rows={3}
                    />
                  </div>
                </div>
              </section>
            </div>
            <div className="flex justify-end gap-2 border-t bg-background px-6 py-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setMostrarFormularioSocio(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={Object.keys(erroresCreacion).length > 0 || enviandoCreacion}
              >
                {enviandoCreacion ? 'Creando…' : 'Crear socio'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal baja */}
      <Dialog
        open={mostrarConfirmacionEliminar}
        onOpenChange={(open) => {
          setMostrarConfirmacionEliminar(open);
          if (!open) {
            setSocioAEliminar(null);
            setMotivoDesactivacion('');
            setResultadoDesactivacion(null);
          }
        }}
      >
        <DialogContent className="max-w-md">
          {resultadoDesactivacion ? (
            <>
              <DialogHeader>
                <DialogTitle>Baja realizada</DialogTitle>
                <DialogDescription>
                  {socioAEliminar?.nombre} {socioAEliminar?.apellido} fue dado de baja correctamente.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 py-2">
                {resultadoDesactivacion.tienePlanActivo && (
                  <Alert variant="destructive" className="border-destructive/30 bg-destructive/5">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Plan alimentario activo</AlertTitle>
                    <AlertDescription>
                      El socio tiene un plan alimentario activo. Recordá gestionarlo.
                    </AlertDescription>
                  </Alert>
                )}
                <div className="rounded-md border bg-muted/20 p-3 text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Turnos cancelados</span>
                    <span className="font-medium">{resultadoDesactivacion.turnosCancelados}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Nutricionistas afectados</span>
                    <span className="font-medium">{resultadoDesactivacion.nutricionistasAfectados}</span>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  onClick={() => {
                    setMostrarConfirmacionEliminar(false);
                    setSocioAEliminar(null);
                    setMotivoDesactivacion('');
                    setResultadoDesactivacion(null);
                  }}
                >
                  Cerrar
                </Button>
              </div>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Dar de baja</DialogTitle>
                <DialogDescription>
                  Estás por dar de baja a <strong>{socioAEliminar?.nombre} {socioAEliminar?.apellido}</strong>.
                  Esta acción cancelará todos sus turnos futuros.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label htmlFor="motivo-baja" required>Motivo de la baja</Label>
                  <Textarea
                    id="motivo-baja"
                    placeholder="Describí el motivo de la baja (mín. 10 caracteres)"
                    value={motivoDesactivacion}
                    onChange={(e) => setMotivoDesactivacion(e.target.value)}
                    maxLength={500}
                    rows={3}
                  />
                  {motivoDesactivacion.length > 0 && motivoDesactivacion.length < 10 && (
                    <p className="text-xs font-medium text-destructive">
                      El motivo debe tener al menos 10 caracteres.
                    </p>
                  )}
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setMostrarConfirmacionEliminar(false);
                    setSocioAEliminar(null);
                    setMotivoDesactivacion('');
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  disabled={motivoDesactivacion.trim().length < 10 || desactivando}
                  onClick={desactivarSocio}
                >
                  {desactivando ? 'Dando de baja…' : 'Dar de baja'}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={mostrarFormularioEdicion}
        onOpenChange={(open) => {
          setMostrarFormularioEdicion(open);
          if (!open) {
            setIdSocioEditando(null);
            setErroresEdicion({});
            setFotoEdicion(null);
          }
        }}
      >
        <DialogContent className="max-w-4xl p-0">
          <DialogHeader className="border-b px-6 py-4">
            <DialogTitle>Editar Socio</DialogTitle>
            <DialogDescription>
              Actualiza la información del socio seleccionado.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={editarSocio} autoComplete="off">
            <div className="max-h-[68vh] space-y-6 overflow-y-auto px-6 py-5">
              <section className="space-y-4">
                <h3 className="text-sm font-semibold text-foreground">Datos personales</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="editar-nombre">Nombre</Label>
                    <Input id="editar-nombre" value={socioFormEdicion.nombre} onChange={(e) => setSocioFormEdicion({ ...socioFormEdicion, nombre: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editar-apellido">Apellido</Label>
                    <Input id="editar-apellido" value={socioFormEdicion.apellido} onChange={(e) => setSocioFormEdicion({ ...socioFormEdicion, apellido: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editar-dni">DNI</Label>
                    <Input
                      id="editar-dni"
                      inputMode="numeric"
                      maxLength={8}
                      value={socioFormEdicion.dni}
                      onChange={(e) => setSocioFormEdicion({ ...socioFormEdicion, dni: e.target.value })}
                      required
                      aria-invalid={Boolean(erroresEdicion.dni)}
                    />
                    {erroresEdicion.dni && (
                      <p className="text-xs font-medium text-destructive">{erroresEdicion.dni}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Fecha de nacimiento</Label>
                    <DatePicker
                      date={parsearFechaInput(socioFormEdicion.fechaNacimiento)}
                      setDate={(fecha) =>
                        setSocioFormEdicion({
                          ...socioFormEdicion,
                          fechaNacimiento: formatearFechaParaInput(fecha),
                        })
                      }
                      placeholder="Seleccionar fecha"
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editar-genero">Género</Label>
                    <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" id="editar-genero" value={socioFormEdicion.genero} onChange={(e) => setSocioFormEdicion({ ...socioFormEdicion, genero: e.target.value as Genero })} required>
                      <option value="MASCULINO">Masculino</option>
                      <option value="FEMENINO">Femenino</option>
                      <option value="OTRO">Otro</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editar-telefono">Teléfono</Label>
                    <Input id="editar-telefono" value={socioFormEdicion.telefono} onChange={(e) => setSocioFormEdicion({ ...socioFormEdicion, telefono: e.target.value })} required />
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <h3 className="text-sm font-semibold text-foreground">Foto de perfil</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2 md:col-span-2">
                    <SelectorImagen
                      etiqueta="Foto del Socio"
                      valorActual={
                        typeof fotoEdicion === 'string' ? fotoEdicion : null
                      }
                      alCambiarFoto={setFotoEdicion}
                      deshabilitado={false}
                    />
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <h3 className="text-sm font-semibold text-foreground">Contacto y ubicación</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="editar-direccion">Dirección</Label>
                    <Input id="editar-direccion" value={socioFormEdicion.direccion} onChange={(e) => setSocioFormEdicion({ ...socioFormEdicion, direccion: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editar-ciudad">Ciudad</Label>
                    <Input id="editar-ciudad" value={socioFormEdicion.ciudad} onChange={(e) => setSocioFormEdicion({ ...socioFormEdicion, ciudad: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editar-provincia">Provincia</Label>
                    <Input id="editar-provincia" value={socioFormEdicion.provincia} onChange={(e) => setSocioFormEdicion({ ...socioFormEdicion, provincia: e.target.value })} required />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="editar-email">Email</Label>
                    <Input id="editar-email" type="email" autoComplete="off" value={socioFormEdicion.email} onChange={(e) => setSocioFormEdicion({ ...socioFormEdicion, email: e.target.value })} required />
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <h3 className="text-sm font-semibold text-foreground">Observaciones</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="editar-observaciones">Observaciones</Label>
                    <Textarea
                      id="editar-observaciones"
                      value={socioFormEdicion.observaciones ?? ''}
                      onChange={(e) => setSocioFormEdicion({ ...socioFormEdicion, observaciones: e.target.value })}
                      placeholder="Notas internas sobre el socio (opcional)"
                      maxLength={2000}
                      rows={3}
                    />
                  </div>
                </div>
              </section>
            </div>
            <div className="flex justify-end gap-2 border-t bg-background px-6 py-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setMostrarFormularioEdicion(false);
                  setIdSocioEditando(null);
                  setErroresEdicion({});
                  setFotoEdicion(null);
                }}
              >
                Cancelar
              </Button>
              <Button type="submit">Guardar cambios</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      

      {/* Modal Ver Detalles */}
      <Dialog open={mostrarModalDetalles} onOpenChange={setMostrarModalDetalles}>
        <DialogContent className="max-w-3xl overflow-hidden p-0">
          <DialogHeader className="border-b bg-muted/30 px-6 py-5">
            <DialogTitle className="text-xl">Detalles del Socio</DialogTitle>
            <DialogDescription>
              Información personal y de contacto del socio seleccionado.
            </DialogDescription>
          </DialogHeader>
          {socioSeleccionado && (
            <div className="max-h-[72vh] space-y-5 overflow-y-auto px-6 py-6">
              <section className="rounded-xl border bg-card p-4 sm:p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <Avatar
                        size="lg"
                        className="h-32 w-32 ring-2 ring-primary/20 sm:h-36 sm:w-36"
                      >
                        {socioSeleccionado.fotoPerfilUrl && (
                          <AvatarImage
                            src={obtenerUrlFoto(socioSeleccionado.fotoPerfilUrl) ?? undefined}
                            alt={`${socioSeleccionado.nombre} ${socioSeleccionado.apellido}`}
                            className="object-cover object-center"
                          />
                        )}
                        <AvatarFallback className="bg-primary/10 text-2xl font-bold text-primary">
                          {obtenerIniciales(socioSeleccionado.nombre, socioSeleccionado.apellido)}
                        </AvatarFallback>
                      </Avatar>
                      {socioSeleccionado.fotoPerfilUrl && (
                        <div
                          className="absolute inset-0 flex cursor-pointer items-center justify-center rounded-full bg-black/30 opacity-0 transition-opacity hover:opacity-100"
                          onClick={() => setMostrarFotoAmpliada(true)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => e.key === 'Enter' && setMostrarFotoAmpliada(true)}
                          aria-label="Ver foto ampliada"
                        >
                          <Search className="h-8 w-8 text-white drop-shadow-lg" />
                        </div>
                      )}
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-xl font-bold text-foreground">
                        {socioSeleccionado.nombre} {socioSeleccionado.apellido}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {socioSeleccionado.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {socioSeleccionado.activo ? (
                      <Badge variant="default" className="bg-emerald-600">
                        Activo
                      </Badge>
                    ) : (
                      <Badge variant="destructive">Inactivo</Badge>
                    )}
                    <Badge variant="outline">DNI {socioSeleccionado.dni || '-'}</Badge>
                  </div>
                </div>
              </section>

              <div className="grid gap-4 md:grid-cols-2">
                <section className="rounded-xl border bg-card p-4">
                  <h4 className="mb-3 text-sm font-semibold text-foreground">
                    Datos personales
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-medium uppercase text-muted-foreground">
                        Fecha de nacimiento
                      </p>
                      <p className="text-sm font-medium">
                        {socioSeleccionado.fechaNacimiento
                          ? formatearFechaArgentinaCorta(socioSeleccionado.fechaNacimiento)
                          : '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase text-muted-foreground">
                        Género
                      </p>
                      <p className="text-sm font-medium capitalize">
                        {socioSeleccionado.genero?.toLowerCase()}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs font-medium uppercase text-muted-foreground">
                        Teléfono
                      </p>
                      <p className="text-sm font-medium">
                        {socioSeleccionado.telefono || '-'}
                      </p>
                    </div>
                  </div>
                </section>

                <section className="rounded-xl border bg-card p-4">
                  <h4 className="mb-3 text-sm font-semibold text-foreground">
                    Ubicación
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <p className="text-xs font-medium uppercase text-muted-foreground">
                        Dirección
                      </p>
                      <p className="text-sm font-medium">
                        {socioSeleccionado.direccion || '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase text-muted-foreground">
                        Ciudad
                      </p>
                      <p className="text-sm font-medium">
                        {socioSeleccionado.ciudad || '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase text-muted-foreground">
                        Provincia
                      </p>
                      <p className="text-sm font-medium">
                        {socioSeleccionado.provincia || '-'}
                      </p>
                    </div>
                  </div>
                </section>
              </div>

              {socioSeleccionado.observaciones && (
                <section className="rounded-xl border bg-card p-4">
                  <h4 className="mb-2 text-sm font-semibold text-foreground">
                    Observaciones
                  </h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {socioSeleccionado.observaciones}
                  </p>
                </section>
              )}
              {socioSeleccionado.fechaBaja && (
                <section className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
                  <p className="text-xs font-medium uppercase text-muted-foreground">
                    Fecha de baja
                  </p>
                  <p className="text-sm font-medium text-destructive">
                    {formatearFechaArgentinaCorta(socioSeleccionado.fechaBaja)}
                  </p>
                </section>
              )}
            </div>
          )}
          <div className="flex justify-end gap-2 border-t bg-muted/20 px-6 py-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setMostrarModalDetalles(false)}
            >
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Lightbox foto ampliada */}
      {socioSeleccionado?.fotoPerfilUrl && (
        <Dialog open={mostrarFotoAmpliada} onOpenChange={setMostrarFotoAmpliada}>
          <DialogContent className="max-w-[90vw] max-h-[90vh] border-0 bg-black/95 p-0" showCloseButton={false}>
            <DialogClose className="absolute top-3 right-3 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80">
              <XIcon className="h-6 w-6" />
            </DialogClose>
            <img
              src={obtenerUrlFoto(socioSeleccionado.fotoPerfilUrl) ?? ''}
              alt={`${socioSeleccionado.nombre} ${socioSeleccionado.apellido}`}
              className="mx-auto max-h-[85vh] w-auto object-contain"
            />
          </DialogContent>
        </Dialog>
      )}

      <ModalContrasenaProvisional
        abierto={mostrarModalContrasenaProvisional}
        alCerrar={() => {
          setMostrarModalContrasenaProvisional(false);
          setContrasenaProvisional(null);
        }}
        contrasena={contrasenaProvisional ?? ''}
        nombreRol="El socio"
      />
    </div>
  );
}
