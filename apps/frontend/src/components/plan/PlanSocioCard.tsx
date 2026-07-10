/**
 * Card read-only que muestra el plan activo de un socio asociado a un
 * nutricionista concreto. Se usa en `MiPlanPage` cuando el socio tiene uno
 * o más planes activos (RF-010: N cards si tiene N nutricionistas).
 *
 * Composición:
 * - Header: nombre del NUT + fecha de inicio + EstadoPlanBadge
 * - Body: WeeklyPlanGrid V2 read-only (sin botones de regenerar)
 * - Body: RazonamientoCumplimiento read-only
 * - Footer: acciones secundarias útiles (marcar leído, contactar al NUT)
 *
 * Mejora v2 (ver `iteracion 1/errores/plan-alimentacion-validacion-playwright.md`):
 * - Reemplaza el botón "Descargar PDF" deshabilitado (que confundía al socio)
 *   por un footer con CTAs claros: marcar leído + contactar al NUT.
 * - Muestra el EstadoPlanBadge completo (BORRADOR/ACTIVO/FINALIZADO).
 * - Hint contextual sobre cuándo se inició el plan.
 *
 * Accesibilidad:
 * - El card usa `<section aria-labelledby>` para vincular el header
 * - Botones con aria-label descriptivo
 * - Contraste WCAG AA en todo el texto
 */

