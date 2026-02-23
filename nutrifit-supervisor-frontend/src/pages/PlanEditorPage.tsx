import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { ArrowLeft, Save, Info, AlertCircle, ChevronLeft, Settings } from 'lucide-react';
import { toast } from 'sonner';

import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { WeeklyPlanGrid, type ComidaEnPlan } from '@/components/plan/WeeklyPlanGrid';
import { FoodSearchDialog } from '@/components/plan/FoodSearchDialog';
import { ExportPlanPDFButton } from '@/components/plan/ExportPlanPDFButton';
import type { Alimento } from '@/lib/api/alimentos';

const DIAS_SEMANA = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO'] as const;
const TIPOS_COMIDA = ['DESAYUNO', 'ALMUERZO', 'MERIENDA', 'CENA', 'COLACION'] as const;

type DiaSemana = typeof DIAS_SEMANA[number];
type TipoComida = typeof TIPOS_COMIDA[number];

interface AlimentoRespuesta {
  idAlimento: number;
  nombre: string;
  cantidad: number;
  calorias: number | null;
  proteinas: number | null;
  carbohidratos: number | null;
  grasas: number | null;
  unidadMedida: string;
}

interface DiaRespuesta {
  dia: string;
  orden: number;
  opcionesComida: Array<{
    tipoComida: string;
    comentarios: string | null;
    alimentos: AlimentoRespuesta[];
  }>;
}

interface PlanRespuesta {
  idPlanAlimentacion: number;
  objetivoNutricional: string;
  dias: DiaRespuesta[];
}

interface ApiRespuesta<T> {
  success: boolean;
  data: T;
}

interface FichaSalud {
  [clave: string]: unknown;
}

function crearComidasVacias(): ComidaEnPlan[] {
  const comidas: ComidaEnPlan[] = [];
  DIAS_SEMANA.forEach(dia => {
    TIPOS_COMIDA.forEach(tipoComida => {
      comidas.push({
        dia,
        tipoComida,
        alimentos: [],
      });
    });
  });
  return comidas;
}

