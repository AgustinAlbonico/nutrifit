import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { Tendencia } from './types';

interface IndicadorTendenciaProps {
  tendencia: Tendencia | null;
  size?: 'sm' | 'md' | 'lg';
}

export function IndicadorTendencia({ tendencia, size = 'md' }: IndicadorTendenciaProps) {
  if (!tendencia) return null;

  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-6 w-6',
  };

  if (tendencia === 'bajando') {
    return <TrendingDown className={`${sizeClasses[size]} text-green-500`} />;
  }
  if (tendencia === 'subiendo') {
    return <TrendingUp className={`${sizeClasses[size]} text-red-500`} />;
  }
  return <Minus className={`${sizeClasses[size]} text-gray-500`} />;
}

interface RangoSaludableBadgeProps {
  categoria: 'bajo_peso' | 'normal' | 'sobrepeso' | 'obesidad' | null;
  size?: 'sm' | 'md';
}

const CATEGORIAS_CONFIG = {
  bajo_peso: {
    label: 'Bajo peso',
    className: 'bg-yellow-100 text-yellow-800',
  },
  normal: {
    label: 'Normal',
    className: 'bg-green-100 text-green-800',
  },
  sobrepeso: {
    label: 'Sobrepeso',
    className: 'bg-orange-100 text-orange-800',
  },
  obesidad: {
    label: 'Obesidad',
    className: 'bg-red-100 text-red-800',
  },
};

export function RangoSaludableBadge({ categoria, size = 'md' }: RangoSaludableBadgeProps) {
  if (!categoria) return null;

  const config = CATEGORIAS_CONFIG[categoria];
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${config.className} ${sizeClasses}`}
    >
      {config.label}
    </span>
  );
}
