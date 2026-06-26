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

import { useMemo, useState, useEffect } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import {
  ArrowLeft,
  Sparkles,
  ThumbsUp,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AvatarPaciente } from '@/components/ui/avatar-paciente';

import { GeneradorPlanSemanal } from '@/components/ia/GeneradorPlanSemanal';
import { FeedbackModal } from '@/components/ia/FeedbackModal';
import {
  WeeklyPlanGrid,
  type ManejadoresRegeneracion,
} from '@/components/plan/WeeklyPlanGrid';
import { VersionHistory } from '@/components/plan/VersionHistory';
import { RazonamientoCumplimiento } from '@/components/plan/RazonamientoCumplimiento';
import { RestriccionesPacienteCard } from '@/components/plan/RestriccionesPacienteCard';

import { apiRequest } from '@/lib/api';
import { useObtenerFichaNutricionista } from '@/hooks/useObtenerFichaNutricionista';
import type { PaginatedData } from '@nutrifit/shared';
import type {
  RespuestaPlanSemanalV2FE,
  RespuestaRegeneracionFE,
  SolicitudRegeneracionFE,
} from '@/types/ia';

interface PacienteResumen {
  socioId: number;
  nombreCompleto: string;
  dni: string;
  fotoPerfilUrl: string | null;
}

