import { useState, useDeferredValue, useMemo } from 'react';
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

  // Diferimos el objetivo nutricional para evitar que el PDF se regenere en cada keystroke
  const objetivoDiferido = useDeferredValue(objetivoNutricional);

  const documento = useMemo(
    () => (
      <DocumentoPlan
        objetivoNutricional={objetivoDiferido}
        comidas={comidas}
        nombreSocio={nombreSocio}
      />
    ),
    [objetivoDiferido, comidas, nombreSocio],
  );

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
      document={documento}
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
