/**
 * Empty state amigable para mostrar cuando el socio aún no tiene planes
 * activos. Acompaña al usuario mientras su nutricionista prepara el plan.
 *
 * - Mensaje principal: "Tu nutricionista está preparando tu plan"
 * - Mensaje secundario: "Te avisaremos cuando esté listo"
 * - Si `diasDesdeAsignacion > 7`, agrega sugerencia de contacto con el NUT
 *
 * Accesibilidad:
 * - region role="status" para que lectores de pantalla anuncien el contexto
 * - Icono decorativo con aria-hidden
 * - Contraste de texto cumple WCAG AA
 */

import { ChefHat, Clock, MessageCircle } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface PropiedadesEmptyStatePlanEnPreparacion {
  /**
   * Días transcurridos desde que se le asignó un nutricionista al socio.
   * Si supera 7, se muestra sugerencia de contacto.
   */
  diasDesdeAsignacion?: number;
  /** Nombre del nutricionista (opcional, mejora la calidez del copy). */
  nombreNutricionista?: string;
  /** Clases extra para composición con el contenedor padre. */
  className?: string;
}

const UMBRAL_DIAS_SUGERENCIA_CONTACTO = 7;

export function EmptyStatePlanEnPreparacion({
  diasDesdeAsignacion,
  nombreNutricionista,
  className,
}: PropiedadesEmptyStatePlanEnPreparacion) {
  const mostrarSugerenciaContacto =
    typeof diasDesdeAsignacion === 'number' &&
    diasDesdeAsignacion > UMBRAL_DIAS_SUGERENCIA_CONTACTO;

  return (
    <Card
      role="status"
      aria-live="polite"
      data-testid="empty-state-plan-en-preparacion"
      className={cn(
        'border-dashed border-orange-300/60 bg-gradient-to-br from-orange-50/60 via-amber-50/40 to-transparent dark:from-orange-950/20 dark:via-amber-950/10 dark:to-transparent',
        className,
      )}
    >
      <CardContent className="flex flex-col items-center gap-5 py-12 text-center">
        {/* Ícono principal: chef hat como metáfora del NUT cocinando el plan */}
        <div
          aria-hidden="true"
          className="relative flex size-20 items-center justify-center rounded-full bg-gradient-to-br from-orange-100 to-amber-100 shadow-inner dark:from-orange-900/40 dark:to-amber-900/30"
        >
          <ChefHat
            className="size-10 text-orange-600 dark:text-orange-400"
            strokeWidth={1.6}
          />
          <span
            aria-hidden="true"
            className="absolute -bottom-1 -right-1 flex size-7 items-center justify-center rounded-full bg-amber-200 text-amber-800 shadow-sm dark:bg-amber-800 dark:text-amber-200"
          >
            <Clock className="size-3.5" />
          </span>
        </div>

        {/* Mensaje principal */}
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-foreground sm:text-2xl">
            Tu nutricionista está preparando tu plan
          </h2>
          <p className="mx-auto max-w-md text-sm text-muted-foreground sm:text-base">
            {nombreNutricionista
              ? `${nombreNutricionista} está diseñando un plan personalizado para vos.`
              : 'Tu nutricionista está diseñando un plan personalizado para vos.'}{' '}
            Te avisaremos cuando esté listo.
          </p>
        </div>

        {/* Sugerencia de contacto si pasaron >7 días */}
        {mostrarSugerenciaContacto && (
          <div
            data-testid="sugerencia-contacto-nutricionista"
            className="mt-2 flex items-start gap-3 rounded-lg border border-amber-300/60 bg-amber-50/80 px-4 py-3 text-left text-sm text-amber-900 dark:border-amber-700/50 dark:bg-amber-950/30 dark:text-amber-200"
          >
            <MessageCircle
              className="mt-0.5 size-4 shrink-0"
              aria-hidden="true"
            />
            <p>
              <strong>¿Ya pasaron más de {UMBRAL_DIAS_SUGERENCIA_CONTACTO} días?</strong>{' '}
              Hablale a tu nutricionista para conocer el estado de tu plan.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}