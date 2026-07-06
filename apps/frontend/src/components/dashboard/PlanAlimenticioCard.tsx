import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Utensils, Coffee, Apple, Soup, Moon, ExternalLink } from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from '@tanstack/react-router';
import type { ApiResponse } from '@/types/api';

interface Comida {
  tipo: 'DESAYUNO' | 'ALMUERZO' | 'MERIENDA' | 'CENA' | 'COLACION';
  alimentos: string[];
  calorias?: number;
}

interface PlanActivo {
  idPlan: number;
  nombre: string;
  comidas: Comida[];
  caloriasTotales: number;
}



const ICONOS_COMIDA = {
  DESAYUNO: Coffee,
  ALMUERZO: Soup,
  MERIENDA: Apple,
  CENA: Moon,
  COLACION: Utensils,
};

export function PlanAlimenticioCard() {
  const { token, personaId } = useAuth();
  const navigate = useNavigate();

  const { data: response, isLoading } = useQuery({
    queryKey: ['plan-activo', personaId, token],
    queryFn: async () => {
      try {
        const resp = await apiRequest<ApiResponse<PlanActivo | PlanActivo[] | null>>(
          `/planes-alimentacion/socio/${personaId}/activo`,
          { token }
        );
        return resp;
      } catch (error) {
        const errorConStatus = error as Error & { status?: number };
        if (errorConStatus.status === 404) {
          return { data: null } as ApiResponse<PlanActivo | null>;
        }
        throw error;
      }
    },
    enabled: !!token && !!personaId,
    retry: false,
  });

  const datoPlan = response?.data;
  const plan = Array.isArray(datoPlan) ? (datoPlan[0] ?? null) : datoPlan;

  if (isLoading) {
    return (
      <Card className="rounded-2xl border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Utensils className="h-5 w-5 text-orange-500" />
            Mi Plan Alimenticio
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Cargando...</p>
        </CardContent>
      </Card>
    );
  }

  if (!plan) {
    return (
      <Card className="rounded-2xl border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Utensils className="h-5 w-5 text-orange-500" />
            Mi Plan Alimenticio
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm leading-6 text-muted-foreground">
            No tenés un plan alimenticio activo todavía. Cuando tu nutricionista lo cargue,
            lo vas a ver completo en esta sección.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Badge variant="secondary">Sin plan activo</Badge>
            <Button
              variant="outline"
              size="sm"
              className="border-orange-200 text-orange-700 hover:bg-orange-50"
              onClick={() => navigate({ to: '/turnos/agendar' })}
            >
              Reservar consulta
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl border-border/50 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-lg">
          <span className="flex items-center gap-2">
            <Utensils className="h-5 w-5 text-orange-500" />
            Mi Plan Alimenticio
          </span>
          <Badge variant="outline" className="text-xs">
            {plan.caloriasTotales} kcal
          </Badge>
        </CardTitle>
        <p className="text-sm text-muted-foreground">{plan.nombre}</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {(plan.comidas ?? []).map((comida) => {
            const IconoComida = ICONOS_COMIDA[comida.tipo] || Utensils;
            return (
              <div key={comida.tipo} className="flex items-start gap-3 p-2 rounded-lg bg-muted/50">
                <IconoComida className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-sm capitalize">
                    {comida.tipo.toLowerCase()}
                  </p>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {comida.alimentos.slice(0, 3).join(', ')}
                    {comida.alimentos.length > 3 && '...'}
                  </p>
                </div>
                {comida.calorias && (
                  <span className="text-xs text-muted-foreground">
                    {comida.calorias} kcal
                  </span>
                )}
              </div>
            );
          })}
        </div>
        <button
          type="button"
          onClick={() => navigate({ to: '/mi-plan' })}
          className="mt-4 flex items-center gap-1 text-sm text-orange-600 hover:text-orange-700"
        >
          Ver plan completo
          <ExternalLink className="h-3 w-3" />
        </button>
      </CardContent>
    </Card>
  );
}
