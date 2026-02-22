import { MealSlotCard, type AlimentoEnComida } from './MealSlotCard';
export type { AlimentoEnComida } from './MealSlotCard';
import { DailyTotalsCard } from './DailyTotalsCard';

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

  const formatearDia = (dia: DiaSemana): string => {
    const nombres: Record<DiaSemana, string> = {
      LUNES: 'Lun',
      MARTES: 'Mar',
      MIERCOLES: 'Mié',
      JUEVES: 'Jue',
      VIERNES: 'Vie',
      SABADO: 'Sáb',
      DOMINGO: 'Dom',
    };
    return nombres[dia];
  };

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[1200px]">
        <div className="grid grid-cols-8 gap-2 mb-2">
          <div className="p-2 text-sm font-medium text-muted-foreground">Comida</div>
          {DIAS_SEMANA.map(dia => {
            const totales = calcularTotalesDia(dia);
            return (
              <div key={dia} className="p-2 text-center">
                <div className="font-medium text-sm">{formatearDia(dia)}</div>
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

        {TIPOS_COMIDA.map(tipoComida => (
          <div key={tipoComida} className="grid grid-cols-8 gap-2 mb-2">
            <div className="p-2 flex items-center">
              <span className="text-sm font-medium capitalize">
                {tipoComida.toLowerCase()}
              </span>
            </div>
            {DIAS_SEMANA.map(dia => (
              <div key={`${dia}-${tipoComida}`} className="min-h-[120px]">
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
  );
}
