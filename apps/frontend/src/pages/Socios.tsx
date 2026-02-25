import { useState, useEffect, useCallback, useMemo, type FormEvent } from 'react';
import { toast } from 'sonner';
import { AlertCircle, CheckCircle2, Users } from 'lucide-react';
import { format as formatearFechaIso } from 'date-fns';

import { useAuth } from '@/contexts/AuthContext';
import { apiRequest, obtenerUrlFoto } from '@/lib/api';
import {
  formatearFechaArgentinaCorta,
  formatearFechaArgentinaParaInput,
} from '@/lib/fechasArgentina';
import { REGEX_DNI, REGEX_TELEFONO, REGEX_EMAIL, obtenerErroresContrasenia } from '@/lib/validaciones';
import type { Socio, CrearSocioDto, Genero } from '@/types/socio';
import { Button } from '@/components/ui/button';
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
import { DialogoZoomImagen } from '@/components/media/DialogoZoomImagen';

type CampoFormularioCreacion = keyof CrearSocioDto;
type CampoFormularioEdicion = keyof CrearSocioDto;
type ErroresFormularioCreacion = Partial<Record<CampoFormularioCreacion, string>>;
type ErroresFormularioEdicion = Partial<Record<CampoFormularioEdicion, string>>;
type ContextoAjusteFoto = 'CREACION' | 'EDICION';

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
  contrasena: '',
};

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

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
  
  const [socios, setSocios] = useState<Socio[]>([]);
  const [cargandoSocios, setCargandoSocios] = useState(false);
  const [errorSocios, setErrorSocios] = useState<string | null>(null);

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

  const [socioFormEdicion, setSocioFormEdicion] = useState<CrearSocioDto>(FORMULARIO_SOCIO_INICIAL);
  const [erroresEdicion, setErroresEdicion] = useState<ErroresFormularioEdicion>({});

  const [mostrarConfirmacionEliminar, setMostrarConfirmacionEliminar] = useState(false);
  const [socioAEliminar, setSocioAEliminar] = useState<Socio | null>(null);

  const [fotoCreacion, setFotoCreacion] = useState<File | null>(null);
  const [fotoEdicion, setFotoEdicion] = useState<File | null>(null);
  const [mostrarDialogoZoomFoto, setMostrarDialogoZoomFoto] = useState(false);
  const [archivoAjusteFoto, setArchivoAjusteFoto] = useState<File | null>(null);
  const [contextoAjusteFoto, setContextoAjusteFoto] =
    useState<ContextoAjusteFoto | null>(null);

  const cerrarDialogoZoomFoto = useCallback(() => {
    setMostrarDialogoZoomFoto(false);
    setArchivoAjusteFoto(null);
    setContextoAjusteFoto(null);
  }, []);

  const abrirDialogoZoomFoto = useCallback(
    (archivo: File, contexto: ContextoAjusteFoto) => {
      setArchivoAjusteFoto(archivo);
      setContextoAjusteFoto(contexto);
      setMostrarDialogoZoomFoto(true);
    },
    [],
  );

  const confirmarDialogoZoomFoto = useCallback(
    (archivoProcesado: File) => {
      if (contextoAjusteFoto === 'CREACION') {
        setFotoCreacion(archivoProcesado);
      }

      if (contextoAjusteFoto === 'EDICION') {
        setFotoEdicion(archivoProcesado);
      }

      cerrarDialogoZoomFoto();
      toast.success('Foto ajustada correctamente.');
    },
    [cerrarDialogoZoomFoto, contextoAjusteFoto],
  );

  const [mostrarModalDetalles, setMostrarModalDetalles] = useState(false);
  const [socioSeleccionado, setSocioSeleccionado] = useState<Socio | null>(null);

  const abrirModalDetalles = (socio: Socio) => {
    setSocioSeleccionado(socio);
    setMostrarModalDetalles(true);
  };

  const erroresContrasenia = useMemo(
    () => obtenerErroresContrasenia(socioForm.contrasena),
    [socioForm.contrasena],
  );

  const requisitosContrasenia = useMemo(
    () => [
      {
        descripcion: 'Al menos 8 caracteres',
        cumple: socioForm.contrasena.length >= 8,
      },
      {
        descripcion: 'Una letra mayúscula',
        cumple: /[A-Z]/.test(socioForm.contrasena),
      },
      {
        descripcion: 'Una letra minúscula',
        cumple: /[a-z]/.test(socioForm.contrasena),
      },
      {
        descripcion: 'Un número',
        cumple: /\d/.test(socioForm.contrasena),
      },
      {
        descripcion: 'Un símbolo especial',
        cumple: /[^A-Za-z0-9]/.test(socioForm.contrasena),
      },
    ],
    [socioForm.contrasena],
  );

  const normalizarTexto = (valor: string) => valor.trim().toLowerCase();

  const provinciasDisponibles = useMemo(() => {
    return Array.from(
      new Set(socios.map((socio) => socio.provincia.trim())),
    )
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));
  }, [socios]);

  const ciudadesDisponibles = useMemo(() => {
    const sociosPorProvincia =
      filtroProvincia === 'TODAS'
        ? socios
        : socios.filter((socio) => socio.provincia === filtroProvincia);

    return Array.from(
      new Set(sociosPorProvincia.map((socio) => socio.ciudad.trim())),
    )
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));
  }, [socios, filtroProvincia]);

  const sociosFiltradosOrdenados = useMemo(() => {
    const textoBusqueda = normalizarTexto(busquedaAplicada);

    return [...socios]
      .filter((socio) => {
        const coincideBusqueda =
          !textoBusqueda ||
          normalizarTexto(
            `${socio.nombre} ${socio.apellido} ${socio.email} ${socio.dni} ${socio.ciudad} ${socio.provincia}`,
          ).includes(textoBusqueda);

        const coincideEstado =
          filtroEstado === 'TODOS' ||
          (filtroEstado === 'ACTIVO' ? socio.activo : !socio.activo);

        const coincideProvincia =
          filtroProvincia === 'TODAS' || socio.provincia === filtroProvincia;

        const coincideCiudad = filtroCiudad === 'TODAS' || socio.ciudad === filtroCiudad;

        return (
          coincideBusqueda &&
          coincideEstado &&
          coincideProvincia &&
          coincideCiudad
        );
      })
      .sort((a, b) => {
        const multiplicador = direccionOrden === 'ASC' ? 1 : -1;

        switch (campoOrden) {
          case 'ESTADO': {
            const estadoA = a.activo ? 'ACTIVO' : 'INACTIVO';
            const estadoB = b.activo ? 'ACTIVO' : 'INACTIVO';
            return estadoA.localeCompare(estadoB) * multiplicador;
          }
          case 'NOMBRE':
          default: {
            const nombreA = `${a.apellido} ${a.nombre}`;
            const nombreB = `${b.apellido} ${b.nombre}`;
            return nombreA.localeCompare(nombreB) * multiplicador;
          }
        }
      });
  }, [
    busquedaAplicada,
    campoOrden,
    direccionOrden,
    filtroCiudad,
    filtroEstado,
    filtroProvincia,
    socios,
  ]);

  const totalPaginas = Math.max(
    1,
    Math.ceil(sociosFiltradosOrdenados.length / limitePorPagina),
  );

  const indiceInicio = (paginaActual - 1) * limitePorPagina;
  const indiceFin = indiceInicio + limitePorPagina;
  const sociosPaginados = sociosFiltradosOrdenados.slice(
    indiceInicio,
    indiceFin,
  );

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

  const actualizarCampoCreacion = useCallback(
    <K extends CampoFormularioCreacion>(campo: K, valor: CrearSocioDto[K]) => {
      setSocioForm((prev) => ({ ...prev, [campo]: valor }));
      setErroresCreacion((prev) => ({ ...prev, [campo]: undefined }));
      setErrorGeneralCreacion(null);
    },
    [],
  );

  const validarFormularioCreacion = useCallback((): ErroresFormularioCreacion => {
    const errores: ErroresFormularioCreacion = {};

    if (!socioForm.nombre.trim()) errores.nombre = 'Ingresá el nombre.';
    if (!socioForm.apellido.trim()) errores.apellido = 'Ingresá el apellido.';
    if (!REGEX_DNI.test(socioForm.dni.trim())) errores.dni = 'El DNI debe tener exactamente 8 dígitos.';
    if (!socioForm.fechaNacimiento) errores.fechaNacimiento = 'Seleccioná la fecha de nacimiento.';
    if (!REGEX_TELEFONO.test(socioForm.telefono.trim())) errores.telefono = 'Ingresá un teléfono válido (8 a 20 caracteres).';
    if (!socioForm.direccion.trim()) errores.direccion = 'Ingresá la dirección.';
    if (!socioForm.ciudad.trim()) errores.ciudad = 'Ingresá la ciudad.';
    if (!socioForm.provincia.trim()) errores.provincia = 'Ingresá la provincia.';
    if (!REGEX_EMAIL.test(socioForm.email.trim())) errores.email = 'Ingresá un email válido.';

    if (erroresContrasenia.length > 0) {
      errores.contrasena = 'La contraseña no cumple los requisitos mínimos de seguridad.';
    }

    return errores;
  }, [erroresContrasenia.length, socioForm]);

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
    cerrarDialogoZoomFoto();
  }, [cerrarDialogoZoomFoto]);

  const cargarSocios = useCallback(async () => {
    if (!token) return;

    try {
      setCargandoSocios(true);
      setErrorSocios(null);
      const response = await apiRequest<ApiResponse<Socio[]>>('/socio', { token });
      setSocios(response.data ?? []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'No se pudieron cargar los socios';
      setErrorSocios(errorMessage);
      toast.error(errorMessage);
    } finally {
      setCargandoSocios(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) {
      setCargandoSocios(false);
      setSocios([]);
      return;
    }

    void cargarSocios();
  }, [cargarSocios, token]);

  const crearSocio = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) return;

    const errores = validarFormularioCreacion();

    if (Object.keys(errores).length > 0) {
      setErroresCreacion(errores);
      setErrorGeneralCreacion('Revisá los campos marcados antes de continuar.');
      return;
    }

    try {
      // Usar FormData si hay foto, sino JSON normal
      if (fotoCreacion) {
        const formData = new FormData();
        formData.append('foto', fotoCreacion);
        Object.entries(socioForm).forEach(([key, value]) => {
          formData.append(key, String(value));
        });
        
        await apiRequest('/socio', {
          method: 'POST',
          token,
          formData,
        });
      } else {
        await apiRequest('/socio', {
          method: 'POST',
          token,
          body: socioForm,
        });
      }
      
      toast.success('Socio creado exitosamente');
      setMostrarFormularioSocio(false);
      limpiarEstadoCreacion();
      setFotoCreacion(null);
      await cargarSocios();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'No se pudo crear el socio';
      setErrorGeneralCreacion(errorMessage);
      toast.error(errorMessage);
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
      contrasena: '',
    });
    setErroresEdicion({});
    setFotoEdicion(null);
    cerrarDialogoZoomFoto();
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
      const payload = {
        ...socioFormEdicion,
        ...(socioFormEdicion.contrasena ? {} : { contraseña: undefined }),
      };

      // Usar FormData si hay foto, sino JSON normal
      if (fotoEdicion) {
        const formData = new FormData();
        formData.append('foto', fotoEdicion);
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
      await cargarSocios();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'No se pudo editar el socio';
      toast.error(errorMessage);
    }
  };

  const confirmarEliminar = (socio: Socio) => {
    setSocioAEliminar(socio);
    setMostrarConfirmacionEliminar(true);
  };

  const eliminarSocio = async () => {
    if (!token || !socioAEliminar) return;

    try {
      await apiRequest(`/socio/${socioAEliminar.idPersona}`, {
        method: 'DELETE',
        token,
      });

      toast.success('Socio dado de baja exitosamente');
      setMostrarConfirmacionEliminar(false);
      setSocioAEliminar(null);
      await cargarSocios();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'No se pudo dar de baja el socio';
      toast.error(errorMessage);
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
      await cargarSocios();
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
              onClick={() => void cargarSocios()}
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
              Resultados: <span className="font-medium text-foreground">{sociosFiltradosOrdenados.length}</span>
            </p>

            <div className="flex items-center gap-2">
              <select
                className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
                value={limitePorPagina}
                onChange={(event) => setLimitePorPagina(Number(event.target.value))}
              >
                <option value={6}>6 por página</option>
                <option value={9}>9 por página</option>
                <option value={12}>12 por página</option>
                <option value={18}>18 por página</option>
              </select>
              <Button variant="outline" size="sm" onClick={limpiarFiltros}>
                Limpiar filtros
              </Button>
            </div>
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
          ) : sociosFiltradosOrdenados.length === 0 ? (
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
                    {sociosPaginados.map((socio) => (
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
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => abrirModalEdicion(socio)}
                              disabled={!socio.activo}
                            >
                              Editar
                            </Button>
                            {socio.activo ? (
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={() => confirmarEliminar(socio)}
                              >
                                Baja
                              </Button>
                            ) : (
                              <Button
                                type="button"
                                variant="default"
                                size="sm"
                                className="bg-emerald-600 hover:bg-emerald-700"
                                onClick={() => void reactivarSocio(socio)}
                              >
                                Reactivar
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex flex-col gap-2 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  Mostrando{' '}
                  <span className="font-medium text-foreground">{indiceInicio + 1}</span>
                  {' - '}
                  <span className="font-medium text-foreground">
                    {Math.min(indiceFin, sociosFiltradosOrdenados.length)}
                  </span>
                  {' de '}
                  <span className="font-medium text-foreground">
                    {sociosFiltradosOrdenados.length}
                  </span>
                </p>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setPaginaActual((previa) => Math.max(1, previa - 1))}
                    disabled={paginaActual === 1}
                  >
                    Anterior
                  </Button>

                  <span className="text-sm text-muted-foreground">
                    Página {paginaActual} de {totalPaginas}
                  </span>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setPaginaActual((previa) => Math.min(totalPaginas, previa + 1))
                    }
                    disabled={paginaActual === totalPaginas}
                  >
                    Siguiente
                  </Button>
                </div>
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
                    <Label htmlFor="crear-foto">Foto (opcional)</Label>
                    <Input
                      id="crear-foto"
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const archivo = e.target.files?.[0];
                        if (archivo) {
                          abrirDialogoZoomFoto(archivo, 'CREACION');
                        }
                        e.currentTarget.value = '';
                      }}
                    />
                    {fotoCreacion && (
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-muted-foreground">
                          Archivo seleccionado: {fotoCreacion.name}
                        </p>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-auto px-2 py-1 text-xs"
                          onClick={() => abrirDialogoZoomFoto(fotoCreacion, 'CREACION')}
                        >
                          Ajustar zoom
                        </Button>
                      </div>
                    )}
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
                <h3 className="text-sm font-semibold text-foreground">Seguridad</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="crear-password" required>Contraseña temporal</Label>
                    <Input
                      id="crear-password"
                      type="password"
                      autoComplete="new-password"
                      value={socioForm.contrasena}
                      onChange={(e) => actualizarCampoCreacion('contrasena', e.target.value)}
                      aria-invalid={Boolean(erroresCreacion.contrasena)}
                      required
                    />
                    {erroresCreacion.contrasena && <p className="text-xs font-medium text-destructive">{erroresCreacion.contrasena}</p>}
                    <div className="rounded-md border bg-muted/20 p-3">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Seguridad de contraseña
                      </p>
                      <ul className="space-y-1 text-xs">
                        {requisitosContrasenia.map((regla) => {
                          const colorTexto = regla.cumple ? 'text-emerald-700' : 'text-muted-foreground';

                          return (
                            <li
                              key={regla.descripcion}
                              className={`flex items-center gap-2 ${colorTexto}`}
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span>{regla.descripcion}</span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
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
              <Button type="submit">Crear socio</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={mostrarConfirmacionEliminar} onOpenChange={setMostrarConfirmacionEliminar}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar baja</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que querés dar de baja a {socioAEliminar?.nombre} {socioAEliminar?.apellido}?
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
                setSocioAEliminar(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={eliminarSocio}
            >
              Dar de baja
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={mostrarFormularioEdicion}
        onOpenChange={(open) => {
          setMostrarFormularioEdicion(open);
          if (!open) {
            setFotoEdicion(null);
            cerrarDialogoZoomFoto();
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
                    <Label htmlFor="editar-foto">Nueva foto (opcional)</Label>
                    <Input
                      id="editar-foto"
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const archivo = e.target.files?.[0];
                        if (archivo) {
                          abrirDialogoZoomFoto(archivo, 'EDICION');
                        }
                        e.currentTarget.value = '';
                      }}
                    />
                    {fotoEdicion && (
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-muted-foreground">
                          Archivo seleccionado: {fotoEdicion.name}
                        </p>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-auto px-2 py-1 text-xs"
                          onClick={() => abrirDialogoZoomFoto(fotoEdicion, 'EDICION')}
                        >
                          Ajustar zoom
                        </Button>
                      </div>
                    )}
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
                <h3 className="text-sm font-semibold text-foreground">Seguridad (opcional)</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="editar-password">Nueva contraseña</Label>
                    <Input id="editar-password" type="password" autoComplete="new-password" value={socioFormEdicion.contrasena} onChange={(e) => setSocioFormEdicion({ ...socioFormEdicion, contrasena: e.target.value })} />
                    <p className="text-xs text-muted-foreground">Dejá en blanco para mantener la contraseña actual.</p>
                  </div>
                </div>
              </section>
            </div>
            <div className="flex justify-end gap-2 border-t bg-background px-6 py-4">
              <Button type="button" variant="outline" onClick={() => setMostrarFormularioEdicion(false)}>
                Cancelar
              </Button>
              <Button type="submit">Guardar cambios</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <DialogoZoomImagen
        abierto={mostrarDialogoZoomFoto}
        archivoOriginal={archivoAjusteFoto}
        titulo="Ajustar foto del socio"
        descripcion="Podés acercar la imagen para centrar mejor el perfil antes de guardar."
        textoBotonConfirmar="Usar esta imagen"
        onCancelar={cerrarDialogoZoomFoto}
        onConfirmar={confirmarDialogoZoomFoto}
      />

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
    </div>
  );
}
