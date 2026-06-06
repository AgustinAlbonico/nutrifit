import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from 'react';
import { Link } from '@tanstack/react-router';
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  FileWarning,
  History,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FichaSaludBannerUltimaEdicion } from '@/components/ficha-salud/FichaSaludBannerUltimaEdicion';
import { FichaSaludConsentimientoModal } from '@/components/ficha-salud/FichaSaludConsentimientoModal';
import { FichaSaludHistorialModal } from '@/components/ficha-salud/FichaSaludHistorialModal';
import { SeccionConsentimiento } from '@/components/ficha-salud/SeccionConsentimiento';
import { useObtenerHistorialFicha } from '@/hooks/useObtenerHistorialFicha';
import { useObtenerVersionFicha } from '@/hooks/useObtenerVersionFicha';
import { validarFormularioFichaSalud } from '@/schemas/ficha-salud.schema';
import {
  FRECUENCIAS_COMIDAS,
  NIVELES_ACTIVIDAD_FISICA,
  type FrecuenciaComidasValue,
  type NivelActividadFisicaValue,
} from '@nutrifit/shared';
import type { FichaSaludSocio as FichaSaludSocioDto } from '@/types/ficha-salud';

type ConsumoAlcoholValue =
  | 'Nunca'
  | 'Ocasional'
  | 'Moderado'
  | 'Frecuente';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

type FrecuenciaComidasForm = FrecuenciaComidasValue | '';
type ConsumoAlcoholForm = ConsumoAlcoholValue | '';

interface FormularioFichaSalud {
  altura: string;
  peso: string;
  nivelActividadFisica: NivelActividadFisicaValue;
  alergias: string;
  patologias: string;
  objetivoPersonal: string;
  medicacionActual: string;
  suplementosActuales: string;
  cirugiasPrevias: string;
  antecedentesFamiliares: string;
  frecuenciaComidas: FrecuenciaComidasForm;
  consumoAguaDiario: string;
  restriccionesAlimentarias: string;
  consumoAlcohol: ConsumoAlcoholForm;
  fumaTabaco: boolean;
  horasSueno: string;
  contactoEmergenciaNombre: string;
  contactoEmergenciaTelefono: string;
}

const FORMULARIO_INICIAL: FormularioFichaSalud = {
  altura: '',
  peso: '',
  nivelActividadFisica: 'MODERADO',
  alergias: '',
  patologias: '',
  objetivoPersonal: '',
  medicacionActual: '',
  suplementosActuales: '',
  cirugiasPrevias: '',
  antecedentesFamiliares: '',
  frecuenciaComidas: '',
  consumoAguaDiario: '',
  restriccionesAlimentarias: '',
  consumoAlcohol: '',
  fumaTabaco: false,
  horasSueno: '',
  contactoEmergenciaNombre: '',
  contactoEmergenciaTelefono: '',
};

const separarLista = (valor: string): string[] => {
  return Array.from(
    new Set(
      valor
        .split(',')
        .map((item) => item.trim())
        .filter((item) => item.length > 0),
    ),
  );
};

const unirLista = (items: string[]): string => items.join(', ');