export function PlanEditorPage() {
  const { token, personaId } = useAuth();
  const params = useParams({ strict: false }) as { socioId?: string };
  const navigate = useNavigate();
  const socioIdNumero = params.socioId ? Number(params.socioId) : undefined;

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

  // Slots editados manualmente (set conservador: el backend puede marcarlos,
  // o el usuario marca antes de regenerar)
  const [slotsEditadosManualmente, setSlotsEditadosManualmente] = useState<
    Set<string>
  >(new Set());

  // Paciente (header avatar + nombre)
  const [paciente, setPaciente] = useState<PacienteResumen | null>(null);
  const [cargandoPaciente, setCargandoPaciente] = useState(false);

  // Ficha de salud del paciente (para mostrar restricciones)
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
  });

  // Carga paciente cuando cambia el socioId
  useEffect(() => {
    if (!token || !personaId || !socioIdNumero) return;
    let cancelado = false;

    const cargarPaciente = async () => {
      try {
        setCargandoPaciente(true);
        const respuestaApi = await apiRequest<
          PaginatedData<PacienteResumen>
        >(`/turnos/profesional/${personaId}/pacientes`, { token });

        if (cancelado) return;

        const encontrado = (respuestaApi.data ?? []).find(
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
  }, [token, personaId, socioIdNumero]);

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

  // Handlers de regeneración
  const alRegenerarPlan = () => {
    if (!respuesta) return;
    // La regeneración PLAN completa genera una nueva versión.
    // Implementamos vía apiRequest directo (no usamos useIa para mantener
    // el scope del componente acotado a esta página).
    regenerar({
      planAlimentacionVersionId: respuesta.versionId,
      scope: 'PLAN',
      confirmarPerdidaEdicionManual: true, // El usuario ya clickeó el botón
    });
  };

  const alRegenerarDia: ManejadoresRegeneracion['alRegenerarDia'] = (dia) => {
    if (!respuesta) return;
    regenerar({
      planAlimentacionVersionId: respuesta.versionId,
      scope: 'DIA',
      dia,
    });
  };

  const alRegenerarAlternativa: ManejadoresRegeneracion['alRegenerarAlternativa'] =
    ({ dia, comidaSlot, alternativaIndex }) => {
      if (!respuesta) return;
      regenerar({
        planAlimentacionVersionId: respuesta.versionId,
        scope: 'ALTERNATIVA',
        dia,
        comidaSlot,
        alternativaIndex,
      });
    };

  const regenerar = async (solicitud: SolicitudRegeneracionFE) => {
    try {
      const data = await apiRequest<RespuestaRegeneracionFE>(
        '/ia/plan-semanal/regenerar',
        {
          method: 'POST',
          body: solicitud,
        },
      );

      // Actualizar respuesta con el nuevo plan y versionId
      setRespuesta((prev) =>
        prev
          ? {
              ...prev,
              versionId: data.nuevaVersionId,
              numeroVersion: data.numeroVersion,
              plan: data.plan,
              validacion: data.validacion,
              macros: data.macros,
              advertencias: prev.advertencias,
            }
          : null,
      );
      setVersionSeleccionadaId(data.nuevaVersionId);

      toast.success(`Plan regenerado (v${data.numeroVersion})`, {
        description: `Motivo: ${data.motivoCambio.replace(/_/g, ' ')}. Revisá y activá cuando esté listo.`,
      });
    } catch (err) {
      const mensaje =
        err instanceof Error ? err.message : 'No se pudo regenerar el plan.';
      toast.error('Error al regenerar', { description: mensaje });
    }
  };

  const marcarSlotEditado = (slotKey: string) => {
    setSlotsEditadosManualmente((prev) => {
      const nuevo = new Set(prev);
      nuevo.add(slotKey);
      return nuevo;
    });
  };

  const regen: ManejadoresRegeneracion = useMemo(
    () => ({
      alRegenerarPlan,
      alRegenerarDia,
      alRegenerarAlternativa,
      slotsEditadosManualmente,
      estaRegenerando: false,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [respuesta?.versionId, slotsEditadosManualmente],
  );

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div className="space-y-6 pb-24">
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
                  Editor de plan con IA
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
                Editor de plan con IA
              </h1>
              <p className="text-sm text-muted-foreground">
                Generá un plan para el socio #{(socioIdNumero ?? 0).toString()}
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

      {/* Layout principal: grid responsive */}
      <div
        className="grid gap-6 lg:grid-cols-[1fr_320px]"
        data-testid="plan-editor-layout"
      >
        {/* Main: Generador + Plan + Razonamiento */}
        <main className="flex flex-col gap-6">
          {/* Card: Restricciones del paciente (ficha de salud) */}
          {socioIdNumero && (
            <RestriccionesPacienteCard
              ficha={ficha}
              isLoading={cargandoFicha}
              isError={errorFicha}
              sinFicha={sinFicha}
              sinPermisos={sinPermisos}
            />
          )}

          {/* Card: Generador de plan */}
          <Card className="rounded-2xl border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Sparkles
                  className="size-4 text-fuchsia-500"
                  aria-hidden="true"
                />
                Generar plan con IA
              </CardTitle>
            </CardHeader>
            <CardContent>
              <GeneradorPlanSemanal
                planAlimentacionId={respuesta?.planAlimentacionId}
                socioIdPreseleccionado={socioIdNumero}
                socioNombre={paciente?.nombreCompleto}
                socioDni={paciente?.dni}
                onSuccess={(data) => {
                  setRespuesta(data);
                  setVersionSeleccionadaId(data.versionId);
                  // Limpiar slots editados al generar plan nuevo
                  setSlotsEditadosManualmente(new Set());
                }}
              />
            </CardContent>
          </Card>

          {/* Card: Plan generado (solo si hay respuesta) */}
          {respuesta && (
            <Card
              className="rounded-2xl border-border/50"
              data-testid="plan-generado-card"
            >
              <CardHeader className="pb-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <div
                        className="size-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"
                        aria-hidden="true"
                      />
                      Plan semanal generado
                    </CardTitle>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      Versión {respuesta.numeroVersion} ·{' '}
                      {Object.keys(respuesta.macros.macrosPorDia ?? {}).length}{' '}
                      días con macros validadas
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <WeeklyPlanGrid
                  planV2={respuesta.plan}
                  regen={regen}
                />
              </CardContent>
            </Card>
          )}

          {/* Card: Razonamiento de cumplimiento (solo si hay plan) */}
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

        {/* Sidebar: Versiones (solo si hay plan) */}
        <aside aria-label="Historial de versiones" className="space-y-4">
          {respuesta && (
            <Card className="rounded-2xl border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Versiones</CardTitle>
              </CardHeader>
              <CardContent>
                <VersionHistory
                  planId={respuesta.planAlimentacionId}
                  versionSeleccionadaId={versionSeleccionadaId}
                  onSelect={(vid) => {
                    setVersionSeleccionadaId(vid);
                    toast.info(`Versión ${vid} seleccionada`, {
                      description: 'Cargando datos de la versión…',
                    });
                  }}
                />
              </CardContent>
            </Card>
          )}

          {/* Help: Cómo editar manualmente */}
          <Card className="rounded-2xl border-border/50 bg-muted/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Edición manual</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Si editás un alimento manualmente y luego regenerás, el sistema
                te va a pedir confirmación para no perder los cambios.
              </p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (respuesta) {
                    const slot = 'LUNES-DESAYUNO';
                    marcarSlotEditado(slot);
                    toast.info(`Slot ${slot} marcado como editado`);
                  }
                }}
                disabled={!respuesta}
                className="mt-2 h-7 text-xs"
                data-testid="marcar-editado-demo"
              >
                Marcar desayuno lunes como editado (demo)
              </Button>
            </CardContent>
          </Card>
        </aside>
      </div>

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
