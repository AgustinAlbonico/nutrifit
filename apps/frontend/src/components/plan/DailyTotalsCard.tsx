import { Flame, Beef, Wheat, Droplet } from 'lucide-react';
import { cn } from '@/lib/utils';

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
    const tieneDatos = calorias > 0 || proteinas > 0 || carbohidratos > 0 || grasas > 0;
    
    return (
      <div className={cn(
        "flex items-center justify-center gap-2 text-xs py-1.5 px-2 rounded-full transition-all",
        tieneDatos 
          ? "bg-gradient-to-r from-orange-500/10 via-rose-500/5 to-sky-500/10 dark:from-orange-500/20 dark:via-rose-500/10 dark:to-sky-500/20" 
          : "bg-muted/30"
      )}>
        <div className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
          <Flame className="h-3 w-3" />
          <span className="font-semibold tabular-nums">{calorias}</span>
        </div>
        <div className="w-px h-3 bg-border/50" />
        <div className="flex items-center gap-2.5">
          <span className="text-rose-600 dark:text-rose-400 font-medium tabular-nums">P{proteinas}g</span>
          <span className="text-amber-600 dark:text-amber-400 font-medium tabular-nums">C{carbohidratos}g</span>
          <span className="text-sky-600 dark:text-sky-400 font-medium tabular-nums">G{grasas}g</span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border/50 bg-gradient-to-br from-background via-muted/10 to-muted/30 p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-orange-500 to-rose-500" />
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Totales del día
        </span>
      </div>
      
      <div className="grid grid-cols-4 gap-3">
        <MacroStat
          valor={calorias}
          unidad="kcal"
          icono={<Flame className="h-4 w-4" />}
          color="naranja"
          etiqueta="Calorías"
        />
        <MacroStat
          valor={proteinas}
          unidad="g"
          icono={<Beef className="h-4 w-4" />}
          color="rojo"
          etiqueta="Proteínas"
        />
        <MacroStat
          valor={carbohidratos}
          unidad="g"
          icono={<Wheat className="h-4 w-4" />}
          color="ambar"
          etiqueta="Carbos"
        />
        <MacroStat
          valor={grasas}
          unidad="g"
          icono={<Droplet className="h-4 w-4" />}
          color="azul"
          etiqueta="Grasas"
        />
      </div>
    </div>
  );
}

interface PropsMacroStat {
  valor: number;
  unidad: string;
  icono: React.ReactNode;
  color: 'naranja' | 'rojo' | 'ambar' | 'azul';
  etiqueta: string;
}

function MacroStat({ valor, unidad, icono, color, etiqueta }: PropsMacroStat) {
  const colores = {
    naranja: {
      bg: 'bg-gradient-to-br from-orange-500/15 to-orange-600/5 dark:from-orange-500/25 dark:to-orange-600/10',
      text: 'text-orange-600 dark:text-orange-400',
      icon: 'text-orange-500 dark:text-orange-400',
    },
    rojo: {
      bg: 'bg-gradient-to-br from-rose-500/15 to-rose-600/5 dark:from-rose-500/25 dark:to-rose-600/10',
      text: 'text-rose-600 dark:text-rose-400',
      icon: 'text-rose-500 dark:text-rose-400',
    },
    ambar: {
      bg: 'bg-gradient-to-br from-amber-500/15 to-amber-600/5 dark:from-amber-500/25 dark:to-amber-600/10',
      text: 'text-amber-600 dark:text-amber-400',
      icon: 'text-amber-500 dark:text-amber-400',
    },
    azul: {
      bg: 'bg-gradient-to-br from-sky-500/15 to-sky-600/5 dark:from-sky-500/25 dark:to-sky-600/10',
      text: 'text-sky-600 dark:text-sky-400',
      icon: 'text-sky-500 dark:text-sky-400',
    },
  };

  return (
    <div className={cn('flex flex-col items-center rounded-xl p-2.5', colores[color].bg)}>
      <div className={cn('mb-1', colores[color].icon)}>{icono}</div>
      <div className="flex items-baseline gap-0.5">
        <span className={cn('text-lg font-bold tabular-nums', colores[color].text)}>{valor}</span>
        <span className={cn('text-xs font-medium', colores[color].text, 'opacity-70')}>{unidad}</span>
      </div>
      <span className="text-[10px] text-muted-foreground mt-0.5">{etiqueta}</span>
    </div>
  );
}