function formatearFechaHora(fecha: Date | string | null | undefined): string {
  if (!fecha) return 'desconocida';
  const fechaObj = fecha instanceof Date ? fecha : new Date(fecha);
  if (Number.isNaN(fechaObj.getTime())) return 'desconocida';
  return fechaObj.toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function obtenerMensajeError(err: unknown): string {
  return err instanceof Error
    ? err.message
    : 'No se pudo completar la operación.';
}

/**
 * Extrae los `details: string[]` que el backend devuelve dentro de
 * `error.error.details` cuando la respuesta 400 viene de class-validator.
 * Devuelve `null` si el error no trae detalles estructurados.
 */
function obtenerDetallesDelError(err: unknown): string[] | null {
  if (!(err instanceof Error)) return null;

  const apiError = err as Error & {
    details?: unknown;
  };
  if (!Array.isArray(apiError.details)) return null;

  const detalles = apiError.details.filter(
    (item): item is string => typeof item === 'string',
  );
  return detalles.length > 0 ? detalles : null;
}

/**
 * Mapea los mensajes de error del backend a campos del formulario
 * haciendo match por nombre del campo en el string (heurística best-effort
 * mientras el backend no devuelva `{ field, message }`).
 *
 * Solo mapea campos que existen en `erroresValidacion` y que ya están
 * siendo renderizados inline. El resto se expone en el banner.
 */
const MAPEO_CAMPOS_POR_TOKEN: ReadonlyArray<{
  campo: string;
  tokens: readonly string[];
}> = [
  { campo: 'altura', tokens: ['altura'] },
  { campo: 'peso', tokens: ['peso'] },
  { campo: 'nivelActividadFisica', tokens: ['actividad física', 'nivelActividadFisica'] },
  { campo: 'objetivoPersonal', tokens: ['objetivo personal', 'objetivoPersonal'] },
  { campo: 'alergias', tokens: ['alergia'] },
  { campo: 'patologias', tokens: ['patología', 'patologias'] },
  { campo: 'medicacionActual', tokens: ['medicación actual', 'medicacionActual'] },
  { campo: 'suplementosActuales', tokens: ['suplementos'] },
  { campo: 'cirugiasPrevias', tokens: ['cirugía', 'cirugiasPrevias'] },
  { campo: 'antecedentesFamiliares', tokens: ['antecedentes familiar'] },
  { campo: 'consumoAguaDiario', tokens: ['consumo de agua', 'consumoAguaDiario'] },
  { campo: 'restriccionesAlimentarias', tokens: ['restricciones aliment'] },
  { campo: 'horasSueno', tokens: ['horas de sueño', 'horasSueno'] },
  { campo: 'contactoEmergenciaNombre', tokens: ['nombre del contacto de emergencia'] },
  { campo: 'contactoEmergenciaTelefono', tokens: ['teléfono del contacto de emergencia'] },
  { campo: 'frecuenciaComidas', tokens: ['frecuencia de comidas'] },
  { campo: 'consumoAlcohol', tokens: ['consumo de alcohol'] },
  { campo: 'fumaTabaco', tokens: ['fuma tabaco'] },
];

function mapearDetallesACampos(
  detalles: string[],
): Record<string, string> {
  const resultado: Record<string, string> = {};
  for (const detalle of detalles) {
    const normalizado = detalle.toLowerCase();
    for (const { campo, tokens } of MAPEO_CAMPOS_POR_TOKEN) {
      if (tokens.some((token) => normalizado.includes(token.toLowerCase()))) {
        if (!resultado[campo]) {
          resultado[campo] = detalle;
        }
        break;
      }
    }
  }
  return resultado;
}

/**
 * Hace focus en el primer input del formulario con `aria-invalid="true"`.
 * Si no encuentra ninguno, no hace nada.
 */
function enfocarPrimerError(form: HTMLFormElement | null): void {
  if (!form) return;
  const invalido = form.querySelector<HTMLElement>('[aria-invalid="true"]');
  if (invalido) {
    invalido.scrollIntoView({ behavior: 'smooth', block: 'center' });
    invalido.focus({ preventScroll: true });
  }
}

/**
 * Genera el texto del tooltip del botón Guardar según el estado del form.
 * Comunica al usuario POR QUÉ el botón está deshabilitado.
 */
function obtenerTituloBotonGuardar({
  guardando,
  formularioValido,
  fichaExistente,
  erroresVisibles,
}: {
  guardando: boolean;
  formularioValido: boolean;
  fichaExistente: boolean;
  erroresVisibles: Record<string, string>;
  erroresValidacionMemo?:
    | { exito: true; datos: unknown }
    | { exito: false; errores: Record<string, string> };
}): string {
  if (guardando) return 'Guardando tu ficha de salud…';

  if (!formularioValido) {
    const campos = Object.keys(erroresVisibles);
    if (campos.length === 1) {
      const unicoCampo = campos[0];
      return `Revisá el campo "${unicoCampo}". ${erroresVisibles[unicoCampo]}`;
    }
    if (campos.length > 1) {
      return `Hay ${campos.length} campos para revisar antes de guardar.`;
    }
    if (!fichaExistente) {
      return 'Tildá el consentimiento expreso para guardar la ficha.';
    }
    return 'Revisá los datos antes de guardar.';
  }

  return fichaExistente
    ? 'Actualizar la ficha de salud'
    : 'Guardar la ficha de salud';
}

export function FichaSaludSocio() {
  const { token, rol } = useAuth();
  const queryClient = useQueryClient();

  const [formulario, setFormulario] =
    useState<FormularioFichaSalud>(FORMULARIO_INICIAL);
  const [fichaCargada, setFichaCargada] = useState<FichaSaludSocioDto | null>(
    null,
  );
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

  const [consentimiento, setConsentimiento] = useState(false);
  const [modalConsentimientoAbierto, setModalConsentimientoAbierto] =
    useState(false);
  const [modalHistorialAbierto, setModalHistorialAbierto] = useState(false);
  const [versionConsultada, setVersionConsultada] = useState<number | null>(
    null,
  );
  const [erroresValidacion, setErroresValidacion] = useState<
    Record<string, string>
  >({});
  const formRef = useRef<HTMLFormElement>(null);

  const fichaExistente = fichaCargada !== null;

  const cargarFichaSalud = useCallback(async () => {
    if (!token) {
      return;
    }
    try {
      setCargando(true);
      setError(null);
      const response = await apiRequest<ApiResponse<FichaSaludSocioDto | null>>(
        '/turnos/socio/ficha-salud',
        { token },
      );
      const ficha = response.data;
      if (!ficha) {
        setFichaCargada(null);
        setFormulario(FORMULARIO_INICIAL);
        setConsentimiento(false);
        return;
      }
      setFichaCargada(ficha);
      setConsentimiento(true);
      setFormulario({
        altura: String(ficha.altura),
        peso: String(ficha.peso),
        nivelActividadFisica: ficha.nivelActividadFisica,
        alergias: unirLista(ficha.alergias),
        patologias: unirLista(ficha.patologias),
        objetivoPersonal: ficha.objetivoPersonal,
        medicacionActual: ficha.medicacionActual ?? '',
        suplementosActuales: ficha.suplementosActuales ?? '',
        cirugiasPrevias: ficha.cirugiasPrevias ?? '',
        antecedentesFamiliares: ficha.antecedentesFamiliares ?? '',
        frecuenciaComidas: ficha.frecuenciaComidas ?? '',
        consumoAguaDiario: ficha.consumoAguaDiario
          ? String(ficha.consumoAguaDiario)
          : '',
        restriccionesAlimentarias: ficha.restriccionesAlimentarias ?? '',
        consumoAlcohol: ficha.consumoAlcohol ?? '',
        fumaTabaco: ficha.fumaTabaco,
        horasSueno: ficha.horasSueno ? String(ficha.horasSueno) : '',
        contactoEmergenciaNombre: ficha.contactoEmergenciaNombre ?? '',
        contactoEmergenciaTelefono: ficha.contactoEmergenciaTelefono ?? '',
      });
    } catch (requestError) {
      setError(obtenerMensajeError(requestError));
    } finally {
      setCargando(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token || rol !== 'SOCIO') {
      setCargando(false);
      return;
    }
    void cargarFichaSalud();
  }, [cargarFichaSalud, rol, token]);

  const {
    data: historial,
    isLoading: cargandoHistorial,
    isError: errorHistorial,
    error: errorHistorialRaw,
    refetch: refetchHistorial,
  } = useObtenerHistorialFicha({
    token,
    habilitado: modalHistorialAbierto,
  });

  const {
    data: datosVersion,
    isLoading: cargandoVersion,
    isError: errorVersion,
    error: errorVersionRaw,
  } = useObtenerVersionFicha({ token, n: versionConsultada });

  useEffect(() => {
    if (modalHistorialAbierto) {
      void refetchHistorial();
    }
  }, [modalHistorialAbierto, refetchHistorial]);

  const erroresValidacionMemo = useMemo(() => {
    const datosCrudos = {
      altura: formulario.altura,
      peso: formulario.peso,
      nivelActividadFisica: formulario.nivelActividadFisica,
      objetivoPersonal: formulario.objetivoPersonal,
    };
    return validarFormularioFichaSalud(datosCrudos);
  }, [
    formulario.altura,
    formulario.peso,
    formulario.nivelActividadFisica,
    formulario.objetivoPersonal,
  ]);

  const formularioValido = useMemo(() => {
    if (!erroresValidacionMemo.exito) return false;
    return !fichaExistente ? consentimiento : true;
  }, [erroresValidacionMemo, fichaExistente, consentimiento]);

  const erroresVisibles = useMemo<Record<string, string>>(() => {
    const zodErrores = erroresValidacionMemo.exito
      ? {}
      : erroresValidacionMemo.errores;
    return { ...zodErrores, ...erroresValidacion };
  }, [erroresValidacionMemo, erroresValidacion]);

  const mensajesErrorBanner = useMemo(() => {
    const mensajes = new Set<string>();
    for (const mensaje of Object.values(erroresVisibles)) {
      mensajes.add(mensaje);
    }
    if (error) {
      for (const parte of error.split(' • ')) {
        const trimmed = parte.trim();
        if (trimmed) mensajes.add(trimmed);
      }
    }
    return Array.from(mensajes);
  }, [erroresVisibles, error]);

  const manejarEnvio = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) return;

    if (!erroresValidacionMemo.exito) {
      setErroresValidacion(erroresValidacionMemo.errores);
      setError('Revisá los datos marcados en rojo.');
      enfocarPrimerError(formRef.current);
      return;
    }

    if (!fichaExistente && !consentimiento) {
      setError('Necesitamos tu consentimiento para almacenar la ficha.');
      return;
    }

    setErroresValidacion({});

    try {
      setGuardando(true);
      setError(null);
      setMensajeExito(null);

      const esCreacion = !fichaExistente;
      const payload = {
        altura: Number(formulario.altura),
        peso: Number(formulario.peso),
        nivelActividadFisica: formulario.nivelActividadFisica,
        alergias: separarLista(formulario.alergias),
        patologias: separarLista(formulario.patologias),
        objetivoPersonal: formulario.objetivoPersonal.trim(),
        medicacionActual: formulario.medicacionActual.trim() || null,
        suplementosActuales: formulario.suplementosActuales.trim() || null,
        cirugiasPrevias: formulario.cirugiasPrevias.trim() || null,
        antecedentesFamiliares: formulario.antecedentesFamiliares.trim() || null,
        frecuenciaComidas: formulario.frecuenciaComidas || null,
        consumoAguaDiario: formulario.consumoAguaDiario
          ? Number(formulario.consumoAguaDiario)
          : null,
        restriccionesAlimentarias: formulario.restriccionesAlimentarias.trim() || null,
        consumoAlcohol: formulario.consumoAlcohol || null,
        fumaTabaco: formulario.fumaTabaco,
        horasSueno: formulario.horasSueno ? Number(formulario.horasSueno) : null,
        contactoEmergenciaNombre: formulario.contactoEmergenciaNombre.trim() || null,
        contactoEmergenciaTelefono: formulario.contactoEmergenciaTelefono.trim() || null,
        ...(esCreacion ? { consentimiento: true } : {}),
      };

      const response = await apiRequest<ApiResponse<FichaSaludSocioDto>>(
        '/turnos/socio/ficha-salud',
        {
          method: 'PUT',
          token,
          body: payload,
        },
      );

      setFichaCargada(response.data);
      setMensajeExito(
        esCreacion
          ? 'Ficha de salud completada. Ya podés reservar turnos.'
          : 'Ficha actualizada correctamente.',
      );

      // Invalidar caches para que vistas que dependen del estado de la
      // ficha (modal bloqueante en Mis Turnos, modal de historial)
      // reflejen el cambio al volver.
      void queryClient.invalidateQueries({
        queryKey: ['ficha-salud', 'historial'],
      });
      void queryClient.invalidateQueries({
        queryKey: ['ficha-salud', 'estado'],
      });
    } catch (requestError) {
      const mensaje = obtenerMensajeError(requestError);
      const detalles = obtenerDetallesDelError(requestError);
      const erroresPorCampo = detalles ? mapearDetallesACampos(detalles) : {};
      setErroresValidacion(erroresPorCampo);
      setError(mensaje);
      if (Object.keys(erroresPorCampo).length > 0) {
        enfocarPrimerError(formRef.current);
      }
    } finally {
      setGuardando(false);
    }
  };

  if (rol !== 'SOCIO') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Acceso denegado</CardTitle>
        </CardHeader>
        <CardContent>Esta pantalla solo esta disponible para socios.</CardContent>
      </Card>
    );
  }

  return (
    <main
      role="main"
      aria-labelledby="titulo-ficha"
      className="space-y-6"
    >
      <div className="relative overflow-hidden rounded-2xl border border-orange-500/20 bg-gradient-to-r from-orange-500/10 via-rose-500/10 to-transparent p-8 mb-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-rose-500/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        <div className="relative z-10 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Calendar className="h-8 w-8 text-orange-500" aria-hidden="true" />
              <h1
                id="titulo-ficha"
                className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-rose-600 bg-clip-text text-transparent"
              >
                Mi ficha de salud
              </h1>
            </div>
            <p className="text-muted-foreground">
              Debes completar esta ficha para poder reservar turnos con nutricionistas.
            </p>
          </div>

          <Button asChild variant="outline">
            <Link to="/turnos/agendar" data-testid="volver-agendar">
              <ArrowLeft className="h-4 w-4" />
              Volver a agendar
            </Link>
          </Button>
        </div>
      </div>

      {fichaExistente && fichaCargada?.completada === true && (
        <FichaSaludBannerUltimaEdicion
          fecha={fichaCargada.actualizadaAt ?? fichaCargada.completadaAt}
        />
      )}

      {!fichaExistente && (
        <Card className="border-amber-200 bg-amber-50/40">
          <CardContent className="pt-4">
            <p className="text-sm text-amber-800">
              Todavía no tenés ficha cargada. Completala para habilitar la
              reserva de turnos.
            </p>
          </CardContent>
        </Card>
      )}

      {cargando ? (
        <Card>
          <CardContent className="py-8">
            <p
              className="text-sm text-muted-foreground"
              aria-live="polite"
            >
              Cargando ficha de salud...
            </p>
          </CardContent>
        </Card>
      ) : (
        <form
          ref={formRef}
          className="space-y-6"
          onSubmit={manejarEnvio}
          noValidate
        >
          {/* Consentimiento RGPD (siempre visible, requerido solo en creación) */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Consentimiento</CardTitle>
            </CardHeader>
            <CardContent>
              <SeccionConsentimiento
                checked={consentimiento}
                onChange={setConsentimiento}
                disabled={fichaExistente}
                required={!fichaExistente}
                fechaConsentimiento={fichaCargada?.consentAt}
                onAbrirModalRGPD={() => setModalConsentimientoAbierto(true)}
                idError={
                  !fichaExistente && !consentimiento && error
                    ? 'error-consentimiento'
                    : undefined
                }
              />
            </CardContent>
          </Card>

          {/* Sección: Datos físicos básicos */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Datos físicos básicos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <Label htmlFor="altura" required>
                    Altura (cm)
                  </Label>
                  <Input
                    id="altura"
                    type="number"
                    min={100}
                    max={250}
                    value={formulario.altura}
                    onChange={(event) =>
                      setFormulario((previo) => ({
                        ...previo,
                        altura: event.target.value,
                      }))
                    }
                    aria-invalid={
                      Boolean(erroresVisibles.altura) || undefined
                    }
                    aria-describedby={
                      erroresVisibles.altura ? 'error-altura' : undefined
                    }
                    title="Tu altura en centímetros, entre 100 y 250"
                    placeholder="Ej: 175"
                    required
                  />
                  {erroresVisibles.altura && (
                    <p
                      id="error-altura"
                      className="text-xs text-destructive"
                      role="alert"
                    >
                      {erroresVisibles.altura}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="peso" required>
                    Peso (kg)
                  </Label>
                  <Input
                    id="peso"
                    type="number"
                    min={20}
                    max={500}
                    step="0.1"
                    value={formulario.peso}
                    onChange={(event) =>
                      setFormulario((previo) => ({
                        ...previo,
                        peso: event.target.value,
                      }))
                    }
                    aria-invalid={Boolean(erroresVisibles.peso) || undefined}
                    aria-describedby={
                      erroresVisibles.peso ? 'error-peso' : undefined
                    }
                    title="Tu peso en kilogramos, entre 20 y 300 (el cliente bloquea >300)"
                    placeholder="Ej: 75.5"
                    required
                  />
                  {erroresVisibles.peso && (
                    <p
                      id="error-peso"
                      className="text-xs text-destructive"
                      role="alert"
                    >
                      {erroresVisibles.peso}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nivel-actividad" required>
                    Nivel de actividad física
                  </Label>
                  <select
                    id="nivel-actividad"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={formulario.nivelActividadFisica}
                    onChange={(event) =>
                      setFormulario((previo) => ({
                        ...previo,
                        nivelActividadFisica: event.target
                          .value as NivelActividadFisicaValue,
                      }))
                    }
                    required
                  >
                    {NIVELES_ACTIVIDAD_FISICA.map((opcion) => (
                      <option key={opcion.value} value={opcion.value}>
                        {opcion.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="objetivo" required>
                    Objetivo personal
                  </Label>
                  <Input
                    id="objetivo"
                    value={formulario.objetivoPersonal}
                    onChange={(event) =>
                      setFormulario((previo) => ({
                        ...previo,
                        objetivoPersonal: event.target.value,
                      }))
                    }
                    placeholder="Ej: bajar grasa, mejorar rendimiento..."
                    aria-invalid={
                      Boolean(erroresVisibles.objetivoPersonal) || undefined
                    }
                    aria-describedby={
                      erroresVisibles.objetivoPersonal
                        ? 'error-objetivo'
                        : undefined
                    }
                    required
                  />
                  {erroresVisibles.objetivoPersonal && (
                    <p
                      id="error-objetivo"
                      className="text-xs text-destructive"
                      role="alert"
                    >
                      {erroresVisibles.objetivoPersonal}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sección: Alergias y patologías */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Alergias y patologías</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="alergias">Alergias</Label>
                  <Input
                    id="alergias"
                    value={formulario.alergias}
                    onChange={(event) =>
                      setFormulario((previo) => ({
                        ...previo,
                        alergias: event.target.value,
                      }))
                    }
                    placeholder="Separar por coma. Ej: maní, lactosa"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="patologias">Patologías</Label>
                  <Input
                    id="patologias"
                    value={formulario.patologias}
                    onChange={(event) =>
                      setFormulario((previo) => ({
                        ...previo,
                        patologias: event.target.value,
                      }))
                    }
                    placeholder="Separar por coma. Ej: diabetes, hipertensión"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sección: Medicación y suplementos */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Medicación y suplementos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="medicacion">Medicación actual</Label>
                  <Textarea
                    id="medicacion"
                    value={formulario.medicacionActual}
                    onChange={(event) =>
                      setFormulario((previo) => ({
                        ...previo,
                        medicacionActual: event.target.value,
                      }))
                    }
                    placeholder="Listá los medicamentos que tomás actualmente"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="suplementos">Suplementos actuales</Label>
                  <Textarea
                    id="suplementos"
                    value={formulario.suplementosActuales}
                    onChange={(event) =>
                      setFormulario((previo) => ({
                        ...previo,
                        suplementosActuales: event.target.value,
                      }))
                    }
                    placeholder="Vitaminas, proteínas, etc."
                    rows={3}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sección: Historial médico */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Historial médico</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="cirugias">Cirugías previas</Label>
                  <Textarea
                    id="cirugias"
                    value={formulario.cirugiasPrevias}
                    onChange={(event) =>
                      setFormulario((previo) => ({
                        ...previo,
                        cirugiasPrevias: event.target.value,
                      }))
                    }
                    placeholder="Indicá si tuviste cirugías relevantes"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="antecedentes">Antecedentes familiares</Label>
                  <Textarea
                    id="antecedentes"
                    value={formulario.antecedentesFamiliares}
                    onChange={(event) =>
                      setFormulario((previo) => ({
                        ...previo,
                        antecedentesFamiliares: event.target.value,
                      }))
                    }
                    placeholder="Enfermedades en tu familia (diabetes, hipertensión, etc.)"
                    rows={3}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sección: Hábitos alimentarios */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Hábitos alimentarios</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="frecuencia-comidas">Comidas por día</Label>
                  <select
                    id="frecuencia-comidas"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={formulario.frecuenciaComidas}
                    onChange={(event) =>
                      setFormulario((previo) => ({
                        ...previo,
                        frecuenciaComidas: event.target
                          .value as FrecuenciaComidasForm,
                      }))
                    }
                  >
                    <option value="">Seleccionar...</option>
                    {FRECUENCIAS_COMIDAS.map((opcion) => (
                      <option key={opcion.value} value={opcion.value}>
                        {opcion.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="agua">Agua diaria (litros)</Label>
                  <Input
                    id="agua"
                    type="number"
                    min={0}
                    max={10}
                    step="0.5"
                    value={formulario.consumoAguaDiario}
                    onChange={(event) =>
                      setFormulario((previo) => ({
                        ...previo,
                        consumoAguaDiario: event.target.value,
                      }))
                    }
                    aria-invalid={
                      Boolean(erroresVisibles.consumoAguaDiario) || undefined
                    }
                    aria-describedby={
                      erroresVisibles.consumoAguaDiario
                        ? 'error-agua'
                        : undefined
                    }
                    placeholder="Ej: 2"
                  />
                  {erroresVisibles.consumoAguaDiario && (
                    <p
                      id="error-agua"
                      className="text-xs text-destructive"
                      role="alert"
                    >
                      {erroresVisibles.consumoAguaDiario}
                    </p>
                  )}
                </div>

                <div className="space-y-2 md:col-span-1">
                  <Label htmlFor="restricciones">Restricciones alimentarias</Label>
                  <Input
                    id="restricciones"
                    value={formulario.restriccionesAlimentarias}
                    onChange={(event) =>
                      setFormulario((previo) => ({
                        ...previo,
                        restriccionesAlimentarias: event.target.value,
                      }))
                    }
                    placeholder="Ej: vegetariano, kosher, halal"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sección: Hábitos de vida */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Hábitos de vida</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="alcohol">Consumo de alcohol</Label>
                  <select
                    id="alcohol"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={formulario.consumoAlcohol}
                    onChange={(event) =>
                      setFormulario((previo) => ({
                        ...previo,
                        consumoAlcohol: event.target.value as ConsumoAlcoholForm,
                      }))
                    }
                  >
                    <option value="">Seleccionar...</option>
                    <option value="Nunca">Nunca</option>
                    <option value="Ocasional">Ocasional</option>
                    <option value="Moderado">Moderado</option>
                    <option value="Frecuente">Frecuente</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tabaco">¿Fumás tabaco?</Label>
                  <div className="flex items-center gap-4 pt-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="tabaco"
                        checked={formulario.fumaTabaco === true}
                        onChange={() =>
                          setFormulario((previo) => ({
                            ...previo,
                            fumaTabaco: true,
                          }))
                        }
                      />
                      <span className="text-sm">Sí</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="tabaco"
                        checked={formulario.fumaTabaco === false}
                        onChange={() =>
                          setFormulario((previo) => ({
                            ...previo,
                            fumaTabaco: false,
                          }))
                        }
                      />
                      <span className="text-sm">No</span>
                    </label>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sueno">Horas de sueño (promedio)</Label>
                  <Input
                    id="sueno"
                    type="number"
                    min={0}
                    max={24}
                    value={formulario.horasSueno}
                    onChange={(event) =>
                      setFormulario((previo) => ({
                        ...previo,
                        horasSueno: event.target.value,
                      }))
                    }
                    aria-invalid={
                      Boolean(erroresVisibles.horasSueno) || undefined
                    }
                    aria-describedby={
                      erroresVisibles.horasSueno ? 'error-sueno' : undefined
                    }
                    placeholder="Ej: 7"
                  />
                  {erroresVisibles.horasSueno && (
                    <p
                      id="error-sueno"
                      className="text-xs text-destructive"
                      role="alert"
                    >
                      {erroresVisibles.horasSueno}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sección: Contacto de emergencia */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Contacto de emergencia</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="contacto-nombre">Nombre completo</Label>
                  <Input
                    id="contacto-nombre"
                    value={formulario.contactoEmergenciaNombre}
                    onChange={(event) =>
                      setFormulario((previo) => ({
                        ...previo,
                        contactoEmergenciaNombre: event.target.value,
                      }))
                    }
                    aria-invalid={
                      Boolean(erroresVisibles.contactoEmergenciaNombre) ||
                      undefined
                    }
                    aria-describedby={
                      erroresVisibles.contactoEmergenciaNombre
                        ? 'error-contacto-nombre'
                        : undefined
                    }
                    placeholder="Nombre del contacto"
                  />
                  {erroresVisibles.contactoEmergenciaNombre && (
                    <p
                      id="error-contacto-nombre"
                      className="text-xs text-destructive"
                      role="alert"
                    >
                      {erroresVisibles.contactoEmergenciaNombre}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contacto-telefono">Teléfono</Label>
                  <Input
                    id="contacto-telefono"
                    type="tel"
                    value={formulario.contactoEmergenciaTelefono}
                    onChange={(event) =>
                      setFormulario((previo) => ({
                        ...previo,
                        contactoEmergenciaTelefono: event.target.value,
                      }))
                    }
                    aria-invalid={
                      Boolean(erroresVisibles.contactoEmergenciaTelefono) ||
                      undefined
                    }
                    aria-describedby={
                      erroresVisibles.contactoEmergenciaTelefono
                        ? 'error-contacto-telefono'
                        : undefined
                    }
                    placeholder="Ej: +54 11 1234-5678"
                  />
                  {erroresVisibles.contactoEmergenciaTelefono && (
                    <p
                      id="error-contacto-telefono"
                      className="text-xs text-destructive"
                      role="alert"
                    >
                      {erroresVisibles.contactoEmergenciaTelefono}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Mensajes de error/éxito y botones */}
          <Card>
            <CardContent className="pt-6">
              {mensajesErrorBanner.length > 0 && (
                <div
                  className="mb-4 flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
                  role="alert"
                  aria-live="assertive"
                >
                  <FileWarning
                    className="mt-0.5 h-4 w-4 shrink-0"
                    aria-hidden="true"
                  />
                  {mensajesErrorBanner.length > 1 ? (
                    <ul className="list-disc pl-4 space-y-1">
                      {mensajesErrorBanner.map((mensaje, idx) => (
                        <li key={idx}>{mensaje}</li>
                      ))}
                    </ul>
                  ) : (
                    <p>{mensajesErrorBanner[0]}</p>
                  )}
                </div>
              )}

              {mensajeExito && (
                <div
                  className="mb-4 flex items-start gap-2 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700"
                  role="status"
                  aria-live="polite"
                >
                  <CheckCircle2
                    className="mt-0.5 h-4 w-4 shrink-0"
                    aria-hidden="true"
                  />
                  <p>{mensajeExito}</p>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-end gap-2">
                {fichaExistente && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setModalHistorialAbierto(true)}
                    data-testid="boton-ver-historial"
                  >
                    <History className="h-4 w-4" />
                    Ver historial
                  </Button>
                )}
                <Button type="button" variant="outline" asChild>
                  <Link to="/turnos/agendar" data-testid="ir-agendar-turno">
                    Ir a agendar turno
                  </Link>
                </Button>
                <Button
                  type="submit"
                  disabled={!formularioValido || guardando}
                  data-testid="boton-guardar-ficha"
                  title={obtenerTituloBotonGuardar({
                    guardando,
                    formularioValido,
                    fichaExistente,
                    erroresVisibles,
                    erroresValidacionMemo,
                  })}
                  aria-label={
                    fichaExistente
                      ? 'Actualizar ficha de salud'
                      : 'Guardar ficha de salud y dar consentimiento'
                  }
                >
                  {guardando
                    ? 'Guardando...'
                    : !formularioValido
                      ? 'No se puede guardar todavía'
                      : fichaExistente
                        ? 'Actualizar ficha'
                        : 'Guardar ficha'}
                  {!formularioValido && !guardando && (
                    <AlertCircle
                      className="ml-2 h-4 w-4"
                      aria-hidden="true"
                    />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      )}

      <FichaSaludConsentimientoModal
        open={modalConsentimientoAbierto}
        onClose={() => setModalConsentimientoAbierto(false)}
        onAceptar={() => setConsentimiento(true)}
        fechaConsentimiento={fichaCargada?.consentAt}
      />

      <FichaSaludHistorialModal
        open={modalHistorialAbierto}
        onClose={() => {
          setModalHistorialAbierto(false);
          setVersionConsultada(null);
        }}
        versiones={historial}
        cargando={cargandoHistorial}
        error={errorHistorial ? obtenerMensajeError(errorHistorialRaw) : null}
        versionSeleccionada={versionConsultada}
        datosVersion={datosVersion}
        cargandoVersion={cargandoVersion}
        errorVersion={errorVersion ? obtenerMensajeError(errorVersionRaw) : null}
        onSeleccionarVersion={(n) => setVersionConsultada(n)}
      />

      <p
        className="sr-only"
        data-testid="fecha-guardado-invisible"
        aria-hidden="true"
      >
        {formatearFechaHora(fichaCargada?.actualizadaAt)}
      </p>
    </main>
  );
}
