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
import type { Nutricionista, CrearNutricionistaDto, Genero } from '@/types/nutricionista';
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

type CampoFormularioCreacion = keyof CrearNutricionistaDto;
type CampoFormularioEdicion = keyof CrearNutricionistaDto;
type ErroresFormularioCreacion = Partial<Record<CampoFormularioCreacion, string>>;
type ErroresFormularioEdicion = Partial<Record<CampoFormularioEdicion, string>>;
type ContextoAjusteFoto = 'CREACION' | 'EDICION';

const FORMULARIO_NUTRICIONISTA_INICIAL: CrearNutricionistaDto = {
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
  matricula: '',
  añosExperiencia: 0,
  tarifaSesion: 0,
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

export function Nutricionistas() {
  const { token } = useAuth();
  
  const [nutricionistas, setNutricionistas] = useState<Nutricionista[]>([]);
  const [cargandoNutricionistas, setCargandoNutricionistas] = useState(false);
  const [errorNutricionistas, setErrorNutricionistas] = useState<string | null>(null);

  const [busqueda, setBusqueda] = useState('');
  const [busquedaAplicada, setBusquedaAplicada] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<'TODOS' | 'ACTIVO' | 'INACTIVO'>('TODOS');
  const [filtroProvincia, setFiltroProvincia] = useState('TODAS');
  const [filtroCiudad, setFiltroCiudad] = useState('TODAS');
  const [filtroAntiguedad, setFiltroAntiguedad] = useState<
    'TODAS' | '0-2' | '3-5' | '6-10' | '11+'
  >('TODAS');
  const [campoOrden, setCampoOrden] = useState<'NOMBRE' | 'ESTADO' | 'EXPERIENCIA'>('NOMBRE');
  const [direccionOrden, setDireccionOrden] = useState<'ASC' | 'DESC'>('ASC');
  const [limitePorPagina, setLimitePorPagina] = useState(9);
  const [paginaActual, setPaginaActual] = useState(1);

  const [mostrarFormularioNutricionista, setMostrarFormularioNutricionista] = useState(false);
  const [mostrarFormularioEdicion, setMostrarFormularioEdicion] = useState(false);
  const [idNutricionistaEditando, setIdNutricionistaEditando] = useState<number | null>(null);
  
  const [nutricionistaForm, setNutricionistaForm] = useState<CrearNutricionistaDto>(FORMULARIO_NUTRICIONISTA_INICIAL);
  const [erroresCreacion, setErroresCreacion] = useState<ErroresFormularioCreacion>({});
  const [errorGeneralCreacion, setErrorGeneralCreacion] = useState<string | null>(null);
  const [fotoCreacion, setFotoCreacion] = useState<File | null>(null);
  const [mostrarDialogoZoomFoto, setMostrarDialogoZoomFoto] = useState(false);
  const [archivoAjusteFoto, setArchivoAjusteFoto] = useState<File | null>(null);
  const [contextoAjusteFoto, setContextoAjusteFoto] =
    useState<ContextoAjusteFoto | null>(null);

  const [nutricionistaFormEdicion, setNutricionistaFormEdicion] = useState<CrearNutricionistaDto>(FORMULARIO_NUTRICIONISTA_INICIAL);
  const [erroresEdicion, setErroresEdicion] = useState<ErroresFormularioEdicion>({});
  const [fotoEdicion, setFotoEdicion] = useState<File | null>(null);

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

  const [mostrarConfirmacionEliminar, setMostrarConfirmacionEliminar] = useState(false);
  const [nutricionistaAEliminar, setNutricionistaAEliminar] = useState<Nutricionista | null>(null);

  const [mostrarModalDetalles, setMostrarModalDetalles] = useState(false);
  const [nutricionistaSeleccionado, setNutricionistaSeleccionado] = useState<Nutricionista | null>(null);

  const abrirModalDetalles = (nutricionista: Nutricionista) => {
    setNutricionistaSeleccionado(nutricionista);
    setMostrarModalDetalles(true);
  };

  const normalizarTexto = (valor: string) => valor.trim().toLowerCase();

  const cumpleFiltroAntiguedad = (
    aniosExperiencia: number,
    filtro: 'TODAS' | '0-2' | '3-5' | '6-10' | '11+',
  ) => {
    switch (filtro) {
      case '0-2':
        return aniosExperiencia >= 0 && aniosExperiencia <= 2;
      case '3-5':
        return aniosExperiencia >= 3 && aniosExperiencia <= 5;
      case '6-10':
        return aniosExperiencia >= 6 && aniosExperiencia <= 10;
      case '11+':
        return aniosExperiencia >= 11;
      default:
        return true;
    }
  };

  const erroresContrasenia = useMemo(
    () => obtenerErroresContrasenia(nutricionistaForm.contrasena),
    [nutricionistaForm.contrasena],
  );

  const requisitosContrasenia = useMemo(
    () => [
      {
        descripcion: 'Al menos 8 caracteres',
        cumple: nutricionistaForm.contrasena.length >= 8,
      },
      {
        descripcion: 'Una letra mayúscula',
        cumple: /[A-Z]/.test(nutricionistaForm.contrasena),
      },
      {
        descripcion: 'Una letra minúscula',
        cumple: /[a-z]/.test(nutricionistaForm.contrasena),
      },
      {
        descripcion: 'Un número',
        cumple: /\d/.test(nutricionistaForm.contrasena),
      },
      {
        descripcion: 'Un símbolo especial',
        cumple: /[^A-Za-z0-9]/.test(nutricionistaForm.contrasena),
      },
    ],
    [nutricionistaForm.contrasena],
  );

  const actualizarCampoCreacion = useCallback(
    <K extends CampoFormularioCreacion>(campo: K, valor: CrearNutricionistaDto[K]) => {
      setNutricionistaForm((prev) => ({ ...prev, [campo]: valor }));
      setErroresCreacion((prev) => ({ ...prev, [campo]: undefined }));
      setErrorGeneralCreacion(null);
    },
    [],
  );

  const validarFormularioCreacion = useCallback((): ErroresFormularioCreacion => {
    const errores: ErroresFormularioCreacion = {};

    if (!nutricionistaForm.nombre.trim()) errores.nombre = 'Ingresá el nombre.';
    if (!nutricionistaForm.apellido.trim()) errores.apellido = 'Ingresá el apellido.';
    if (!REGEX_DNI.test(nutricionistaForm.dni.trim())) errores.dni = 'El DNI debe tener exactamente 8 dígitos.';
    if (!nutricionistaForm.fechaNacimiento) errores.fechaNacimiento = 'Seleccioná la fecha de nacimiento.';
    if (!REGEX_TELEFONO.test(nutricionistaForm.telefono.trim())) errores.telefono = 'Ingresá un teléfono válido (8 a 20 caracteres).';
    if (!nutricionistaForm.direccion.trim()) errores.direccion = 'Ingresá la dirección.';
    if (!nutricionistaForm.ciudad.trim()) errores.ciudad = 'Ingresá la ciudad.';
    if (!nutricionistaForm.provincia.trim()) errores.provincia = 'Ingresá la provincia.';
    if (!REGEX_EMAIL.test(nutricionistaForm.email.trim())) errores.email = 'Ingresá un email válido.';
    if (!nutricionistaForm.matricula.trim()) errores.matricula = 'Ingresá la matrícula.';
    if (nutricionistaForm.añosExperiencia < 0) errores.añosExperiencia = 'Los años de experiencia no pueden ser negativos.';
    if (nutricionistaForm.tarifaSesion <= 0) errores.tarifaSesion = 'La tarifa por sesión debe ser mayor a 0.';

    if (erroresContrasenia.length > 0) {
      errores.contrasena = 'La contraseña no cumple los requisitos mínimos de seguridad.';
    }

    return errores;
  }, [erroresContrasenia.length, nutricionistaForm]);

  const validarFormularioEdicion = useCallback((): ErroresFormularioEdicion => {
    const errores: ErroresFormularioEdicion = {};

    if (!nutricionistaFormEdicion.nombre.trim()) errores.nombre = 'Ingresá el nombre.';
    if (!nutricionistaFormEdicion.apellido.trim()) errores.apellido = 'Ingresá el apellido.';
    if (!REGEX_DNI.test(nutricionistaFormEdicion.dni.trim())) errores.dni = 'El DNI debe tener exactamente 8 dígitos.';
    if (!nutricionistaFormEdicion.fechaNacimiento) errores.fechaNacimiento = 'Seleccioná la fecha de nacimiento.';
    if (!REGEX_TELEFONO.test(nutricionistaFormEdicion.telefono.trim())) errores.telefono = 'Ingresá un teléfono válido (8 a 20 caracteres).';
    if (!nutricionistaFormEdicion.direccion.trim()) errores.direccion = 'Ingresá la dirección.';
    if (!nutricionistaFormEdicion.ciudad.trim()) errores.ciudad = 'Ingresá la ciudad.';
    if (!nutricionistaFormEdicion.provincia.trim()) errores.provincia = 'Ingresá la provincia.';
    if (!REGEX_EMAIL.test(nutricionistaFormEdicion.email.trim())) errores.email = 'Ingresá un email válido.';
    if (!nutricionistaFormEdicion.matricula.trim()) errores.matricula = 'Ingresá la matrícula.';
    if (nutricionistaFormEdicion.añosExperiencia < 0) errores.añosExperiencia = 'Los años de experiencia no pueden ser negativos.';
    if (nutricionistaFormEdicion.tarifaSesion <= 0) errores.tarifaSesion = 'La tarifa por sesión debe ser mayor a 0.';

    return errores;
  }, [nutricionistaFormEdicion]);

  const limpiarEstadoCreacion = useCallback(() => {
    setNutricionistaForm(FORMULARIO_NUTRICIONISTA_INICIAL);
    setErroresCreacion({});
    setErrorGeneralCreacion(null);
    setFotoCreacion(null);
    cerrarDialogoZoomFoto();
  }, [cerrarDialogoZoomFoto]);

  const provinciasDisponibles = useMemo(() => {
    return Array.from(
      new Set(nutricionistas.map((nutricionista) => nutricionista.provincia.trim())),
    )
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));
  }, [nutricionistas]);

  const ciudadesDisponibles = useMemo(() => {
    const nutricionistasPorProvincia =
      filtroProvincia === 'TODAS'
        ? nutricionistas
        : nutricionistas.filter((nutricionista) => nutricionista.provincia === filtroProvincia);

    return Array.from(
      new Set(nutricionistasPorProvincia.map((nutricionista) => nutricionista.ciudad.trim())),
    )
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));
  }, [nutricionistas, filtroProvincia]);

  const nutricionistasFiltradosOrdenados = useMemo(() => {
    const textoBusqueda = normalizarTexto(busquedaAplicada);

    return [...nutricionistas]
      .filter((nutricionista) => {
        const coincideBusqueda =
          !textoBusqueda ||
          normalizarTexto(
            `${nutricionista.nombre} ${nutricionista.apellido} ${nutricionista.email} ${nutricionista.matricula} ${nutricionista.dni} ${nutricionista.ciudad} ${nutricionista.provincia}`,
          ).includes(textoBusqueda);

        const coincideEstado =
          filtroEstado === 'TODOS' ||
          (filtroEstado === 'ACTIVO' ? nutricionista.activo : !nutricionista.activo);

        const coincideProvincia =
          filtroProvincia === 'TODAS' || nutricionista.provincia === filtroProvincia;

        const coincideCiudad = filtroCiudad === 'TODAS' || nutricionista.ciudad === filtroCiudad;

        const coincideAntiguedad = cumpleFiltroAntiguedad(
          nutricionista.añosExperiencia,
          filtroAntiguedad,
        );

        return (
          coincideBusqueda &&
          coincideEstado &&
          coincideProvincia &&
          coincideCiudad &&
          coincideAntiguedad
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
          case 'EXPERIENCIA':
            return (a.añosExperiencia - b.añosExperiencia) * multiplicador;
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
    filtroAntiguedad,
    filtroCiudad,
    filtroEstado,
    filtroProvincia,
    nutricionistas,
  ]);

  const totalPaginas = Math.max(
    1,
    Math.ceil(nutricionistasFiltradosOrdenados.length / limitePorPagina),
  );

  const indiceInicio = (paginaActual - 1) * limitePorPagina;
  const indiceFin = indiceInicio + limitePorPagina;
  const nutricionistasPaginados = nutricionistasFiltradosOrdenados.slice(
    indiceInicio,
    indiceFin,
  );

  const limpiarFiltros = () => {
    setBusqueda('');
    setBusquedaAplicada('');
    setFiltroEstado('TODOS');
    setFiltroProvincia('TODAS');
    setFiltroCiudad('TODAS');
    setFiltroAntiguedad('TODAS');
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
    filtroAntiguedad,
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

  const cargarNutricionistas = useCallback(async () => {
    if (!token) return;

    try {
      setCargandoNutricionistas(true);
      setErrorNutricionistas(null);
      const response = await apiRequest<ApiResponse<Nutricionista[]>>('/profesional', { token });
      setNutricionistas(response.data ?? []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'No se pudieron cargar los nutricionistas';
      setErrorNutricionistas(errorMessage);
      toast.error(errorMessage);
    } finally {
      setCargandoNutricionistas(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) {
      setCargandoNutricionistas(false);
      setNutricionistas([]);
      return;
    }

    void cargarNutricionistas();
  }, [cargarNutricionistas, token]);

  const crearNutricionista = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) return;

    const errores = validarFormularioCreacion();

    if (Object.keys(errores).length > 0) {
      setErroresCreacion(errores);
      setErrorGeneralCreacion('Revisá los campos marcados antes de continuar.');
      return;
    }

    try {
      if (fotoCreacion) {
        const formData = new FormData();
        formData.append('foto', fotoCreacion);
        Object.entries(nutricionistaForm).forEach(([key, value]) => {
          formData.append(key, String(value));
        });
        await apiRequest('/profesional', {
          method: 'POST',
          token,
          formData,
        });
      } else {
        await apiRequest('/profesional', {
          method: 'POST',
          token,
          body: nutricionistaForm,
        });
      }
      
      toast.success('Nutricionista creado exitosamente');
      setMostrarFormularioNutricionista(false);
      limpiarEstadoCreacion();
      setFotoCreacion(null);
      await cargarNutricionistas();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'No se pudo crear el nutricionista';
      setErrorGeneralCreacion(errorMessage);
      toast.error(errorMessage);
    }
  };

  const abrirModalEdicion = (nutricionista: Nutricionista) => {
    setIdNutricionistaEditando(nutricionista.idPersona);
    setNutricionistaFormEdicion({
      nombre: nutricionista.nombre,
      apellido: nutricionista.apellido,
      dni: nutricionista.dni,
      fechaNacimiento: nutricionista.fechaNacimiento
        ? formatearFechaArgentinaParaInput(nutricionista.fechaNacimiento)
        : '',
      telefono: nutricionista.telefono,
      genero: nutricionista.genero,
      direccion: nutricionista.direccion,
      ciudad: nutricionista.ciudad,
      provincia: nutricionista.provincia,
      email: nutricionista.email,
      matricula: nutricionista.matricula,
      añosExperiencia: nutricionista.añosExperiencia,
      tarifaSesion: nutricionista.tarifaSesion,
      contrasena: '',
    });
    setErroresEdicion({});
    setFotoEdicion(null);
    cerrarDialogoZoomFoto();
    setMostrarFormularioEdicion(true);
  };

  const editarNutricionista = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token || idNutricionistaEditando === null) return;

    // Validar antes de enviar
    const errores = validarFormularioEdicion();
    if (Object.keys(errores).length > 0) {
      setErroresEdicion(errores);
      toast.error('Por favor, corregí los errores del formulario');
      return;
    }

    try {
      if (fotoEdicion) {
        const formData = new FormData();
        formData.append('foto', fotoEdicion);
        Object.entries(nutricionistaFormEdicion).forEach(([key, value]) => {
          if (key !== 'contrasena' || value) {
            formData.append(key, String(value));
          }
        });
        await apiRequest(`/profesional/${idNutricionistaEditando}`, {
          method: 'PUT',
          token,
          formData,
        });
      } else {
        const payload = {
          ...nutricionistaFormEdicion,
          ...(nutricionistaFormEdicion.contrasena ? {} : { contrasena: undefined }),
        };

        await apiRequest(`/profesional/${idNutricionistaEditando}`, {
          method: 'PUT',
          token,
          body: payload,
        });
      }

      toast.success('Nutricionista actualizado exitosamente');
      setMostrarFormularioEdicion(false);
      setIdNutricionistaEditando(null);
      setErroresEdicion({});
      setFotoEdicion(null);
      await cargarNutricionistas();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'No se pudo editar el nutricionista';
      toast.error(errorMessage);
    }
  };

  const confirmarEliminar = (nutricionista: Nutricionista) => {
    setNutricionistaAEliminar(nutricionista);
    setMostrarConfirmacionEliminar(true);
  };

  const eliminarNutricionista = async () => {
    if (!token || !nutricionistaAEliminar) return;

    try {
      await apiRequest(`/profesional/${nutricionistaAEliminar.idPersona}`, {
        method: 'DELETE',
        token,
      });

      toast.success('Nutricionista dado de baja exitosamente');
      setMostrarConfirmacionEliminar(false);
      setNutricionistaAEliminar(null);
      await cargarNutricionistas();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'No se pudo dar de baja el nutricionista';
      toast.error(errorMessage);
    }
  };

  const reactivarNutricionista = async (nutricionista: Nutricionista) => {
    if (!token) return;

    try {
      await apiRequest(`/profesional/${nutricionista.idPersona}/reactivar`, {
        method: 'POST',
        token,
      });

      toast.success('Nutricionista reactivado exitosamente');
      await cargarNutricionistas();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'No se pudo reactivar el nutricionista';
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
                Gestión de Nutricionistas
              </h1>
            </div>
            <p className="text-muted-foreground">
              Administración profesional de altas, bajas y seguimiento del equipo.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => void cargarNutricionistas()}
              type="button"
              disabled={cargandoNutricionistas}
            >
              Refrescar
            </Button>
            <Button
              onClick={() => setMostrarFormularioNutricionista(true)}
              type="button"
            >
              Nuevo nutricionista
            </Button>
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr_1fr_1fr]">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Buscar</p>
              <Input
                placeholder="Nombre, apellido, email, matrícula o DNI"
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
              <p className="text-xs text-muted-foreground">Antigüedad</p>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={filtroAntiguedad}
                onChange={(event) =>
                  setFiltroAntiguedad(
                    event.target.value as 'TODAS' | '0-2' | '3-5' | '6-10' | '11+',
                  )
                }
              >
                <option value="TODAS">Todas</option>
                <option value="0-2">0 a 2 años</option>
                <option value="3-5">3 a 5 años</option>
                <option value="6-10">6 a 10 años</option>
                <option value="11+">11+ años</option>
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
                      event.target.value as 'NOMBRE' | 'ESTADO' | 'EXPERIENCIA',
                    )
                  }
                >
                  <option value="NOMBRE">Nombre</option>
                  <option value="ESTADO">Estado</option>
                  <option value="EXPERIENCIA">Experiencia</option>
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
              Resultados: <span className="font-medium text-foreground">{nutricionistasFiltradosOrdenados.length}</span>
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

          {errorNutricionistas && (
            <Alert variant="destructive" className="border-destructive/30 bg-destructive/5">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>No se pudo cargar el listado</AlertTitle>
              <AlertDescription>{errorNutricionistas}</AlertDescription>
            </Alert>
          )}

          {cargandoNutricionistas ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={`skeleton-${index}`} className="flex gap-4 rounded-md border p-4">
                  <div className="h-4 w-8 animate-pulse rounded bg-muted" />
                  <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                  <div className="h-4 w-48 animate-pulse rounded bg-muted" />
                  <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                  <div className="h-4 w-20 animate-pulse rounded bg-muted" />
                </div>
              ))}
            </div>
          ) : nutricionistas.length === 0 ? (
            <div className="rounded-md border border-dashed p-10 text-center text-muted-foreground">
              No hay nutricionistas registrados.
            </div>
          ) : nutricionistasFiltradosOrdenados.length === 0 ? (
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
                      <TableHead>Matrícula</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead className="w-20">Exp.</TableHead>
                      <TableHead className="w-24">Tarifa</TableHead>
                      <TableHead className="w-24">Estado</TableHead>
                      <TableHead className="w-36 text-center">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {nutricionistasPaginados.map((nutricionista) => (
                      <TableRow key={nutricionista.idPersona} className={!nutricionista.activo ? 'opacity-60' : ''}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar
                              size="default"
                              className="size-10 ring-1 ring-border/60"
                            >
                              {nutricionista.fotoPerfilUrl && (
                                <AvatarImage
                                  src={
                                    obtenerUrlFoto(nutricionista.fotoPerfilUrl) ??
                                    undefined
                                  }
                                  alt={`${nutricionista.nombre} ${nutricionista.apellido}`}
                                  className="object-cover object-center"
                                />
                              )}
                              <AvatarFallback className="text-xs font-medium bg-primary/10 text-primary">
                                {obtenerIniciales(nutricionista.nombre, nutricionista.apellido)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{nutricionista.nombre} {nutricionista.apellido}</p>
                              <p className="text-xs text-muted-foreground">{nutricionista.ciudad}, {nutricionista.provincia}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{nutricionista.matricula}</TableCell>
                        <TableCell className="text-sm">{nutricionista.email}</TableCell>
                        <TableCell className="text-center text-sm">{nutricionista.añosExperiencia} años</TableCell>
                        <TableCell className="text-sm font-medium">${nutricionista.tarifaSesion}</TableCell>
                        <TableCell>
                          {nutricionista.activo ? (
                            <Badge variant="default" className="bg-emerald-600">Activo</Badge>
                          ) : (
                            <div className="space-y-1">
                              <Badge variant="destructive">Inactivo</Badge>
                              {nutricionista.fechaBaja && (
                                <p className="text-xs text-muted-foreground">
                                  {formatearFechaArgentinaCorta(nutricionista.fechaBaja)}
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
                              onClick={() => abrirModalDetalles(nutricionista)}
                            >
                              Ver
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => abrirModalEdicion(nutricionista)}
                              disabled={!nutricionista.activo}
                            >
                              Editar
                            </Button>
                            {nutricionista.activo ? (
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={() => confirmarEliminar(nutricionista)}
                              >
                                Baja
                              </Button>
                            ) : (
                              <Button
                                type="button"
                                variant="default"
                                size="sm"
                                className="bg-emerald-600 hover:bg-emerald-700"
                                onClick={() => void reactivarNutricionista(nutricionista)}
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
                    {Math.min(indiceFin, nutricionistasFiltradosOrdenados.length)}
                  </span>
                  {' de '}
                  <span className="font-medium text-foreground">
                    {nutricionistasFiltradosOrdenados.length}
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
          open={mostrarFormularioNutricionista}
          onOpenChange={(open) => {
            setMostrarFormularioNutricionista(open);
            if (!open) {
              limpiarEstadoCreacion();
            }
          }}
        >
        <DialogContent className="max-w-4xl p-0">
          <DialogHeader className="border-b px-6 py-4">
            <DialogTitle>Nuevo nutricionista</DialogTitle>
            <DialogDescription>
              Completa los datos para registrar un nuevo nutricionista.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={crearNutricionista} autoComplete="off">
            <div className="max-h-[68vh] space-y-6 overflow-y-auto px-6 py-5">
              {errorGeneralCreacion && (
                <Alert variant="destructive" className="border-destructive/30 bg-destructive/5">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>No se pudo crear el nutricionista</AlertTitle>
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
                      value={nutricionistaForm.nombre}
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
                      value={nutricionistaForm.apellido}
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
                      value={nutricionistaForm.dni}
                      onChange={(e) => actualizarCampoCreacion('dni', e.target.value)}
                      aria-invalid={Boolean(erroresCreacion.dni)}
                      required
                    />
                    {erroresCreacion.dni && <p className="text-xs font-medium text-destructive">{erroresCreacion.dni}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label required>Fecha de nacimiento</Label>
                    <DatePicker
                      date={parsearFechaInput(nutricionistaForm.fechaNacimiento)}
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
                      value={nutricionistaForm.genero}
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
                      value={nutricionistaForm.telefono}
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
                      value={nutricionistaForm.direccion}
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
                      value={nutricionistaForm.ciudad}
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
                      value={nutricionistaForm.provincia}
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
                      value={nutricionistaForm.email}
                      onChange={(e) => actualizarCampoCreacion('email', e.target.value)}
                      aria-invalid={Boolean(erroresCreacion.email)}
                      required
                    />
                    {erroresCreacion.email && <p className="text-xs font-medium text-destructive">{erroresCreacion.email}</p>}
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <h3 className="text-sm font-semibold text-foreground">Datos profesionales</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="crear-matricula" required>Matrícula</Label>
                    <Input
                      id="crear-matricula"
                      value={nutricionistaForm.matricula}
                      onChange={(e) => actualizarCampoCreacion('matricula', e.target.value)}
                      aria-invalid={Boolean(erroresCreacion.matricula)}
                      required
                    />
                    {erroresCreacion.matricula && <p className="text-xs font-medium text-destructive">{erroresCreacion.matricula}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="crear-anios" required>Años de experiencia</Label>
                    <Input
                      id="crear-anios"
                      type="number"
                      min={0}
                      value={nutricionistaForm.añosExperiencia}
                      onChange={(e) => actualizarCampoCreacion('añosExperiencia', parseInt(e.target.value, 10) || 0)}
                      aria-invalid={Boolean(erroresCreacion.añosExperiencia)}
                      required
                    />
                    {erroresCreacion.añosExperiencia && <p className="text-xs font-medium text-destructive">{erroresCreacion.añosExperiencia}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="crear-tarifa" required>Tarifa por sesión</Label>
                    <Input
                      id="crear-tarifa"
                      type="number"
                      min={0}
                      step="0.01"
                      value={nutricionistaForm.tarifaSesion}
                      onChange={(e) => actualizarCampoCreacion('tarifaSesion', parseFloat(e.target.value) || 0)}
                      aria-invalid={Boolean(erroresCreacion.tarifaSesion)}
                      required
                    />
                    {erroresCreacion.tarifaSesion && <p className="text-xs font-medium text-destructive">{erroresCreacion.tarifaSesion}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="crear-password" required>Contraseña temporal</Label>
                    <Input
                      id="crear-password"
                      type="password"
                      autoComplete="new-password"
                      value={nutricionistaForm.contrasena}
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
                onClick={() => setMostrarFormularioNutricionista(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">Crear nutricionista</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={mostrarConfirmacionEliminar} onOpenChange={setMostrarConfirmacionEliminar}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar baja</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que querés dar de baja a {nutricionistaAEliminar?.nombre} {nutricionistaAEliminar?.apellido}?
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
                setNutricionistaAEliminar(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={eliminarNutricionista}
            >
              Dar de baja
            </Button>
          </div>
        </DialogContent>
      </Dialog>

       <Dialog open={mostrarFormularioEdicion} onOpenChange={(open) => {
         setMostrarFormularioEdicion(open);
         if (!open) {
           setFotoEdicion(null);
            cerrarDialogoZoomFoto();
          }
        }}>
        <DialogContent className="max-w-4xl p-0">
          <DialogHeader className="border-b px-6 py-4">
            <DialogTitle>Editar Nutricionista</DialogTitle>
            <DialogDescription>
              Actualiza la información del nutricionista seleccionado.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={editarNutricionista} autoComplete="off">
            <div className="max-h-[68vh] space-y-6 overflow-y-auto px-6 py-5">
              <section className="space-y-4">
                <h3 className="text-sm font-semibold text-foreground">Datos personales</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="editar-nombre">Nombre</Label>
                    <Input id="editar-nombre" value={nutricionistaFormEdicion.nombre} onChange={(e) => setNutricionistaFormEdicion({ ...nutricionistaFormEdicion, nombre: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editar-apellido">Apellido</Label>
                    <Input id="editar-apellido" value={nutricionistaFormEdicion.apellido} onChange={(e) => setNutricionistaFormEdicion({ ...nutricionistaFormEdicion, apellido: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editar-dni">DNI</Label>
                    <Input
                      id="editar-dni"
                      inputMode="numeric"
                      maxLength={8}
                      value={nutricionistaFormEdicion.dni}
                      onChange={(e) => setNutricionistaFormEdicion({ ...nutricionistaFormEdicion, dni: e.target.value })}
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
                      date={parsearFechaInput(nutricionistaFormEdicion.fechaNacimiento)}
                      setDate={(fecha) =>
                        setNutricionistaFormEdicion({
                          ...nutricionistaFormEdicion,
                          fechaNacimiento: formatearFechaParaInput(fecha),
                        })
                      }
                      placeholder="Seleccionar fecha"
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editar-genero">Género</Label>
                    <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" id="editar-genero" value={nutricionistaFormEdicion.genero} onChange={(e) => setNutricionistaFormEdicion({ ...nutricionistaFormEdicion, genero: e.target.value as Genero })} required>
                      <option value="MASCULINO">Masculino</option>
                      <option value="FEMENINO">Femenino</option>
                      <option value="OTRO">Otro</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editar-telefono">Teléfono</Label>
                    <Input id="editar-telefono" value={nutricionistaFormEdicion.telefono} onChange={(e) => setNutricionistaFormEdicion({ ...nutricionistaFormEdicion, telefono: e.target.value })} required />
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
                    <Input id="editar-direccion" value={nutricionistaFormEdicion.direccion} onChange={(e) => setNutricionistaFormEdicion({ ...nutricionistaFormEdicion, direccion: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editar-ciudad">Ciudad</Label>
                    <Input id="editar-ciudad" value={nutricionistaFormEdicion.ciudad} onChange={(e) => setNutricionistaFormEdicion({ ...nutricionistaFormEdicion, ciudad: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editar-provincia">Provincia</Label>
                    <Input id="editar-provincia" value={nutricionistaFormEdicion.provincia} onChange={(e) => setNutricionistaFormEdicion({ ...nutricionistaFormEdicion, provincia: e.target.value })} required />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="editar-email">Email</Label>
                    <Input id="editar-email" type="email" autoComplete="off" value={nutricionistaFormEdicion.email} onChange={(e) => setNutricionistaFormEdicion({ ...nutricionistaFormEdicion, email: e.target.value })} required />
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <h3 className="text-sm font-semibold text-foreground">Datos profesionales</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="editar-matricula">Matrícula</Label>
                    <Input id="editar-matricula" value={nutricionistaFormEdicion.matricula} onChange={(e) => setNutricionistaFormEdicion({ ...nutricionistaFormEdicion, matricula: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editar-anios">Años de experiencia</Label>
                    <Input id="editar-anios" type="number" min={0} value={nutricionistaFormEdicion.añosExperiencia} onChange={(e) => setNutricionistaFormEdicion({ ...nutricionistaFormEdicion, añosExperiencia: parseInt(e.target.value) || 0 })} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editar-tarifa">Tarifa por sesión</Label>
                    <Input id="editar-tarifa" type="number" min={0} step="0.01" value={nutricionistaFormEdicion.tarifaSesion} onChange={(e) => setNutricionistaFormEdicion({ ...nutricionistaFormEdicion, tarifaSesion: parseFloat(e.target.value) || 0 })} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editar-password">Nueva contraseña (opcional)</Label>
                    <Input id="editar-password" type="password" autoComplete="new-password" value={nutricionistaFormEdicion.contrasena} onChange={(e) => setNutricionistaFormEdicion({ ...nutricionistaFormEdicion, contrasena: e.target.value })} />
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
        titulo="Ajustar foto del nutricionista"
        descripcion="Podés acercar la imagen para centrar mejor el perfil antes de guardar."
        textoBotonConfirmar="Usar esta imagen"
        onCancelar={cerrarDialogoZoomFoto}
        onConfirmar={confirmarDialogoZoomFoto}
      />

      {/* Modal Ver Detalles */}
      <Dialog open={mostrarModalDetalles} onOpenChange={setMostrarModalDetalles}>
        <DialogContent className="max-w-3xl overflow-hidden p-0">
          <DialogHeader className="border-b bg-muted/30 px-6 py-5">
            <DialogTitle className="text-xl">Detalles del Nutricionista</DialogTitle>
            <DialogDescription>
              Información profesional, personal y de contacto del nutricionista seleccionado.
            </DialogDescription>
          </DialogHeader>
          {nutricionistaSeleccionado && (
            <div className="max-h-[72vh] space-y-5 overflow-y-auto px-6 py-6">
              <section className="rounded-xl border bg-card p-4 sm:p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar
                      size="lg"
                      className="h-32 w-32 ring-2 ring-primary/20 sm:h-36 sm:w-36"
                    >
                      {nutricionistaSeleccionado.fotoPerfilUrl && (
                        <AvatarImage
                          src={
                            obtenerUrlFoto(nutricionistaSeleccionado.fotoPerfilUrl) ??
                            undefined
                          }
                          alt={`${nutricionistaSeleccionado.nombre} ${nutricionistaSeleccionado.apellido}`}
                          className="object-cover object-center"
                        />
                      )}
                      <AvatarFallback className="bg-primary/10 text-2xl font-bold text-primary">
                        {obtenerIniciales(
                          nutricionistaSeleccionado.nombre,
                          nutricionistaSeleccionado.apellido,
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <h3 className="text-xl font-bold text-foreground">
                        {nutricionistaSeleccionado.nombre}{' '}
                        {nutricionistaSeleccionado.apellido}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {nutricionistaSeleccionado.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {nutricionistaSeleccionado.activo ? (
                      <Badge variant="default" className="bg-emerald-600">
                        Activo
                      </Badge>
                    ) : (
                      <Badge variant="destructive">Inactivo</Badge>
                    )}
                    <Badge variant="outline">
                      Matrícula {nutricionistaSeleccionado.matricula || '-'}
                    </Badge>
                  </div>
                </div>
              </section>

              <div className="grid gap-4 md:grid-cols-2">
                <section className="rounded-xl border bg-card p-4">
                  <h4 className="mb-3 text-sm font-semibold text-foreground">
                    Información profesional
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-medium uppercase text-muted-foreground">
                        Matrícula
                      </p>
                      <p className="text-sm font-medium">
                        {nutricionistaSeleccionado.matricula || '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase text-muted-foreground">
                        Años de experiencia
                      </p>
                      <p className="text-sm font-medium">
                        {nutricionistaSeleccionado.añosExperiencia} años
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs font-medium uppercase text-muted-foreground">
                        Tarifa por sesión
                      </p>
                      <p className="text-sm font-medium">
                        ${nutricionistaSeleccionado.tarifaSesion.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </section>

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
                        {nutricionistaSeleccionado.dni || '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase text-muted-foreground">
                        Fecha de nacimiento
                      </p>
                      <p className="text-sm font-medium">
                        {nutricionistaSeleccionado.fechaNacimiento
                          ? formatearFechaArgentinaCorta(
                              nutricionistaSeleccionado.fechaNacimiento,
                            )
                          : '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase text-muted-foreground">
                        Género
                      </p>
                      <p className="text-sm font-medium capitalize">
                        {nutricionistaSeleccionado.genero?.toLowerCase()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase text-muted-foreground">
                        Teléfono
                      </p>
                      <p className="text-sm font-medium">
                        {nutricionistaSeleccionado.telefono || '-'}
                      </p>
                    </div>
                  </div>
                </section>
              </div>

              <section className="rounded-xl border bg-card p-4">
                <h4 className="mb-3 text-sm font-semibold text-foreground">Ubicación</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <p className="text-xs font-medium uppercase text-muted-foreground">
                      Dirección
                    </p>
                    <p className="text-sm font-medium">
                      {nutricionistaSeleccionado.direccion || '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase text-muted-foreground">
                      Ciudad
                    </p>
                    <p className="text-sm font-medium">
                      {nutricionistaSeleccionado.ciudad || '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase text-muted-foreground">
                      Provincia
                    </p>
                    <p className="text-sm font-medium">
                      {nutricionistaSeleccionado.provincia || '-'}
                    </p>
                  </div>
                </div>
              </section>

              {nutricionistaSeleccionado.fechaBaja && (
                <section className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
                  <p className="text-xs font-medium uppercase text-muted-foreground">
                    Fecha de baja
                  </p>
                  <p className="text-sm font-medium text-destructive">
                    {formatearFechaArgentinaCorta(nutricionistaSeleccionado.fechaBaja)}
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
