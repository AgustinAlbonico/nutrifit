import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type FormEvent,
} from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useParams, useNavigate, Link } from '@tanstack/react-router';
import { toast } from 'sonner';
import {
  ArrowLeft,
  CheckCircle2,
  FileWarning,
  FileText,
  Upload,
  Trash2,
  User,
  TrendingUp,
  ChevronDown,
  ChevronRight,
  Ruler,
  Activity,
  Heart,
  Scale,
  Utensils,
  Edit,
  X,
} from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/api';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { ApiResponse } from '@/types/api';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { IndicadorEtapasConsulta } from '@/components/consulta/IndicadorEtapasConsulta';
import { FotosSesionConsulta } from '@/components/consulta/FotosSesionConsulta';
import { RevisionFinalConsulta } from '@/components/consulta/RevisionFinalConsulta';
import { useFotosProgreso } from '@/components/progreso/useFotosProgreso';
import { obtenerEtapasConsulta, puedeCerrarConsulta } from '@/lib/consulta/estadoEtapas';
import {
  convertirMedicionesConsultaPayload,
  medicionesConsultaSchema,
  type ValoresFormularioMedicionesConsulta,
  type ValoresMedicionesConsulta,
} from '@/schemas/mediciones-consulta.schema';
import type { HistorialMediciones } from '@/components/progreso/types';
import type { HistorialConsultaPaciente, IdEtapaConsulta } from '@/types/consulta';

type NivelActividadFisica = 'Sedentario' | 'Moderado' | 'Intenso';
type FrecuenciaComidas = '1-2 comidas' | '3 comidas' | '4-5 comidas' | '6 o más comidas';
type ConsumoAlcohol = 'Nunca' | 'Ocasional' | 'Moderado' | 'Frecuente';

interface FichaSalud {
  fichaSaludId: number;
  altura: number;
  peso: number;
  nivelActividadFisica: NivelActividadFisica;
  alergias: string[];
  patologias: string[];
  objetivoPersonal: string;
  medicacionActual: string | null;
  suplementosActuales: string | null;
  cirugiasPrevias: string | null;
  antecedentesFamiliares: string | null;
  frecuenciaComidas: FrecuenciaComidas | null;
  consumoAguaDiario: number | null;
  restriccionesAlimentarias: string | null;
  consumoAlcohol: ConsumoAlcohol | null;
  fumaTabaco: boolean;
  horasSueno: number | null;
  contactoEmergenciaNombre: string | null;
  contactoEmergenciaTelefono: string | null;
}

interface DatosTurno {
  idTurno: number;
  fechaTurno: string;
  horaTurno: string;
  estadoTurno: string;
  consultaFinalizadaAt: string | null;
  observacionClinica: ObservacionClinica | null;
  fichaActualizada?: boolean;
  consultaId?: number | null;
  cierreAutomatico: boolean;
  motivoCierreAutomatico: string | null;
  reabiertaPorCierreAuto: boolean;
  socio: {
    idPersona: number;
    nombre: string;
    apellido: string;
    dni: string;
    email: string;
    telefono: string | null;
  };
  fichaSalud: FichaSalud | null;
}

interface ObservacionClinica {
  comentario: string;
  sugerencias: string | null;
  habitosSocio: string | null;
  objetivosSocio: string | null;
  esPublica: boolean;
}

interface AdjuntoClinico {
  id: number;
  nombreOriginal: string;
  urlFirmada: string;
  mimeType: string;
  sizeBytes: number;
  esPostCierre: boolean;
  createdAt: string;
}

type FormularioMediciones = ValoresFormularioMedicionesConsulta;
type SeccionMediciones = 'perimetros' | 'pliegues' | 'composicion' | 'signosVitales';
type EstadoSeccionesMediciones = Record<SeccionMediciones, boolean>;
type CampoMedicionPrecargado = Exclude<keyof FormularioMediciones, 'notasMedicion'>;

interface FormularioObservaciones {
  comentario: string;
  sugerencias: string;
  habitosSocio: string;
  objetivosSocio: string;
  esPublica: boolean;
}

interface RespuestaGuardarMedicionesConsulta {
  success: boolean;
  imc: number | null;
  idMedicion: number;
}

const FORMULARIO_INICIAL: FormularioMediciones = {
  peso: '',
  altura: '',
  perimetroCintura: '',
  perimetroCadera: '',
  perimetroBrazo: '',
  perimetroMuslo: '',
  perimetroPecho: '',
  pliegueTriceps: '',
  pliegueAbdominal: '',
  pliegueMuslo: '',
  porcentajeGrasa: '',
  frecuenciaCardiaca: '',
  tensionSistolica: '',
  tensionDiastolica: '',
  notasMedicion: '',
};

const FORMULARIO_OBSERVACIONES_INICIAL: FormularioObservaciones = {
  comentario: '',
  sugerencias: '',
  habitosSocio: '',
  objetivosSocio: '',
  esPublica: false,
};

const CLAVE_SECCIONES_MEDICIONES = 'nutrifit.consulta.mediciones.secciones';

const SECCIONES_MEDICIONES_INICIALES: EstadoSeccionesMediciones = {
  perimetros: false,
  pliegues: false,
  composicion: false,
  signosVitales: false,
};

function esEstadoSeccionesMediciones(valor: unknown): valor is EstadoSeccionesMediciones {
  if (typeof valor !== 'object' || valor === null) {
    return false;
  }

  const registro = valor as Partial<Record<SeccionMediciones, unknown>>;
  return (
    typeof registro.perimetros === 'boolean' &&
    typeof registro.pliegues === 'boolean' &&
    typeof registro.composicion === 'boolean' &&
    typeof registro.signosVitales === 'boolean'
  );
}

function leerSeccionesMediciones(): EstadoSeccionesMediciones {
  const crudo = localStorage.getItem(CLAVE_SECCIONES_MEDICIONES);
  if (!crudo) {
    return SECCIONES_MEDICIONES_INICIALES;
  }

  try {
    const valor: unknown = JSON.parse(crudo);
    if (esEstadoSeccionesMediciones(valor)) {
      return valor;
    }
  } catch {
    localStorage.removeItem(CLAVE_SECCIONES_MEDICIONES);
  }

  return SECCIONES_MEDICIONES_INICIALES;
}

function guardarSeccionesMediciones(secciones: EstadoSeccionesMediciones) {
  localStorage.setItem(CLAVE_SECCIONES_MEDICIONES, JSON.stringify(secciones));
}

// Componente para secciones colapsables
function SeccionColapsable({
  titulo,
  icono: Icono,
  expandida,
  onToggle,
  children,
}: {
  titulo: string;
  icono: React.ElementType;
  expandida: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between p-3 text-left hover:bg-gray-50"
      >
        <div className="flex items-center gap-2">
          <Icono className="h-4 w-4 text-gray-500" />
          <span className="font-medium">{titulo}</span>
          <span className="text-xs text-gray-400">(opcional)</span>
        </div>
        {expandida ? (
          <ChevronDown className="h-4 w-4 text-gray-400" />
        ) : (
          <ChevronRight className="h-4 w-4 text-gray-400" />
        )}
      </button>
      {expandida && <div className="border-t p-4">{children}</div>}
    </div>
  );
}

function IndicadorValorPrevio() {
  return (
    <span className="inline-flex w-fit rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700">
      valor previo
    </span>
  );
}

function obtenerTextoOPlaceholder(
  valor: string | number | null | undefined,
  placeholder = 'No registrado',
) {
  if (valor === null || valor === undefined || valor === '') {
    return placeholder;
  }

  return String(valor);
}

function formatearSiNo(valor: boolean) {
  return valor ? 'Sí' : 'No';
}

function formatearHorasSueno(horas: number | null) {
  if (horas === null || horas <= 0) {
    return 'No registrado';
  }

  return `${horas} h`;
}

function formatearConsumoAgua(consumoAguaDiario: number | null) {
  if (consumoAguaDiario === null || consumoAguaDiario <= 0) {
    return 'No registrado';
  }

  return `${consumoAguaDiario} ml`;
}

function renderizarEtiquetas(items: string[], tono: 'rojo' | 'ambar' | 'gris' = 'gris') {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">Sin registros</p>;
  }

  const clases = {
    rojo: 'border-red-200 bg-red-50 text-red-800',
    ambar: 'border-amber-200 bg-amber-50 text-amber-800',
    gris: 'border-border/70 bg-muted/40 text-foreground/80',
  };

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span
          key={item}
          className={`rounded-full border px-2.5 py-1 text-xs font-medium ${clases[tono]}`}
        >
          {item}
        </span>
      ))}
    </div>
  );
}

function ItemDatoContexto({
  etiqueta,
  valor,
  destacar = false,
}: {
  etiqueta: string;
  valor: string;
  destacar?: boolean;
}) {
  return (
    <div className="space-y-1 rounded-xl border border-border/50 bg-background/70 p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{etiqueta}</p>
      <p className={destacar ? 'text-sm font-semibold text-foreground' : 'text-sm text-foreground/80'}>
        {valor}
      </p>
    </div>
  );
}

function TarjetaMetricaContexto({
  titulo,
  valor,
  detalle,
}: {
  titulo: string;
  valor: string;
  detalle: string;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-background/80 p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">{titulo}</p>
      <p className="mt-2 text-2xl font-semibold text-foreground">{valor}</p>
      <p className="mt-1 text-sm text-muted-foreground">{detalle}</p>
    </div>
  );
}

