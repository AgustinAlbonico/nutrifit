import { Plus, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FoodInfoCard } from './FoodInfoCard';
import type { Alimento } from '@/lib/api/alimentos';

export interface AlimentoEnComida {
  alimento: Alimento;
  cantidad: number;
}

interface PropsTarjetaSlotComida {
  tipoComida: string;
  alimentos: AlimentoEnComida[];
  alAgregarAlimento: () => void;
  alEditarCantidad: (indice: number, cantidad: number) => void;
  alEliminarAlimento: (indice: number) => void;
}

export function MealSlotCard({
  tipoComida,
  alimentos,
  alAgregarAlimento,
  alEditarCantidad,
  alEliminarAlimento,
}: PropsTarjetaSlotComida) {
  const formatearTipoComida = (tipo: string): string => {
    const mapa: Record<string, string> = {
      DESAYUNO: 'Desayuno',
      ALMUERZO: 'Almuerzo',
      MERIENDA: 'Merienda',
      CENA: 'Cena',
      COLACION: 'Colación',
    };
    return mapa[tipo] || tipo;
  };

  const totalesComida = alimentos.reduce(
    (acc, item) => ({
      calorias: acc.calorias + (item.alimento.calorias ?? 0) * (item.cantidad / (item.alimento.cantidad || 1)),
      proteinas: acc.proteinas + (item.alimento.proteinas ?? 0) * (item.cantidad / (item.alimento.cantidad || 1)),
      carbohidratos: acc.carbohidratos + (item.alimento.carbohidratos ?? 0) * (item.cantidad / (item.alimento.cantidad || 1)),
      grasas: acc.grasas + (item.alimento.grasas ?? 0) * (item.cantidad / (item.alimento.cantidad || 1)),
    }),
    { calorias: 0, proteinas: 0, carbohidratos: 0, grasas: 0 }
  );

  return (
    <Card className="h-full">
      <CardHeader className="pb-2 pt-3 px-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">
            {formatearTipoComida(tipoComida)}
          </CardTitle>
          <div className="flex items-center gap-2">
            {alimentos.length > 0 && (
              <span className="text-xs text-muted-foreground">
                {Math.round(totalesComida.calorias)} kcal
              </span>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={alAgregarAlimento}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 px-3 pb-3 space-y-2 max-h-[300px] overflow-y-auto">
        {alimentos.length === 0 ? (
          <div className="text-center py-4">
            <Button
              variant="outline"
              size="sm"
              onClick={alAgregarAlimento}
              className="text-xs"
            >
              <Plus className="h-3 w-3 mr-1" />
              Agregar alimento
            </Button>
          </div>
        ) : (
          alimentos.map((item, indice) => (
            <div key={`${item.alimento.idAlimento}-${indice}`} className="relative group">
              <FoodInfoCard alimento={item.alimento} cantidad={item.cantidad} />
              <div className="absolute top-1 right-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Input
                  type="number"
                  value={item.cantidad}
                  onChange={(e) => alEditarCantidad(indice, parseFloat(e.target.value) || 0)}
                  className="w-16 h-6 text-xs"
                  min={0}
                  step={item.alimento.unidadMedida === 'g' || item.alimento.unidadMedida === 'ml' ? 10 : 0.5}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                  onClick={() => alEliminarAlimento(indice)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
