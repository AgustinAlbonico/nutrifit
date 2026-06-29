/**
 * PlanEditorPage — Editor de plan con IA V2.
 *
 * Compone los nuevos componentes del change `plan-alimentacion-ia-v2`:
 * - `<GeneradorPlanSemanal />` form V2 (RHF + Zod)
 * - `<WeeklyPlanGrid />` vista V2 con MacrosBadge + botones regen por scope
 * - `<RazonamientoCumplimiento />` panel colapsable con detalles de validación
 * - `<VersionHistory />` sidebar con historial inmutable de versiones
 * - `<FeedbackModal />` modal de feedback (botón flotante)
 *
 * Layout: grid responsive (1 columna mobile, 3 columnas desktop).
 * En desktop: main (2/3) + sidebar versiones (1/3).
/**
 * PlanEditorPage — Editor de plan con IA V2.
 *
 * Compone los nuevos componentes del change `plan-alimentacion-ia-v2`:
 * - `<GeneradorPlanSemanal />` form V2 (RHF + Zod)
 * - `<WeeklyPlanGrid />` vista V2 con MacrosBadge + botones regen por scope
 * - `<RazonamientoCumplimiento />` panel colapsable con detalles de validación
 * - `<VersionHistory />` sidebar con historial inmutable de versiones
 * - `<FeedbackModal />` modal de feedback (botón flotante)
 *
 * Layout: grid responsive (1 columna mobile, 3 columnas desktop).
 * En desktop: main (2/3) + sidebar versiones (1/3).
 * Botón flotante "Dar feedback" abre el FeedbackModal cuando hay un plan activo.
 *
 * Accesibilidad:
 * - Landmarks semánticos: <main>, <aside>, <header>, <section>
 * - aria-live en mensajes de error
 * - Focus management al abrir modal
 * - Skip-links implícitos por jerarquía de headings
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import {
  ArrowLeft,
  Sparkles,
  ThumbsUp,
  ExternalLink,
  Loader2,
  Lock,
  PenLine,
  History,
  Save,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';

import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';

import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AvatarPaciente } from '@/components/ui/avatar-paciente';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

import { GeneradorPlanSemanal } from '@/components/ia/GeneradorPlanSemanal';
import { FeedbackModal } from '@/components/ia/FeedbackModal';
import { VersionHistory } from '@/components/plan/VersionHistory';
import { RazonamientoCumplimiento } from '@/components/plan/RazonamientoCumplimiento';
import { RestriccionesEditablesCard } from '@/components/plan/RestriccionesEditablesCard';
import { GrillaManualSlots } from '@/components/plan/GrillaManualSlots';
import { PanelIdeasIa } from '@/components/plan/PanelIdeasIa';

import { apiRequest } from '@/lib/api';
import { desenvolverRespuestaApi } from '@/lib/api-response';
import { useObtenerFichaNutricionista } from '@/hooks/useObtenerFichaNutricionista';
import { useEditarFichaPaciente } from '@/hooks/useEditarFichaPaciente';
import { useDebounce } from '@/hooks/useDebounce';
import { normalizarVersionesPlan } from '@/hooks/useVersionesPlan';
import type { PaginatedData } from '@nutrifit/shared';
import type { ApiResponse } from '@/types/api';
import type {
  RespuestaPlanSemanalV2FE,
  EstructuraDiaFE,
  PlanAlimentacionDatosJsonFE,
  DiaSemana,
  TipoComidaPlan,
  IdeaComidaIa,
} from '@/types/ia';
import type { FichaSaludSocio } from '@/types/ficha-salud';

interface PacienteResumen {
  socioId: number;
  nombreCompleto: string;
  dni: string;
  fotoPerfilUrl: string | null;
}

interface PlanAlimentacionListadoFE {
  idPlanAlimentacion: number;
  fechaCreacion?: string | Date;
  objetivoNutricional?: string;
  activo?: boolean;
  estado?: 'BORRADOR' | 'ACTIVO' | 'FINALIZADO';
  eliminadoEn?: string | Date | null;
  socioId?: number;
  nutricionistaId?: number;
}

interface PropiedadesEstadoBloqueadoPlanEditor {
  titulo: string;
  descripcion: string;
  onVolver: () => void;
}

function normalizarRespuestaConMacros<
  T extends {
    plan: RespuestaPlanSemanalV2FE['plan'];
    macros: RespuestaPlanSemanalV2FE['macros'];
  },
>(respuesta: T): T {
  return {
    ...respuesta,
    plan: {
      ...respuesta.plan,
      macrosPorDia: respuesta.macros?.macrosPorDia ?? respuesta.plan.macrosPorDia,
    },
  };
}

function normalizarPlanesListado(
  respuesta: PlanAlimentacionListadoFE[] | ApiResponse<PlanAlimentacionListadoFE[]>,
): PlanAlimentacionListadoFE[] {
  const data = desenvolverRespuestaApi(respuesta);
  return Array.isArray(data) ? data : [];
}

function esPlanEditableExistente(
  plan: PlanAlimentacionListadoFE,
  nutricionistaId: number | null,
): boolean {
  if (plan.eliminadoEn) return false;
  if (plan.estado === 'FINALIZADO') return false;
  if (nutricionistaId != null && plan.nutricionistaId != null) {
    return plan.nutricionistaId === nutricionistaId;
  }
  return true;
}

const DIAS_PLAN: DiaSemana[] = [
  'LUNES',
  'MARTES',
  'MIERCOLES',
  'JUEVES',
  'VIERNES',
  'SABADO',
  'DOMINGO',
];

const TIPOS_COMIDA_PLAN: TipoComidaPlan[] = [
  'DESAYUNO',
  'ALMUERZO',
  'MERIENDA',
  'CENA',
  'COLACION',
];

interface VersionPlanCompletaFE {
  id: number;
  planAlimentacionId: number;
  numeroVersion: number;
  datosJson: PlanAlimentacionDatosJsonFE;
}

function crearEstructuraInicial(): EstructuraDiaFE[] {
  return DIAS_PLAN.map((dia) => ({
    dia,
    comidas: TIPOS_COMIDA_PLAN.map((tipo) => ({ tipo, alternativas: [] })),
  }));
}

function completarEstructuraManual(
  estructuraPersistida?: EstructuraDiaFE[],
): EstructuraDiaFE[] {
  const estructuraBase = crearEstructuraInicial();
  if (!estructuraPersistida || estructuraPersistida.length === 0) {
    return estructuraBase;
  }

  return estructuraBase.map((diaBase) => {
    const diaPersistido = estructuraPersistida.find((dia) => dia.dia === diaBase.dia);
    if (!diaPersistido) return diaBase;

    return {
      dia: diaBase.dia,
      comidas: diaBase.comidas.map((comidaBase) => {
        const comidaPersistida = diaPersistido.comidas.find(
          (comida) => comida.tipo === comidaBase.tipo,
        );
        return comidaPersistida
          ? { ...comidaPersistida, alternativas: comidaPersistida.alternativas ?? [] }
          : comidaBase;
      }),
    };
  });
}

interface PersistirManualPayload {
  dias: Array<{
    dia: string;
    orden: number;
    comidas: Array<{
      tipoComida: string;
      alternativas: Array<{
        nombre?: string;
        alimentos: Array<{
          alimentoId: number;
          cantidad: number;
          unidad?: string;
        }>;
      }>;
    }>;
  }>;
  notas?: string;
}

function estructuraToPayload(estructura: EstructuraDiaFE[]): PersistirManualPayload {
  return {
    dias: estructura.map((dia, orden) => ({
      dia: dia.dia,
      orden,
      comidas: dia.comidas.map((comida) => ({
        tipoComida: comida.tipo,
        alternativas: comida.alternativas.map((alt) => ({
          nombre: alt.nombre,
          alimentos: alt.alimentos,
        })),
      })),
    })),
  };
}

export function PlanEditorPage() {
  const { token, personaId, rol } = useAuth();
  const params = useParams({ strict: false }) as { socioId?: string };
  const navigate = useNavigate();
  const socioIdNumero = params.socioId ? Number(params.socioId) : undefined;
  const puedeEditarPlanes = rol === 'NUTRICIONISTA';

  // Estado principal: respuesta del backend con el plan generado
  const [respuesta, setRespuesta] = useState<RespuestaPlanSemanalV2FE | null>(
    null,
  );
  // Versión seleccionada (click en sidebar → carga otra versión)
  const [versionSeleccionadaId, setVersionSeleccionadaId] = useState<
    number | null
  >(null);

  // Modal de feedback
  const [feedbackAbierto, setFeedbackAbierto] = useState(false);

  // Modo de tabs: editor | versiones
  const [modo, setModo] = useState<'editor' | 'versiones'>('editor');
  const [planManualExistenteId, setPlanManualExistenteId] = useState<number | null>(
    null,
  );
  const [cargandoPlanExistente, setCargandoPlanExistente] = useState(false);


  // Paciente
  const [paciente, setPaciente] = useState<PacienteResumen | null>(null);
  const [cargandoPaciente, setCargandoPaciente] = useState(false);

  // Estados del editor unificado y autoguardado de borrador
  const [estructura, setEstructura] = useState<EstructuraDiaFE[]>(crearEstructuraInicial);
  const [ultimoGuardado, setUltimoGuardado] = useState<Date | null>(null);
  const [guardandoBorrador, setGuardandoBorrador] = useState(false);
  const [cargandoEstructura, setCargandoEstructura] = useState(false);
  const haSidoModificadoRef = useRef(false);

  // Estados de sugerencias IA por slot
  const [diaSeleccionado, setDiaSeleccionado] = useState<DiaSemana>('LUNES');
  const [comidaSeleccionada, setComidaSeleccionada] = useState<TipoComidaPlan>('DESAYUNO');

  // Ficha de salud del paciente
  const {
    data: ficha,
    isLoading: cargandoFicha,
    isError: errorFicha,
    sinFicha,
    sinPermisos,
  } = useObtenerFichaNutricionista({
    token,
    nutricionistaId: personaId,
    socioId: socioIdNumero ?? null,
    habilitado: puedeEditarPlanes,
  });

  // Mutación para editar ficha
  const {
    editarFichaAsync,
    isPending: guardandoFicha,
    error: errorGuardarFicha,
  } = useEditarFichaPaciente({
    token,
    nutricionistaId: personaId ?? 0,
    socioId: socioIdNumero ?? 0,
  });

  const manejarGuardarFicha = async (
    datosEditados: Partial<FichaSaludSocio>,
  ): Promise<void> => {
    if (!puedeEditarPlanes || !socioIdNumero || !personaId) return;
    await editarFichaAsync({ payload: datosEditados });
    toast.success('Ficha del paciente actualizada', {
      description: `Versión guardada. La IA usará los datos actualizados.`,
    });
  };

  // Carga paciente cuando cambia el socioId
  useEffect(() => {
    if (!puedeEditarPlanes || !token || !personaId || !socioIdNumero) return;
    let cancelado = false;

    const cargarPaciente = async () => {
      try {
        setCargandoPaciente(true);
        // El endpoint devuelve {success, data: {data: [...], pagination: {...}}}
        // — apiRequest no desenvuelve el wrapper. Acceso: respuesta.data.data.
        type RespuestaApi = {
          data: PaginatedData<PacienteResumen>;
        };
        const respuestaApi = await apiRequest<RespuestaApi>(
          `/turnos/profesional/${personaId}/pacientes`,
          { token },
        );

        if (cancelado) return;

        const lista = respuestaApi?.data?.data ?? [];
        const encontrado = lista.find(
          (p) => String(p.socioId) === String(socioIdNumero),
        );
        setPaciente(encontrado ?? null);
      } catch {
        if (!cancelado) setPaciente(null);
      } finally {
        if (!cancelado) setCargandoPaciente(false);
      }
    };

    void cargarPaciente();
    return () => {
      cancelado = true;
    };
  }, [puedeEditarPlanes, token, personaId, socioIdNumero]);

  useEffect(() => {
    if (!puedeEditarPlanes || !socioIdNumero) return;
    let cancelado = false;

    const cargarPlanEditableExistente = async () => {
      try {
        setCargandoPlanExistente(true);
        const respuestaApi = await apiRequest<
          PlanAlimentacionListadoFE[] | ApiResponse<PlanAlimentacionListadoFE[]>
        >(`/planes-alimentacion/socio/${socioIdNumero}`, { token });

        if (cancelado) return;

        const planEditable = normalizarPlanesListado(respuestaApi).find((plan) =>
          esPlanEditableExistente(plan, personaId ?? null),
        );
        setPlanManualExistenteId(planEditable?.idPlanAlimentacion ?? null);
      } catch {
        if (!cancelado) setPlanManualExistenteId(null);
      } finally {
        if (!cancelado) setCargandoPlanExistente(false);
      }
    };

    void cargarPlanEditableExistente();
    return () => {
      cancelado = true;
    };
  }, [puedeEditarPlanes, token, personaId, socioIdNumero]);

  const volverAlPlan = () => {
    if (socioIdNumero) {
      void navigate({ to: `/profesional/plan/${socioIdNumero}` });
    } else {
      void navigate({ to: '/dashboard' });
    }
  };

  const irAMiPerfil = () => {
    void navigate({ to: '/profesional/mi-perfil' });
  };

  const [cargandoPlanManual, setCargandoPlanManual] = useState(false);

  const manejarCrearPlanManual = async () => {
    if (!socioIdNumero) return;
    setCargandoPlanManual(true);
    try {
      const res = await apiRequest<
        RespuestaPlanSemanalV2FE | ApiResponse<RespuestaPlanSemanalV2FE>
      >(`/planes-alimentacion/crear-manual/${socioIdNumero}`, {
        method: 'POST',
      });
      const planData = normalizarRespuestaConMacros(desenvolverRespuestaApi(res));
      setRespuesta(planData);
      setPlanManualExistenteId(planData.planAlimentacionId);
      setEstructura(crearEstructuraInicial());
      setModo('editor');
      toast.success('Plan manual creado');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al crear plan manual';
      toast.error(msg);
    } finally {
      setCargandoPlanManual(false);
    }
  };

  const planIdActual = respuesta?.planAlimentacionId ?? planManualExistenteId;

  // Carga el borrador o versión activa al montar o cambiar de plan
  useEffect(() => {
    if (!planIdActual) return;
    let cancelado = false;

    const cargarBorradorOActiva = async () => {
      try {
        setCargandoEstructura(true);
        const respuestaVersiones = await apiRequest<Parameters<typeof normalizarVersionesPlan>[0]>(
          `/planes-alimentacion/${planIdActual}/versiones`,
          { token }
        );
        const versiones = normalizarVersionesPlan(respuestaVersiones, planIdActual);
        
        // Buscar borrador (numeroVersion === 0)
        const borrador = versiones.find((v) => v.numeroVersion === 0);
        const activa = versiones.find((v) => v.activa);
        const seleccionada = borrador ?? activa ?? versiones[0] ?? null;

        if (cancelado) return;
        if (!seleccionada) {
          setEstructura(crearEstructuraInicial());
          return;
        }

        const respuestaVersion = await apiRequest<VersionPlanCompletaFE | ApiResponse<VersionPlanCompletaFE>>(
          `/planes-alimentacion/version/${seleccionada.idPlanAlimentacionVersion}`,
          { token }
        );
        const versionCompleta = desenvolverRespuestaApi(respuestaVersion);

        if (cancelado) return;
        setEstructura(completarEstructuraManual(versionCompleta.datosJson?.estructura));
        setVersionSeleccionadaId(seleccionada.idPlanAlimentacionVersion);
      } catch {
        if (!cancelado) setEstructura(crearEstructuraInicial());
      } finally {
        if (!cancelado) setCargandoEstructura(false);
      }
    };

    void cargarBorradorOActiva();
    return () => {
      cancelado = true;
    };
  }, [planIdActual, token]);

  // Auto-save debounced (800ms)
  const debouncedEstructura = useDebounce(estructura, 800);

  const tieneContenido = estructura.some((dia) =>
    dia.comidas.some((c) => c.alternativas.length > 0),
  );

  const persistirSilencioso = useCallback(
    async (estructuraParaGuardar: EstructuraDiaFE[]) => {
      if (!planIdActual) return;
      setGuardandoBorrador(true);
      try {
        await apiRequest(
          `/planes-alimentacion/${planIdActual}/persistir-manual`,
          {
            method: 'POST',
            body: estructuraToPayload(estructuraParaGuardar),
          },
        );
        setUltimoGuardado(new Date());
      } catch {
        // Silencioso
      } finally {
        setGuardandoBorrador(false);
      }
    },
    [planIdActual],
  );

  useEffect(() => {
    if (debouncedEstructura && haSidoModificadoRef.current && tieneContenido) {
      persistirSilencioso(debouncedEstructura);
    }
  }, [debouncedEstructura, tieneContenido, persistirSilencioso]);

  // Guardar versión explicitamente (V1, V2, etc.)
  const guardarVersionExplicita = async () => {
    if (!planIdActual) return;
    setGuardandoBorrador(true);
    try {
      const res = await apiRequest<RespuestaPlanSemanalV2FE | ApiResponse<RespuestaPlanSemanalV2FE>>(
        `/planes-alimentacion/${planIdActual}/guardar-version`,
        {
          method: 'POST',
        },
      );
      const planData = normalizarRespuestaConMacros(desenvolverRespuestaApi(res));
      setRespuesta(planData);
      setVersionSeleccionadaId(planData.versionId);
      haSidoModificadoRef.current = false;
      toast.success('Nueva versión guardada correctamente', {
        description: `Se creó la versión v${planData.numeroVersion} y se activó para el socio.`,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al guardar la versión';
      toast.error(msg);
    } finally {
      setGuardandoBorrador(false);
    }
  };

  // Drag and drop setup
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over) return;

      const ideaIdTemp = active.id as string;
      const slotKey = over.id as string;

      const idea = active.data.current as IdeaComidaIa | undefined;
      if (!idea || idea.idTemp !== ideaIdTemp) return;

      const guionIdx = slotKey.indexOf('-');
      if (guionIdx === -1) return;
      const dia = slotKey.slice(0, guionIdx) as DiaSemana;
      const tipoComida = slotKey.slice(guionIdx + 1) as TipoComidaPlan;

      const diaIdx = estructura.findIndex((d) => d.dia === dia);
      if (diaIdx === -1) return;
      const comidaIdx = estructura[diaIdx].comidas.findIndex((c) => c.tipo === tipoComida);
      if (comidaIdx === -1) return;

      const nuevaAlternativa = {
        nombre: idea.nombre,
        alimentos: idea.alimentos.map((a) => ({
          alimentoId: a.alimentoId,
          cantidad: a.cantidad,
          unidad: a.unidad,
        })),
        calorias: idea.calorias,
        proteinas: idea.proteinas,
        carbohidratos: idea.carbohidratos,
        grasas: idea.grasas,
      };

      setEstructura((prev) =>
        prev.map((d, i) => {
          if (i !== diaIdx) return d;
          return {
            ...d,
            comidas: d.comidas.map((c, j) => {
              if (j !== comidaIdx) return c;
              return {
                ...c,
                alternativas: [...c.alternativas, nuevaAlternativa],
              };
            }),
          };
        }),
      );
      haSidoModificadoRef.current = true;
    },
    [estructura],
  );

  const handleEstructuraChange = useCallback((nueva: EstructuraDiaFE[]) => {
    setEstructura(nueva);
    haSidoModificadoRef.current = true;
  }, []);

  const handleAddIdea = useCallback(
    (dia: DiaSemana, tipoComida: TipoComidaPlan, idea: IdeaComidaIa) => {
      setEstructura((prev) =>
        prev.map((d) => {
          if (d.dia !== dia) return d;
          return {
            ...d,
            comidas: d.comidas.map((c) => {
              if (c.tipo !== tipoComida) return c;
              return {
                ...c,
                alternativas: [
                  ...c.alternativas,
                  {
                    nombre: idea.nombre,
                    alimentos: idea.alimentos.map((a) => ({
                      alimentoId: a.alimentoId,
                      cantidad: a.cantidad,
                      unidad: a.unidad,
                    })),
                    calorias: idea.calorias,
                    proteinas: idea.proteinas,
                    carbohidratos: idea.carbohidratos,
                    grasas: idea.grasas,
                  },
                ],
              };
            }),
          };
        }),
      );
      haSidoModificadoRef.current = true;
    },
    [],
  );

  const handleSelectSlotForIa = useCallback((dia: DiaSemana, tipoComida: TipoComidaPlan) => {
    setDiaSeleccionado(dia);
    setComidaSeleccionada(tipoComida);
  }, []);





  const planIdEditorManual = respuesta?.planAlimentacionId ?? planManualExistenteId;

  if (!puedeEditarPlanes) {
    return (
      <EstadoBloqueadoPlanEditor
        titulo="No tenés permisos para editar planes"
        descripcion="Este editor está disponible solo para nutricionistas. No se cargan datos clínicos ni acciones de IA para tu rol."
        onVolver={volverAlPlan}
      />
    );
  }

  if (sinPermisos) {
    return (
      <EstadoBloqueadoPlanEditor
        titulo="No tenés acceso a este paciente"
        descripcion="Solo podés editar planes y fichas de pacientes vinculados a tu atención profesional."
        onVolver={volverAlPlan}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-24">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={volverAlPlan}
            aria-label="Volver al plan del socio"
            className="rounded-full hover:bg-muted"
          >
            <ArrowLeft className="h-5 w-5" aria-hidden="true" />
          </Button>
          {cargandoPaciente ? (
            <Loader2
              className="size-8 animate-spin text-muted-foreground"
              aria-label="Cargando paciente"
            />
          ) : paciente ? (
            <>
              <AvatarPaciente
                fotoUrl={paciente.fotoPerfilUrl}
                nombreCompleto={paciente.nombreCompleto}
                size="lg"
              />
              <div>
                <h1 className="text-2xl font-bold tracking-tight">
                  Editor de plan
                </h1>
                <p className="text-sm text-muted-foreground">
                  {paciente.nombreCompleto}
                  {paciente.dni ? ` · DNI ${paciente.dni}` : ''}
                </p>
              </div>
            </>
          ) : (
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                Editor de plan
              </h1>
              <p className="text-sm text-muted-foreground">
                Socio #{(socioIdNumero ?? 0).toString()}
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={irAMiPerfil}
            aria-label="Editar mis preferencias IA en mi perfil"
            data-testid="link-preferencias-ia"
          >
            <ExternalLink className="size-4" aria-hidden="true" />
            Preferencias IA
          </Button>
        </div>
      </header>

      {/* Tabs: Editor / Versiones */}
      <Tabs value={modo} onValueChange={(v) => setModo(v as typeof modo)}>
        <TabsList variant="line" aria-label="Modo de edición del plan">
          <TabsTrigger value="editor" className="gap-1.5">
            <Sparkles className="size-4 text-fuchsia-500" aria-hidden="true" />
            Editor
          </TabsTrigger>
          <TabsTrigger value="versiones" className="gap-1.5">
            <History className="size-4" aria-hidden="true" />
            Historial de versiones
          </TabsTrigger>
        </TabsList>

        {/* Tab: Editor */}
        <TabsContent value="editor" className="mt-0">
          <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
            {planIdEditorManual ? (
              <div
                className="grid gap-6 lg:grid-cols-[1fr_360px]"
                data-testid="plan-editor-layout"
              >
                {/* Columna Izquierda: Grilla + Validaciones */}
                <main className="flex flex-col gap-6 min-w-0">
                  {cargandoEstructura ? (
                    <div className="flex items-center justify-center gap-2 py-16 text-center text-sm text-muted-foreground bg-card/25 rounded-2xl border border-dashed">
                      <Loader2 className="size-5 animate-spin" aria-hidden="true" />
                      Cargando borrador del plan...
                    </div>
                  ) : (
                    <GrillaManualSlots
                      estructura={estructura}
                      onChange={handleEstructuraChange}
                      onSelectSlot={handleSelectSlotForIa}
                    />
                  )}

                  {/* Card: Razonamiento de cumplimiento */}
                  {respuesta && (
                    <Card className="rounded-2xl border-border/50">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">
                          Validación de cumplimiento
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <RazonamientoCumplimiento
                          razonamiento={respuesta.plan.razonamientoCumplimiento}
                        />
                      </CardContent>
                    </Card>
                  )}

                  {/* Advertencias del backend */}
                  {respuesta && respuesta.advertencias.length > 0 && (
                    <section
                      role="alert"
                      aria-label="Advertencias de generación"
                      className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4"
                    >
                      <h3 className="mb-2 text-sm font-semibold text-amber-900 dark:text-amber-200">
                        Advertencias ({respuesta.advertencias.length})
                      </h3>
                      <ul className="space-y-1 text-sm text-amber-800 dark:text-amber-300">
                        {respuesta.advertencias.map((adv, idx) => (
                          <li key={idx}>• {adv}</li>
                        ))}
                      </ul>
                    </section>
                  )}
                </main>

                {/* Columna Derecha: Sidebar de Acciones */}
                <aside aria-label="Controles del plan" className="space-y-6">
                  {/* Card: Estado del Borrador y Guardar Versión Definitiva */}
                  <Card className="rounded-2xl border-border/50 bg-card/60 backdrop-blur-sm shadow-md">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                        <CheckCircle2 className="size-4 text-emerald-500" />
                        Autoguardado
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-xs text-muted-foreground">
                        Tus cambios se guardan automáticamente en un borrador. Hacé clic en "Guardar versión definitiva" para publicar y activar el plan para el paciente.
                      </p>
                      {ultimoGuardado && !guardandoBorrador && (
                        <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                          <CheckCircle2 className="size-3.5" />
                          Borrador actualizado a las {ultimoGuardado.toLocaleTimeString()}
                        </div>
                      )}
                      {guardandoBorrador && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Loader2 className="size-3.5 animate-spin" />
                          Guardando borrador...
                        </div>
                      )}
                      <Button
                        onClick={guardarVersionExplicita}
                        disabled={guardandoBorrador || cargandoEstructura}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-9 flex items-center justify-center gap-1.5 rounded-xl transition-all shadow"
                        data-testid="guardar-version-btn"
                      >
                        <Save className="size-4" />
                        Guardar versión definitiva
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Panel de Ideas IA (Sugerencias) */}
                  <PanelIdeasIa
                    planId={planIdEditorManual}
                    diaSeleccionado={diaSeleccionado}
                    comidaSeleccionada={comidaSeleccionada}
                    onSelectSlot={handleSelectSlotForIa}
                    onAddIdea={handleAddIdea}
                  />

                  {/* Generador de plan completo con IA */}
                  <Card className="rounded-2xl border-border/50">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-md">
                        <Sparkles
                          className="size-4 text-fuchsia-500 animate-pulse"
                          aria-hidden="true"
                        />
                        Generar plan completo con IA
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <GeneradorPlanSemanal
                        planAlimentacionId={planIdEditorManual}
                        socioIdPreseleccionado={socioIdNumero}
                        fichaDisponible={!!ficha && !cargandoFicha && !sinPermisos && !sinFicha && !errorFicha}
                        onSuccess={(data) => {
                          const respuestaNormalizada = normalizarRespuestaConMacros(data);
                          setRespuesta(respuestaNormalizada);
                          setEstructura(completarEstructuraManual(respuestaNormalizada.plan.estructura));
                          setVersionSeleccionadaId(respuestaNormalizada.versionId);
                          haSidoModificadoRef.current = false;
                        }}
                      />
                    </CardContent>
                  </Card>

                  {/* Ficha de salud del paciente (editable) */}
                  {socioIdNumero && (
                    <RestriccionesEditablesCard
                      ficha={ficha}
                      socio={
                        paciente
                          ? {
                              nombreCompleto: paciente.nombreCompleto,
                              dni: paciente.dni,
                            }
                          : null
                      }
                      isLoading={cargandoFicha}
                      isError={errorFicha}
                      sinFicha={sinFicha}
                      sinPermisos={sinPermisos}
                      onSave={manejarGuardarFicha}
                      isSaving={guardandoFicha}
                      errorGuardar={errorGuardarFicha?.message ?? null}
                    />
                  )}
                </aside>
              </div>
            ) : cargandoPlanExistente ? (
              <div className="flex items-center justify-center gap-2 py-16 text-center text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                Buscando planes y borradores existentes…
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-4 py-16 text-center max-w-md mx-auto">
                <PenLine className="size-12 text-muted-foreground/30" aria-hidden="true" />
                <div>
                  <h3 className="font-semibold text-lg">Comenzá a planificar</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Podés generar un plan semanal completo usando IA, o empezar a cargarlo de forma manual slot por slot.
                  </p>
                </div>
                <div className="flex flex-col gap-2 w-full pt-4">
                  <Card className="rounded-2xl border-border/50 p-4 text-left">
                    <h4 className="text-sm font-semibold flex items-center gap-1.5 mb-2">
                      <Sparkles className="size-4 text-fuchsia-500" />
                      Opción A: Generar con IA
                    </h4>
                    <GeneradorPlanSemanal
                      planAlimentacionId={undefined}
                      socioIdPreseleccionado={socioIdNumero}
                      fichaDisponible={!!ficha && !cargandoFicha && !sinPermisos && !sinFicha && !errorFicha}
                      onSuccess={(data) => {
                        const respuestaNormalizada = normalizarRespuestaConMacros(data);
                        setRespuesta(respuestaNormalizada);
                        setPlanManualExistenteId(respuestaNormalizada.planAlimentacionId);
                        setEstructura(completarEstructuraManual(respuestaNormalizada.plan.estructura));
                        setVersionSeleccionadaId(respuestaNormalizada.versionId);
                        haSidoModificadoRef.current = false;
                      }}
                    />
                  </Card>

                  <div className="relative flex py-2 items-center">
                    <div className="flex-grow border-t border-border/60"></div>
                    <span className="flex-shrink mx-4 text-muted-foreground text-xs font-medium uppercase">o también</span>
                    <div className="flex-grow border-t border-border/60"></div>
                  </div>

                  <Button
                    onClick={manejarCrearPlanManual}
                    disabled={cargandoPlanManual || !socioIdNumero}
                    variant="outline"
                    className="w-full h-11 text-sm font-semibold border-dashed"
                  >
                    {cargandoPlanManual ? 'Creando…' : 'Opción B: Crear plan manual vacío'}
                  </Button>
                </div>
              </div>
            )}
          </DndContext>
        </TabsContent>

        {/* Tab: Historial */}
        <TabsContent value="versiones" className="mt-0">
          {planIdEditorManual ? (
            <div className="flex flex-col gap-4">
              <Card className="rounded-2xl border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">
                    Historial de versiones
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <VersionHistory
                    planId={planIdEditorManual}
                    versionSeleccionadaId={versionSeleccionadaId}
                    onSelect={async (vid) => {
                      setVersionSeleccionadaId(vid);
                      toast.info(`Versión ${vid} cargada en el editor`, {
                        description: 'Se usará como borrador actual.',
                      });
                      try {
                        const res = await apiRequest<VersionPlanCompletaFE | ApiResponse<VersionPlanCompletaFE>>(
                          `/planes-alimentacion/version/${vid}`,
                          { token }
                        );
                        const versionCompleta = desenvolverRespuestaApi(res);
                        setEstructura(completarEstructuraManual(versionCompleta.datosJson?.estructura));
                        
                        // Guardarla como borrador en el servidor inmediatamente
                        await apiRequest(
                          `/planes-alimentacion/${planIdEditorManual}/persistir-manual`,
                          {
                            method: 'POST',
                            body: estructuraToPayload(completarEstructuraManual(versionCompleta.datosJson?.estructura)),
                          },
                        );
                        haSidoModificadoRef.current = false;
                      } catch (err) {
                        toast.error('Error al cargar la versión');
                      }
                    }}
                  />
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card className="rounded-2xl border-border/50">
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                Creá o generá un plan para ver el historial de versiones.
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Botón flotante: Dar feedback (solo si hay plan) */}
      {respuesta && (
        <Button
          type="button"
          onClick={() => setFeedbackAbierto(true)}
          aria-label="Dar feedback sobre este plan"
          data-testid="feedback-floating-button"
          className="fixed bottom-6 right-6 z-40 size-14 rounded-full bg-gradient-to-br from-orange-500 to-rose-500 text-white shadow-lg hover:from-orange-600 hover:to-rose-600"
          size="icon"
        >
          <ThumbsUp className="size-6" aria-hidden="true" />
          <span className="sr-only">Dar feedback</span>
        </Button>
      )}

      {/* Modal de feedback */}
      {respuesta && (
        <FeedbackModal
          open={feedbackAbierto}
          onOpenChange={setFeedbackAbierto}
          versionId={respuesta.versionId}
          onSuccess={() => {
            toast.success('Feedback registrado. La IA aprende para próximos planes.');
          }}
        />
      )}
    </div>
  );
}

function EstadoBloqueadoPlanEditor({
  titulo,
  descripcion,
  onVolver,
}: PropiedadesEstadoBloqueadoPlanEditor) {
  return (
    <div className="space-y-6 pb-24">
      <Button
        type="button"
        variant="ghost"
        onClick={onVolver}
        aria-label="Volver al plan del socio"
        className="rounded-full hover:bg-muted"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Volver
      </Button>

      <Card className="max-w-2xl rounded-2xl border-amber-500/30 bg-amber-500/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-900 dark:text-amber-200">
            <Lock className="size-5" aria-hidden="true" />
            {titulo}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-amber-900/80 dark:text-amber-100/80">
            {descripcion}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
