import { useState } from 'react';
import { Calendar, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useGenerarPlanSemanal } from '@/hooks/useIa';
import type { PlanSemanalIA, RespuestaIA } from '@/types/ia';

interface PropiedadesGeneradorPlanSemanal {
  socioId: number;
  token: string | null;
  alergias?: string[];
  onPlanGenerado?: (plan: PlanSemanalIA) => void;
}

export function GeneradorPlanSemanal({
  socioId,
  token,
  alergias = [],
  onPlanGenerado,
}: PropiedadesGeneradorPlanSemanal) {
  const [caloriasObjetivo, establecerCaloriasObjetivo] = useState<number>(2000);
  const [diasAGenerar, establecerDiasAGenerar] = useState<number>(7);
  const [resultado, establecerResultado] = useState<RespuestaIA<PlanSemanalIA> | null>(null);

  const { mutate: generar, isPending } = useGenerarPlanSemanal({ token });

  const manejarGenerar = () => {
    generar(
      {
        socioId,
        caloriasObjetivo,
        diasAGenerar,
      },
      {
        onSuccess: (respuesta) => {
          establecerResultado(respuesta);
          if (respuesta.exito && respuesta.datos && onPlanGenerado) {
            onPlanGenerado(respuesta.datos);
          }
        },
      },
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          Generar Plan Semanal con IA
        </CardTitle>
        <CardDescription>
          Crea un plan de alimentación completo para toda la semana
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {alergias.length > 0 && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Alergias registradas:</strong> {alergias.join(', ')}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="calorias">Calorías objetivo (diarias)</Label>
            <Input
              id="calorias"
              type="number"
              min={1200}
              max={3000}
              value={caloriasObjetivo}
              onChange={(e) => establecerCaloriasObjetivo(parseInt(e.target.value) || 2000)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dias">Días a generar</Label>
            <Input
              id="dias"
              type="number"
              min={1}
              max={7}
              value={diasAGenerar}
              onChange={(e) => establecerDiasAGenerar(parseInt(e.target.value) || 7)}
            />
          </div>
        </div>

        <Button onClick={manejarGenerar} disabled={isPending || !token} className="w-full">
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generando plan...
            </>
          ) : (
            <>
              <Calendar className="mr-2 h-4 w-4" />
              Generar Plan Semanal
            </>
          )}
        </Button>

        {resultado && !resultado.exito ? (
          <div className="mt-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{resultado.error}</AlertDescription>
            </Alert>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
