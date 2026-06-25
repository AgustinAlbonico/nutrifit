/**
 * Card read-only que muestra el plan activo de un socio asociado a un
 * nutricionista concreto. Se usa en `MiPlanPage` cuando el socio tiene uno
 * o más planes activos (RF-010: N cards si tiene N nutricionistas).
 *
 * Composición:
 * - Header: nombre del NUT + fecha de inicio + badge "Activo"
 * - Body: WeeklyPlanGrid V2 read-only (sin botones de regenerar)
 * - Body: RazonamientoCumplimiento read-only (sin colapsable interactivo)
 * - Footer: botón "Descargar PDF" (placeholder: el botón real se mantiene
 *   mientras se actualiza el endpoint a V2; cuando esté disponible se
 *   reusa `<ExportPlanPDFButton>`)
 *
 * Accesibilidad:
 * - El card usa `<section aria-labelledby>` para vincular el header
 * - Botón "Descargar PDF" tiene aria-label descriptivo
 * - Contraste WCAG AA en todo el texto
 */

import { Calendar, Download, User } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RazonamientoCumplimiento } from '@/components/plan/RazonamientoCumplimiento';
import { WeeklyPlanGrid } from '@/components/plan/WeeklyPlanGrid';
import type { PlanSocioActivo } from '@/types/ia';

interface PropiedadesPlanSocioCard {
  /** Plan activo del socio (asociado a un nutricionista). */
  plan: PlanSocioActivo;
  /**
   * Callback cuando el socio hace click en "Descargar PDF". Mientras el
   * endpoint V2 no esté listo, este callback es opcional: si no se pasa,
   * el botón se renderiza deshabilitado.
   */
  alDescargarPdf?: (planId: number, versionId: number) => void;
  /** Clases extra para composición con el contenedor padre. */
  className?: string;
}

/**
 * Formatea una fecha ISO 8601 a formato argentino legible:
 * "15 de junio de 2026". Devuelve string vacío si el input es inválido.
 */
function formatearFecha(fechaIso: string): string {
  if (!fechaIso) return '';
  const fecha = new Date(fechaIso);
  if (Number.isNaN(fecha.getTime())) return '';
  return fecha.toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function PlanSocioCard({
  plan,
  alDescargarPdf,
  className,
}: PropiedadesPlanSocioCard) {
  const headerId = `plan-socio-card-header-${plan.idPlanAlimentacion}`;
  const fechaInicioFormateada = formatearFecha(plan.fechaInicio);

  const manejarClickDescargarPdf = () => {
    alDescargarPdf?.(plan.idPlanAlimentacion, plan.versionId);
  };

  return (
    <Card
      data-testid="plan-socio-card"
      data-plan-id={plan.idPlanAlimentacion}
      data-nutricionista-id={plan.nutricionistaId}
      aria-labelledby={headerId}
      className={className}
    >
      <CardHeader className="border-b border-border/40">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1.5">
            <CardTitle
              id={headerId}
              className="flex items-center gap-2 text-xl sm:text-2xl"
            >
              <User
                className="size-5 text-orange-600 dark:text-orange-400"
                aria-hidden="true"
              />
              Mi plan con {plan.nutricionistaNombre}
            </CardTitle>
            <CardDescription className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
              {fechaInicioFormateada && (
                <span className="inline-flex items-center gap-1.5">
                  <Calendar
                    className="size-3.5"
                    aria-hidden="true"
                  />
                  Plan activo desde {fechaInicioFormateada}
                </span>
              )}
            </CardDescription>
          </div>
          <Badge
            variant="secondary"
            className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
          >
            Activo
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-5 pt-5">
        {/* Grilla semanal read-only (sin botones de regen). */}
        <WeeklyPlanGrid planV2={plan.plan} />

        {/* Razonamiento de cumplimiento de restricciones (read-only). */}
        <section
          aria-label={`Razonamiento de cumplimiento del plan con ${plan.nutricionistaNombre}`}
          className="space-y-2"
        >
          <h3 className="text-sm font-semibold text-foreground">
            Cumplimiento de restricciones
          </h3>
          <RazonamientoCumplimiento
            razonamiento={plan.plan.razonamientoCumplimiento}
            readOnly
            defaultOpen={false}
          />
        </section>
      </CardContent>

      <CardFooter className="flex flex-wrap items-center justify-between gap-3 border-t border-border/40 bg-muted/20 pt-4">
        <p className="text-xs text-muted-foreground">
          Este plan es de solo lectura. Si querés cambios, contactá a tu
          nutricionista.
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={manejarClickDescargarPdf}
          disabled={!alDescargarPdf}
          aria-label={`Descargar PDF del plan con ${plan.nutricionistaNombre}`}
          data-testid="boton-descargar-pdf"
        >
          <Download className="mr-2 size-4" aria-hidden="true" />
          Descargar PDF
        </Button>
      </CardFooter>
    </Card>
  );
}