export function ConsultaProfesionalPage() {
  const { token, rol, personaId } = useAuth();
  const { turnoId } = useParams({ from: '/auth/profesional/consulta/$turnoId' });
  const navigate = useNavigate();

  const [datosTurno, setDatosTurno] = useState<DatosTurno | null>(null);
  const formularioMediciones = useForm<FormularioMediciones, unknown, ValoresMedicionesConsulta>({
    resolver: zodResolver(medicionesConsultaSchema),
    defaultValues: FORMULARIO_INICIAL,
    mode: 'onBlur',
  });
  const {
    register,
    handleSubmit,
    reset,
    getValues,
    watch,
    setError: establecerErrorMediciones,
    formState: { errors },
  } = formularioMediciones;
  const formulario = watch();
  const [formularioObservaciones, setFormularioObservaciones] = useState<FormularioObservaciones>(
    FORMULARIO_OBSERVACIONES_INICIAL,
  );
  const [cargando, setCargando] = useState(true);
  const [guardandoMediciones, setGuardandoMediciones] = useState(false);
  const [guardandoObservaciones, setGuardandoObservaciones] = useState(false);
  const [finalizandoConsulta, setFinalizandoConsulta] = useState(false);
  const [reabriendoConsulta, setReabriendoConsulta] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [mensajeExitoObservaciones, setMensajeExitoObservaciones] = useState<string | null>(null);
  const [etapaActiva, setEtapaActiva] = useState<IdEtapaConsulta>('contexto');
  const [historialMediciones, setHistorialMediciones] = useState<HistorialMediciones | null>(null);
  const [cargandoEvolucion, setCargandoEvolucion] = useState(false);
  const [errorEvolucion, setErrorEvolucion] = useState(false);
  const [historialConsultas, setHistorialConsultas] = useState<HistorialConsultaPaciente[]>([]);
  const [cargandoHistorialConsultas, setCargandoHistorialConsultas] = useState(false);
  const [errorHistorialConsultas, setErrorHistorialConsultas] = useState(false);

  // Estado para adjuntos clínicos
  const [adjuntos, setAdjuntos] = useState<AdjuntoClinico[]>([]);
  const [cargandoAdjuntos, setCargandoAdjuntos] = useState(false);
  const [subiendoAdjunto, setSubiendoAdjunto] = useState(false);
  const [eliminandoAdjuntoId, setEliminandoAdjuntoId] = useState<number | null>(null);
  const [arrastrandoArchivo, setArrastrandoArchivo] = useState(false);
  const [colaArchivos, setColaArchivos] = useState<File[]>([]);

  // Estado para secciones colapsables
  const [secciones, setSecciones] = useState<EstadoSeccionesMediciones>(() => leerSeccionesMediciones());

  interface EstadoMedicionPrecargada {
    medicionActualId: number | null;
    camposPrecargados: CampoMedicionPrecargado[];
  }

  type AccionMedicionPrecargada =
    | { tipo: 'precargar'; idMedicion: number | null; campos: CampoMedicionPrecargado[] }
    | { tipo: 'actualizarId'; idMedicion: number }
    | { tipo: 'limpiar' };

  const estadoMedicionInicial: EstadoMedicionPrecargada = {
    medicionActualId: null,
    camposPrecargados: [],
  };

  function reducerMedicionPrecargada(
    estado: EstadoMedicionPrecargada,
    accion: AccionMedicionPrecargada
  ): EstadoMedicionPrecargada {
    switch (accion.tipo) {
      case 'precargar':
        return { medicionActualId: accion.idMedicion, camposPrecargados: accion.campos };
      case 'actualizarId':
        return { ...estado, medicionActualId: accion.idMedicion, camposPrecargados: [] };
      case 'limpiar':
        return estadoMedicionInicial;
    }
  }

  const [estadoMedicionPrecargada, despacharMedicionPrecargada] = useReducer(
    reducerMedicionPrecargada,
    estadoMedicionInicial
  );

  const medicionActualId = estadoMedicionPrecargada.medicionActualId;
  const camposPrecargados = estadoMedicionPrecargada.camposPrecargados;

  const toggleSeccion = (seccion: SeccionMediciones) => {
    setSecciones((prev) => {
      const siguiente = { ...prev, [seccion]: !prev[seccion] };
      guardarSeccionesMediciones(siguiente);
      return siguiente;
    });
  };

  const campoPrecargado = (campo: CampoMedicionPrecargado) => camposPrecargados.includes(campo);

  const esNutricionista = rol === 'NUTRICIONISTA';

  const socioIdConsulta = datosTurno?.socio.idPersona ?? 0;
  const idTurnoNumerico = Number(turnoId);
  const {
    data: galeriaFotos,
    refetch: recargarFotos,
  } = useFotosProgreso(socioIdConsulta, token);

  const consultaCerrada = useMemo(() => {
    if (!datosTurno) return false;
    return (
      datosTurno.estadoTurno === 'REALIZADO' ||
      datosTurno.consultaFinalizadaAt !== null
    );
  }, [datosTurno]);

  const consultaEditable = useMemo(() => {
    if (!datosTurno || consultaCerrada) return false;
    return datosTurno.estadoTurno === 'EN_CURSO';
  }, [consultaCerrada, datosTurno]);

  const mensajeEstadoConsulta = useMemo(() => {
    if (!datosTurno) {
      return null;
    }

    if (consultaCerrada) {
      return 'Esta consulta está cerrada. No se pueden modificar datos clínicos.';
    }

    if (
      datosTurno.estadoTurno === 'PROGRAMADO' ||
      datosTurno.estadoTurno === 'CONFIRMADO'
    ) {
      return 'La consulta todavía no puede editarse porque el turno no registró check-in.';
    }

    if (datosTurno.estadoTurno === 'PRESENTE') {
      return 'El check-in ya fue registrado. La consulta se habilitará al iniciarse.';
    }

    return null;
  }, [consultaCerrada, datosTurno]);

  const cargarResumenClinicoPaciente = useCallback(async () => {
    if (!token || !personaId || !datosTurno?.socio.idPersona) {
      return;
    }

    setCargandoEvolucion(true);
    setErrorEvolucion(false);
    setCargandoHistorialConsultas(true);
    setErrorHistorialConsultas(false);

    const [resultadoMediciones, resultadoConsultas] = await Promise.allSettled([
      apiRequest<ApiResponse<HistorialMediciones>>(
        `/turnos/profesional/${personaId}/pacientes/${datosTurno.socio.idPersona}/historial-mediciones`,
        { token },
      ),
      apiRequest<ApiResponse<HistorialConsultaPaciente[]>>(
        `/turnos/profesional/${personaId}/pacientes/${datosTurno.socio.idPersona}/historial-consultas`,
        { token },
      ),
    ]);

    if (resultadoMediciones.status === 'fulfilled') {
      setHistorialMediciones(resultadoMediciones.value.data);
    } else {
      setErrorEvolucion(true);
      setHistorialMediciones(null);
    }

    if (resultadoConsultas.status === 'fulfilled') {
      setHistorialConsultas(resultadoConsultas.value.data ?? []);
    } else {
      setErrorHistorialConsultas(true);
      setHistorialConsultas([]);
    }

    setCargandoEvolucion(false);
    setCargandoHistorialConsultas(false);
  }, [datosTurno?.socio.idPersona, personaId, token]);

  const cargarDatosTurno = useCallback(async () => {
    if (!token || !turnoId) {
      return;
    }

    try {
      setCargando(true);
      setError(null);

      const response = await apiRequest<ApiResponse<DatosTurno>>(
        `/turnos/${turnoId}`,
        { token },
      );

      setDatosTurno(response.data);

      // Pre-cargar altura desde ficha de salud si existe
      if (response.data.fichaSalud) {
        reset({
          ...getValues(),
          altura: String(response.data.fichaSalud?.altura ?? ''),
        });
      }

      setFormularioObservaciones({
        comentario: response.data.observacionClinica?.comentario ?? '',
        sugerencias: response.data.observacionClinica?.sugerencias ?? '',
        habitosSocio: response.data.observacionClinica?.habitosSocio ?? '',
        objetivosSocio: response.data.observacionClinica?.objetivosSocio ?? '',
        esPublica: response.data.observacionClinica?.esPublica ?? false,
      });
    } catch (requestError) {
      const mensaje =
        requestError instanceof Error
          ? requestError.message
          : 'No se pudo cargar los datos del turno.';
      setError(mensaje);
      toast.error(mensaje);
    } finally {
      setCargando(false);
    }
  }, [getValues, reset, token, turnoId]);

  // === Funciones de Adjuntos Clínicos ===

  const cargarAdjuntos = useCallback(async () => {
    if (!token || !turnoId) return;

    try {
      setCargandoAdjuntos(true);
      const response = await apiRequest<ApiResponse<AdjuntoClinico[]>>(
        `/turnos/${turnoId}/adjuntos`,
        { token },
      );
      setAdjuntos(response.data);
    } catch (requestError) {
      const mensaje =
        requestError instanceof Error
          ? requestError.message
          : 'No se pudieron cargar los adjuntos.';
      toast.error(mensaje);
    } finally {
      setCargandoAdjuntos(false);
    }
  }, [token, turnoId]);

  useEffect(() => {
    void cargarDatosTurno();
    void cargarAdjuntos();
  }, [cargarDatosTurno, cargarAdjuntos]);

  useEffect(() => {
    void cargarResumenClinicoPaciente();
  }, [cargarResumenClinicoPaciente]);

  useEffect(() => {
    if (!historialMediciones) return;
    const ultima = historialMediciones.mediciones[0];
    if (!ultima) return;

    const previo = getValues();
    if (previo.peso || previo.perimetroCintura) {
      return;
    }

    const valoresPrecargados: Partial<FormularioMediciones> = {};
    const camposDesdeHistorial: CampoMedicionPrecargado[] = [];
    const registrarValorPrevio = (campo: CampoMedicionPrecargado, valor: number | null | undefined) => {
      if (valor == null) {
        return;
      }

      valoresPrecargados[campo] = String(valor);
      camposDesdeHistorial.push(campo);
    };

    registrarValorPrevio('peso', ultima.peso);
    registrarValorPrevio('perimetroCintura', ultima.perimetroCintura);
    registrarValorPrevio('perimetroCadera', ultima.perimetroCadera);
    registrarValorPrevio('perimetroBrazo', ultima.perimetroBrazo);
    registrarValorPrevio('perimetroMuslo', ultima.perimetroMuslo);
    registrarValorPrevio('perimetroPecho', ultima.perimetroPecho);
    registrarValorPrevio('pliegueTriceps', ultima.pliegueTriceps);
    registrarValorPrevio('pliegueAbdominal', ultima.pliegueAbdominal);
    registrarValorPrevio('pliegueMuslo', ultima.pliegueMuslo);
    registrarValorPrevio('porcentajeGrasa', ultima.porcentajeGrasa);
    registrarValorPrevio('frecuenciaCardiaca', ultima.frecuenciaCardiaca);
    registrarValorPrevio('tensionSistolica', ultima.tensionSistolica);
    registrarValorPrevio('tensionDiastolica', ultima.tensionDiastolica);

    const esDelTurnoActual = ultima.idTurno === idTurnoNumerico;

    despacharMedicionPrecargada({
      tipo: 'precargar',
      idMedicion: esDelTurnoActual ? ultima.idMedicion : null,
      campos: esDelTurnoActual ? [] : camposDesdeHistorial,
    });
    reset({
      ...previo,
      ...valoresPrecargados,
    });
  }, [getValues, historialMediciones, reset, idTurnoNumerico]);

  const imc = useMemo(() => {
    const pesoNum = Number(formulario.peso);
    const alturaNum = Number(formulario.altura);

    if (
      !Number.isFinite(pesoNum) ||
      !Number.isFinite(alturaNum) ||
      pesoNum <= 0 ||
      alturaNum <= 0
    ) {
      return null;
    }

    const alturaMts = alturaNum / 100;
    const imcCalculado = pesoNum / (alturaMts * alturaMts);
    return imcCalculado.toFixed(2);
  }, [formulario.peso, formulario.altura]);

  const masaMagra = useMemo(() => {
    const pesoNum = Number(formulario.peso);
    const grasaNum = Number(formulario.porcentajeGrasa);

    if (
      !Number.isFinite(pesoNum) ||
      !Number.isFinite(grasaNum) ||
      pesoNum <= 0 ||
      grasaNum <= 0 ||
      grasaNum >= 100
    ) {
      return null;
    }

    return (pesoNum * (1 - grasaNum / 100)).toFixed(1);
  }, [formulario.peso, formulario.porcentajeGrasa]);

  // === Funciones de Adjuntos Clínicos (continuación) ===

  const validarArchivoAdjunto = (archivo: File): string | null => {
    if (archivo.size > 10 * 1024 * 1024) {
      return `${archivo.name}: excede el límite de 10MB.`;
    }

    const tiposPermitidos = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!tiposPermitidos.includes(archivo.type)) {
      return `${archivo.name}: tipo no permitido (solo JPG, PNG, PDF).`;
    }

    return null;
  };

  const subirAdjuntoIndividual = async (archivo: File): Promise<boolean> => {
    if (!token || !turnoId) return false;

    const errorValidacion = validarArchivoAdjunto(archivo);
    if (errorValidacion) {
      toast.error(errorValidacion);
      return false;
    }

    try {
      setSubiendoAdjunto(true);

      const formData = new FormData();
      formData.append('archivo', archivo);

      const response = await apiRequest<ApiResponse<AdjuntoClinico>>(
        `/turnos/${turnoId}/adjuntos`,
        {
          method: 'POST',
          token,
          formData,
        },
      );

      setAdjuntos((prev) => [response.data, ...prev]);
      return true;
    } catch (requestError) {
      const mensaje =
        requestError instanceof Error
          ? requestError.message
          : `No se pudo subir ${archivo.name}.`;
      toast.error(mensaje);
      return false;
    } finally {
      setSubiendoAdjunto(false);
    }
  };

  const subirColaAdjuntos = async (archivos: File[]) => {
    if (archivos.length === 0) return;

    setColaArchivos(archivos);
    let exitos = 0;

    for (const archivo of archivos) {
      const ok = await subirAdjuntoIndividual(archivo);
      if (ok) exitos += 1;
    }

    if (exitos > 0) {
      toast.success(
        exitos === 1
          ? 'Archivo subido correctamente.'
          : `${exitos} archivos subidos correctamente.`,
      );
    }

    setColaArchivos([]);
  };

  const manejarSeleccionArchivos = (archivos: FileList | null) => {
    if (!archivos || archivos.length === 0) return;
    const lista = Array.from(archivos);
    void subirColaAdjuntos(lista);
  };

  const manejarDropArchivos = (evento: React.DragEvent<HTMLDivElement>) => {
    evento.preventDefault();
    evento.stopPropagation();
    setArrastrandoArchivo(false);
    manejarSeleccionArchivos(evento.dataTransfer.files);
  };

  const manejarDragOverArchivos = (evento: React.DragEvent<HTMLDivElement>) => {
    evento.preventDefault();
    evento.stopPropagation();
    if (!arrastrandoArchivo) setArrastrandoArchivo(true);
  };

  const manejarDragLeaveArchivos = (evento: React.DragEvent<HTMLDivElement>) => {
    evento.preventDefault();
    evento.stopPropagation();
    if (evento.currentTarget === evento.target) {
      setArrastrandoArchivo(false);
    }
  };



  const eliminarAdjunto = async (adjuntoId: number) => {
    if (!token || !turnoId) return;

    try {
      setEliminandoAdjuntoId(adjuntoId);
      await apiRequest(`/turnos/${turnoId}/adjuntos/${adjuntoId}`, {
        method: 'DELETE',
        token,
      });
      setAdjuntos((prev) => prev.filter((a) => a.id !== adjuntoId));
      toast.success('Archivo eliminado.');
    } catch (requestError) {
      const mensaje =
        requestError instanceof Error
          ? requestError.message
          : 'No se pudo eliminar el archivo.';
      toast.error(mensaje);
    } finally {
      setEliminandoAdjuntoId(null);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const iniciarConsulta = useCallback(async (silencioso = false) => {
    if (!token || !turnoId) {
      return;
    }

    try {
      await apiRequest(`/turnos/${turnoId}/iniciar-consulta`, {
        method: 'POST',
        token,
      });

      await cargarDatosTurno();

      if (!silencioso) {
        toast.success('Consulta iniciada');
      }
    } catch (requestError) {
      const mensaje =
        requestError instanceof Error
          ? requestError.message
          : 'Error al iniciar consulta';

      if (!silencioso) {
        toast.error(mensaje);
      }
    }
  }, [cargarDatosTurno, token, turnoId]);

  const inicioConsultaIniciadoRef = useRef<string | null>(null);

  useEffect(() => {
    if (!datosTurno || consultaCerrada) {
      return;
    }

    if (datosTurno.estadoTurno !== 'PRESENTE') {
      return;
    }

    if (inicioConsultaIniciadoRef.current === turnoId) {
      return;
    }

    inicioConsultaIniciadoRef.current = turnoId;
    void iniciarConsulta(true);
  }, [consultaCerrada, datosTurno, iniciarConsulta, turnoId]);

  const guardarMediciones = handleSubmit(async (valores) => {
    if (!token || !turnoId) {
      return;
    }

    try {
      setGuardandoMediciones(true);
      setError(null);
      setMensajeExito(null);

      const actualizandoMedicion = medicionActualId !== null;
      const rutaMediciones = actualizandoMedicion
        ? `/turnos/${turnoId}/mediciones/${medicionActualId}`
        : `/turnos/${turnoId}/mediciones`;

      const respuesta = await apiRequest<ApiResponse<RespuestaGuardarMedicionesConsulta>>(rutaMediciones, {
        method: actualizandoMedicion ? 'PUT' : 'POST',
        token,
        body: convertirMedicionesConsultaPayload(valores),
      });

      despacharMedicionPrecargada({ tipo: 'actualizarId', idMedicion: respuesta.data.idMedicion });
      setMensajeExito(
        actualizandoMedicion
          ? 'Mediciones actualizadas correctamente'
          : 'Mediciones guardadas correctamente',
      );
      await cargarResumenClinicoPaciente();
      toast.success(actualizandoMedicion ? 'Mediciones actualizadas' : 'Mediciones guardadas');
    } catch (requestError) {
      const mensaje =
        requestError instanceof Error
          ? requestError.message
          : 'No se pudieron guardar las mediciones.';
      establecerErrorMediciones('root', { message: mensaje });
      setError(mensaje);
      toast.error(mensaje);
    } finally {
      setGuardandoMediciones(false);
    }
  });

  const guardarObservaciones = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token || !turnoId) {
      return;
    }

    try {
      setGuardandoObservaciones(true);
      setError(null);
      setMensajeExitoObservaciones(null);

      await apiRequest(`/turnos/${turnoId}/observaciones`, {
        method: 'POST',
        token,
        body: {
          comentario: formularioObservaciones.comentario.trim(),
          sugerencias: formularioObservaciones.sugerencias.trim() || undefined,
          habitosSocio: formularioObservaciones.habitosSocio.trim() || undefined,
          objetivosSocio: formularioObservaciones.objetivosSocio.trim() || undefined,
          esPublica: formularioObservaciones.esPublica,
        },
      });

      setMensajeExitoObservaciones('Observaciones guardadas correctamente');
      await cargarDatosTurno();
      toast.success('Observaciones guardadas');
    } catch (requestError) {
      // TASK-1.19: 409 = lock optimista (otro usuario ya modifico
      // observacion_clinica). El backend tiro OptimisticLockVersionMismatchError
      // que el AppErrorFilter global traduce a HTTP 409.
      const status =
        requestError instanceof Error &&
          'status' in requestError &&
          typeof requestError.status === 'number'
          ? requestError.status
          : null;

      if (status === 409) {
        toast.error(
          'La consulta fue modificada por otro usuario. Recargá los cambios.',
        );
        // Forzar recarga para que el form vuelva al estado persistido.
        await cargarDatosTurno();
        return;
      }

      const mensaje =
        requestError instanceof Error
          ? requestError.message
          : 'No se pudieron guardar las observaciones.';
      setError(mensaje);
      toast.error(mensaje);
    } finally {
      setGuardandoObservaciones(false);
    }
  };

  const finalizarConsulta = async () => {
    if (!token || !turnoId) {
      return;
    }

    try {
      setFinalizandoConsulta(true);

      await apiRequest(`/turnos/${turnoId}/finalizar-consulta`, {
        method: 'POST',
        token,
      });

      toast.success('Consulta finalizada exitosamente');
      navigate({ to: '/turnos-profesional' });
    } catch (requestError) {
      const mensaje =
        requestError instanceof Error
          ? requestError.message
          : 'Error al finalizar consulta';
      toast.error(mensaje);
    } finally {
      setFinalizandoConsulta(false);
    }
  };

  const reabrirConsultaCerradaAuto = async () => {
    if (!token || !turnoId) {
      return;
    }

    try {
      setReabriendoConsulta(true);

      await apiRequest(`/turnos/${turnoId}/reabrir-cierre-auto`, {
        method: 'POST',
        token,
      });

      toast.success('Consulta reabierta — ya podés completar los datos clínicos');
      void cargarDatosTurno();
    } catch (requestError) {
      const mensaje =
        requestError instanceof Error
          ? requestError.message
          : 'Error al reabrir la consulta';
      toast.error(mensaje);
    } finally {
      setReabriendoConsulta(false);
    }
  };

  if (!esNutricionista) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Acceso denegado</CardTitle>
        </CardHeader>
        <CardContent>
          Solo nutricionistas pueden acceder a esta pantalla.
        </CardContent>
      </Card>
    );
  }

  if (cargando) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-sm text-muted-foreground">Cargando datos de la consulta...</p>
        </CardContent>
      </Card>
    );
  }

  if (!datosTurno) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Turno no encontrado</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-muted-foreground">
            No se encontraron datos para este turno.
          </p>
          <Button asChild variant="outline">
            <Link to="/turnos-profesional">
              <ArrowLeft className="h-4 w-4" />
              Volver a turnos
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const { socio, fichaSalud } = datosTurno;
  const fotosSesionActual =
    galeriaFotos?.sesiones?.find((sesion) => sesion.turnoId === idTurnoNumerico)
      ?.fotos.flatMap((grupo) => grupo.fotos).length ?? 0;
  const etapasConsulta = obtenerEtapasConsulta({
    cargoTurno: !!datosTurno,
    cargoEvolucion: !cargandoEvolucion && !errorEvolucion,
    hayMedicionBase: Boolean(formulario.peso) || Boolean(historialMediciones?.mediciones.length),
    hayComentarioClinico: Boolean(formularioObservaciones.comentario.trim()),
    seModificoPlanObjetivos: Boolean(formularioObservaciones.objetivosSocio.trim()),
    cantidadFotosSesion: fotosSesionActual,
    cantidadAdjuntos: adjuntos.length,
    errorEvolucion,
  });
  const puedeCerrar = puedeCerrarConsulta(etapasConsulta);
  const ultimaMedicion = historialMediciones?.mediciones.at(0);
  const consultasRealizadas = historialConsultas.filter(
    (consulta) => consulta.estadoTurno === 'REALIZADO',
  );
  const ultimaConsultaRegistrada =
    consultasRealizadas[0] ?? historialConsultas[0] ?? null;

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl border border-orange-500/20 bg-gradient-to-r from-orange-500/10 via-rose-500/10 to-transparent p-8 mb-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-rose-500/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
        <div className="relative z-10 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <User className="h-8 w-8 text-orange-500" />
              <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-rose-600 bg-clip-text text-transparent">
                Consulta Profesional
              </h1>
            </div>
            <p className="text-muted-foreground">
              Turno del {datosTurno.fechaTurno} - {datosTurno.horaTurno}
            </p>
          </div>

          <Button asChild variant="outline">
            <Link to="/turnos-profesional">
              <ArrowLeft className="h-4 w-4" />
              Volver a turnos
            </Link>
          </Button>
        </div>
      </div>

      <IndicadorEtapasConsulta
        etapas={etapasConsulta}
        etapaActiva={etapaActiva}
        onCambiarEtapa={setEtapaActiva}
      />

      {datosTurno.estadoTurno === 'REALIZADO' && datosTurno.cierreAutomatico && !datosTurno.reabiertaPorCierreAuto && (
        <Card className="border-blue-200 bg-blue-50/60 shadow-sm">
          <CardContent className="flex items-center justify-between pt-6">
            <div className="flex items-start gap-3 text-blue-900">
              <FileWarning className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
              <div>
                <p className="text-sm font-medium">
                  Esta consulta fue cerrada automáticamente por inactividad
                </p>
                <p className="text-sm text-blue-700/70">
                  {datosTurno.motivoCierreAutomatico
                    ? `Motivo: ${datosTurno.motivoCierreAutomatico}`
                    : 'Podés reabrirla para completar los datos clínicos pendientes.'}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={reabrirConsultaCerradaAuto}
              disabled={reabriendoConsulta}
              className="shrink-0 border-blue-300 text-blue-700 hover:bg-blue-100"
            >
              {reabriendoConsulta ? 'Reabriendo...' : 'Reabrir consulta'}
            </Button>
          </CardContent>
        </Card>
      )}

      {datosTurno.estadoTurno === 'REALIZADO' && datosTurno.cierreAutomatico && datosTurno.reabiertaPorCierreAuto && (
        <Card className="border-emerald-200 bg-emerald-50/60 shadow-sm">
          <CardContent className="flex items-start gap-3 pt-6 text-emerald-900">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
            <p className="text-sm font-medium">
              Consulta reabierta — ya podés completar los datos clínicos pendientes.
            </p>
          </CardContent>
        </Card>
      )}

      <Tabs
        value={etapaActiva}
        onValueChange={(valor) => setEtapaActiva(valor as IdEtapaConsulta)}
        className="w-full"
      >
        {/* <TabsList className="mb-8 grid h-auto w-full grid-cols-2 bg-muted/50 p-1 md:grid-cols-4 xl:grid-cols-8">
          {etapasConsulta.map((etapa) => (
            <TabsTrigger key={etapa.id} value={etapa.id} className="text-xs">
              {etapa.titulo}
            </TabsTrigger>
          ))}
        </TabsList> */}

        <TabsContent value="contexto" className="space-y-6 animate-in fade-in-50 duration-500">
          {datosTurno.fichaActualizada && (
            <Card className="border-amber-200 bg-amber-50/60 shadow-sm">
              <CardContent className="flex items-start gap-3 pt-6 text-amber-900">
                <FileWarning className="mt-0.5 h-5 w-5 shrink-0" />
                <p className="text-sm font-medium">
                  La ficha de salud fue actualizada después de la última consulta.
                  Revisá este contexto antes de avanzar.
                </p>
              </CardContent>
            </Card>
          )}

          <Card className="overflow-hidden border-orange-200/70 bg-gradient-to-br from-orange-50/90 via-background to-rose-50/60 shadow-sm">
            <CardHeader className="border-b border-orange-100/80 pb-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-2">
                  <CardTitle className="text-xl font-semibold text-foreground">
                    Resumen clínico inicial
                  </CardTitle>
                  <p className="max-w-2xl text-sm text-muted-foreground">
                    Panorama rápido para arrancar la consulta con antecedentes,
                    métricas de referencia y la última interacción registrada.
                  </p>
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link
                    to="/profesional/paciente/$socioId/ficha"
                    params={{ socioId: socio.idPersona.toString() }}
                  >
                    Ver ficha longitudinal
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
                <div className="rounded-2xl border border-orange-100/80 bg-background/90 p-5 shadow-sm">
                  <div className="flex items-start gap-4">
                    <div className="rounded-2xl bg-orange-100 p-3 text-orange-700">
                      <User className="h-6 w-6" />
                    </div>
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-[0.2em] text-orange-700/80">
                          Paciente en consulta
                        </p>
                        <h2 className="text-2xl font-semibold text-foreground">
                          {socio.nombre} {socio.apellido}
                        </h2>
                      </div>

                      <div className="grid gap-3 md:grid-cols-2">
                        <ItemDatoContexto etiqueta="DNI" valor={obtenerTextoOPlaceholder(socio.dni)} />
                        <ItemDatoContexto etiqueta="Teléfono" valor={obtenerTextoOPlaceholder(socio.telefono)} />
                        <ItemDatoContexto etiqueta="Email" valor={obtenerTextoOPlaceholder(socio.email)} />
                        <ItemDatoContexto
                          etiqueta="Turno actual"
                          valor={`${datosTurno.fechaTurno} - ${datosTurno.horaTurno}`}
                          destacar
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                  <TarjetaMetricaContexto
                    titulo="Objetivo personal"
                    valor={obtenerTextoOPlaceholder(
                      fichaSalud?.objetivoPersonal,
                      'Sin objetivo cargado',
                    )}
                    detalle="Motivo principal declarado por el socio"
                  />
                  <TarjetaMetricaContexto
                    titulo="Actividad física"
                    valor={obtenerTextoOPlaceholder(
                      fichaSalud?.nivelActividadFisica,
                      'Sin registro',
                    )}
                    detalle="Nivel reportado en ficha de salud"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <TarjetaMetricaContexto
                  titulo="Peso de referencia"
                  valor={fichaSalud ? `${fichaSalud.peso} kg` : '-'}
                  detalle="Peso cargado al completar la ficha"
                />
                <TarjetaMetricaContexto
                  titulo="Altura de referencia"
                  valor={fichaSalud ? `${fichaSalud.altura} cm` : '-'}
                  detalle="Base inicial para cálculo e interpretación"
                />
                <TarjetaMetricaContexto
                  titulo="Último peso"
                  valor={ultimaMedicion ? `${ultimaMedicion.peso} kg` : '-'}
                  detalle={
                    ultimaMedicion
                      ? `Registrado el ${new Date(ultimaMedicion.fecha).toLocaleDateString('es-AR')}`
                      : 'Todavía no hay mediciones previas'
                  }
                />
                <TarjetaMetricaContexto
                  titulo="Consultas previas"
                  valor={String(consultasRealizadas.length)}
                  detalle={
                    ultimaConsultaRegistrada
                      ? `Última: ${ultimaConsultaRegistrada.fechaTurno}`
                      : 'Se trataría de una primera consulta'
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-medium text-foreground/80">
                Banderas clínicas
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Datos que pueden cambiar decisiones rápidas durante la consulta.
              </p>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-red-100 bg-red-50/60 p-4">
                <p className="mb-2 text-sm font-semibold text-red-900">Alergias</p>
                {renderizarEtiquetas(fichaSalud?.alergias ?? [], 'rojo')}
              </div>
              <div className="rounded-2xl border border-amber-100 bg-amber-50/60 p-4">
                <p className="mb-2 text-sm font-semibold text-amber-900">Patologías</p>
                {renderizarEtiquetas(fichaSalud?.patologias ?? [], 'ambar')}
              </div>
              <div className="rounded-2xl border border-border/60 bg-background/80 p-4">
                <p className="mb-2 text-sm font-semibold text-foreground">Restricciones alimentarias</p>
                <p className="text-sm text-muted-foreground">
                  {obtenerTextoOPlaceholder(
                    fichaSalud?.restriccionesAlimentarias,
                    'Sin restricciones declaradas',
                  )}
                </p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-background/80 p-4">
                <p className="mb-2 text-sm font-semibold text-foreground">Medicación actual</p>
                <p className="text-sm text-muted-foreground">
                  {obtenerTextoOPlaceholder(
                    fichaSalud?.medicacionActual,
                    'Sin medicación informada',
                  )}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-medium text-foreground/80">
                Última consulta registrada
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                El resumen clínico previo queda visible en contexto para no perder continuidad.
              </p>
            </CardHeader>
            <CardContent>
              {cargandoHistorialConsultas ? (
                <div className="rounded-2xl border border-dashed bg-muted/10 p-5 text-sm text-muted-foreground">
                  Cargando última consulta...
                </div>
              ) : errorHistorialConsultas ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
                  No se pudo cargar el historial de consultas. Podés continuar, pero el resumen previo no está disponible ahora.
                </div>
              ) : ultimaConsultaRegistrada ? (
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-3">
                    <ItemDatoContexto
                      etiqueta="Fecha"
                      valor={obtenerTextoOPlaceholder(ultimaConsultaRegistrada.fechaTurno)}
                      destacar
                    />
                    <ItemDatoContexto
                      etiqueta="Hora"
                      valor={obtenerTextoOPlaceholder(ultimaConsultaRegistrada.horaTurno)}
                    />
                    <ItemDatoContexto
                      etiqueta="Estado"
                      valor={obtenerTextoOPlaceholder(ultimaConsultaRegistrada.estadoTurno)}
                    />
                  </div>

                  <div className="grid gap-4 lg:grid-cols-2">
                    <div className="rounded-2xl border border-border/60 bg-background/80 p-4">
                      <p className="mb-2 text-sm font-semibold text-foreground">Comentario clínico</p>
                      <p className="text-sm leading-6 text-muted-foreground">
                        {obtenerTextoOPlaceholder(
                          ultimaConsultaRegistrada.notasProfesional,
                          'Sin comentario clínico registrado',
                        )}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-border/60 bg-background/80 p-4">
                      <p className="mb-2 text-sm font-semibold text-foreground">Sugerencias previas</p>
                      <p className="text-sm leading-6 text-muted-foreground">
                        {obtenerTextoOPlaceholder(
                          ultimaConsultaRegistrada.sugerencias,
                          'Sin sugerencias registradas',
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed bg-muted/10 p-6 text-center">
                  <p className="text-base font-medium text-foreground">Primera consulta</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    No hay consultas previas registradas para este paciente con este profesional.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {fichaSalud ? (
            <Card className="border-border/50 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-medium text-foreground/80">
                  Hábitos y antecedentes
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Información ampliada de ficha para entender rutina, soporte y riesgos asociados.
                </p>
              </CardHeader>
              <CardContent>
                <Accordion type="multiple" className="w-full space-y-4">
                  <AccordionItem value="habitos" className="rounded-2xl border border-border/60 px-4">
                    <AccordionTrigger className="text-base font-medium hover:no-underline">
                      Hábitos diarios
                    </AccordionTrigger>
                    <AccordionContent className="pb-0">
                      <div className="grid gap-3 pb-4 md:grid-cols-2 xl:grid-cols-3">
                        <ItemDatoContexto
                          etiqueta="Frecuencia de comidas"
                          valor={obtenerTextoOPlaceholder(fichaSalud.frecuenciaComidas)}
                        />
                        <ItemDatoContexto
                          etiqueta="Consumo de agua"
                          valor={formatearConsumoAgua(fichaSalud.consumoAguaDiario)}
                        />
                        <ItemDatoContexto
                          etiqueta="Horas de sueño"
                          valor={formatearHorasSueno(fichaSalud.horasSueno)}
                        />
                        <ItemDatoContexto
                          etiqueta="Consumo de alcohol"
                          valor={obtenerTextoOPlaceholder(fichaSalud.consumoAlcohol)}
                        />
                        <ItemDatoContexto
                          etiqueta="Tabaco"
                          valor={formatearSiNo(fichaSalud.fumaTabaco)}
                        />
                        <ItemDatoContexto
                          etiqueta="Suplementos actuales"
                          valor={obtenerTextoOPlaceholder(
                            fichaSalud.suplementosActuales,
                            'Sin suplementos informados',
                          )}
                        />
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="antecedentes" className="rounded-2xl border border-border/60 px-4">
                    <AccordionTrigger className="text-base font-medium hover:no-underline">
                      Antecedentes y soporte
                    </AccordionTrigger>
                    <AccordionContent className="pb-0">
                      <div className="grid gap-3 pb-4 md:grid-cols-2">
                        <ItemDatoContexto
                          etiqueta="Cirugías previas"
                          valor={obtenerTextoOPlaceholder(
                            fichaSalud.cirugiasPrevias,
                            'Sin cirugías registradas',
                          )}
                        />
                        <ItemDatoContexto
                          etiqueta="Antecedentes familiares"
                          valor={obtenerTextoOPlaceholder(
                            fichaSalud.antecedentesFamiliares,
                            'Sin antecedentes declarados',
                          )}
                        />
                        <ItemDatoContexto
                          etiqueta="Contacto de emergencia"
                          valor={obtenerTextoOPlaceholder(
                            fichaSalud.contactoEmergenciaNombre,
                            'Sin contacto cargado',
                          )}
                        />
                        <ItemDatoContexto
                          etiqueta="Tel. emergencia"
                          valor={obtenerTextoOPlaceholder(
                            fichaSalud.contactoEmergenciaTelefono,
                            'Sin teléfono cargado',
                          )}
                        />
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-amber-200/50 bg-amber-50/30 shadow-sm">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-amber-800/80">
                  <FileWarning className="h-5 w-5" />
                  <p className="text-sm font-medium">
                    El socio no tiene ficha de salud registrada.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

        </TabsContent>

        <TabsContent value="evolucion" className="space-y-6 animate-in fade-in-50 duration-500">
          <Card className="border-border/50 shadow-md">
            <CardHeader className="bg-muted/20 border-b border-border/50 pb-4">
              <CardTitle className="text-lg flex items-center gap-2 text-foreground/80">
                <TrendingUp className="h-5 w-5 text-primary" />
                Evolución previa
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              {cargandoEvolucion ? (
                <p className="text-sm text-muted-foreground">Cargando evolución...</p>
              ) : errorEvolucion ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                  No se pudo cargar la evolución previa. Podés continuar, pero revisá la ficha completa si necesitás contexto histórico.
                </div>
              ) : ultimaMedicion ? (
                <div className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-4">
                    <div className="rounded-xl border bg-card p-4">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Último peso</p>
                      <p className="mt-2 text-2xl font-bold">{ultimaMedicion.peso} kg</p>
                    </div>
                    <div className="rounded-xl border bg-card p-4">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">IMC</p>
                      <p className="mt-2 text-2xl font-bold">{ultimaMedicion.imc?.toFixed?.(1) ?? '-'}</p>
                    </div>
                    <div className="rounded-xl border bg-card p-4">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Mediciones</p>
                      <p className="mt-2 text-2xl font-bold">{historialMediciones?.mediciones.length ?? 0}</p>
                    </div>
                    <div className="rounded-xl border bg-card p-4">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Último registro</p>
                      <p className="mt-2 text-lg font-semibold">
                        {new Date(ultimaMedicion.fecha).toLocaleDateString('es-AR')}
                      </p>
                    </div>
                  </div>

                  {/* Resumen rápido de la consulta anterior: sin abrir la ficha completa */}
                  {(() => {
                    const consultaPrevia = historialConsultas.find(
                      (c) => c.estadoTurno === 'REALIZADO' || c.estadoTurno === 'EN_CURSO',
                    );
                    if (!consultaPrevia) return null;

                    const comentario = consultaPrevia.notasProfesional ?? consultaPrevia.sugerencias;
                    if (!comentario) return null;

                    return (
                      <div
                        data-testid="evolucion-resumen-consulta-previa"
                        className="rounded-xl border border-primary/20 bg-primary/5 p-5 shadow-sm"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-xs font-medium uppercase tracking-wide text-primary">
                            Última consulta · {consultaPrevia.fechaTurno} · {consultaPrevia.horaTurno}
                          </p>
                          {consultaPrevia.tipoConsulta ? (
                            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                              {consultaPrevia.tipoConsulta}
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-3 whitespace-pre-line text-sm text-foreground/80">{comentario}</p>
                        {consultaPrevia.sugerencias &&
                          consultaPrevia.notasProfesional &&
                          consultaPrevia.sugerencias !== consultaPrevia.notasProfesional ? (
                          <div className="mt-3 border-t border-primary/10 pt-3">
                            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                              Sugerencias
                            </p>
                            <p className="mt-1 whitespace-pre-line text-sm text-foreground/70">
                              {consultaPrevia.sugerencias}
                            </p>
                          </div>
                        ) : null}
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed bg-muted/10 p-6 text-center text-muted-foreground">
                  Este paciente todavía no tiene mediciones previas registradas.
                </div>
              )}
              <Link
                to="/profesional/paciente/$socioId/progreso"
                params={{ socioId: socio.idPersona.toString() }}
                search={{ consulta: idTurnoNumerico }}
              >
                <Button variant="outline">
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Abrir panel completo de evolución
                </Button>
              </Link>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mediciones" className="space-y-6 animate-in fade-in-50 duration-500">
          {/* Formulario de Mediciones */}
          <form onSubmit={guardarMediciones}>
            <Card className="border-border/50 shadow-md">
              <CardHeader className="bg-muted/20 border-b border-border/50 pb-4">
                <CardTitle className="text-lg flex items-center gap-2 text-foreground/80">
                  <Scale className="h-5 w-5 text-primary" />
                  Mediciones de la Consulta
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                {mensajeEstadoConsulta && (
                  <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50/50 p-4 text-sm text-amber-800">
                    <FileWarning className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                    <p className="font-medium">{mensajeEstadoConsulta}</p>
                  </div>
                )}
                {medicionActualId !== null && consultaEditable && (
                  <div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50/60 p-4 text-sm text-blue-900">
                    <Edit className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
                    <p className="font-medium">
                      Esta medición ya está guardada; los cambios actualizarán el registro existente.
                    </p>
                  </div>
                )}
                {/* Datos básicos - siempre visible */}
                <div className="grid gap-6 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="peso" required className="text-muted-foreground">
                      Peso (kg)
                    </Label>
                    {campoPrecargado('peso') && <IndicadorValorPrevio />}
                    <Input
                      id="peso"
                      type="number"
                      min={20}
                      max={500}
                      step="0.1"
                      {...register('peso')}
                      aria-invalid={errors.peso ? 'true' : 'false'}
                      aria-describedby={errors.peso ? 'peso-error' : undefined}
                      required
                      placeholder="Ej: 75.5"
                      disabled={!consultaEditable}
                      className="text-lg transition-all focus:ring-2 focus:ring-primary/20 h-12"
                    />
                    {errors.peso && (
                      <p id="peso-error" role="alert" className="text-sm text-destructive">
                        {errors.peso.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="altura" className="text-muted-foreground">Altura (cm)</Label>
                    {campoPrecargado('altura') && <IndicadorValorPrevio />}
                    <Input
                      id="altura"
                      type="number"
                      min={100}
                      max={250}
                      {...register('altura')}
                      aria-invalid={errors.altura ? 'true' : 'false'}
                      aria-describedby={errors.altura ? 'altura-error' : undefined}
                      placeholder="Pre-cargado de ficha"
                      disabled={!consultaEditable}
                      className="text-lg transition-all focus:ring-2 focus:ring-primary/20 h-12"
                    />
                    {errors.altura && (
                      <p id="altura-error" role="alert" className="text-sm text-destructive">
                        {errors.altura.message}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground/60">Se usa la última registrada</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="imc" className="text-muted-foreground">IMC (calculado)</Label>
                    <div className="relative">
                      <Input
                        id="imc"
                        type="text"
                        value={imc ?? '-'}
                        disabled
                        className="text-lg font-medium bg-muted/30 border-dashed h-12"
                      />
                      {imc && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${Number(imc) < 18.5 ? 'bg-blue-100 text-blue-800' :
                            Number(imc) < 25 ? 'bg-green-100 text-green-800' :
                              Number(imc) < 30 ? 'bg-amber-100 text-amber-800' :
                                'bg-red-100 text-red-800'
                            }`}>
                            {Number(imc) < 18.5 && 'Bajo peso'}
                            {Number(imc) >= 18.5 && Number(imc) < 25 && 'Normal'}
                            {Number(imc) >= 25 && Number(imc) < 30 && 'Sobrepeso'}
                            {Number(imc) >= 30 && 'Obesidad'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="w-full h-px bg-border/40 my-2" />

                {/* Secciones colapsables con estilo mejorado */}
                <div className="grid gap-3 lg:grid-cols-2">
                  {/* Perímetros */}
                  <div className="lg:col-span-2">
                    <SeccionColapsable
                      titulo="Perímetros corporales"
                      icono={Ruler}
                      expandida={secciones.perimetros}
                      onToggle={() => toggleSeccion('perimetros')}
                    >
                      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5 bg-background">
                        <div className="space-y-2">
                          <Label className="text-muted-foreground text-xs uppercase tracking-wider">Cintura (cm)</Label>
                          <Input
                            type="number"
                            min={0}
                            max={300}
                            step="0.1"
                            {...register('perimetroCintura')}
                            placeholder="Ej: 85"
                            disabled={!consultaEditable}
                            className="bg-transparent border-t-0 border-x-0 border-b-2 rounded-none px-1 focus-visible:ring-0 focus-visible:border-primary transition-colors"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-muted-foreground text-xs uppercase tracking-wider">Cadera (cm)</Label>
                          <Input
                            type="number"
                            min={0}
                            max={300}
                            step="0.1"
                            {...register('perimetroCadera')}
                            placeholder="Ej: 100"
                            disabled={!consultaEditable}
                            className="bg-transparent border-t-0 border-x-0 border-b-2 rounded-none px-1 focus-visible:ring-0 focus-visible:border-primary transition-colors"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-muted-foreground text-xs uppercase tracking-wider">Brazo (cm)</Label>
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            step="0.1"
                            {...register('perimetroBrazo')}
                            placeholder="Ej: 32"
                            disabled={!consultaEditable}
                            className="bg-transparent border-t-0 border-x-0 border-b-2 rounded-none px-1 focus-visible:ring-0 focus-visible:border-primary transition-colors"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-muted-foreground text-xs uppercase tracking-wider">Muslo (cm)</Label>
                          <Input
                            type="number"
                            min={0}
                            max={150}
                            step="0.1"
                            {...register('perimetroMuslo')}
                            placeholder="Ej: 55"
                            disabled={!consultaEditable}
                            className="bg-transparent border-t-0 border-x-0 border-b-2 rounded-none px-1 focus-visible:ring-0 focus-visible:border-primary transition-colors"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-muted-foreground text-xs uppercase tracking-wider">Pecho (cm)</Label>
                          <Input
                            type="number"
                            min={0}
                            max={200}
                            step="0.1"
                            {...register('perimetroPecho')}
                            placeholder="Ej: 95"
                            disabled={!consultaEditable}
                            className="bg-transparent border-t-0 border-x-0 border-b-2 rounded-none px-1 focus-visible:ring-0 focus-visible:border-primary transition-colors"
                          />
                        </div>
                      </div>
                    </SeccionColapsable>
                  </div>

                  {/* Pliegues cutáneos */}
                  <SeccionColapsable
                    titulo="Pliegues cutáneos"
                    icono={Activity}
                    expandida={secciones.pliegues}
                    onToggle={() => toggleSeccion('pliegues')}
                  >
                    <div className="grid gap-4 md:grid-cols-3 bg-background">
                      <div className="space-y-2">
                        <Label className="text-muted-foreground text-xs uppercase tracking-wider">Tríceps (mm)</Label>
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          step="0.1"
                          {...register('pliegueTriceps')}
                          placeholder="Ej: 15"
                          disabled={!consultaEditable}
                          className="bg-transparent border-t-0 border-x-0 border-b-2 rounded-none px-1 focus-visible:ring-0 focus-visible:border-primary transition-colors"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-muted-foreground text-xs uppercase tracking-wider">Abdominal (mm)</Label>
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          step="0.1"
                          {...register('pliegueAbdominal')}
                          placeholder="Ej: 20"
                          disabled={!consultaEditable}
                          className="bg-transparent border-t-0 border-x-0 border-b-2 rounded-none px-1 focus-visible:ring-0 focus-visible:border-primary transition-colors"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-muted-foreground text-xs uppercase tracking-wider">Muslo (mm)</Label>
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          step="0.1"
                          {...register('pliegueMuslo')}
                          placeholder="Ej: 18"
                          disabled={!consultaEditable}
                          className="bg-transparent border-t-0 border-x-0 border-b-2 rounded-none px-1 focus-visible:ring-0 focus-visible:border-primary transition-colors"
                        />
                      </div>
                    </div>
                  </SeccionColapsable>

                  <div className="space-y-3">
                    {/* Composición corporal */}
                    <SeccionColapsable
                      titulo="Composición corporal"
                      icono={Scale}
                      expandida={secciones.composicion}
                      onToggle={() => toggleSeccion('composicion')}
                    >
                      <div className="grid gap-4 md:grid-cols-2 bg-background">
                        <div className="space-y-2">
                          <Label className="text-muted-foreground text-xs uppercase tracking-wider">% Grasa corporal</Label>
                          <Input
                            type="number"
                            min={0}
                            max={70}
                            step="0.1"
                            {...register('porcentajeGrasa')}
                            placeholder="Ej: 22.5"
                            disabled={!consultaEditable}
                            className="bg-transparent border-t-0 border-x-0 border-b-2 rounded-none px-1 focus-visible:ring-0 focus-visible:border-primary transition-colors"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-muted-foreground text-xs uppercase tracking-wider">Masa magra</Label>
                          <Input
                            type="text"
                            value={masaMagra ? `${masaMagra} kg` : '-'}
                            disabled
                            className="bg-muted/30 border-dashed text-muted-foreground"
                          />
                        </div>
                      </div>
                    </SeccionColapsable>

                    {/* Signos vitales */}
                    <SeccionColapsable
                      titulo="Signos vitales"
                      icono={Heart}
                      expandida={secciones.signosVitales}
                      onToggle={() => toggleSeccion('signosVitales')}
                    >
                      <div className="grid gap-4 md:grid-cols-3 bg-background">
                        <div className="space-y-2">
                          <Label className="text-muted-foreground text-xs uppercase tracking-wider">Frec. cardíaca (lpm)</Label>
                          <Input
                            type="number"
                            min={30}
                            max={220}
                            {...register('frecuenciaCardiaca')}
                            placeholder="Ej: 72"
                            disabled={!consultaEditable}
                            className="bg-transparent border-t-0 border-x-0 border-b-2 rounded-none px-1 focus-visible:ring-0 focus-visible:border-primary transition-colors"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="tensionSistolica" className="text-muted-foreground text-xs uppercase tracking-wider">Sistólica (mmHg)</Label>
                          <Input
                            id="tensionSistolica"
                            type="number"
                            min={60}
                            max={250}
                            {...register('tensionSistolica')}
                            aria-invalid={errors.tensionSistolica ? 'true' : 'false'}
                            placeholder="Ej: 120"
                            disabled={!consultaEditable}
                            className="bg-transparent border-t-0 border-x-0 border-b-2 rounded-none px-1 focus-visible:ring-0 focus-visible:border-primary transition-colors"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="tensionDiastolica" className="text-muted-foreground text-xs uppercase tracking-wider">Diastólica (mmHg)</Label>
                          <Input
                            id="tensionDiastolica"
                            type="number"
                            min={40}
                            max={150}
                            {...register('tensionDiastolica')}
                            aria-invalid={errors.tensionDiastolica ? 'true' : 'false'}
                            aria-describedby={errors.tensionDiastolica ? 'tensionDiastolica-error' : undefined}
                            placeholder="Ej: 80"
                            disabled={!consultaEditable}
                            className="bg-transparent border-t-0 border-x-0 border-b-2 rounded-none px-1 focus-visible:ring-0 focus-visible:border-primary transition-colors"
                          />
                          {errors.tensionDiastolica && (
                            <p id="tensionDiastolica-error" role="alert" className="text-sm normal-case tracking-normal text-destructive">
                              {errors.tensionDiastolica.message}
                            </p>
                          )}
                        </div>
                      </div>
                    </SeccionColapsable>
                  </div>
                </div>

                <div className="w-full h-px bg-border/40 my-2" />

                {/* Notas de medición */}
                <div className="space-y-2">
                  <Label htmlFor="notasMedicion" className="text-muted-foreground">Notas de la medición</Label>
                  <Textarea
                    id="notasMedicion"
                    {...register('notasMedicion')}
                    placeholder="Observaciones relevantes sobre las mediciones tomadas, condiciones, herramientas utilizadas..."
                    rows={3}
                    disabled={!consultaEditable}
                    className="resize-none focus-visible:ring-primary/30"
                  />
                </div>

                {error && (
                  <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive font-medium">
                    <FileWarning className="mt-0.5 h-5 w-5 shrink-0" />
                    <p>{error}</p>
                  </div>
                )}

                {mensajeExito && (
                  <div className="flex items-start gap-2 rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 font-medium">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                    <p>{mensajeExito}</p>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-end gap-3 pt-6 border-t border-border/50">
                  <Button
                    type="submit"
                    variant="outline"
                    className="h-10 px-6 font-medium"
                    disabled={guardandoMediciones || finalizandoConsulta || !consultaEditable}
                  >
                    {guardandoMediciones ? 'Guardando...' : 'Guardar mediciones'}
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setEtapaActiva('revision')}
                    className="h-10 px-6 font-medium bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
                    disabled={guardandoMediciones || finalizandoConsulta || !consultaEditable}
                  >
                    Revisar cierre
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>
        </TabsContent>

        <TabsContent value="observacion" className="space-y-6 animate-in fade-in-50 duration-500">
          <form onSubmit={guardarObservaciones}>
            <Card className="border-border/50 shadow-md">
              <CardHeader className="bg-muted/20 border-b border-border/50 pb-4">
                <CardTitle className="text-lg flex items-center gap-2 text-foreground/80">
                  <FileText className="h-5 w-5 text-primary" />
                  Observaciones Clínicas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                {mensajeEstadoConsulta && (
                  <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50/50 p-4 text-sm text-amber-800">
                    <FileWarning className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                    <p className="font-medium">{mensajeEstadoConsulta}</p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="comentarioObservacion" className="text-muted-foreground text-base">
                    Comentario clínico <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="comentarioObservacion"
                    value={formularioObservaciones.comentario}
                    onChange={(event) =>
                      setFormularioObservaciones((previo) => ({
                        ...previo,
                        comentario: event.target.value,
                      }))
                    }
                    rows={5}
                    placeholder="Resumen clínico detallado de la consulta, evolución, hallazgos y evaluación profesional general..."
                    disabled={!consultaEditable}
                    required
                    className="resize-none text-base p-4 focus-visible:ring-primary/30"
                  />
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="sugerenciasObservacion" className="text-muted-foreground">Sugerencias y Pautas</Label>
                    <Textarea
                      id="sugerenciasObservacion"
                      value={formularioObservaciones.sugerencias}
                      onChange={(event) =>
                        setFormularioObservaciones((previo) => ({
                          ...previo,
                          sugerencias: event.target.value,
                        }))
                      }
                      rows={4}
                      placeholder="Indicaciones específicas, recomendaciones de estilo de vida, pautas..."
                      disabled={!consultaEditable}
                      className="resize-none focus-visible:ring-primary/30"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="habitosObservacion" className="text-muted-foreground">Hábitos reportados</Label>
                    <Textarea
                      id="habitosObservacion"
                      value={formularioObservaciones.habitosSocio}
                      onChange={(event) =>
                        setFormularioObservaciones((previo) => ({
                          ...previo,
                          habitosSocio: event.target.value,
                        }))
                      }
                      rows={4}
                      placeholder="Descanso, hidratación, adherencia al plan, adherencia al entrenamiento..."
                      disabled={!consultaEditable}
                      className="resize-none focus-visible:ring-primary/30"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="objetivosObservacion" className="text-muted-foreground">Objetivos acordados para próxima consulta</Label>
                  <Textarea
                    id="objetivosObservacion"
                    value={formularioObservaciones.objetivosSocio}
                    onChange={(event) =>
                      setFormularioObservaciones((previo) => ({
                        ...previo,
                        objetivosSocio: event.target.value,
                      }))
                    }
                    rows={3}
                    placeholder="Metas SMART (Específicas, Medibles, Alcanzables, Relevantes, Temporales)..."
                    disabled={!consultaEditable}
                    className="resize-none focus-visible:ring-primary/30"
                  />
                </div>

                <div className="pt-4 border-t border-border/50">
                  <label className="flex items-start gap-3 rounded-lg border border-border/60 bg-muted/20 p-4 text-sm cursor-pointer hover:bg-muted/40 transition-colors">
                    <input
                      type="checkbox"
                      checked={formularioObservaciones.esPublica}
                      onChange={(event) =>
                        setFormularioObservaciones((previo) => ({
                          ...previo,
                          esPublica: event.target.checked,
                        }))
                      }
                      disabled={!consultaEditable}
                      className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <div className="flex flex-col gap-1">
                      <span className="font-medium text-foreground">Marcar como observación compartida</span>
                      <span className="text-muted-foreground/80 leading-relaxed">
                        Si habilitás esta opción, el paciente (y otros roles autorizados) podrán ver esta nota en su historial.
                        Útil para dejar registro de lo acordado en consulta. Mantenelo desmarcado para notas privadas tuyas.
                      </span>
                    </div>
                  </label>
                </div>

                {mensajeExitoObservaciones && (
                  <div className="flex items-start gap-2 rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 font-medium">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                    <p>{mensajeExitoObservaciones}</p>
                  </div>
                )}

                <div className="flex justify-end pt-4">
                  <Button
                    type="submit"
                    className="h-10 px-8 font-medium shadow-sm"
                    disabled={guardandoObservaciones || finalizandoConsulta || !consultaEditable}
                  >
                    {guardandoObservaciones
                      ? 'Guardando...'
                      : 'Guardar clínica'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>

        </TabsContent>

        <TabsContent value="planObjetivos" className="space-y-6 animate-in fade-in-50 duration-500">
          <Card className="border-border/50 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/5 border-b border-border/50 p-6 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-100 rounded-full text-emerald-600">
                  <Utensils className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-emerald-900/80">Plan de Alimentación</h3>
                  <p className="text-sm text-emerald-800/60 max-w-md">
                    Gestioná la dieta y recomendaciones nutricionales para {socio.nombre}.
                  </p>
                </div>
              </div>
              <Link
                to="/profesional/plan/$socioId/editar"
                params={{ socioId: socio.idPersona.toString() }}
                search={{ turnoId: idTurnoNumerico }}
                className="w-full md:w-auto"
              >
                <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm border-emerald-700">
                  <Edit className="mr-2 h-4 w-4" />
                  Abrir editor de plan
                </Button>
              </Link>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="fotos" className="space-y-6 animate-in fade-in-50 duration-500">
          <FotosSesionConsulta
            socioId={socio.idPersona}
            turnoId={idTurnoNumerico}
            token={token}
            galeria={galeriaFotos}
            consultaEditable={consultaEditable}
            onFotoSubida={() => void recargarFotos()}
          />
        </TabsContent>

        <TabsContent value="adjuntos" className="space-y-6 animate-in fade-in-50 duration-500">
          <Card className="border-border/50 shadow-md">
            <CardHeader className="bg-muted/20 border-b border-border/50 pb-4">
              <CardTitle className="text-lg flex items-center gap-2 text-foreground/80">
                <FileText className="h-5 w-5 text-primary" />
                Archivos Clínicos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              {consultaCerrada && (
                <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50/50 p-4 text-sm text-amber-800">
                  <FileWarning className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                  <p className="font-medium">Esta consulta está cerrada. Solo puedes ver los adjuntos existentes.</p>
                </div>
              )}

              {/* Upload area */}
              {!consultaCerrada && (
                <div
                  onDragOver={manejarDragOverArchivos}
                  onDragEnter={manejarDragOverArchivos}
                  onDragLeave={manejarDragLeaveArchivos}
                  onDrop={manejarDropArchivos}
                  data-testid="adjuntos-dropzone"
                  className={
                    `flex flex-col md:flex-row items-start md:items-center gap-6 p-4 rounded-xl border-2 border-dashed transition-colors ` +
                    (arrastrandoArchivo
                      ? 'border-primary bg-primary/10 ring-2 ring-primary/30'
                      : 'border-border bg-muted/10')
                  }
                >
                  <label
                    data-testid="adjuntos-label"
                    className={
                      `flex flex-col items-center justify-center rounded-xl p-8 cursor-pointer transition-all w-full md:w-64 min-h-[160px] ` +
                      (subiendoAdjunto
                        ? 'border-border bg-muted/50 cursor-not-allowed opacity-60'
                        : arrastrandoArchivo
                          ? 'border-2 border-primary bg-primary/15 shadow-md'
                          : 'border border-primary/20 bg-primary/5 hover:border-primary/50 hover:bg-primary/10 shadow-sm')
                    }
                  >
                    <Upload className={`h-10 w-10 mb-3 ${subiendoAdjunto ? 'text-muted-foreground animate-pulse' : 'text-primary'}`} />
                    <span className={`font-medium ${subiendoAdjunto ? 'text-muted-foreground' : 'text-primary'}`}>
                      {arrastrandoArchivo
                        ? 'Soltá el archivo acá'
                        : subiendoAdjunto
                          ? 'Subiendo...'
                          : 'Seleccionar archivo(s)'}
                    </span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,application/pdf"
                      multiple
                      className="hidden"
                      disabled={subiendoAdjunto}
                      onChange={(e) => {
                        manejarSeleccionArchivos(e.target.files);
                        e.target.value = '';
                      }}
                    />
                  </label>
                  <div className="space-y-2 text-sm text-muted-foreground flex-1">
                    <h4 className="font-medium text-foreground">Sube estudios, análisis o fotos</h4>
                    <ul className="list-disc pl-5 space-y-1 marker:text-primary/50">
                      <li>Podés <strong>arrastrar y soltar</strong> varios archivos a la vez</li>
                      <li>Formatos soportados: <strong>JPG, PNG, PDF</strong></li>
                      <li>Tamaño máximo: <strong>10MB por archivo</strong></li>
                      <li>Los archivos quedan asociados de forma permanente a esta consulta</li>
                    </ul>
                    {colaArchivos.length > 0 && (
                      <div
                        data-testid="adjuntos-cola"
                        className="mt-3 rounded-lg border border-primary/30 bg-primary/5 p-3"
                      >
                        <p className="text-xs font-medium text-foreground">
                          Subiendo {colaArchivos.length} archivo{colaArchivos.length === 1 ? '' : 's'}...
                        </p>
                        <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                          {colaArchivos.map((archivo, idx) => (
                            <li key={`${archivo.name}-${idx}`} className="truncate">
                              · {archivo.name}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Lista de adjuntos */}
              <div>
                <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
                  Archivos de esta consulta ({adjuntos.length})
                </h4>
                {cargandoAdjuntos ? (
                  <div className="flex flex-col items-center py-8 text-muted-foreground">
                    <Activity className="h-8 w-8 animate-pulse text-muted-foreground/30 mb-2" />
                    <p className="text-sm">Cargando archivos...</p>
                  </div>
                ) : adjuntos.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 border rounded-xl border-dashed border-border bg-muted/5">
                    <FileText className="h-12 w-12 text-muted-foreground/20 mb-3" />
                    <p className="text-muted-foreground text-center max-w-[250px]">
                      No hay análisis ni documentos adjuntos registrados todavía.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {adjuntos.map((adjunto) => (
                      <div
                        key={adjunto.id}
                        className="group flex flex-col justify-between rounded-xl border border-border/60 bg-card p-4 hover:border-primary/30 hover:shadow-md transition-all duration-200"
                      >
                        <div className="flex items-start gap-3 min-w-0 mb-4">
                          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg shadow-sm ${adjunto.mimeType === 'application/pdf' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-blue-50 text-blue-600 border border-blue-100'
                            }`}>
                            <FileText className="h-6 w-6" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-foreground/90" title={adjunto.nombreOriginal}>
                              {adjunto.nombreOriginal}
                            </p>
                            <p className="text-xs text-muted-foreground font-medium mt-1">
                              {formatFileSize(adjunto.sizeBytes)}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {new Date(adjunto.createdAt).toLocaleDateString('es-AR', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 w-full pt-3 border-t border-border/40">
                          <a
                            href={adjunto.urlFirmada}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 flex items-center justify-center gap-2 h-9 rounded-md bg-muted/50 hover:bg-primary/10 hover:text-primary transition-colors text-sm font-medium"
                            title="Ver archivo"
                          >
                            Ver completo
                          </a>
                          {!consultaCerrada && (
                            <button
                              type="button"
                              onClick={() => void eliminarAdjunto(adjunto.id)}
                              disabled={eliminandoAdjuntoId === adjunto.id}
                              className="flex items-center justify-center h-9 w-9 shrink-0 rounded-md border border-transparent hover:bg-destructive/10 text-muted-foreground hover:text-destructive hover:border-destructive/20 transition-colors disabled:opacity-50"
                              title="Eliminar archivo"
                            >
                              {eliminandoAdjuntoId === adjunto.id ? (
                                <X className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revision" className="space-y-6 animate-in fade-in-50 duration-500">
          <RevisionFinalConsulta
            etapas={etapasConsulta}
            puedeCerrar={puedeCerrar}
            finalizando={finalizandoConsulta}
            consultaEditable={consultaEditable}
            onFinalizar={finalizarConsulta}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
