import { Sparkles } from 'lucide-react';
import { useMacrosAcumulados } from '@/hooks/useMacrosAcumulados';
import type { EstructuraDiaFE } from '@/types/ia';
import { Card } from '@/components/ui/card';
import { MacrosBadge } from '@/components/plan/MacrosBadge';

interface Props {
  estructura: EstructuraDiaFE[];
  objetivoKcal?: number;
}

const PORCENTAJE_OBJETIVO_DEFAULT = 2000;

function clasificarBanda(desvioPorcentaje: number): 'VERDE' | 'AMARILLO' | 'ROJO' {
  const abs = Math.abs(desvioPorcentaje);
  if (abs <= 5) return 'VERDE';
  if (abs <= 10) return 'AMARILLO';
  return 'ROJO';
}

export function DialogResumenMacros({ estructura, objetivoKcal = PORCENTAJE_OBJETIVO_DEFAULT }: Props) {
  const totales = useMacrosAcumulados(estructura);
  const desvioPct = objetivoKcal ? ((totales.calorias - objetivoKcal) / objetivoKcal) * 100 : 0;
  const banda = clasificarBanda(desvioPct);

  return (
    <Card data-testid="resumen-macros-sticky" className="fixed bottom-4 right-4 z-30 max-w-xs p-3 shadow-lg">
      <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
        <Sparkles className="size-3.5" aria-hidden="true" />
        Total del plan
      </div>
      <p className="mt-1 text-2xl font-bold tabular-nums">{totales.calorias} <span className="text-sm text-muted-foreground">kcal</span></p>
      <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">
        P {totales.proteinas}g · C {totales.carbohidratos}g · G {totales.grasas}g
      </p>
      <div className="mt-2">
        <MacrosBadge banda={banda} desvioPorcentaje={desvioPct} compact />
      </div>
    </Card>
  );
}
