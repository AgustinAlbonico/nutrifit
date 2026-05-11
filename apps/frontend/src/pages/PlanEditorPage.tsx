import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { ArrowLeft, Save, Info, AlertCircle, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AvatarPaciente } from '@/components/ui/avatar-paciente';

import { WeeklyPlanGrid, type ComidaEnPlan } from '@/components/plan/WeeklyPlanGrid';
import { FoodSearchDialog } from '@/components/plan/FoodSearchDialog';
import { ExportPlanPDFButton } from '@/components/plan/ExportPlanPDFButton';
import { GeneradorPlanSemanal, GeneradorRecomendacion, IdeasComidaPanel } from '@/components/ia';
import { buscarAlimentosPorTexto, type Alimento } from '@/lib/api/alimentos';
import type { PlanSemanalIA, RecomendacionComida, PropuestaIA } from '@/types/ia';

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

interface ItemRespuesta {
  idItemComida: number;
  cantidad: number;
  unidad: string;
  notas: string | null;
  alimento: AlimentoRespuesta;
}

interface DiaRespuesta {
  dia: string;
  orden: number;
  opcionesComida: Array<{
    tipoComida: string;
    comentarios: string | null;
    items: ItemRespuesta[];
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

interface PacienteResumen {
  socioId: number;
  nombreCompleto: string;
  dni: string;
  fotoPerfilUrl: string | null;
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
  const [pacienteSeleccionado, establecerPacienteSeleccionado] = useState<PacienteResumen | null>(null);
  const [diaSeleccionadoIa, establecerDiaSeleccionadoIa] = useState<DiaSemana>('LUNES');
  const [tipoComidaSeleccionadaIa, establecerTipoComidaSeleccionadaIa] =
    useState<TipoComida>('ALMUERZO');
  const [planIaPendiente, establecerPlanIaPendiente] = useState<PlanSemanalIA | null>(null);
  const [aplicandoIa, establecerAplicandoIa] = useState(false);
  const [dialogoBusquedaAbierto, establecerDialogoBusquedaAbierto] = useState(false);
  const [slotSeleccionado, establecerSlotSeleccionado] = useState<{ dia: DiaSemana; tipoComida: TipoComida } | null>(null);

  const [, establecerAlimentosCache] = useState<Map<number, Alimento>>(new Map());

  const normalizarTexto = useCallback((texto: string): string => {
    return texto
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }, []);

  const mapearTipoComidaIA = useCallback((tipoComida: string): TipoComida | null => {
    const tipo = normalizarTexto(tipoComida);
    if (tipo === 'desayuno') return 'DESAYUNO';
    if (tipo === 'almuerzo') return 'ALMUERZO';
    if (tipo === 'merienda') return 'MERIENDA';
    if (tipo === 'cena') return 'CENA';
    if (tipo === 'colacion' || tipo === 'colacion') return 'COLACION';
    return null;
  }, [normalizarTexto]);

  const obtenerAlergiasFicha = useMemo(() => {
    if (!fichaSalud) return [] as string[];
    const valor = fichaSalud['alergias'];

    if (typeof valor === 'string') {
      return valor
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
    }

    if (Array.isArray(valor)) {
      const resultado: string[] = [];
      valor.forEach((item) => {
        if (typeof item === 'string') {
          const limpio = item.trim();
          if (limpio) resultado.push(limpio);
          return;
        }

        if (typeof item === 'object' && item !== null && 'nombre' in item) {
          const nombre = item.nombre;
          if (typeof nombre === 'string' && nombre.trim()) {
            resultado.push(nombre.trim());
          }
        }
      });
      return resultado;
    }

    return [] as string[];
  }, [fichaSalud]);

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
                nuevasComidas[index].alimentos = opcion.items.map(item => {
                  const a = item.alimento;
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
                    cantidad: item.cantidad,
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

  useEffect(() => {
    if (!token || !personaId || !socioId) return;

    const cargarPaciente = async () => {
      try {
        const respuesta = await apiRequest<ApiRespuesta<PacienteResumen[]>>(
          `/turnos/profesional/${personaId}/pacientes`,
          { token },
        );

        const encontrado = (respuesta.data ?? []).find(
          (paciente) => String(paciente.socioId) === String(socioId),
        );

        establecerPacienteSeleccionado(encontrado ?? null);
      } catch {
        establecerPacienteSeleccionado(null);
      }
    };

    void cargarPaciente();
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

  const buscarAlimentoParaTexto = useCallback(
    async (texto: string): Promise<Alimento | null> => {
      if (!token) return null;
      const termino = texto.trim();
      if (!termino) return null;

      const resultados = await buscarAlimentosPorTexto(token, termino, 10);
      if (resultados.length === 0) return null;

      const terminoNormalizado = normalizarTexto(termino);
      const exacto = resultados.find(
        (alimento) => normalizarTexto(alimento.nombre) === terminoNormalizado,
      );
      if (exacto) return exacto;

      const contenido = resultados.find((alimento) =>
        normalizarTexto(alimento.nombre).includes(terminoNormalizado),
      );
      return contenido ?? resultados[0];
    },
    [token, normalizarTexto],
  );

  const mapearIngredientesAAlimentos = useCallback(
    async (ingredientes: string[]): Promise<Alimento[]> => {
      const unicos = Array.from(new Set(ingredientes.map((ing) => ing.trim()).filter(Boolean)));
      const candidatos = await Promise.all(unicos.slice(0, 6).map((ing) => buscarAlimentoParaTexto(ing)));

      const mapa = new Map<number, Alimento>();
      candidatos.forEach((alimento) => {
        if (!alimento) return;
        mapa.set(alimento.idAlimento, alimento);
      });

      return Array.from(mapa.values());
    },
    [buscarAlimentoParaTexto],
  );

  const agregarPropuestaAlPlan = useCallback(
    async (propuesta: PropuestaIA, dia: DiaSemana, tipoComida: TipoComida) => {
      if (!token) {
        toast.error('No hay sesión activa.');
        return;
      }

      try {
        establecerAplicandoIa(true);
        const todosLosIngredientes = propuesta.ingredientes.map((ing) => ing.nombre.trim()).filter(Boolean);
        const alimentos = await mapearIngredientesAAlimentos(todosLosIngredientes);

        if (alimentos.length === 0) {
          toast.error('No se encontraron alimentos del catálogo para la propuesta.');
          return;
        }

        establecerComidas((prev) => {
          const nuevas = [...prev];
          const idx = nuevas.findIndex((c) => c.dia === dia && c.tipoComida === tipoComida);
          if (idx === -1) return prev;

          nuevas[idx] = {
            ...nuevas[idx],
            alimentos: alimentos.map((alimento) => ({
              alimento,
              cantidad: alimento.cantidad || 100,
            })),
          };
          return nuevas;
        });

        toast.success(`Propuesta "${propuesta.nombre}" aplicada en ${dia} - ${tipoComida}.`);
      } catch (err) {
        const mensaje = err instanceof Error ? err.message : 'No se pudo aplicar la propuesta.';
        toast.error(mensaje);
      } finally {
        establecerAplicandoIa(false);
      }
    },
    [token, mapearIngredientesAAlimentos],
  );

  const aplicarRecomendacionesIa = useCallback(async (recomendaciones: RecomendacionComida[]) => {
    if (recomendaciones.length === 0) {
      toast.error('No hay recomendaciones para aplicar.');
      return;
    }

    if (!token) {
      toast.error('No hay sesión activa para aplicar sugerencias.');
      return;
    }

    try {
      establecerAplicandoIa(true);

      // Recolectar todos los ingredientes únicos de todas las recomendaciones
      const todosLosIngredientes = new Set<string>();
      recomendaciones.forEach((rec) => {
        rec.ingredientes.forEach((ing) => todosLosIngredientes.add(ing.trim()));
      });

      const alimentos = await mapearIngredientesAAlimentos(Array.from(todosLosIngredientes));

      if (alimentos.length === 0) {
        toast.error('No se encontraron alimentos del catálogo para las recomendaciones generadas.');
        return;
      }

      establecerComidas((prev) => {
        const nuevas = [...prev];
        const idx = nuevas.findIndex(
          (c) => c.dia === diaSeleccionadoIa && c.tipoComida === tipoComidaSeleccionadaIa,
        );
        if (idx === -1) return prev;

        nuevas[idx] = {
          ...nuevas[idx],
          alimentos: alimentos.map((alimento) => ({
            alimento,
            cantidad: alimento.cantidad || 100,
          })),
        };

        return nuevas;
      });

      toast.success(
        `${recomendaciones.length} recomendacion${recomendaciones.length > 1 ? 'es' : ''} IA aplicada${recomendaciones.length > 1 ? 's' : ''} en ${diaSeleccionadoIa} - ${tipoComidaSeleccionadaIa}.`,
      );
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : 'No se pudo aplicar la recomendación IA';
      toast.error(mensaje);
    } finally {
      establecerAplicandoIa(false);
    }
  }, [
    token,
    mapearIngredientesAAlimentos,
    diaSeleccionadoIa,
    tipoComidaSeleccionadaIa,
  ]);

  const aplicarPlanSemanalIa = useCallback(async (planObjetivo?: PlanSemanalIA) => {
    const planAAplicar = planObjetivo ?? planIaPendiente;

    if (!planAAplicar) {
      toast.error('Primero generá un plan semanal con IA.');
      return;
    }

    if (!token) {
      toast.error('No hay sesión activa para aplicar sugerencias.');
      return;
    }

    try {
      establecerAplicandoIa(true);
      const nuevasComidas = crearComidasVacias();

      for (const diaIa of planAAplicar.dias) {
        const dia = DIAS_SEMANA[diaIa.dia - 1];
        if (!dia) continue;

        for (const comidaIa of diaIa.comidas) {
          const tipo = mapearTipoComidaIA(comidaIa.tipoComida);
          if (!tipo) continue;

          let alimentos = await mapearIngredientesAAlimentos(comidaIa.ingredientes);
          if (alimentos.length === 0) {
            const fallback = await buscarAlimentoParaTexto(comidaIa.nombre);
            alimentos = fallback ? [fallback] : [];
          }

          if (alimentos.length === 0) continue;

          const idx = nuevasComidas.findIndex((c) => c.dia === dia && c.tipoComida === tipo);
          if (idx === -1) continue;

          nuevasComidas[idx] = {
            ...nuevasComidas[idx],
            alimentos: alimentos.map((alimento) => ({
              alimento,
              cantidad: alimento.cantidad || 100,
            })),
          };
        }
      }

      establecerComidas(nuevasComidas);
      establecerPlanIaPendiente(null);
      toast.success('Plan semanal IA aplicado en la grilla. Revisá y guardá los cambios.');
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : 'No se pudo aplicar el plan semanal IA';
      toast.error(mensaje);
    } finally {
      establecerAplicandoIa(false);
    }
  }, [
    planIaPendiente,
    token,
    mapearTipoComidaIA,
    mapearIngredientesAAlimentos,
    buscarAlimentoParaTexto,
  ]);

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
            items: comida?.alimentos.map((item) => ({
              alimentoId: item.alimento.idAlimento,
              cantidad: item.cantidad,
            })) ?? [],
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
    <div className="space-y-6 pb-10">
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
          {pacienteSeleccionado && (
            <AvatarPaciente
              fotoUrl={pacienteSeleccionado.fotoPerfilUrl}
              nombreCompleto={pacienteSeleccionado.nombreCompleto}
              size="lg"
            />
          )}
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
              {planId !== null ? 'Editar plan' : 'Crear plan'}
            </h1>
            {pacienteSeleccionado ? (
              <div className="mt-1">
                <p className="text-sm text-muted-foreground">
                  {pacienteSeleccionado.nombreCompleto}
                </p>
                {pacienteSeleccionado.dni ? (
                  <p className="text-xs text-muted-foreground/80">DNI: {pacienteSeleccionado.dni}</p>
                ) : null}
              </div>
            ) : null}
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
      <div className="flex flex-col gap-6">
        {/* Objective Card - Top Section */}
        <Card className="rounded-2xl border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-gradient-to-r from-orange-500 to-rose-500" />
              Configuración
            </CardTitle>
            <CardDescription>
              Definí el objetivo del plan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="objetivo" className="text-sm font-medium">
                Objetivo nutricional
              </Label>
              <Input
                id="objetivo"
                value={objetivoNutricional}
                onChange={(e) => establecerObjetivoNutricional(e.target.value)}
                placeholder="Ej: Pérdida de peso, ganancia muscular..."
                maxLength={255}
                className="border-border/50 focus:border-orange-500/50"
              />
              <p className="text-xs text-muted-foreground text-right">
                {objetivoNutricional.length}/255
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-fuchsia-500" />
              Asistente IA
            </CardTitle>
            <CardDescription>
              Generá recomendaciones y aplicalas al plan con un clic.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Día destino</Label>
                <Select
                  value={diaSeleccionadoIa}
                  onValueChange={(valor) => establecerDiaSeleccionadoIa(valor as DiaSemana)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar día" />
                  </SelectTrigger>
                  <SelectContent>
                    {DIAS_SEMANA.map((dia) => (
                      <SelectItem key={dia} value={dia}>
                        {dia}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Comida destino</Label>
                <Select
                  value={tipoComidaSeleccionadaIa}
                  onValueChange={(valor) =>
                    establecerTipoComidaSeleccionadaIa(valor as TipoComida)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar comida" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS_COMIDA.map((tipo) => (
                      <SelectItem key={tipo} value={tipo}>
                        {tipo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

            </div>

            <Button
              type="button"
              variant="outline"
              disabled={!planIaPendiente || aplicandoIa}
              onClick={() => {
                void aplicarPlanSemanalIa();
              }}
            >
              Aplicar plan semanal IA completo
            </Button>

            <div className="grid gap-4 lg:grid-cols-2">
              <GeneradorRecomendacion
                socioId={Number(socioId ?? 0)}
                token={token}
                alergias={obtenerAlergiasFicha}
                onRecomendacionesSeleccionadas={(recomendaciones) => {
                  void aplicarRecomendacionesIa(recomendaciones);
                }}
              />
              <GeneradorPlanSemanal
                socioId={Number(socioId ?? 0)}
                token={token}
                alergias={obtenerAlergiasFicha}
                onPlanGenerado={(plan) => {
                  establecerPlanIaPendiente(plan);
                  void aplicarPlanSemanalIa(plan);
                }}
              />
            </div>

            {/* Ideas de comida individuales (RF36-RF38) */}
            <IdeasComidaPanel
              token={token}
              socioId={Number(socioId ?? 0)}
              alergias={obtenerAlergiasFicha}
              restricciones={obtenerAlergiasFicha}
              diaSeleccionado={diaSeleccionadoIa}
              tipoComidaSeleccionada={tipoComidaSeleccionadaIa}
              onPropuestaSeleccionada={(propuesta, dia, tipoComida) => {
                void agregarPropuestaAlPlan(propuesta, dia as DiaSemana, tipoComida as TipoComida);
              }}
            />
          </CardContent>
        </Card>

        {/* Weekly Plan Grid */}
        <Card className="w-full rounded-2xl border-border/50 overflow-hidden">
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
          <CardContent className="p-0">
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
