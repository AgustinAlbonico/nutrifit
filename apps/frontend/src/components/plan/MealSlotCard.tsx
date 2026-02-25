import { Plus, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FoodInfoCard } from './FoodInfoCard';
import { cn } from '@/lib/utils';
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

const ICONOS_COMIDA: Record<string, string> = {
  DESAYUNO: '🌅',
  ALMUERZO: '☀️',
  MERIENDA: '🍵',
  CENA: '🌙',
  COLACION: '🍎',
};

const COLORES_COMIDA: Record<string, string> = {
  DESAYUNO: 'from-amber-500/10 to-orange-500/5 dark:from-amber-500/20 dark:to-orange-500/10',
  ALMUERZO: 'from-yellow-500/10 to-amber-500/5 dark:from-yellow-500/20 dark:to-amber-500/10',
  MERIENDA: 'from-emerald-500/10 to-teal-500/5 dark:from-emerald-500/20 dark:to-teal-500/10',
  CENA: 'from-indigo-500/10 to-purple-500/5 dark:from-indigo-500/20 dark:to-purple-500/10',
  COLACION: 'from-rose-500/10 to-pink-500/5 dark:from-rose-500/20 dark:to-pink-500/10',
};

export function MealSlotCard({
  tipoComida,
  alimentos,
  alAgregarAlimento,
  alEditarCantidad,
  alEliminarAlimento,
}: PropsTarjetaSlotComida) {
  const [expandido, establecerExpandido] = useState(true);

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

  const tieneAlimentos = alimentos.length > 0;
  const colorComida = COLORES_COMIDA[tipoComida] || COLORES_COMIDA.COLACION;

  return (
    <div className={cn(
      "rounded-xl border border-border/40 overflow-hidden transition-all h-full flex flex-col",
      "bg-gradient-to-br",
      colorComida
    )}>
      {/* Header */}
      <button
        type="button"
        className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors w-full text-left"
        onClick={() => establecerExpandido(!expandido)}
        aria-expanded={expandido}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm">{ICONOS_COMIDA[tipoComida] || '🍽️'}</span>
          <span className="text-sm font-medium">{formatearTipoComida(tipoComida)}</span>
          {tieneAlimentos && (
            <span className="text-xs text-muted-foreground bg-background/50 px-1.5 py-0.5 rounded-full">
              {alimentos.length}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {tieneAlimentos && (
            <div className="flex items-center gap-1 text-xs">
              <span className="font-semibold text-orange-600 dark:text-orange-400 tabular-nums">
                {Math.round(totalesComida.calorias)}
              </span>
              <span className="text-muted-foreground">kcal</span>
            </div>
          )}
          {expandido ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Content */}
      {expandido && (
        <div className="flex-1 flex flex-col px-2 pb-2 space-y-1.5">
          {tieneAlimentos ? (
            <>
              {alimentos.map((item, indice) => (
                <div 
                  key={`${item.alimento.idAlimento}-${indice}`} 
                  className="group relative"
                >
                  <FoodInfoCard 
                    alimento={item.alimento} 
                    cantidad={item.cantidad} 
                    variante="compacta"
                  />
                  
                  {/* Hover Controls */}
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-background/90 dark:bg-background/80 backdrop-blur-sm rounded-lg p-1 shadow-sm border border-border/50">
                    <Input
                      type="number"
                      value={item.cantidad}
                      onChange={(e) => alEditarCantidad(indice, parseFloat(e.target.value) || 0)}
                      className="w-14 h-7 text-xs text-center"
                      min={0}
                      step={item.alimento.unidadMedida === 'g' || item.alimento.unidadMedida === 'ml' ? 10 : 0.5}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-destructive/70 hover:text-destructive hover:bg-destructive/10"
                      onClick={(e) => {
                        e.stopPropagation();
                        alEliminarAlimento(indice);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
              
              {/* Add More Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  alAgregarAlimento();
                }}
                className="flex items-center justify-center gap-1.5 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-background/50 rounded-lg transition-colors border border-dashed border-border/50 hover:border-border"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Agregar</span>
              </button>
            </>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                alAgregarAlimento();
              }}
              className="flex-1 flex flex-col items-center justify-center gap-2 py-4 text-muted-foreground hover:text-foreground transition-colors min-h-[80px]"
            >
              <div className="w-8 h-8 rounded-full bg-background/80 flex items-center justify-center">
                <Plus className="h-4 w-4" />
              </div>
              <span className="text-xs">Agregar alimento</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
