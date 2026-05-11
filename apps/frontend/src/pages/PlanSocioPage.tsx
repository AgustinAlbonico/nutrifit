import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { CheckCircle, Plus, Trash2, Utensils } from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

interface PlanAlimentacion {
  idPlanAlimentacion: number;
  objetivoNutricional: string | null;
  activo: boolean;
  fechaCreacion: string;
  fechaVencimiento: string;
  motivoEdicion: string | null;
  ultimaEdicion: string;
  socioId: number;
  nutricionistaId: number;
  dias: DiaPlan[];
}

interface DiaPlan {
  dia: string;
  orden: number;
  opcionesComida: OpcionComida[];
}

interface OpcionComida {
  tipoComida: string;
  comentarios: string | null;
  items: Array<{
    alimentoId: number;
    cantidad: number;
  }>;
}

type EstadoPlan = 'CARGANDO' | 'ACTIVO' | 'SIN_PLAN' | 'ERROR';

export function PlanSocioPage() {
  const { token } = useAuth();
  const params = useParams({ strict: false }) as { socioId?: string };
  const socioId = params.socioId;
  const navigate = useNavigate();

  const [estado, establecerEstado] = useState<EstadoPlan>('CARGANDO');
  const [error, setError] = useState<string | null>(null);
  const [planActivo, establecerPlanActivo] = useState<PlanAlimentacion | null>(null);

  useEffect(() => {
    if (!token || !socioId) {
      return;
    }

    const cargarPlanActivo = async () => {
      try {
        setError(null);
        establecerEstado(() => 'CARGANDO');

        const response = await apiRequest<ApiResponse<PlanAlimentacion>>(
          `/planes-alimentacion/socio/${socioId}/activo`,
          { token },
        );

        establecerPlanActivo(response.data);
        establecerEstado(() => 'ACTIVO');
      } catch (err) {
        const mensaje = err instanceof Error ? err.message : 'No se pudo cargar el plan';
        setError(mensaje);

        // 404 = no hay plan activo, 403 = sin permisos pero debería mostrar crear
        if (err instanceof Error && (err.message.includes('404') || err.message.includes('403'))) {
          establecerPlanActivo(null);
          establecerEstado(() => 'SIN_PLAN');
        } else {
          establecerEstado(() => 'ERROR');
        }
      }
    };

    void cargarPlanActivo();
  }, [token, socioId]);

  const mostrarErrorInicial = useMemo(() => !token && !socioId && estado === 'CARGANDO', [token, socioId, estado]);

  const manejarCrearNuevoPlan = () => {
    navigate({ to: `/profesional/plan/${socioId}/editar` });
  };

  const manejarEditarPlan = () => {
    navigate({ to: `/profesional/plan/${socioId}/editar` });
  };

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl border border-orange-500/20 bg-gradient-to-r from-orange-500/10 via-rose-500/10 to-transparent p-8 mb-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-rose-500/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <Utensils className="h-8 w-8 text-orange-500" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-rose-600 bg-clip-text text-transparent">
              Plan alimentación - Socio {socioId}
            </h1>
          </div>
          <p className="text-muted-foreground">
            Gestión del plan de alimentación del socio.
          </p>
        </div>
      </div>

      {estado === 'CARGANDO' ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            Cargando plan del socio...
          </CardContent>
        </Card>
      ) : mostrarErrorInicial ? (
        <Card>
          <CardContent className="py-10 text-center text-destructive">
            Faltan datos de autenticación o socio
          </CardContent>
        </Card>
      ) : estado === 'SIN_PLAN' ? (
        <Card>
          <CardHeader>
            <CardTitle>Plan no configurado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-md border border-dashed p-10 text-center">
              <p className="mb-4 text-sm text-muted-foreground">
                El socio no tiene un plan de alimentación activo.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  type="button"
                  variant="outline"
                  onClick={manejarCrearNuevoPlan}
                  className="min-w-[200px]"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Crear nuevo plan
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={manejarEditarPlan}
                  className="min-w-[200px]"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Crear plan completo
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : estado === 'ERROR' ? (
        <Card>
          <CardContent className="py-10 text-center text-destructive">
            {error || 'Error al cargar el plan'}
          </CardContent>
        </Card>
      ) : planActivo ? (
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl">Plan activo</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {planActivo.fechaCreacion && (
                    <span>Creado: {new Date(planActivo.fechaCreacion).toLocaleDateString('es-AR')}</span>
                  )}
                  {planActivo.fechaVencimiento && (
                    <span className="ml-3">Vence: {new Date(planActivo.fechaVencimiento).toLocaleDateString('es-AR')}</span>
                  )}
                </p>
              </div>
              <Badge variant="default" className="bg-emerald-600">
                <CheckCircle className="mr-1 h-4 w-4" />
                Activo
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {planActivo.objetivoNutricional && (
              <div>
                <h3 className="text-sm font-semibold mb-3">Objetivo Nutricional</h3>
                <div className="rounded-md border p-3 bg-muted/50">
                  <p className="text-sm">{planActivo.objetivoNutricional}</p>
                </div>
              </div>
            )}

            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold mb-3">Acciones</h3>
              <div className="flex flex-wrap gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={manejarEditarPlan}
                >
                  Editar plan
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="border-destructive text-destructive hover:bg-destructive/10"
                  disabled
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Finalizar plan
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {error && !mostrarErrorInicial && estado !== 'SIN_PLAN' && (
        <Alert variant="destructive" className="border-destructive/30 bg-destructive/5">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
