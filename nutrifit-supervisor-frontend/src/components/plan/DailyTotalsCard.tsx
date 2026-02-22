import { Flame, Beef, Wheat, Droplet } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface PropsTarjetaTotalesDiarios {
  calorias: number;
  proteinas: number;
  carbohidratos: number;
  grasas: number;
  compacto?: boolean;
}

export function DailyTotalsCard({ 
  calorias, 
  proteinas, 
  carbohidratos, 
  grasas,
  compacto = false 
}: PropsTarjetaTotalesDiarios) {
  if (compacto) {
    return (
      <div className="flex items-center gap-2 text-xs bg-muted/50 px-2 py-1 rounded">
        <span className="flex items-center gap-1 text-orange-600">
          <Flame className="h-3 w-3" />
          {calorias}
        </span>
        <span className="text-red-600">P:{proteinas}g</span>
        <span className="text-amber-600">C:{carbohidratos}g</span>
        <span className="text-blue-600">G:{grasas}g</span>
      </div>
    );
  }

  return (
    <Card className="bg-muted/30">
      <CardContent className="p-3">
        <div className="text-xs font-medium mb-2 text-muted-foreground">Totales del día</div>
        <div className="grid grid-cols-4 gap-2 text-sm">
          <div className="flex flex-col items-center">
            <Flame className="h-4 w-4 text-orange-600 mb-1" />
            <span className="font-semibold">{calorias}</span>
            <span className="text-xs text-muted-foreground">kcal</span>
          </div>
          <div className="flex flex-col items-center">
            <Beef className="h-4 w-4 text-red-600 mb-1" />
            <span className="font-semibold">{proteinas}g</span>
            <span className="text-xs text-muted-foreground">Proteínas</span>
          </div>
          <div className="flex flex-col items-center">
            <Wheat className="h-4 w-4 text-amber-600 mb-1" />
            <span className="font-semibold">{carbohidratos}g</span>
            <span className="text-xs text-muted-foreground">Carbos</span>
          </div>
          <div className="flex flex-col items-center">
            <Droplet className="h-4 w-4 text-blue-600 mb-1" />
            <span className="font-semibold">{grasas}g</span>
            <span className="text-xs text-muted-foreground">Grasas</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
