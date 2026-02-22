import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { ArrowLeft, Save } from 'lucide-react';
import { toast } from 'sonner';

import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

interface DiaRespuesta {
  dia: string;
  orden: number;
  opcionesComida: Array<{
    tipoComida: string;
    comentarios: string | null;
    alimentos: Array<{ idAlimento: number; cantidad?: number }>;
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

  const [_alimentosCache, establecerAlimentosCache] = useState<Map<number, Alimento>>(new Map());

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
                    nombre: `Alimento ${a.idAlimento}`,
                    cantidad: 100,
                    unidadMedida: 'g',
                    calorias: null,
                    proteinas: null,
                    carbohidratos: null,
                    grasas: null,
                    grupoAlimenticio: null,
                  };
                  nuevoCache.set(a.idAlimento, alimento);
                  return {
                    alimento,
                    cantidad: a.cantidad || 100,
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
              objetivoNutricional,
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
              objetivoNutricional,
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
        <p className="text-muted-foreground">Cargando editor de plan...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center gap-3">
        <Button type="button" variant="ghost" size="icon" onClick={volverAlPlan}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">
            {planId !== null ? 'Editar plan' : 'Crear plan'} – Socio {socioId}
          </h1>
          <p className="text-sm text-muted-foreground">
            {planId !== null
              ? 'Modificá el plan de alimentación del socio'
              : 'Configurá el plan de alimentación del socio'}
          </p>
        </div>
        <div className="flex items-center gap-2">
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
            variant="default"
            className="min-w-[120px]"
          >
            <Save className="mr-2 h-4 w-4" />
            {guardando ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
      </div>

      {fichaSalud && (
        <div className="rounded-md border border-border bg-muted/30 p-4">
          <div className="flex gap-2">
            <span className="text-muted-foreground">ℹ</span>
            <p className="text-sm text-muted-foreground">
              Ficha de salud del socio cargada. Verificá que el plan no incluya términos o alimentos que contraríen sus restricciones.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-md border border-destructive bg-destructive/10 p-4">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Configuración del plan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="objetivo">Objetivo nutricional</Label>
            <Input
              id="objetivo"
              value={objetivoNutricional}
              onChange={(e) => establecerObjetivoNutricional(e.target.value)}
              placeholder="Describe el objetivo del plan..."
              maxLength={255}
            />
            <p className="text-xs text-muted-foreground">
              {objetivoNutricional.length}/255 caracteres
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Plan semanal</h3>
            <WeeklyPlanGrid
              comidas={comidas}
              alAgregarAlimento={alAgregarAlimento}
              alEditarCantidad={alEditarCantidad}
              alEliminarAlimento={alEliminarAlimento}
            />
          </div>
        </CardContent>
      </Card>

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
