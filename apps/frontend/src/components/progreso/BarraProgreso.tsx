import { useMemo } from 'react';
import { cn } from '@/lib/utils';

interface PropiedadesBarraProgreso {
  progreso: number;
  mostrarEtiqueta?: boolean;
  className?: string;
}

export function BarraProgreso({
  progreso,
  mostrarEtiqueta = true,
  className,
}: PropiedadesBarraProgreso) {
  const progresoNormalizado = useMemo(() => {
    return Math.min(100, Math.max(0, progreso));
  }, [progreso]);

  const color = useMemo(() => {
    if (progresoNormalizado >= 100) return 'bg-green-500';
    if (progresoNormalizado >= 71) return 'bg-blue-500';
    if (progresoNormalizado >= 31) return 'bg-yellow-500';
    return 'bg-orange-500';
  }, [progresoNormalizado]);

  return (
    <div className={cn('w-full', className)}>
      {mostrarEtiqueta && (
        <div className="flex justify-between mb-1 text-sm">
          <span className="text-muted-foreground">Progreso</span>
          <span className="font-medium">{Math.round(progresoNormalizado)}%</span>
        </div>
      )}
      <div className="w-full bg-secondary rounded-full h-2.5 overflow-hidden">
        <div
          className={cn('h-2.5 rounded-full transition-all duration-500 ease-out', color)}
          style={{ width: `${progresoNormalizado}%` }}
        />
      </div>
    </div>
  );
}