export function PlanEditorPage() {
  const { token } = useAuth();
  const { personaId } = useAuth();
  const params = useParams({ strict: false }) as { socioId?: string };
  const navigate = useNavigate();
  const socioId = params.socioId;

  const [cargando, establecerCargando] = useState(false);
  const [guardando, establecerGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [planId, establecerPlanId] = useState<number | null>(null);
  const [objetivoNutricional, establecerObjetivoNutricional] = useState('');
  const [comidas, establecerComidas] = useState<ComidaEnPlan[]>(crearComidasVacias);
  const [fichaSalud, establecerFichaSalud] = useState<FichaSalud | null>(null);

  const [dialogoBusquedaAbierto, establecerDialogoBusquedaAbierto] = useState(false);
  const [slotSeleccionado, establecerSlotSeleccionado] = useState<{ dia: DiaSemana; tipoComida: TipoComida } | null>(null);
  const [sidebarColapsado, establecerSidebarColapsado] = useState(true);

  const [, establecerAlimentosCache] = useState<Map<number, Alimento>>(new Map());

  useEffect(() => {
    if (!error) return;
    const timer = setTimeout(() => setError(null), 5000);
    return () => clearTimeout(timer);
  }, [error]);

  useEffect(() => {
    if (!token || !socioId) return;

    const cargarPlan = async () => {
      try {
        setError(null);
        establecerCargando(true);
        establecerPlanId(null);

        const respuesta = await apiRequest<ApiRespuesta<PlanRespuesta>>(
          `/planes-alimentacion/socio/${socioId}/activo`,
          { token },
        );

        if (respuesta.data) {
          establecerPlanId(respuesta.data.idPlanAlimentacion);
          establecerObjetivoNutricional(respuesta.data.objetivoNutricional || '');

          const nuevasComidas = crearComidasVacias();
          const nuevoCache = new Map<number, Alimento>();

          respuesta.data.dias.forEach(dia => {
            dia.opcionesComida.forEach(opcion => {
              const index = nuevasComidas.findIndex(
                c => c.dia === dia.dia && c.tipoComida === opcion.tipoComida
              );
              if (index !== -1) {
                nuevasComidas[index].alimentos = opcion.alimentos.map(a => {
                  const alimento: Alimento = {
                    idAlimento: a.idAlimento,
                    nombre: a.nombre,
                    cantidad: a.cantidad,
                    unidadMedida: a.unidadMedida,
                    calorias: a.calorias,
                    proteinas: a.proteinas,
                    carbohidratos: a.carbohidratos,
                    grasas: a.grasas,
                    grupoAlimenticio: null,
                  };
                  nuevoCache.set(a.idAlimento, alimento);
                  return {
                    alimento,
                    cantidad: a.cantidad,
                  };
                });
              }
            });
          });

          establecerComidas(nuevasComidas);
          establecerAlimentosCache(nuevoCache);
        }

        establecerCargando(false);
      } catch (err) {
        const mensaje = err instanceof Error ? err.message : 'No se pudo cargar el plan';
        setError(mensaje);
        establecerCargando(false);
      }
    };

    void cargarPlan();
  }, [token, socioId]);

  useEffect(() => {
    if (!token || !personaId || !socioId) return;

    const cargarFichaSalud = async () => {
      try {
        const respuesta = await apiRequest<Record<string, unknown>>(
          `/turnos/profesional/${personaId}/pacientes/${socioId}/ficha-salud`,
          { token },
        );
        if (respuesta.data && typeof respuesta.data === 'object' && respuesta.data !== null) {
          establecerFichaSalud(respuesta.data as FichaSalud);
        }
      } catch {
        // Silencioso: es opcional
      }
    };

    void cargarFichaSalud();
  }, [token, personaId, socioId]);

  const alAgregarAlimento = useCallback((dia: DiaSemana, tipoComida: TipoComida) => {
    establecerSlotSeleccionado({ dia, tipoComida });
    establecerDialogoBusquedaAbierto(true);
  }, []);

  const alEditarCantidad = useCallback((dia: DiaSemana, tipoComida: TipoComida, indiceAlimento: number, cantidad: number) => {
    establecerComidas(prev => {
      const nuevas = [...prev];
      const idx = nuevas.findIndex(c => c.dia === dia && c.tipoComida === tipoComida);
      if (idx !== -1 && nuevas[idx].alimentos[indiceAlimento]) {
        nuevas[idx] = {
          ...nuevas[idx],
          alimentos: [...nuevas[idx].alimentos],
        };
        nuevas[idx].alimentos[indiceAlimento] = {
          ...nuevas[idx].alimentos[indiceAlimento],
          cantidad,
        };
      }
      return nuevas;
    });
  }, []);

  const alEliminarAlimento = useCallback((dia: DiaSemana, tipoComida: TipoComida, indiceAlimento: number) => {
    establecerComidas(prev => {
      const nuevas = [...prev];
      const idx = nuevas.findIndex(c => c.dia === dia && c.tipoComida === tipoComida);
      if (idx !== -1) {
        nuevas[idx] = {
          ...nuevas[idx],
          alimentos: nuevas[idx].alimentos.filter((_, i) => i !== indiceAlimento),
        };
      }
      return nuevas;
    });
  }, []);

  const alSeleccionarAlimento = useCallback((alimento: Alimento) => {
    if (!slotSeleccionado) return;

    establecerAlimentosCache(prev => {
      const nuevo = new Map(prev);
      nuevo.set(alimento.idAlimento, alimento);
      return nuevo;
    });

    establecerComidas(prev => {
      const nuevas = [...prev];
      const idx = nuevas.findIndex(c => c.dia === slotSeleccionado.dia && c.tipoComida === slotSeleccionado.tipoComida);
      if (idx !== -1) {
        nuevas[idx] = {
          ...nuevas[idx],
          alimentos: [...nuevas[idx].alimentos, { alimento, cantidad: alimento.cantidad }],
        };
      }
      return nuevas;
    });

    establecerDialogoBusquedaAbierto(false);
    establecerSlotSeleccionado(null);
  }, [slotSeleccionado]);

  const guardarPlan = async () => {
    if (!token || !socioId) {
      setError('Faltan datos de autenticación');
      return;
    }

    const objetivoNutricionalLimpio = objetivoNutricional.trim();
    if (!objetivoNutricionalLimpio) {
      const mensaje = 'El objetivo nutricional es obligatorio para guardar el plan.';
      setError(mensaje);
      toast.error(mensaje);
      return;
    }

    if (!window.confirm('¿Estás seguro de que deseas guardar este plan de alimentación?')) {
      return;
    }

    try {
      setError(null);
      establecerGuardando(true);

      const diasPayload = DIAS_SEMANA.map((dia, index) => ({
        dia,
        orden: index + 1,
        opcionesComida: TIPOS_COMIDA.map(tipoComida => {
          const comida = comidas.find(c => c.dia === dia && c.tipoComida === tipoComida);
          return {
            tipoComida,
            comentarios: '',
            alimentosIds: comida?.alimentos.map(a => a.alimento.idAlimento) ?? [],
          };
        }),
      }));

      if (planId) {
        await apiRequest<ApiRespuesta<PlanRespuesta>>(
          `/planes-alimentacion/${planId}`,
          {
            token,
            method: 'PUT',
              body: {
                planId,
                objetivoNutricional: objetivoNutricionalLimpio,
                motivoEdicion: 'Edición desde grilla semanal',
                dias: diasPayload,
              },
            },
        );
      } else {
        await apiRequest<ApiRespuesta<PlanRespuesta>>(
          '/planes-alimentacion',
          {
            token,
            method: 'POST',
              body: {
                socioId: Number(socioId),
                objetivoNutricional: objetivoNutricionalLimpio,
                dias: diasPayload,
              },
            },
        );
      }

      toast.success('Plan guardado correctamente');
      establecerGuardando(false);

      setTimeout(() => {
        navigate({ to: `/profesional/plan/${socioId}` });
      }, 1500);
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : 'No se pudo guardar el plan';
      setError(mensaje);
      establecerGuardando(false);
      toast.error(mensaje);
    }
  };

  const volverAlPlan = () => {
    void navigate({ to: `/profesional/plan/${socioId}` });
  };

  const tieneAlimentos = useMemo(() => {
    return comidas.some(c => c.alimentos.length > 0);
  }, [comidas]);

  if (cargando) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="w-10 h-10 border-3 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
        <p className="text-muted-foreground">Cargando editor de plan...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <Button 
            type="button" 
            variant="ghost" 
            size="icon" 
            onClick={volverAlPlan}
            className="rounded-full hover:bg-muted"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
              {planId !== null ? 'Editar plan' : 'Crear plan'}
              <span className="text-muted-foreground font-normal ml-2">
                – Socio {socioId}
              </span>
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {planId !== null
                ? 'Modificá el plan de alimentación del socio'
                : 'Configurá el plan de alimentación del socio'}
            </p>
          </div>
        </div>
        
        <div className="sm:ml-auto flex items-center gap-2">
          {tieneAlimentos && (
            <ExportPlanPDFButton
              objetivoNutricional={objetivoNutricional}
              comidas={comidas}
              planId={planId ?? undefined}
            />
          )}
          <Button
            type="button"
            onClick={guardarPlan}
            disabled={guardando}
            className="bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white min-w-[120px]"
          >
            {guardando ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Guardar
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Health Record Warning */}
      {fichaSalud && (
        <div className="rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-500/5 to-orange-500/5 dark:from-amber-500/10 dark:to-orange-500/10 p-4">
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
              <Info className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
            <p className="text-sm text-amber-800 dark:text-amber-200">
              Ficha de salud del socio cargada. Verificá que el plan no incluya términos o alimentos que contraríen sus restricciones.
            </p>
          </div>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex gap-4 xl:gap-6">
        {/* Objective Card - Sidebar */}
        <div className={sidebarColapsado ? 'hidden xl:flex w-14 shrink-0' : 'xl:w-72 shrink-0'}>
          <Card 
            className={
              sidebarColapsado 
                ? 'w-14 flex flex-col items-center py-4 rounded-2xl border-border/50'
                : 'w-full rounded-2xl border-border/50'
            }
          >
            {sidebarColapsado ? (
              <button
                type="button"
                onClick={() => establecerSidebarColapsado(false)}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
                title="Expandir configuracion"
              >
                <Settings className="h-5 w-5 text-muted-foreground" />
              </button>
            ) : (
              <>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-gradient-to-r from-orange-500 to-rose-500" />
                      Configuracion
                    </CardTitle>
                    <button
                      type="button"
                      onClick={() => establecerSidebarColapsado(true)}
                      className="p-1 rounded hover:bg-muted transition-colors"
                      title="Colapsar"
                    >
                      <ChevronLeft className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </div>
                  <CardDescription>
                    Defini el objetivo del plan
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="objetivo" className="text-sm font-medium">
                      Objetivo nutricional
                    </Label>
                    <Input
                      id="objetivo"
                      value={objetivoNutricional}
                      onChange={(e) => establecerObjetivoNutricional(e.target.value)}
                      placeholder="Ej: Perdida de peso, ganancia muscular..."
                      maxLength={255}
                      className="border-border/50 focus:border-orange-500/50"
                    />
                    <p className="text-xs text-muted-foreground text-right">
                      {objetivoNutricional.length}/255
                    </p>
                  </div>
                </CardContent>
              </>
            )}
          </Card>
        </div>

        {/* Weekly Plan Grid */}
        <Card className="flex-1 rounded-2xl border-border/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500" />
                  Plan semanal
                </CardTitle>
                <CardDescription>
                  Agregá alimentos a cada comida
                </CardDescription>
              </div>
              {tieneAlimentos && (
                <div className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-full">
                  {comidas.reduce((acc, c) => acc + c.alimentos.length, 0)} alimentos
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <WeeklyPlanGrid
              comidas={comidas}
              alAgregarAlimento={alAgregarAlimento}
              alEditarCantidad={alEditarCantidad}
              alEliminarAlimento={alEliminarAlimento}
            />
          </CardContent>
        </Card>
      </div>

      {/* Food Search Dialog */}
      <FoodSearchDialog
        abierto={dialogoBusquedaAbierto}
        alCerrar={() => {
          establecerDialogoBusquedaAbierto(false);
          establecerSlotSeleccionado(null);
        }}
        alSeleccionar={alSeleccionarAlimento}
      />
    </div>
  );
}
