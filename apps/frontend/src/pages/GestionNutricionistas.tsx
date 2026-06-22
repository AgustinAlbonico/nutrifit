import { useState, useEffect, useCallback, useMemo, useRef, type FormEvent, type ReactNode } from 'react';
import { toast } from 'sonner';
import { AlertCircle, ChevronDown, Search, Trash2, Upload, Users, XIcon } from 'lucide-react';
import { format as formatearFechaIso } from 'date-fns';

import { useAuth } from '@/contexts/AuthContext';
import { Can } from '@/components/auth/Can';
import { ACCIONES } from '@nutrifit/shared';
import { apiRequest, obtenerUrlFoto } from '@/lib/api';
import { agregarValorAFormData } from '@/lib/formData';
import {
  formatearFechaArgentinaCorta,
  formatearFechaArgentinaParaInput,
} from '@/lib/fechasArgentina';
import { REGEX_DNI, REGEX_TELEFONO, REGEX_EMAIL } from '@/lib/validaciones';
import { normalizarTexto } from '@/lib/text';
import { ControlesPaginacion } from '@/components/ui/ControlesPaginacion';
import type { Nutricionista, CrearNutricionistaDto, Genero, DiplomaDto } from '@/types/nutricionista';
import { Button } from '@/components/ui/button';
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
import { EditorTrayectoriaProfesional } from '@/components/profesionales/EditorTrayectoriaProfesional';
import type { ApiResponse } from '@/types/api';

type CampoFormularioCreacion = keyof CrearNutricionistaDto;
type CampoFormularioEdicion = keyof CrearNutricionistaDto;
type ErroresFormularioCreacion = Partial<Record<CampoFormularioCreacion, string>>;
type ErroresFormularioEdicion = Partial<Record<CampoFormularioEdicion, string>>;
type EstadoFoto = string | File | null;

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
  aniosExperiencia: 0,
  tarifaSesion: 0,
  presentacion: '',
  certificaciones: [],
  formacionAcademica: [],
};

type ClaveSeccion = 'datos-personales' | 'contacto-ubicacion' | 'datos-profesionales';
const SECCIONES_INICIAL: Record<ClaveSeccion, boolean> = {
  'datos-personales': true,
  'contacto-ubicacion': true,
  'datos-profesionales': true,
};

