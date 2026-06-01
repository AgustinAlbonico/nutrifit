import type { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

type TipoVarianteBadge =
  | 'default'
  | 'secondary'
  | 'destructive'
  | 'outline'
  | 'success'
  | 'warning';

interface EstadisticasKpiCardProps {
  titulo: string;
  valor: number | string;
  icono: ReactNode;
  descripcion?: string;
  badge?: { texto: string; variante: TipoVarianteBadge };
  cargando?: boolean;
}

const obtenerClasesBadge = (variante: TipoVarianteBadge): string => {
  if (variante === 'success') {
    return 'bg-green-100 text-green-700 hover:bg-green-100 border-0';
  }
  if (variante === 'warning') {
    return 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100 border-0';
  }
  return '';
};

export function EstadisticasKpiCard({
  titulo,
  valor,
  icono,
  descripcion,
  badge,
  cargando = false,
}: EstadisticasKpiCardProps) {
  if (cargando) {
    return (
      <Card className="rounded-2xl border-border/50 shadow-sm">
        <div className="h-1 w-full bg-gradient-to-r from-orange-400/50 to-rose-400/50" />
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-16 mb-2" />
          <Skeleton className="h-3 w-24" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl border-border/50 shadow-sm">
      <div className="h-1 w-full bg-gradient-to-r from-orange-400 to-rose-400 rounded-t-2xl" />
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          {icono}
          {titulo}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{valor}</div>
        {descripcion && (
          <p className="text-xs text-muted-foreground mt-1">{descripcion}</p>
        )}
        {badge && (
          <Badge
            variant={
              badge.variante === 'success' || badge.variante === 'warning'
                ? 'outline'
                : badge.variante
            }
            className={`mt-2 ${obtenerClasesBadge(badge.variante)}`}
          >
            {badge.texto}
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}
