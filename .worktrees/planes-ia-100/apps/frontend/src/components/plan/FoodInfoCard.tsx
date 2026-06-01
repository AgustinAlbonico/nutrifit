import { Flame, Beef, Wheat, Droplet } from 'lucide-react';
import type { Alimento } from '@/lib/api/alimentos';
import { cn } from '@/lib/utils';

interface PropsFoodInfoCard {
  alimento: Alimento;
  cantidad?: number;
  variante?: 'default' | 'compacta';
}

export function FoodInfoCard({ alimento, cantidad = 1, variante = 'default' }: PropsFoodInfoCard) {
  const multiplicador = cantidad / (alimento.cantidad || 1);
  
  const calorias = Math.round((alimento.calorias ?? 0) * multiplicador);
  const proteinas = Math.round((alimento.proteinas ?? 0) * multiplicador);
  const carbohidratos = Math.round((alimento.carbohidratos ?? 0) * multiplicador);
  const grasas = Math.round((alimento.grasas ?? 0) * multiplicador);

  if (variante === 'compacta') {
    return (
      <div className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-muted/50 transition-colors">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-medium text-sm truncate">{alimento.nombre}</span>
          <span className="text-xs text-muted-foreground shrink-0">
            {cantidad} {alimento.unidadMedida}
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <MacroPill valor={calorias} icono={<Flame className="h-3 w-3" />} color="naranja" compacta />
        </div>
      </div>
    );
  }

  return (
    <div className="group relative rounded-xl border border-border/50 bg-gradient-to-br from-background to-muted/20 p-3 transition-all hover:border-border hover:shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0 flex-1">
          <h4 className="font-medium text-sm leading-tight truncate">{alimento.nombre}</h4>
          <p className="text-xs text-muted-foreground mt-0.5">
            {cantidad} {alimento.unidadMedida}
            {alimento.grupoAlimenticio && (
              <span className="mx-1.5">•</span>
            )}
            {alimento.grupoAlimenticio?.descripcion}
          </p>
        </div>
      </div>

      {/* Macros Grid */}
      <div className="grid grid-cols-4 gap-1.5">
        <MacroPill 
          valor={calorias} 
          etiqueta="kcal" 
          icono={<Flame className="h-3 w-3" />} 
          color="naranja" 
        />
        <MacroPill 
          valor={proteinas} 
          etiqueta="g" 
          icono={<Beef className="h-3 w-3" />} 
          color="rojo" 
        />
        <MacroPill 
          valor={carbohidratos} 
          etiqueta="g" 
          icono={<Wheat className="h-3 w-3" />} 
          color="ambar" 
        />
        <MacroPill 
          valor={grasas} 
          etiqueta="g" 
          icono={<Droplet className="h-3 w-3" />} 
          color="azul" 
        />
      </div>
    </div>
  );
}

interface PropsMacroPill {
  valor: number;
  etiqueta?: string;
  icono: React.ReactNode;
  color: 'naranja' | 'rojo' | 'ambar' | 'azul';
  compacta?: boolean;
}

function MacroPill({ valor, etiqueta, icono, color, compacta }: PropsMacroPill) {
  const colores = {
    naranja: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
    rojo: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
    ambar: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    azul: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
  };

  if (compacta) {
    return (
      <span className={cn('inline-flex items-center gap-1 text-xs font-medium', colores[color])}>
        {icono}
        <span>{valor}</span>
      </span>
    );
  }

  return (
    <div className={cn(
      'flex flex-col items-center justify-center rounded-lg py-1.5 px-1 text-center',
      colores[color]
    )}>
      <div className="flex items-center justify-center mb-0.5">
        {icono}
      </div>
      <span className="text-xs font-semibold leading-none">{valor}</span>
      {etiqueta && <span className="text-[10px] opacity-70 leading-none mt-0.5">{etiqueta}</span>}
    </div>
  );
}
