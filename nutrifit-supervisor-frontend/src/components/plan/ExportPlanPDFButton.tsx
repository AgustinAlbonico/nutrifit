import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { Button } from '@/components/ui/button';
import { DocumentoPlan } from '@/lib/pdf/plan-pdf';
import type { ComidaEnPlan } from './WeeklyPlanGrid';

interface PropsBotonExportarPDF {
  objetivoNutricional: string;
  comidas: ComidaEnPlan[];
  nombreSocio?: string;
  planId?: number;
}

export function ExportPlanPDFButton({
  objetivoNutricional,
  comidas,
  nombreSocio,
  planId,
}: PropsBotonExportarPDF) {
  const [timestamp] = useState(() => Date.now());
  const nombreArchivo = planId
    ? `plan-alimentacion-${planId}.pdf`
    : `plan-alimentacion-${timestamp}.pdf`;

  if (comidas.length === 0) {
    return (
      <Button variant="outline" disabled>
        <Download className="mr-2 h-4 w-4" />
        Sin datos para exportar
      </Button>
    );
  }

  return (
    <PDFDownloadLink
      document={
        <DocumentoPlan
          objetivoNutricional={objetivoNutricional}
          comidas={comidas}
          nombreSocio={nombreSocio}
        />
      }
      fileName={nombreArchivo}
    >
      {({ loading }) => (
        <Button variant="outline" disabled={loading}>
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          {loading ? 'Generando PDF...' : 'Exportar PDF'}
        </Button>
      )}
    </PDFDownloadLink>
  );
}
