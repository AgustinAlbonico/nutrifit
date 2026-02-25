import { MealSlotCard, type AlimentoEnComida } from './MealSlotCard';
export type { AlimentoEnComida } from './MealSlotCard';
import { DailyTotalsCard } from './DailyTotalsCard';
import { cn } from '@/lib/utils';

const DIAS_SEMANA = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO'] as const;
const TIPOS_COMIDA = ['DESAYUNO', 'ALMUERZO', 'MERIENDA', 'CENA', 'COLACION'] as const;

type DiaSemana = typeof DIAS_SEMANA[number];
type TipoComida = typeof TIPOS_COMIDA[number];

export interface ComidaEnPlan {
  dia: DiaSemana;
  tipoComida: TipoComida;
  alimentos: AlimentoEnComida[];
}

interface PropsGrillaPlanSemanal {
  comidas: ComidaEnPlan[];
  alAgregarAlimento: (dia: DiaSemana, tipoComida: TipoComida) => void;
  alEditarCantidad: (dia: DiaSemana, tipoComida: TipoComida, indiceAlimento: number, cantidad: number) => void;
  alEliminarAlimento: (dia: DiaSemana, tipoComida: TipoComida, indiceAlimento: number) => void;
}

export function WeeklyPlanGrid({
  comidas,
  alAgregarAlimento,
  alEditarCantidad,
  alEliminarAlimento,
}: PropsGrillaPlanSemanal) {
  const obtenerComida = (dia: DiaSemana, tipoComida: TipoComida): AlimentoEnComida[] => {
    const comida = comidas.find(c => c.dia === dia && c.tipoComida === tipoComida);
    return comida?.alimentos ?? [];
  };

  const calcularTotalesDia = (dia: DiaSemana) => {
    const comidasDelDia = TIPOS_COMIDA.map(tipo => obtenerComida(dia, tipo));
    
    return comidasDelDia.reduce(
      (acc, alimentos) => {
        alimentos.forEach(item => {
          const multiplicador = item.cantidad / (item.alimento.cantidad || 1);
          acc.calorias += (item.alimento.calorias ?? 0) * multiplicador;
          acc.proteinas += (item.alimento.proteinas ?? 0) * multiplicador;
          acc.carbohidratos += (item.alimento.carbohidratos ?? 0) * multiplicador;
          acc.grasas += (item.alimento.grasas ?? 0) * multiplicador;
        });
        return acc;
      },
      { calorias: 0, proteinas: 0, carbohidratos: 0, grasas: 0 }
    );
  };

  const formatearDia = (dia: DiaSemana): { corto: string; completo: string } => {
    const nombres: Record<DiaSemana, { corto: string; completo: string }> = {
      LUNES: { corto: 'Lun', completo: 'Lunes' },
      MARTES: { corto: 'Mar', completo: 'Martes' },
      MIERCOLES: { corto: 'Mié', completo: 'Miércoles' },
      JUEVES: { corto: 'Jue', completo: 'Jueves' },
      VIERNES: { corto: 'Vie', completo: 'Viernes' },
      SABADO: { corto: 'Sáb', completo: 'Sábado' },
      DOMINGO: { corto: 'Dom', completo: 'Domingo' },
    };
    return nombres[dia];
  };

  const esFinde = (dia: DiaSemana): boolean => {
    return dia === 'SABADO' || dia === 'DOMINGO';
  };

  return (
    <div className="space-y-4">
      {/* Desktop Grid */}
      <div className="hidden lg:block">
          <div className="w-full">
          {/* Header Row */}
          <div className="grid gap-1.5 mb-3" style={{ gridTemplateColumns: '85px repeat(7, minmax(0, 1fr))' }}>
            <div className="p-2" /> {/* Empty corner */}
            {DIAS_SEMANA.map(dia => {
              const totales = calcularTotalesDia(dia);
              return (
                <div 
                  key={dia} 
                  className={cn(
                    "p-2 rounded-xl text-center transition-all",
                    esFinde(dia) 
                      ? "bg-gradient-to-br from-purple-500/5 to-pink-500/5 dark:from-purple-500/10 dark:to-pink-500/10"
                      : "bg-muted/30"
                  )}
                >
                  <div className={cn(
                    "font-semibold text-sm mb-1",
                    esFinde(dia) ? "text-purple-700 dark:text-purple-300" : ""
                  )}>
                    {formatearDia(dia).corto}
                  </div>
                  <DailyTotalsCard
                    calorias={Math.round(totales.calorias)}
                    proteinas={Math.round(totales.proteinas)}
                    carbohidratos={Math.round(totales.carbohidratos)}
                    grasas={Math.round(totales.grasas)}
                    compacto
                  />
                </div>
              );
            })}
          </div>
          {/* Meal Rows */}
          {TIPOS_COMIDA.map(tipoComida => (
            <div key={tipoComida} className="grid gap-1.5 mb-1.5" style={{ gridTemplateColumns: '85px repeat(7, minmax(0, 1fr))' }}>
              {/* Meal Type Label */}
              <div className="flex items-center justify-end pr-2">
                <span className="text-sm font-medium text-muted-foreground capitalize">
                  {tipoComida.charAt(0) + tipoComida.slice(1).toLowerCase()}
                </span>
              </div>
              {/* Day Cells */}
              {DIAS_SEMANA.map(dia => (
                <div key={`${dia}-${tipoComida}`} className="min-h-[100px]">
                  <MealSlotCard
                    tipoComida={tipoComida}
                    alimentos={obtenerComida(dia, tipoComida)}
                    alAgregarAlimento={() => alAgregarAlimento(dia, tipoComida)}
                    alEditarCantidad={(indice, cantidad) => alEditarCantidad(dia, tipoComida, indice, cantidad)}
                    alEliminarAlimento={(indice) => alEliminarAlimento(dia, tipoComida, indice)}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Mobile Stacked View */}
      <div className="lg:hidden space-y-6">
        {DIAS_SEMANA.map(dia => {
          const totales = calcularTotalesDia(dia);
          return (
            <div 
              key={dia} 
              className={cn(
                "rounded-2xl border border-border/50 overflow-hidden",
                esFinde(dia) 
                  ? "bg-gradient-to-br from-purple-500/5 to-pink-500/5 dark:from-purple-500/10 dark:to-pink-500/10"
                  : "bg-muted/20"
              )}
            >
              {/* Day Header */}
              <div className={cn(
                "px-4 py-3 border-b border-border/30",
                esFinde(dia) ? "bg-gradient-to-r from-purple-500/10 to-pink-500/10" : "bg-muted/30"
              )}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className={cn(
                      "font-semibold",
                      esFinde(dia) ? "text-purple-700 dark:text-purple-300" : ""
                    )}>
                      {formatearDia(dia).completo}
                    </h3>
                  </div>
                  <DailyTotalsCard
                    calorias={Math.round(totales.calorias)}
                    proteinas={Math.round(totales.proteinas)}
                    carbohidratos={Math.round(totales.carbohidratos)}
                    grasas={Math.round(totales.grasas)}
                    compacto
                  />
                </div>
              </div>

              {/* Meals Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3">
                {TIPOS_COMIDA.map(tipoComida => (
                  <MealSlotCard
                    key={`${dia}-${tipoComida}-mobile`}
                    tipoComida={tipoComida}
                    alimentos={obtenerComida(dia, tipoComida)}
                    alAgregarAlimento={() => alAgregarAlimento(dia, tipoComida)}
                    alEditarCantidad={(indice, cantidad) => alEditarCantidad(dia, tipoComida, indice, cantidad)}
                    alEliminarAlimento={(indice) => alEliminarAlimento(dia, tipoComida, indice)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
