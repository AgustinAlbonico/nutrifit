/**
 * Card read-only que muestra el plan activo de un socio asociado a un
 * nutricionista concreto. Se usa en `MiPlanPage` cuando el socio tiene uno
 * o más planes activos (RF-010: N cards si tiene N nutricionistas).
 *
 * Composición:
 * - Header: nombre del NUT + fecha de inicio + badge + botón PDF
 * - Body: GrillaManualSlots read-only (misma grilla que ve el nutricionista)
 * - Body: RazonamientoCumplimiento read-only
 * - Footer: texto informativo
 */

import { Calendar, FileDown, Sparkles } from 'lucide-react';
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
import { GrillaManualSlots } from '@/components/plan/GrillaManualSlots';
import { DocumentoPlan } from '@/lib/pdf/plan-pdf';
import { cn } from '@/lib/utils';
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

      const items = primeraAlternativa.alimentos;
      const sumaCantidades = items.reduce((sum, item) => sum + item.cantidad, 0);

      const alimentos: AlimentoEnComida[] = items.map((item) => ({
        alimento: {
          idAlimento: item.alimentoId,
          nombre: item.nombre ?? 'Alimento',
          cantidad: item.cantidad,
          unidadMedida: item.unidad,
          // Los macros por alimento individual pueden venir undefined.
          // Distribuimos los totales de la alternativa proporcionalmente.
          calorias:
            item.calorias ??
            (sumaCantidades > 0
              ? (primeraAlternativa.calorias * item.cantidad) / sumaCantidades
              : 0),
          proteinas:
            item.proteinas ??
            (sumaCantidades > 0
              ? (primeraAlternativa.proteinas * item.cantidad) / sumaCantidades
              : 0),
          carbohidratos:
            item.carbohidratos ??
            (sumaCantidades > 0
              ? (primeraAlternativa.carbohidratos * item.cantidad) / sumaCantidades
              : 0),
          grasas:
            item.grasas ??
            (sumaCantidades > 0
              ? (primeraAlternativa.grasas * item.cantidad) / sumaCantidades
              : 0),
          grupoAlimenticio: null,
        },
        cantidad: item.cantidad,
      }));

      comidas.push({
        dia: dia.dia,
        tipoComida: comida.tipo,
        alimentos,
      });
    }
  }

  return comidas;
}

export function PlanSocioCard({
  plan,
  finalizadoAt,
  className,
}: PropiedadesPlanSocioCard) {
  const headerId = `plan-socio-card-header-${plan.idPlanAlimentacion}`;
  const fechaInicioFormateada = formatearFecha(plan.fechaInicio);

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

  return (
    <Card
      data-testid="plan-socio-card"
      data-plan-id={plan.idPlanAlimentacion}
      data-nutricionista-id={plan.nutricionistaId}
      aria-labelledby={headerId}
      className={cn('overflow-hidden', className)}
    >
      <CardHeader className="flex-row items-start justify-between gap-3 space-y-0 border-b border-border/40">
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
        <div className="flex items-center gap-2 shrink-0">
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
                variant="outline"
                size="sm"
                disabled={loading}
                aria-label="Descargar plan en PDF"
                data-testid="boton-descargar-pdf"
              >
                <FileDown className="mr-1.5 size-4" aria-hidden="true" />
                {loading ? 'Generando...' : 'Descargar PDF'}
              </Button>
            )}
          </PDFDownloadLink>
          <EstadoPlanBadge estado={estado} />
        </div>
      </CardHeader>

      <CardContent className="space-y-5 pt-5">
        {/* Grilla semanal read-only — misma grilla que ve el nutricionista. */}
        <GrillaManualSlots
          estructura={plan.plan.estructura}
          soloLectura
          onChange={() => {}}
        />

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

      <CardFooter className="border-t border-border/40 px-6 py-4">
        <p className="text-xs text-muted-foreground">
          Plan {etiquetaEstado.toLowerCase()}. Si querés cambios, contactá a
          tu nutricionista.
        </p>
      </CardFooter>
    </Card>
  );
}