import { Calendar, CheckCheck, FileDown, Mail, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { RazonamientoCumplimiento } from '@/components/plan/RazonamientoCumplimiento';
import { EstadoPlanBadge } from '@/components/plan/EstadoPlanBadge';
import {
  derivarEstadoPlan,
  type EstadoPlanVisual,
} from '@/components/plan/estado-plan.types';
import { WeeklyPlanGrid } from '@/components/plan/WeeklyPlanGrid';
import { DocumentoPlan } from '@/lib/pdf/plan-pdf';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type {
  ComidaEnPlan,
  AlimentoEnComida,
} from '@/components/plan/WeeklyPlanGrid';
import type { PlanSocioActivo, EstructuraDiaFE } from '@/types/ia';

interface PropiedadesPlanSocioCard {
  /** Plan activo del socio (asociado a un nutricionista). */
  plan: PlanSocioActivo;
  /** Fecha de finalización del plan (opcional). Si existe, alimenta el badge. */
  finalizadoAt?: string | null;
  /** Clases extra para composición con el contenedor padre. */
  className?: string;
}

/**
 * Formatea una fecha ISO 8601 a formato argentino legible:
 * "15 de junio de 2026". Devuelve string vacío si el input es inválido.
 */
function formatearFecha(fechaIso: string | null | undefined): string {
  if (!fechaIso) return '';
  const fecha = new Date(fechaIso);
  if (Number.isNaN(fecha.getTime())) return '';
  return fecha.toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Mapea la estructura del plan IA (EstructuraDiaFE[]) al formato plano
 * ComidaEnPlan[] que espera el componente DocumentoPlan (PDF).
 *
 * Toma la PRIMER alternativa de cada comida (la seleccionada por defecto).
 */
function mapearPlanAComidas(estructura: EstructuraDiaFE[]): ComidaEnPlan[] {
  const comidas: ComidaEnPlan[] = [];

  for (const dia of estructura) {
    for (const comida of dia.comidas) {
      const primeraAlternativa = comida.alternativas[0];
      if (!primeraAlternativa) continue;

      const alimentos: AlimentoEnComida[] = primeraAlternativa.alimentos.map(
        (item) => ({
          alimento: {
            idAlimento: item.alimentoId,
            nombre: item.nombre ?? 'Alimento',
            cantidad: item.cantidad,
            unidadMedida: item.unidad,
            calorias: item.calorias ?? null,
            proteinas: item.proteinas ?? null,
            carbohidratos: item.carbohidratos ?? null,
            grasas: item.grasas ?? null,
            grupoAlimenticio: null,
          },
          cantidad: item.cantidad,
        }),
      );

      comidas.push({
        dia: dia.dia,
        tipoComida: comida.tipo,
        alimentos,
      });
    }
  }

  return comidas;
}

const MENSAJE_CONFIRMACION =
  'Plan marcado como leído. Te avisaremos cuando tu nutricionista lo actualice.';

export function PlanSocioCard({
  plan,
  finalizadoAt,
  className,
}: PropiedadesPlanSocioCard) {
  const headerId = `plan-socio-card-header-${plan.idPlanAlimentacion}`;
  const fechaInicioFormateada = formatearFecha(plan.fechaInicio);
  const [marcadoLeido, setMarcadoLeido] = useState(false);

  // Estado visual: Activo, Borrador o Finalizado. Default Activo.
  // Aceptamos `finalizadoAt` como prop opcional además del campo del plan
  // si en el futuro el backend lo incluye en `PlanSocioActivo`.
  const estado: EstadoPlanVisual = derivarEstadoPlan({
    activo: true,
    finalizadoAt: finalizadoAt ?? null,
  });
  const etiquetaEstado =
    estado === 'ACTIVO'
      ? 'Activo'
      : estado === 'BORRADOR'
        ? 'En revisión'
        : 'Finalizado';

  const manejarMarcarLeido = () => {
    setMarcadoLeido(true);
    toast.success(MENSAJE_CONFIRMACION, {
      description: `Última actualización: ${fechaInicioFormateada || 'hace unos días'}.`,
    });
  };

  return (
    <Card
      data-testid="plan-socio-card"
      data-plan-id={plan.idPlanAlimentacion}
      data-nutricionista-id={plan.nutricionistaId}
      aria-labelledby={headerId}
      className={cn('overflow-hidden', className)}
    >
      <CardHeader className="flex-row items-start justify-between gap-3 space-y-0 border-b border-border/40 bg-muted/10">
        <div className="min-w-0 flex-1 space-y-1.5">
          <CardTitle
            id={headerId}
            className="flex items-center gap-2 text-base sm:text-lg"
          >
            <Sparkles
              className="size-4 shrink-0 text-orange-500"
              aria-hidden="true"
            />
            <span className="truncate">Plan con {plan.nutricionistaNombre}</span>
          </CardTitle>
          {fechaInicioFormateada && (
            <CardDescription
              className="flex items-center gap-1.5 text-xs"
              data-testid="plan-fecha-inicio"
            >
              <Calendar className="size-3.5" aria-hidden="true" />
              {estado === 'ACTIVO'
                ? `Activo desde ${fechaInicioFormateada}`
                : estado === 'FINALIZADO'
                  ? `Finalizado el ${formatearFecha(finalizadoAt ?? null)}`
                  : `En revisión desde ${fechaInicioFormateada}`}
            </CardDescription>
          )}
        </div>
        <EstadoPlanBadge estado={estado} className="shrink-0 self-start" />
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

      <CardFooter className="flex flex-wrap items-center justify-between gap-3 border-t border-border/40 bg-muted/20 px-6 py-4">
        <p className="text-xs text-muted-foreground">
          Plan {etiquetaEstado.toLowerCase()}. Si querés cambios, contactá a
          tu nutricionista.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <PDFDownloadLink
            document={
              <DocumentoPlan
                objetivoNutricional={plan.objetivoNutricional ?? 'Sin objetivo definido'}
                comidas={mapearPlanAComidas(plan.plan.estructura)}
                nombreSocio=""
              />
            }
            fileName={`plan-alimentacion-${plan.nutricionistaNombre.replace(/\s+/g, '-')}.pdf`}
          >
            {({ loading }) => (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={loading}
                aria-label="Descargar plan en PDF"
                data-testid="boton-descargar-pdf"
                className="text-muted-foreground"
              >
                <FileDown className="mr-1.5 size-4" aria-hidden="true" />
                {loading ? 'Generando...' : 'Descargar PDF'}
              </Button>
            )}
          </PDFDownloadLink>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={manejarMarcarLeido}
            disabled={marcadoLeido}
            aria-label="Marcar plan como leído"
            data-testid="boton-marcar-leido"
            className="text-muted-foreground"
          >
            <CheckCheck className="mr-1.5 size-4" aria-hidden="true" />
            {marcadoLeido ? 'Leído' : 'Marcar leído'}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            asChild
          >
            <a
              href={`mailto:?subject=${encodeURIComponent(
                `Mi plan de alimentación con ${plan.nutricionistaNombre}`,
              )}`}
              data-testid="boton-contactar-nutricionista"
            >
              <Mail className="mr-1.5 size-4" aria-hidden="true" />
              Contactar al NUT
            </a>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
