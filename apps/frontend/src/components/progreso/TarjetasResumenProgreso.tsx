import {
  TrendingUp,
  TrendingDown,
  Minus,
  Scale,
  Activity,
  Ruler,
  Target,
} from 'lucide-react';
import type { ResumenProgreso, Tendencia, CategoriaIMC, RiesgoCardiovascular } from './types';

interface TarjetasResumenProgresoProps {
  resumen: ResumenProgreso | undefined;
  isLoading: boolean;
}

function IconoTendencia({ tendencia }: { tendencia: Tendencia | null }) {
  if (!tendencia) return null;

  if (tendencia === 'bajando') {
    return <TrendingDown className="h-4 w-4 text-green-500" />;
  }
  if (tendencia === 'subiendo') {
    return <TrendingUp className="h-4 w-4 text-red-500" />;
  }
  return <Minus className="h-4 w-4 text-gray-500" />;
}

function categoriaIMCToTexto(categoria: CategoriaIMC | null): string {
  if (!categoria) return '-';
  switch (categoria) {
    case 'bajo_peso':
      return 'Bajo peso';
    case 'normal':
      return 'Normal';
    case 'sobrepeso':
      return 'Sobrepeso';
    case 'obesidad':
      return 'Obesidad';
    default:
      return '-';
  }
}

function categoriaIMCColor(categoria: CategoriaIMC | null): string {
  if (!categoria) return 'text-gray-500';
  switch (categoria) {
    case 'bajo_peso':
      return 'text-yellow-600';
    case 'normal':
      return 'text-green-600';
    case 'sobrepeso':
      return 'text-orange-500';
    case 'obesidad':
      return 'text-red-600';
    default:
      return 'text-gray-500';
  }
}

function riesgoCardiovascularTexto(riesgo: RiesgoCardiovascular | null): string {
  if (!riesgo) return '-';
  switch (riesgo) {
    case 'bajo':
      return 'Bajo';
    case 'moderado':
      return 'Moderado';
    case 'alto':
      return 'Alto';
    default:
      return '-';
  }
}

function riesgoCardiovascularColor(riesgo: RiesgoCardiovascular | null): string {
  if (!riesgo) return 'bg-gray-100 text-gray-600';
  switch (riesgo) {
    case 'bajo':
      return 'bg-green-100 text-green-700';
    case 'moderado':
      return 'bg-yellow-100 text-yellow-700';
    case 'alto':
      return 'bg-red-100 text-red-700';
    default:
      return 'bg-gray-100 text-gray-600';
  }
}

export function TarjetasResumenProgreso({ resumen, isLoading }: TarjetasResumenProgresoProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="animate-pulse rounded-lg border bg-white p-4">
            <div className="h-4 w-20 rounded bg-gray-200" />
            <div className="mt-2 h-8 w-24 rounded bg-gray-200" />
            <div className="mt-2 h-3 w-16 rounded bg-gray-200" />
          </div>
        ))}
      </div>
    );
  }

  if (!resumen) {
    return (
      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-center">
        <p className="text-yellow-700">No hay datos de progreso disponibles</p>
      </div>
    );
  }

  const tarjetas = [
    {
      titulo: 'Peso',
      icono: Scale,
      valor: resumen.peso.actual ? `${resumen.peso.actual} kg` : '-',
      diferencia: resumen.peso.diferencia
        ? `${resumen.peso.diferencia > 0 ? '+' : ''}${resumen.peso.diferencia} kg`
        : null,
      tendencia: resumen.peso.tendencia,
      subtexto: resumen.rangoSaludable.pesoMinimo
        ? `Rango saludable: ${resumen.rangoSaludable.pesoMinimo}-${resumen.rangoSaludable.pesoMaximo} kg`
        : null,
    },
    {
      titulo: 'IMC',
      icono: Activity,
      valor: resumen.imc.actual ? resumen.imc.actual.toFixed(1) : '-',
      diferencia: resumen.imc.diferencia
        ? `${resumen.imc.diferencia > 0 ? '+' : ''}${resumen.imc.diferencia.toFixed(1)}`
        : null,
      categoria: resumen.imc.categoriaActual,
      subtexto: categoriaIMCToTexto(resumen.imc.categoriaActual),
      subtextoColor: categoriaIMCColor(resumen.imc.categoriaActual),
    },
    {
      titulo: 'Cintura',
      icono: Ruler,
      valor: resumen.perimetros.cintura.actual
        ? `${resumen.perimetros.cintura.actual} cm`
        : '-',
      diferencia: resumen.perimetros.cintura.diferencia
        ? `${resumen.perimetros.cintura.diferencia > 0 ? '+' : ''}${resumen.perimetros.cintura.diferencia} cm`
        : null,
      tendencia: resumen.perimetros.cintura.tendencia,
    },
    {
      titulo: 'Riesgo Cardiovascular',
      icono: Target,
      valor: resumen.relacionCinturaCadera.actual
        ? resumen.relacionCinturaCadera.actual.toFixed(2)
        : '-',
      subtexto: `Riesgo: ${riesgoCardiovascularTexto(resumen.relacionCinturaCadera.riesgoCardiovascular)}`,
      badgeColor: riesgoCardiovascularColor(resumen.relacionCinturaCadera.riesgoCardiovascular),
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {tarjetas.map((tarjeta) => {
        const IconoComponente = tarjeta.icono;
        return (
          <div
            key={tarjeta.titulo}
            className="rounded-lg border bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <IconoComponente className="h-4 w-4" />
              <span>{tarjeta.titulo}</span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-semibold text-gray-900">
                {tarjeta.valor}
              </span>
              {tarjeta.diferencia && (
                <span
                  className={`text-sm font-medium ${
                    tarjeta.tendencia === 'bajando'
                      ? 'text-green-600'
                      : tarjeta.tendencia === 'subiendo'
                        ? 'text-red-600'
                        : 'text-gray-500'
                  }`}
                >
                  {tarjeta.diferencia}
                </span>
              )}
              <IconoTendencia tendencia={tarjeta.tendencia || null} />
            </div>
            {tarjeta.subtexto && (
              <p
                className={`mt-1 text-xs ${
                  tarjeta.subtextoColor || 'text-gray-500'
                }`}
              >
                {tarjeta.subtexto}
              </p>
            )}
            {tarjeta.badgeColor && (
              <span
                className={`mt-2 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${tarjeta.badgeColor}`}
              >
                {tarjeta.subtexto}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
