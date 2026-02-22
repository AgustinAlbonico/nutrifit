import { Flame, Beef, Wheat, Droplet } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { Alimento } from '@/lib/api/alimentos';

interface PropsFoodInfoCard {
  alimento: Alimento;
  cantidad?: number;
}

export function FoodInfoCard({ alimento, cantidad = 1 }: PropsFoodInfoCard) {
  const multiplicador = cantidad / (alimento.cantidad || 1);
  
  const calorias = Math.round((alimento.calorias ?? 0) * multiplicador);
  const proteinas = Math.round((alimento.proteinas ?? 0) * multiplicador);
  const carbohidratos = Math.round((alimento.carbohidratos ?? 0) * multiplicador);
  const grasas = Math.round((alimento.grasas ?? 0) * multiplicador);

  return (
    <Card className="border-muted">
      <CardContent className="p-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-medium text-sm">{alimento.nombre}</span>
          <span className="text-xs text-muted-foreground">
            {cantidad} {alimento.unidadMedida}
          </span>
        </div>
        
        <div className="grid grid-cols-4 gap-2 text-xs">
          <div className="flex items-center gap-1 text-orange-600">
            <Flame className="h-3 w-3" />
            <span>{calorias} kcal</span>
          </div>
          <div className="flex items-center gap-1 text-red-600">
            <Beef className="h-3 w-3" />
            <span>{proteinas}g P</span>
          </div>
          <div className="flex items-center gap-1 text-amber-600">
            <Wheat className="h-3 w-3" />
            <span>{carbohidratos}g C</span>
          </div>
          <div className="flex items-center gap-1 text-blue-600">
            <Droplet className="h-3 w-3" />
            <span>{grasas}g G</span>
          </div>
        </div>
        
        {alimento.grupoAlimenticio && (
          <span className="text-xs text-muted-foreground">
            {alimento.grupoAlimenticio.descripcion}
          </span>
        )}
      </CardContent>
    </Card>
  );
}