function SeccionColapsable({
  id,
  titulo,
  abierta,
  alAlternar,
  children,
}: {
  id: string;
  titulo: string;
  abierta: boolean;
  alAlternar: () => void;
  children: ReactNode;
}) {
  return (
    <section className="space-y-4 rounded-lg border bg-card/40 p-4">
      <button
        type="button"
        onClick={alAlternar}
        aria-expanded={abierta}
        aria-controls={`${id}-contenido`}
        data-testid={`seccion-${id}-toggle`}
        className="flex w-full items-center justify-between gap-2 rounded-md px-1 py-1 text-left text-sm font-semibold text-foreground transition-colors hover:bg-muted/60"
      >
        <span>{titulo}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${
            abierta ? 'rotate-0' : '-rotate-90'
          }`}
        />
      </button>
      {abierta && (
        <div
          id={`${id}-contenido`}
          data-testid={`seccion-${id}-contenido`}
          className="space-y-4"
        >
          {children}
        </div>
      )}
    </section>
  );
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

export function GestionNutricionistas() {
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
  const [enviandoCreacion, setEnviandoCreacion] = useState(false);
  const [fotoCreacion, setFotoCreacion] = useState<EstadoFoto>(null);
  const [diplomasCreacion, setDiplomasCreacion] = useState<File[]>([]);
  const [fotoEdicion, setFotoEdicion] = useState<EstadoFoto>(null);
  const [diplomasEditando, setDiplomasEditando] = useState<DiplomaDto[]>([]);
  const [subiendoDiplomaEditando, setSubiendoDiplomaEditando] = useState(false);
  const [eliminandoDiplomas, setEliminandoDiplomas] = useState<Set<number>>(new Set());
  const inputDiplomaEditRef = useRef<HTMLInputElement | null>(null);
  const [nutricionistaFormEdicion, setNutricionistaFormEdicion] = useState<CrearNutricionistaDto>(FORMULARIO_NUTRICIONISTA_INICIAL);
  const [erroresEdicion, setErroresEdicion] = useState<ErroresFormularioCreacion>({});

  const [mostrarConfirmacionEliminar, setMostrarConfirmacionEliminar] = useState(false);
  const [nutricionistaAEliminar, setNutricionistaAEliminar] = useState<Nutricionista | null>(null);
  const [motivoDesactivacion, setMotivoDesactivacion] = useState('');
  const [desactivando, setDesactivando] = useState(false);
  const [resultadoDesactivacion, setResultadoDesactivacion] = useState<{
    turnosCancelados: number;
    sociosAfectados: number;
  } | null>(null);

  const [mostrarModalDetalles, setMostrarModalDetalles] = useState(false);
  const [mostrarFotoAmpliada, setMostrarFotoAmpliada] = useState(false);
  const [nutricionistaSeleccionado, setNutricionistaSeleccionado] = useState<Nutricionista | null>(null);

  const [mostrarModalContrasenaProvisional, setMostrarModalContrasenaProvisional] = useState(false);
  const [contrasenaProvisional, setContrasenaProvisional] = useState<string | null>(null);
  const [contrasenaCopiada, setContrasenaCopiada] = useState(false);

  const [seccionesCreacionAbiertas, setSeccionesCreacionAbiertas] = useState<Record<ClaveSeccion, boolean>>(
    SECCIONES_INICIAL,
  );
  const [seccionesEdicionAbiertas, setSeccionesEdicionAbiertas] = useState<Record<ClaveSeccion, boolean>>(
    SECCIONES_INICIAL,
  );
  const alternarSeccionCreacion = useCallback((clave: ClaveSeccion) => {
    setSeccionesCreacionAbiertas((prev) => ({ ...prev, [clave]: !prev[clave] }));
  }, []);
  const alternarSeccionEdicion = useCallback((clave: ClaveSeccion) => {
    setSeccionesEdicionAbiertas((prev) => ({ ...prev, [clave]: !prev[clave] }));
  }, []);

  const abrirModalDetalles = (nutricionista: Nutricionista) => {
    setNutricionistaSeleccionado(nutricionista);
    setMostrarModalDetalles(true);
  };

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

  const validarFormularioCreacion = useCallback(
    (datos: CrearNutricionistaDto): ErroresFormularioCreacion => {
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
      if (!datos.matricula.trim()) errores.matricula = 'Ingresá la matrícula.';
      if (datos.aniosExperiencia < 0) errores.aniosExperiencia = 'Los años de experiencia no pueden ser negativos.';
      if (datos.tarifaSesion <= 0) errores.tarifaSesion = 'La tarifa por sesión debe ser mayor a 0.';

      return errores;
    },
    [],
  );

  const actualizarCampoCreacion = useCallback(
    <K extends CampoFormularioCreacion>(campo: K, valor: CrearNutricionistaDto[K]) => {
      const nuevoForm = { ...nutricionistaForm, [campo]: valor };
      setNutricionistaForm(nuevoForm);
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
    [nutricionistaForm, validarFormularioCreacion],
  );

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
    if (nutricionistaFormEdicion.aniosExperiencia < 0) errores.aniosExperiencia = 'Los años de experiencia no pueden ser negativos.';
    if (nutricionistaFormEdicion.tarifaSesion <= 0) errores.tarifaSesion = 'La tarifa por sesión debe ser mayor a 0.';

    return errores;
  }, [nutricionistaFormEdicion]);

  const limpiarEstadoCreacion = useCallback(() => {
    setNutricionistaForm(FORMULARIO_NUTRICIONISTA_INICIAL);
    setErroresCreacion({});
    setErrorGeneralCreacion(null);
    setFotoCreacion(null);
    setDiplomasCreacion([]);
    setEnviandoCreacion(false);
  }, []);

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
          nutricionista.aniosExperiencia,
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
            return (a.aniosExperiencia - b.aniosExperiencia) * multiplicador;
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
    if (!token || enviandoCreacion) return;

    const errores = validarFormularioCreacion(nutricionistaForm);

    if (Object.keys(errores).length > 0) {
      setErroresCreacion(errores);
      setErrorGeneralCreacion('Revisá los campos marcados antes de continuar.');
      return;
    }

    setEnviandoCreacion(true);

    try {
      const hayFoto = fotoCreacion instanceof File;
      const hayDiplomas = diplomasCreacion.length > 0;

      const payload = { ...nutricionistaForm, duracionTurnoMin: 30 };

      let respuesta;
      if (hayFoto) {
        const formData = new FormData();
        formData.append('foto', fotoCreacion);
        Object.entries(payload).forEach(([key, value]) => {
          agregarValorAFormData(formData, key, value);
        });
        respuesta = await apiRequest<ApiResponse<Nutricionista & { contrasenaProvisional?: string }>>(
          '/profesional',
          {
            method: 'POST',
            token,
            formData,
          },
        );
      } else {
        respuesta = await apiRequest<ApiResponse<Nutricionista & { contrasenaProvisional?: string }>>(
          '/profesional',
          {
            method: 'POST',
            token,
            body: payload,
          },
        );
      }

      const nutriCreado = respuesta.data;
      const idNuevo = nutriCreado?.idPersona;

      if (hayDiplomas && idNuevo) {
        for (const archivo of diplomasCreacion) {
          const diplomaForm = new FormData();
          diplomaForm.append('diploma', archivo);
          await apiRequest(`/profesional/${idNuevo}/diplomas`, {
            method: 'POST',
            token,
            formData: diplomaForm,
          });
        }
      }

      if (nutriCreado?.contrasenaProvisional) {
        setContrasenaProvisional(nutriCreado.contrasenaProvisional);
        setContrasenaCopiada(false);
        setMostrarModalContrasenaProvisional(true);
      }

      toast.success('Nutricionista creado exitosamente');
      setMostrarFormularioNutricionista(false);
      limpiarEstadoCreacion();
      await cargarNutricionistas();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'No se pudo crear el nutricionista';
      setErrorGeneralCreacion(errorMessage);
      toast.error(errorMessage);
    } finally {
      setEnviandoCreacion(false);
    }
  };

  const copiarContrasenaProvisional = async () => {
    if (!contrasenaProvisional) return;
    try {
      await navigator.clipboard.writeText(contrasenaProvisional);
      setContrasenaCopiada(true);
      setTimeout(() => setContrasenaCopiada(false), 2500);
    } catch {
      toast.error('No se pudo copiar al portapapeles');
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
      aniosExperiencia: nutricionista.aniosExperiencia,
      tarifaSesion: nutricionista.tarifaSesion,
      duracionTurnoMin: nutricionista.duracionTurnoMin,
      presentacion: nutricionista.presentacion ?? '',
      certificaciones: nutricionista.certificaciones ?? [],
      formacionAcademica: nutricionista.formacionAcademica ?? [],
    });
    setErroresEdicion({});
    setFotoEdicion(obtenerUrlFoto(nutricionista.fotoPerfilUrl) ?? null);
    setDiplomasEditando(nutricionista.diplomas ?? []);
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
      const esFileFoto = fotoEdicion instanceof File;
      const esNullFoto = fotoEdicion === null;
      const nutricionistaSiendoEditado = nutricionistas.find(
        (n) => n.idPersona === idNutricionistaEditando,
      );
      const nutricionistaTeniaFoto = nutricionistaSiendoEditado?.fotoPerfilUrl;

      const enviarFotoComoFormData = esFileFoto || (esNullFoto && nutricionistaTeniaFoto);

      if (enviarFotoComoFormData) {
        const formData = new FormData();
        if (esFileFoto) {
          formData.append('foto', fotoEdicion);
        }
        if (esNullFoto && nutricionistaTeniaFoto) {
          formData.append('eliminarFoto', 'true');
        }
        Object.entries(nutricionistaFormEdicion).forEach(([key, value]) => {
          agregarValorAFormData(formData, key, value);
        });
        await apiRequest(`/profesional/${idNutricionistaEditando}`, {
          method: 'PUT',
          token,
          formData,
        });
      } else {
        await apiRequest(`/profesional/${idNutricionistaEditando}`, {
          method: 'PUT',
          token,
          body: nutricionistaFormEdicion,
        });
      }

      toast.success('Nutricionista actualizado exitosamente');
      setMostrarFormularioEdicion(false);
      setIdNutricionistaEditando(null);
      setErroresEdicion({});
      setFotoEdicion(null);
      setDiplomasEditando([]);
      await cargarNutricionistas();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'No se pudo editar el nutricionista';
      toast.error(errorMessage);
    }
  };

  const manejarSubirDiplomaEditando = async (archivo: File) => {
    if (!token || idNutricionistaEditando === null) return;
    try {
      setSubiendoDiplomaEditando(true);
      const formData = new FormData();
      formData.append('diploma', archivo);
      const response = await apiRequest<ApiResponse<DiplomaDto>>(
        `/profesional/${idNutricionistaEditando}/diplomas`,
        { method: 'POST', token, formData },
      );
      setDiplomasEditando((prev) => [...prev, response.data]);
      toast.success('Diploma subido correctamente.');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al subir diploma';
      toast.error(msg);
    } finally {
      setSubiendoDiplomaEditando(false);
    }
  };

  const manejarEliminarDiplomaEditando = async (diplomaId: number) => {
    if (!token || idNutricionistaEditando === null) return;
    try {
      setEliminandoDiplomas((prev) => new Set(prev).add(diplomaId));
      await apiRequest(`/profesional/${idNutricionistaEditando}/diplomas/${diplomaId}`, {
        method: 'DELETE',
        token,
      });
      setDiplomasEditando((prev) => prev.filter((d) => d.idDiploma !== diplomaId));
      toast.success('Diploma eliminado.');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al eliminar diploma';
      toast.error(msg);
    } finally {
      setEliminandoDiplomas((prev) => {
        const next = new Set(prev);
        next.delete(diplomaId);
        return next;
      });
    }
  };

  const confirmarDesactivar = (nutricionista: Nutricionista) => {
    setNutricionistaAEliminar(nutricionista);
    setMotivoDesactivacion('');
    setResultadoDesactivacion(null);
    setMostrarConfirmacionEliminar(true);
  };

  const desactivarNutricionista = async () => {
    if (!token || !nutricionistaAEliminar) return;
    if (!motivoDesactivacion.trim() || motivoDesactivacion.trim().length < 10) {
      toast.error('El motivo debe tener al menos 10 caracteres.');
      return;
    }

    setDesactivando(true);
    try {
      const resultado = await apiRequest<{
        message: string;
        turnosCancelados: number;
        sociosAfectados: number;
      }>(`/profesional/${nutricionistaAEliminar.idPersona}/desactivar`, {
        method: 'POST',
        token,
        body: { motivo: motivoDesactivacion.trim() },
      });

      setResultadoDesactivacion({
        turnosCancelados: resultado.turnosCancelados,
        sociosAfectados: resultado.sociosAfectados,
      });
      toast.success(resultado.message);
      await cargarNutricionistas();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'No se pudo desactivar el nutricionista';
      toast.error(errorMessage);
    } finally {
      setDesactivando(false);
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

            <Button variant="outline" size="sm" onClick={limpiarFiltros}>
              Limpiar filtros
            </Button>
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
                        <TableCell className="text-center text-sm">{nutricionista.aniosExperiencia} años</TableCell>
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
                            <Can accion={ACCIONES.NUTRICIONISTAS_EDITAR}>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => abrirModalEdicion(nutricionista)}
                                disabled={!nutricionista.activo}
                              >
                                Editar
                              </Button>
                            </Can>
                            {nutricionista.activo ? (
                              <Can accion={ACCIONES.NUTRICIONISTAS_ELIMINAR}>
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => confirmarDesactivar(nutricionista)}
                                >
                                  Desactivar
                                </Button>
                              </Can>
                            ) : (
                              <Can accion={ACCIONES.NUTRICIONISTAS_EDITAR}>
                                <Button
                                  type="button"
                                  variant="default"
                                  size="sm"
                                  className="bg-emerald-600 hover:bg-emerald-700"
                                  onClick={() => void reactivarNutricionista(nutricionista)}
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
                  total={nutricionistasFiltradosOrdenados.length}
                  limite={limitePorPagina}
                  opcionesLimite={[6, 9, 12, 18]}
                  cargando={cargandoNutricionistas}
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

              <SeccionColapsable
                id="crear-datos-personales"
                titulo="Datos personales"
                abierta={seccionesCreacionAbiertas['datos-personales']}
                alAlternar={() => alternarSeccionCreacion('datos-personales')}
              >
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
                <SelectorImagen
                  etiqueta="Foto de perfil"
                  alCambiarFoto={setFotoCreacion}
                  deshabilitado={false}
                />
              </SeccionColapsable>

              <SeccionColapsable
                id="crear-contacto-ubicacion"
                titulo="Contacto y ubicación"
                abierta={seccionesCreacionAbiertas['contacto-ubicacion']}
                alAlternar={() => alternarSeccionCreacion('contacto-ubicacion')}
              >
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
              </SeccionColapsable>

              <SeccionColapsable
                id="crear-datos-profesionales"
                titulo="Datos profesionales"
                abierta={seccionesCreacionAbiertas['datos-profesionales']}
                alAlternar={() => alternarSeccionCreacion('datos-profesionales')}
              >
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
                      value={nutricionistaForm.aniosExperiencia}
                      onChange={(e) => actualizarCampoCreacion('aniosExperiencia', parseInt(e.target.value, 10) || 0)}
                      aria-invalid={Boolean(erroresCreacion.aniosExperiencia)}
                      required
                    />
                    {erroresCreacion.aniosExperiencia && <p className="text-xs font-medium text-destructive">{erroresCreacion.aniosExperiencia}</p>}
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
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="crear-presentacion">Presentación (opcional)</Label>
                    <Textarea
                      id="crear-presentacion"
                      value={nutricionistaForm.presentacion || ''}
                      onChange={(e) => actualizarCampoCreacion('presentacion', e.target.value)}
                      placeholder="Breve biografía o presentación del profesional..."
                      className="min-h-[100px]"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <EditorTrayectoriaProfesional
                      formacionAcademica={nutricionistaForm.formacionAcademica ?? []}
                      certificaciones={nutricionistaForm.certificaciones ?? []}
                      alCambiarFormacionAcademica={(formacionAcademica) =>
                        setNutricionistaForm((prev) => ({ ...prev, formacionAcademica }))
                      }
                      alCambiarCertificaciones={(certificaciones) =>
                        setNutricionistaForm((prev) => ({ ...prev, certificaciones }))
                      }
                      deshabilitado={enviandoCreacion}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="crear-diplomas">Diplomas / Matrícula profesional (PDF o imagen, opcional)</Label>
                    <Input
                      id="crear-diplomas"
                      type="file"
                      multiple
                      accept="application/pdf,image/*"
                      className="hidden"
                      onChange={(e) => {
                        const archivos = Array.from(e.target.files ?? []);
                        setDiplomasCreacion((prev) => [...prev, ...archivos]);
                        e.target.value = '';
                      }}
                    />
                    {diplomasCreacion.length > 0 && (
                      <ul className="space-y-1">
                        {diplomasCreacion.map((f, i) => (
                          <li key={i} className="text-xs text-muted-foreground">
                            {f.name}
                          </li>
                        ))}
                      </ul>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Los documentos se mostrarán al socio desde el perfil del profesional.
                    </p>
                  </div>
                </div>
              </SeccionColapsable>
            </div>
            <div className="flex justify-end gap-2 border-t bg-background px-6 py-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setMostrarFormularioNutricionista(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={Object.keys(erroresCreacion).length > 0 || enviandoCreacion}
              >
                {enviandoCreacion ? 'Creando…' : 'Crear nutricionista'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={mostrarConfirmacionEliminar} onOpenChange={(open) => {
        if (!open) {
          setMostrarConfirmacionEliminar(false);
          setNutricionistaAEliminar(null);
          setMotivoDesactivacion('');
          setResultadoDesactivacion(null);
        }
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{resultadoDesactivacion ? 'Nutricionista desactivado' : 'Confirmar desactivación'}</DialogTitle>
            <DialogDescription>
              {resultadoDesactivacion ? (
                <span className="text-foreground">
                  Se desactivó a {nutricionistaAEliminar?.nombre} {nutricionistaAEliminar?.apellido}.
                  <br /><br />
                  <strong>{resultadoDesactivacion.turnosCancelados}</strong> turnos futuros fueron cancelados.{' '}
                  <strong>{resultadoDesactivacion.sociosAfectados}</strong> socios fueron notificados.
                </span>
              ) : (
                <>
                  ¿Estás seguro de que querés desactivar a {nutricionistaAEliminar?.nombre} {nutricionistaAEliminar?.apellido}?
                  <br /><br />
                  <span className="font-medium text-amber-600 dark:text-amber-400">
                    Hay turnos futuros que serán cancelados y los socios afectados serán notificados.
                  </span>
                  <br /><br />
                  Esta acción no se puede deshacer.
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {!resultadoDesactivacion && (
            <div className="space-y-3">
              <Label htmlFor="motivo-desactivacion">
                Motivo de la desactivación <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="motivo-desactivacion"
                placeholder="Describí el motivo de la desactivación (mín. 10 caracteres)"
                value={motivoDesactivacion}
                onChange={(e) => setMotivoDesactivacion(e.target.value)}
                rows={3}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground">
                {motivoDesactivacion.length}/500 caracteres
              </p>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            {resultadoDesactivacion ? (
              <Button
                type="button"
                onClick={() => {
                  setMostrarConfirmacionEliminar(false);
                  setNutricionistaAEliminar(null);
                  setMotivoDesactivacion('');
                  setResultadoDesactivacion(null);
                }}
              >
                Cerrar
              </Button>
            ) : (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setMostrarConfirmacionEliminar(false);
                    setNutricionistaAEliminar(null);
                    setMotivoDesactivacion('');
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => void desactivarNutricionista()}
                  disabled={desactivando || motivoDesactivacion.trim().length < 10}
                >
                  {desactivando ? 'Desactivando...' : 'Desactivar'}
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

<Dialog open={mostrarFormularioEdicion} onOpenChange={(open) => {
          setMostrarFormularioEdicion(open);
          if (!open) {
            setIdNutricionistaEditando(null);
            setErroresEdicion({});
            setFotoEdicion(null);
            setDiplomasEditando([]);
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
              <SeccionColapsable
                id="editar-datos-personales"
                titulo="Datos personales"
                abierta={seccionesEdicionAbiertas['datos-personales']}
                alAlternar={() => alternarSeccionEdicion('datos-personales')}
              >
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
                <SelectorImagen
                  etiqueta="Foto de perfil"
                  valorActual={
                    typeof fotoEdicion === 'string' ? fotoEdicion : null
                  }
                  alCambiarFoto={setFotoEdicion}
                  deshabilitado={false}
                />
              </SeccionColapsable>

              <SeccionColapsable
                id="editar-contacto-ubicacion"
                titulo="Contacto y ubicación"
                abierta={seccionesEdicionAbiertas['contacto-ubicacion']}
                alAlternar={() => alternarSeccionEdicion('contacto-ubicacion')}
              >
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
              </SeccionColapsable>

              <SeccionColapsable
                id="editar-datos-profesionales"
                titulo="Datos profesionales"
                abierta={seccionesEdicionAbiertas['datos-profesionales']}
                alAlternar={() => alternarSeccionEdicion('datos-profesionales')}
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="editar-matricula">Matrícula</Label>
                    <Input id="editar-matricula" value={nutricionistaFormEdicion.matricula} onChange={(e) => setNutricionistaFormEdicion({ ...nutricionistaFormEdicion, matricula: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editar-anios">Años de experiencia</Label>
                    <Input id="editar-anios" type="number" min={0} value={nutricionistaFormEdicion.aniosExperiencia} onChange={(e) => setNutricionistaFormEdicion({ ...nutricionistaFormEdicion, aniosExperiencia: parseInt(e.target.value) || 0 })} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editar-tarifa">Tarifa por sesión</Label>
                    <Input id="editar-tarifa" type="number" min={0} step="0.01" value={nutricionistaFormEdicion.tarifaSesion} onChange={(e) => setNutricionistaFormEdicion({ ...nutricionistaFormEdicion, tarifaSesion: parseFloat(e.target.value) || 0 })} required />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="editar-presentacion">Presentación (opcional)</Label>
                    <Textarea id="editar-presentacion" value={nutricionistaFormEdicion.presentacion || ''} onChange={(e) => setNutricionistaFormEdicion({ ...nutricionistaFormEdicion, presentacion: e.target.value })} placeholder="Breve biografía o presentación del profesional..." className="min-h-[100px]" />
                  </div>
                  <div className="md:col-span-2">
                    <EditorTrayectoriaProfesional
                      formacionAcademica={nutricionistaFormEdicion.formacionAcademica ?? []}
                      certificaciones={nutricionistaFormEdicion.certificaciones ?? []}
                      alCambiarFormacionAcademica={(formacionAcademica) =>
                        setNutricionistaFormEdicion((prev) => ({
                          ...prev,
                          formacionAcademica,
                        }))
                      }
                      alCambiarCertificaciones={(certificaciones) =>
                        setNutricionistaFormEdicion((prev) => ({
                          ...prev,
                          certificaciones,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Diplomas / Matrícula profesional</Label>

                    {diplomasEditando.length > 0 && (
                      <div className="space-y-2">
                        {diplomasEditando.map((d) => (
                          <div
                            key={d.idDiploma}
                            className="flex items-center justify-between rounded-lg border p-2"
                          >
                            <span className="text-sm">
                              {d.nombreOriginal ?? `Diploma #${d.idDiploma}`}
                            </span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => manejarEliminarDiplomaEditando(d.idDiploma)}
                              disabled={eliminandoDiplomas.has(d.idDiploma)}
                            >
                              {eliminandoDiplomas.has(d.idDiploma) ? (
                                <span className="text-xs">Eliminando…</span>
                              ) : (
                                <Trash2 className="h-4 w-4 text-destructive" />
                              )}
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}

                    <Input
                      ref={inputDiplomaEditRef}
                      type="file"
                      accept="application/pdf,image/*"
                      className="hidden"
                      onChange={(e) => {
                        const archivo = e.target.files?.[0];
                        if (archivo) void manejarSubirDiplomaEditando(archivo);
                        e.target.value = '';
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => inputDiplomaEditRef.current?.click()}
                      disabled={subiendoDiplomaEditando}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      {subiendoDiplomaEditando ? 'Subiendo…' : 'Agregar diploma'}
                    </Button>
                  </div>
                </div>
              </SeccionColapsable>
            </div>
            <div className="flex justify-end gap-2 border-t bg-background px-6 py-4">
              <Button type="button" variant="outline" onClick={() => {
                  setMostrarFormularioEdicion(false);
                  setIdNutricionistaEditando(null);
                  setFotoEdicion(null);
                  setDiplomasEditando([]);
                }}>
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
                    <div className="relative">
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
                      {nutricionistaSeleccionado.fotoPerfilUrl && (
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
                        {nutricionistaSeleccionado.aniosExperiencia} años
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase text-muted-foreground">
                        Duración del turno
                      </p>
                      <p className="text-sm font-medium">
                        {nutricionistaSeleccionado.duracionTurnoMin} min
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase text-muted-foreground">
                        Tarifa por sesión
                      </p>
                      <p className="text-sm font-medium">
                        ${nutricionistaSeleccionado.tarifaSesion.toLocaleString()}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs font-medium uppercase text-muted-foreground">
                        Diploma / Matrícula profesional
                      </p>
                      {nutricionistaSeleccionado.diplomas?.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {nutricionistaSeleccionado.diplomas.map((d) => (
                            <a
                              key={d.idDiploma}
                              href={d.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                            >
                              {d.nombreOriginal ?? `Diploma #${d.idDiploma}`}
                            </a>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">Sin diploma cargado</p>
                      )}
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
            {nutricionistaSeleccionado?.activo ? (
              <Can accion={ACCIONES.NUTRICIONISTAS_ELIMINAR}>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => {
                    setMostrarModalDetalles(false);
                    confirmarDesactivar(nutricionistaSeleccionado!);
                  }}
                >
                  Desactivar
                </Button>
              </Can>
            ) : nutricionistaSeleccionado ? (
              <Can accion={ACCIONES.NUTRICIONISTAS_EDITAR}>
                <Button
                  type="button"
                  variant="default"
                  className="bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => {
                    setMostrarModalDetalles(false);
                    void reactivarNutricionista(nutricionistaSeleccionado);
                  }}
                >
                  Reactivar
                </Button>
              </Can>
            ) : null}
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
      {nutricionistaSeleccionado?.fotoPerfilUrl && (
        <Dialog open={mostrarFotoAmpliada} onOpenChange={setMostrarFotoAmpliada}>
          <DialogContent className="max-w-[90vw] max-h-[90vh] border-0 bg-black/95 p-0" showCloseButton={false}>
            <DialogClose className="absolute top-3 right-3 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80">
              <XIcon className="h-6 w-6" />
            </DialogClose>
            <img
              src={obtenerUrlFoto(nutricionistaSeleccionado.fotoPerfilUrl) ?? ''}
              alt={`${nutricionistaSeleccionado.nombre} ${nutricionistaSeleccionado.apellido}`}
              className="mx-auto max-h-[85vh] w-auto object-contain"
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Modal contraseña provisional (RB32) */}
      <Dialog
        open={mostrarModalContrasenaProvisional}
        onOpenChange={(open) => {
          if (!open) {
            setMostrarModalContrasenaProvisional(false);
            setContrasenaProvisional(null);
            setContrasenaCopiada(false);
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Contraseña provisional generada</DialogTitle>
            <DialogDescription>
              El sistema generó una contraseña segura. El nutricionista deberá
              cambiarla en su primer inicio de sesión.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Alert className="border-amber-500/40 bg-amber-50">
              <AlertCircle className="h-4 w-4 text-amber-700" />
              <AlertTitle className="text-amber-900">Importante</AlertTitle>
              <AlertDescription className="text-amber-800">
                Compartila por un canal seguro con el profesional. Por
                seguridad, no se vuelve a mostrar.
              </AlertDescription>
            </Alert>
            <div className="flex items-center gap-2 rounded-md border bg-muted/40 p-3">
              <code
                data-testid="contrasena-provisional"
                className="flex-1 break-all font-mono text-base font-semibold tracking-wide"
              >
                {contrasenaProvisional}
              </code>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void copiarContrasenaProvisional()}
              >
                {contrasenaCopiada ? 'Copiado' : 'Copiar'}
              </Button>
            </div>
          </div>
          <div className="flex justify-end gap-2 border-t bg-muted/20 px-6 py-4">
            <Button
              type="button"
              onClick={() => {
                setMostrarModalContrasenaProvisional(false);
                setContrasenaProvisional(null);
                setContrasenaCopiada(false);
              }}
            >
              Entendido
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
