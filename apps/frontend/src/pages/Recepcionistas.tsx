import { useState, useEffect, useCallback, useMemo, type FormEvent } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { AlertCircle, Search, UserCog, XIcon } from 'lucide-react';
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
import type { Recepcionista, CrearRecepcionistaDto, Genero } from '@/types/recepcionista';
import { Button } from '@/components/ui/button';
import { ControlesPaginacion } from '@/components/ui/ControlesPaginacion';
import type { PaginatedData } from '@nutrifit/shared';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
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

type CampoFormularioCreacion = keyof CrearRecepcionistaDto;
type CampoFormularioEdicion = keyof CrearRecepcionistaDto;
type ErroresFormularioCreacion = Partial<Record<CampoFormularioCreacion, string>>;
type ErroresFormularioEdicion = Partial<Record<CampoFormularioEdicion, string>>;
type EstadoFoto = string | File | null;

const FORMULARIO_RECEPCIONISTA_INICIAL: CrearRecepcionistaDto = {
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

export function Recepcionistas() {
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

  const [mostrarFormularioCreacion, setMostrarFormularioCreacion] = useState(false);
  const [mostrarFormularioEdicion, setMostrarFormularioEdicion] = useState(false);
  const [idRecepcionistaEditando, setIdRecepcionistaEditando] = useState<number | null>(null);

  const [recepcionistaForm, setRecepcionistaForm] = useState<CrearRecepcionistaDto>(FORMULARIO_RECEPCIONISTA_INICIAL);
  const [erroresCreacion, setErroresCreacion] = useState<ErroresFormularioCreacion>({});
  const [errorGeneralCreacion, setErrorGeneralCreacion] = useState<string | null>(null);
  const [enviandoCreacion, setEnviandoCreacion] = useState(false);
  const [fotoCreacion, setFotoCreacion] = useState<EstadoFoto>(null);

  const [recepcionistaFormEdicion, setRecepcionistaFormEdicion] = useState<CrearRecepcionistaDto>(FORMULARIO_RECEPCIONISTA_INICIAL);
  const [erroresEdicion, setErroresEdicion] = useState<ErroresFormularioEdicion>({});
  const [fotoEdicion, setFotoEdicion] = useState<EstadoFoto>(null);

  const [mostrarConfirmacionEliminar, setMostrarConfirmacionEliminar] = useState(false);
  const [recepcionistaAEliminar, setRecepcionistaAEliminar] = useState<Recepcionista | null>(null);

  const [mostrarModalDetalles, setMostrarModalDetalles] = useState(false);
  const [mostrarModalContrasenaProvisional, setMostrarModalContrasenaProvisional] = useState(false);
  const [contrasenaProvisional, setContrasenaProvisional] = useState<string | null>(null);
  const [mostrarFotoAmpliada, setMostrarFotoAmpliada] = useState(false);
  const [recepcionistaSeleccionado, setRecepcionistaSeleccionado] = useState<Recepcionista | null>(null);

  const recargarRecepcionistas = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ['recepcionistas-filtros'] });
    void queryClient.invalidateQueries({ queryKey: ['recepcionistas-pagina'] });
  }, [queryClient]);

  const { data: todosLosRecepcionistas = [] } = useQuery<Recepcionista[]>({
    queryKey: ['recepcionistas-filtros', token],
    queryFn: async () => {
      if (!token) return [];
      const response = await apiRequest<ApiResponse<PaginatedData<Recepcionista>>>(
        '/recepcionistas?page=1&limit=100',
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

  const { data: resultadoPagina, isLoading: cargandoRecepcionistas, error: queryError } = useQuery<PaginatedData<Recepcionista> | null>({
    queryKey: ['recepcionistas-pagina', token, paramsPagina],
    queryFn: async () => {
      if (!token) return null;
      const response = await apiRequest<ApiResponse<PaginatedData<Recepcionista>>>(
        `/recepcionistas?${paramsPagina}`,
        { token },
      );
      return response.data ?? null;
    },
    enabled: !!token,
  });

  const recepcionistas = resultadoPagina?.data ?? [];
  const totalServidor = resultadoPagina?.pagination?.total ?? 0;
  const errorRecepcionistas = queryError instanceof Error ? queryError.message : null;

  const abrirModalDetalles = (recepcionista: Recepcionista) => {
    setRecepcionistaSeleccionado(recepcionista);
    setMostrarModalDetalles(true);
  };

  const provinciasDisponibles = useMemo(() => {
    return Array.from(
      new Set(todosLosRecepcionistas.map((r) => r.provincia.trim())),
    )
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));
  }, [todosLosRecepcionistas]);

  const ciudadesDisponibles = useMemo(() => {
    const recepcionistasPorProvincia =
      filtroProvincia === 'TODAS'
        ? todosLosRecepcionistas
        : todosLosRecepcionistas.filter((r) => r.provincia === filtroProvincia);

    return Array.from(
      new Set(recepcionistasPorProvincia.map((r) => r.ciudad.trim())),
    )
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));
  }, [recepcionistas, filtroProvincia]);

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
    (datos: CrearRecepcionistaDto): ErroresFormularioCreacion => {
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
    <K extends CampoFormularioCreacion>(campo: K, valor: CrearRecepcionistaDto[K]) => {
      const nuevoForm = { ...recepcionistaForm, [campo]: valor };
      setRecepcionistaForm(nuevoForm);
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
    [recepcionistaForm, validarFormularioCreacion],
  );

  const validarFormularioEdicion = useCallback((): ErroresFormularioEdicion => {
    const errores: ErroresFormularioEdicion = {};

    if (!recepcionistaFormEdicion.nombre.trim()) errores.nombre = 'Ingresá el nombre.';
    if (!recepcionistaFormEdicion.apellido.trim()) errores.apellido = 'Ingresá el apellido.';
    if (!REGEX_DNI.test(recepcionistaFormEdicion.dni.trim())) errores.dni = 'El DNI debe tener exactamente 8 dígitos.';
    if (!recepcionistaFormEdicion.fechaNacimiento) errores.fechaNacimiento = 'Seleccioná la fecha de nacimiento.';
    if (!REGEX_TELEFONO.test(recepcionistaFormEdicion.telefono.trim())) errores.telefono = 'Ingresá un teléfono válido (8 a 20 caracteres).';
    if (!recepcionistaFormEdicion.direccion.trim()) errores.direccion = 'Ingresá la dirección.';
    if (!recepcionistaFormEdicion.ciudad.trim()) errores.ciudad = 'Ingresá la ciudad.';
    if (!recepcionistaFormEdicion.provincia.trim()) errores.provincia = 'Ingresá la provincia.';
    if (!REGEX_EMAIL.test(recepcionistaFormEdicion.email.trim())) errores.email = 'Ingresá un email válido.';

    return errores;
  }, [recepcionistaFormEdicion]);

  const limpiarEstadoCreacion = useCallback(() => {
    setRecepcionistaForm(FORMULARIO_RECEPCIONISTA_INICIAL);
    setErroresCreacion({});
    setErrorGeneralCreacion(null);
    setFotoCreacion(null);
    setEnviandoCreacion(false);
  }, []);


  const crearRecepcionista = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token || enviandoCreacion) return;

    const errores = validarFormularioCreacion(recepcionistaForm);

    if (Object.keys(errores).length > 0) {
      setErroresCreacion(errores);
      setErrorGeneralCreacion('Revisá los campos marcados antes de continuar.');
      return;
    }

    setEnviandoCreacion(true);

    try {
      interface RespuestaCrearRecepcionista {
        contrasenaProvisional?: string;
      }

      let respuesta: RespuestaCrearRecepcionista | undefined;
      if (fotoCreacion instanceof File) {
        const formData = new FormData();
        formData.append('foto', fotoCreacion);
        Object.entries(recepcionistaForm).forEach(([key, value]) => {
          formData.append(key, String(value));
        });

        respuesta = await apiRequest<ApiResponse<RespuestaCrearRecepcionista>>('/recepcionistas', {
          method: 'POST',
          token,
          formData,
        }).then((r) => r.data);
      } else {
        respuesta = await apiRequest<ApiResponse<RespuestaCrearRecepcionista>>('/recepcionistas', {
          method: 'POST',
          token,
          body: recepcionistaForm,
        }).then((r) => r.data);
      }

      toast.success('Recepcionista creado exitosamente');
      setMostrarFormularioCreacion(false);
      limpiarEstadoCreacion();
      recargarRecepcionistas();

      if (respuesta?.contrasenaProvisional) {
        setContrasenaProvisional(respuesta.contrasenaProvisional);
        setMostrarModalContrasenaProvisional(true);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'No se pudo crear el recepcionista';
      setErrorGeneralCreacion(errorMessage);
      toast.error(errorMessage);
    } finally {
      setEnviandoCreacion(false);
    }
  };

  const abrirModalEdicion = (recepcionista: Recepcionista) => {
    setIdRecepcionistaEditando(recepcionista.idPersona);
    setRecepcionistaFormEdicion({
      nombre: recepcionista.nombre,
      apellido: recepcionista.apellido,
      dni: recepcionista.dni,
      fechaNacimiento: recepcionista.fechaNacimiento
        ? formatearFechaArgentinaParaInput(recepcionista.fechaNacimiento)
        : '',
      telefono: recepcionista.telefono,
      genero: recepcionista.genero,
      direccion: recepcionista.direccion,
      ciudad: recepcionista.ciudad,
      provincia: recepcionista.provincia,
      email: recepcionista.email,
      contrasena: '',
    });
    setErroresEdicion({});
    setFotoEdicion(recepcionista.fotoPerfilUrl ?? null);
    setMostrarFormularioEdicion(true);
  };

  const actualizarRecepcionista = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token || idRecepcionistaEditando === null) return;

    const errores = validarFormularioEdicion();
    if (Object.keys(errores).length > 0) {
      setErroresEdicion(errores);
      toast.error('Por favor, corregí los errores del formulario');
      return;
    }

    try {
      const payload = {
        ...recepcionistaFormEdicion,
        ...(recepcionistaFormEdicion.contrasena ? {} : { contrasena: undefined }),
      };

      const esFile = fotoEdicion instanceof File;
      const esNull = fotoEdicion === null;
      const recepcionistaSiendoEditado = recepcionistas.find(
        (r) => r.idPersona === idRecepcionistaEditando,
      );
      const recepcionistaTeniaFoto = recepcionistaSiendoEditado?.fotoPerfilUrl;

      const formData = new FormData();
      if (esFile) {
        formData.append('foto', fotoEdicion);
      }
      if (esNull && recepcionistaTeniaFoto) {
        formData.append('eliminarFoto', 'true');
      }
      Object.entries(payload).forEach(([key, value]) => {
        if (key !== 'contrasena' || value) {
          formData.append(key, String(value));
        }
      });

      await apiRequest(`/recepcionistas/${idRecepcionistaEditando}`, {
        method: 'PUT',
        token,
        formData,
      });

      toast.success('Recepcionista actualizado exitosamente');
      setMostrarFormularioEdicion(false);
      setIdRecepcionistaEditando(null);
      setErroresEdicion({});
      setFotoEdicion(null);
      recargarRecepcionistas();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'No se pudo editar el recepcionista';
      toast.error(errorMessage);
    }
  };

  const confirmarEliminar = (recepcionista: Recepcionista) => {
    setRecepcionistaAEliminar(recepcionista);
    setMostrarConfirmacionEliminar(true);
  };

  const eliminarRecepcionista = async () => {
    if (!token || !recepcionistaAEliminar) return;

    try {
      await apiRequest(`/recepcionistas/${recepcionistaAEliminar.idPersona}`, {
        method: 'DELETE',
        token,
      });

      toast.success('Recepcionista dado de baja exitosamente');
      setMostrarConfirmacionEliminar(false);
      setRecepcionistaAEliminar(null);
      recargarRecepcionistas();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'No se pudo dar de baja el recepcionista';
      toast.error(errorMessage);
    }
  };

  const reactivarRecepcionista = async (recepcionista: Recepcionista) => {
    if (!token) return;

    try {
      await apiRequest(`/recepcionistas/${recepcionista.idPersona}/reactivar`, {
        method: 'POST',
        token,
      });

      toast.success('Recepcionista reactivado exitosamente');
      recargarRecepcionistas();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'No se pudo reactivar el recepcionista';
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
              <UserCog className="h-8 w-8 text-orange-500" />
              <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-rose-600 bg-clip-text text-transparent">
                Gestión de Recepcionistas
              </h1>
            </div>
            <p className="text-muted-foreground">
              Administración profesional de altas, bajas y seguimiento del equipo de recepción.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => recargarRecepcionistas()}
              type="button"
              disabled={cargandoRecepcionistas}
            >
              Refrescar
            </Button>
            <Can accion={ACCIONES.RECEPCIONISTAS_CREAR}>
              <Button
                onClick={() => setMostrarFormularioCreacion(true)}
                type="button"
              >
                Nuevo recepcionista
              </Button>
            </Can>
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

          {errorRecepcionistas && (
            <Alert variant="destructive" className="border-destructive/30 bg-destructive/5">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>No se pudo cargar el listado</AlertTitle>
              <AlertDescription>{errorRecepcionistas}</AlertDescription>
            </Alert>
          )}

          {cargandoRecepcionistas ? (
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
          ) : recepcionistas.length === 0 ? (
            <div className="rounded-md border border-dashed p-10 text-center text-muted-foreground">
              No hay recepcionistas registrados.
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
                      <TableHead>DNI</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Ubicación</TableHead>
                      <TableHead className="w-24">Estado</TableHead>
                      <TableHead className="w-36 text-center">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recepcionistas.map((recepcionista) => (
                      <TableRow key={recepcionista.idPersona} className={!recepcionista.activo ? 'opacity-60' : ''}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar
                              size="default"
                              className="size-10 ring-1 ring-border/60"
                            >
                              {recepcionista.fotoPerfilUrl && (
                                <AvatarImage
                                  src={
                                    obtenerUrlFoto(recepcionista.fotoPerfilUrl) ??
                                    undefined
                                  }
                                  alt={`${recepcionista.nombre} ${recepcionista.apellido}`}
                                  className="object-cover object-center"
                                />
                              )}
                              <AvatarFallback className="text-xs font-medium bg-primary/10 text-primary">
                                {obtenerIniciales(recepcionista.nombre, recepcionista.apellido)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{recepcionista.nombre} {recepcionista.apellido}</p>
                              <p className="text-xs text-muted-foreground">DNI: {recepcionista.dni || '-'}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{recepcionista.dni}</TableCell>
                        <TableCell className="text-sm">{recepcionista.email}</TableCell>
                        <TableCell className="text-sm">
                          <p>{recepcionista.ciudad}</p>
                          <p className="text-xs text-muted-foreground">{recepcionista.provincia}</p>
                        </TableCell>
                        <TableCell>
                          {recepcionista.activo ? (
                            <Badge variant="default" className="bg-emerald-600">Activo</Badge>
                          ) : (
                            <div className="space-y-1">
                              <Badge variant="destructive">Inactivo</Badge>
                              {recepcionista.fechaBaja && (
                                <p className="text-xs text-muted-foreground">
                                  {formatearFechaArgentinaCorta(recepcionista.fechaBaja)}
                                </p>
                              )}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-center gap-2">
                            <Can accion={ACCIONES.RECEPCIONISTAS_VER}>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => abrirModalDetalles(recepcionista)}
                              >
                                Ver
                              </Button>
                            </Can>
                            <Can accion={ACCIONES.RECEPCIONISTAS_EDITAR}>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => abrirModalEdicion(recepcionista)}
                                disabled={!recepcionista.activo}
                              >
                                Editar
                              </Button>
                            </Can>
                            {recepcionista.activo ? (
                              <Can accion={ACCIONES.RECEPCIONISTAS_ELIMINAR}>
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => confirmarEliminar(recepcionista)}
                                >
                                  Baja
                                </Button>
                              </Can>
                            ) : (
                              <Can accion={ACCIONES.RECEPCIONISTAS_EDITAR}>
                                <Button
                                  type="button"
                                  variant="default"
                                  size="sm"
                                  className="bg-emerald-600 hover:bg-emerald-700"
                                  onClick={() => void reactivarRecepcionista(recepcionista)}
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
                  cargando={cargandoRecepcionistas}
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

      {/* Modal Crear */}
      <Dialog
        open={mostrarFormularioCreacion}
        onOpenChange={(open) => {
          setMostrarFormularioCreacion(open);
          if (!open) {
            limpiarEstadoCreacion();
          }
        }}
      >
        <DialogContent className="max-w-4xl p-0">
          <DialogHeader className="border-b px-6 py-4">
            <DialogTitle>Nuevo recepcionista</DialogTitle>
            <DialogDescription>
              Completa los datos para registrar un nuevo recepcionista.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={crearRecepcionista} autoComplete="off">
            <div className="max-h-[68vh] space-y-6 overflow-y-auto px-6 py-5">
              {errorGeneralCreacion && (
                <Alert variant="destructive" className="border-destructive/30 bg-destructive/5">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>No se pudo crear el recepcionista</AlertTitle>
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
                      value={recepcionistaForm.nombre}
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
                      value={recepcionistaForm.apellido}
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
                      value={recepcionistaForm.dni}
                      onChange={(e) => actualizarCampoCreacion('dni', e.target.value)}
                      aria-invalid={Boolean(erroresCreacion.dni)}
                      required
                    />
                    {erroresCreacion.dni && <p className="text-xs font-medium text-destructive">{erroresCreacion.dni}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label required>Fecha de nacimiento</Label>
                    <DatePicker
                      date={parsearFechaInput(recepcionistaForm.fechaNacimiento)}
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
                      value={recepcionistaForm.genero}
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
                      value={recepcionistaForm.telefono}
                      onChange={(e) => actualizarCampoCreacion('telefono', e.target.value)}
                      aria-invalid={Boolean(erroresCreacion.telefono)}
                      required
                    />
                    {erroresCreacion.telefono && <p className="text-xs font-medium text-destructive">{erroresCreacion.telefono}</p>}
                  </div>
                </div>
              </section>

              <SelectorImagen
                etiqueta="Foto de perfil"
                alCambiarFoto={setFotoCreacion}
                deshabilitado={false}
              />

              <section className="space-y-4">
                <h3 className="text-sm font-semibold text-foreground">Contacto y ubicación</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="crear-direccion" required>Dirección</Label>
                    <Input
                      id="crear-direccion"
                      value={recepcionistaForm.direccion}
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
                      value={recepcionistaForm.ciudad}
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
                      value={recepcionistaForm.provincia}
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
                      value={recepcionistaForm.email}
                      onChange={(e) => actualizarCampoCreacion('email', e.target.value)}
                      aria-invalid={Boolean(erroresCreacion.email)}
                      required
                    />
                    {erroresCreacion.email && <p className="text-xs font-medium text-destructive">{erroresCreacion.email}</p>}
                  </div>
                </div>
              </section>
            </div>
            <div className="flex justify-end gap-2 border-t bg-background px-6 py-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setMostrarFormularioCreacion(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={Object.keys(erroresCreacion).length > 0 || enviandoCreacion}
              >
                {enviandoCreacion ? 'Creando…' : 'Crear recepcionista'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Eliminar */}
      <Dialog open={mostrarConfirmacionEliminar} onOpenChange={setMostrarConfirmacionEliminar}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar baja</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que querés dar de baja a {recepcionistaAEliminar?.nombre} {recepcionistaAEliminar?.apellido}?
              <br /><br />
              Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setMostrarConfirmacionEliminar(false);
                setRecepcionistaAEliminar(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={eliminarRecepcionista}
            >
              Dar de baja
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Editar */}
      <Dialog
        open={mostrarFormularioEdicion}
        onOpenChange={(open) => {
          setMostrarFormularioEdicion(open);
          if (!open) {
            setIdRecepcionistaEditando(null);
            setErroresEdicion({});
            setFotoEdicion(null);
          }
        }}
      >
        <DialogContent className="max-w-4xl p-0">
          <DialogHeader className="border-b px-6 py-4">
            <DialogTitle>Editar Recepcionista</DialogTitle>
            <DialogDescription>
              Actualiza la información del recepcionista seleccionado.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={actualizarRecepcionista} autoComplete="off">
            <div className="max-h-[68vh] space-y-6 overflow-y-auto px-6 py-5">
              <section className="space-y-4">
                <h3 className="text-sm font-semibold text-foreground">Datos personales</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="editar-nombre">Nombre</Label>
                    <Input id="editar-nombre" value={recepcionistaFormEdicion.nombre} onChange={(e) => setRecepcionistaFormEdicion({ ...recepcionistaFormEdicion, nombre: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editar-apellido">Apellido</Label>
                    <Input id="editar-apellido" value={recepcionistaFormEdicion.apellido} onChange={(e) => setRecepcionistaFormEdicion({ ...recepcionistaFormEdicion, apellido: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editar-dni">DNI</Label>
                    <Input
                      id="editar-dni"
                      inputMode="numeric"
                      maxLength={8}
                      value={recepcionistaFormEdicion.dni}
                      onChange={(e) => setRecepcionistaFormEdicion({ ...recepcionistaFormEdicion, dni: e.target.value })}
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
                      date={parsearFechaInput(recepcionistaFormEdicion.fechaNacimiento)}
                      setDate={(fecha) =>
                        setRecepcionistaFormEdicion({
                          ...recepcionistaFormEdicion,
                          fechaNacimiento: formatearFechaParaInput(fecha),
                        })
                      }
                      placeholder="Seleccionar fecha"
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editar-genero">Género</Label>
                    <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" id="editar-genero" value={recepcionistaFormEdicion.genero} onChange={(e) => setRecepcionistaFormEdicion({ ...recepcionistaFormEdicion, genero: e.target.value as Genero })} required>
                      <option value="MASCULINO">Masculino</option>
                      <option value="FEMENINO">Femenino</option>
                      <option value="OTRO">Otro</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editar-telefono">Teléfono</Label>
                    <Input id="editar-telefono" value={recepcionistaFormEdicion.telefono} onChange={(e) => setRecepcionistaFormEdicion({ ...recepcionistaFormEdicion, telefono: e.target.value })} required />
                  </div>
                </div>
              </section>

              <SelectorImagen
                etiqueta="Foto de perfil"
                valorActual={
                  typeof fotoEdicion === 'string' ? fotoEdicion : null
                }
                alCambiarFoto={setFotoEdicion}
                deshabilitado={false}
              />

              <section className="space-y-4">
                <h3 className="text-sm font-semibold text-foreground">Contacto y ubicación</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="editar-direccion">Dirección</Label>
                    <Input id="editar-direccion" value={recepcionistaFormEdicion.direccion} onChange={(e) => setRecepcionistaFormEdicion({ ...recepcionistaFormEdicion, direccion: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editar-ciudad">Ciudad</Label>
                    <Input id="editar-ciudad" value={recepcionistaFormEdicion.ciudad} onChange={(e) => setRecepcionistaFormEdicion({ ...recepcionistaFormEdicion, ciudad: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editar-provincia">Provincia</Label>
                    <Input id="editar-provincia" value={recepcionistaFormEdicion.provincia} onChange={(e) => setRecepcionistaFormEdicion({ ...recepcionistaFormEdicion, provincia: e.target.value })} required />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="editar-email">Email</Label>
                    <Input id="editar-email" type="email" autoComplete="off" value={recepcionistaFormEdicion.email} onChange={(e) => setRecepcionistaFormEdicion({ ...recepcionistaFormEdicion, email: e.target.value })} required />
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <h3 className="text-sm font-semibold text-foreground">Seguridad</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="editar-password">Nueva contraseña (opcional)</Label>
                    <Input id="editar-password" type="password" autoComplete="new-password" value={recepcionistaFormEdicion.contrasena} onChange={(e) => setRecepcionistaFormEdicion({ ...recepcionistaFormEdicion, contrasena: e.target.value })} />
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
                  setIdRecepcionistaEditando(null);
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
            <DialogTitle className="text-xl">Detalles del Recepcionista</DialogTitle>
            <DialogDescription>
              Información personal y de contacto del recepcionista seleccionado.
            </DialogDescription>
          </DialogHeader>
          {recepcionistaSeleccionado && (
            <div className="max-h-[72vh] space-y-5 overflow-y-auto px-6 py-6">
              <section className="rounded-xl border bg-card p-4 sm:p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <Avatar
                        size="lg"
                        className="h-32 w-32 ring-2 ring-primary/20 sm:h-36 sm:w-36"
                      >
                        {recepcionistaSeleccionado.fotoPerfilUrl && (
                          <AvatarImage
                            src={
                              obtenerUrlFoto(recepcionistaSeleccionado.fotoPerfilUrl) ??
                              undefined
                            }
                            alt={`${recepcionistaSeleccionado.nombre} ${recepcionistaSeleccionado.apellido}`}
                            className="object-cover object-center"
                          />
                        )}
                        <AvatarFallback className="bg-primary/10 text-2xl font-bold text-primary">
                          {obtenerIniciales(
                            recepcionistaSeleccionado.nombre,
                            recepcionistaSeleccionado.apellido,
                          )}
                        </AvatarFallback>
                      </Avatar>
                      {recepcionistaSeleccionado.fotoPerfilUrl && (
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
                        {recepcionistaSeleccionado.nombre}{' '}
                        {recepcionistaSeleccionado.apellido}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {recepcionistaSeleccionado.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recepcionistaSeleccionado.activo ? (
                      <Badge variant="default" className="bg-emerald-600">
                        Activo
                      </Badge>
                    ) : (
                      <Badge variant="destructive">Inactivo</Badge>
                    )}
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
                        DNI
                      </p>
                      <p className="text-sm font-medium">
                        {recepcionistaSeleccionado.dni || '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase text-muted-foreground">
                        Fecha de nacimiento
                      </p>
                      <p className="text-sm font-medium">
                        {recepcionistaSeleccionado.fechaNacimiento
                          ? formatearFechaArgentinaCorta(
                              recepcionistaSeleccionado.fechaNacimiento,
                            )
                          : '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase text-muted-foreground">
                        Género
                      </p>
                      <p className="text-sm font-medium capitalize">
                        {recepcionistaSeleccionado.genero?.toLowerCase()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase text-muted-foreground">
                        Teléfono
                      </p>
                      <p className="text-sm font-medium">
                        {recepcionistaSeleccionado.telefono || '-'}
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
                        {recepcionistaSeleccionado.direccion || '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase text-muted-foreground">
                        Ciudad
                      </p>
                      <p className="text-sm font-medium">
                        {recepcionistaSeleccionado.ciudad || '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase text-muted-foreground">
                        Provincia
                      </p>
                      <p className="text-sm font-medium">
                        {recepcionistaSeleccionado.provincia || '-'}
                      </p>
                    </div>
                  </div>
                </section>
              </div>

              {recepcionistaSeleccionado.fechaBaja && (
                <section className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
                  <p className="text-xs font-medium uppercase text-muted-foreground">
                    Fecha de baja
                  </p>
                  <p className="text-sm font-medium text-destructive">
                    {formatearFechaArgentinaCorta(recepcionistaSeleccionado.fechaBaja)}
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
      {recepcionistaSeleccionado?.fotoPerfilUrl && (
        <Dialog open={mostrarFotoAmpliada} onOpenChange={setMostrarFotoAmpliada}>
          <DialogContent className="max-w-[90vw] max-h-[90vh] border-0 bg-black/95 p-0" showCloseButton={false}>
            <DialogClose className="absolute top-3 right-3 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80">
              <XIcon className="h-6 w-6" />
            </DialogClose>
            <img
              src={obtenerUrlFoto(recepcionistaSeleccionado.fotoPerfilUrl) ?? ''}
              alt={`${recepcionistaSeleccionado.nombre} ${recepcionistaSeleccionado.apellido}`}
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
        nombreRol="El recepcionista"
      />
    </div>
  );
}