import { Download, Loader2 } from 'lucide-react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { Button } from '@/components/ui/button';
import { DocumentoProgreso } from '@/lib/pdf/progreso-pdf';
import type {
  ResumenProgreso,
  MedicionHistorial,
  Objetivo,
  FotoProgreso,
  GaleriaFotos,
} from './types';

interface PropsBotonExportarPDF {
  resumen: ResumenProgreso | null | undefined;
  mediciones: MedicionHistorial[];
  objetivos: Objetivo[];
  galeria: GaleriaFotos | undefined;
  nombreSocio: string;
  socioId: number;
}

export function ExportProgresoPDFButton({
  resumen,
  mediciones,
  objetivos,
  galeria,
  nombreSocio,
  socioId,
}: PropsBotonExportarPDF) {
  const fechaActual = new Date().toISOString().split('T')[0];
  const nombreArchivo = `progreso-${socioId}-${fechaActual}.pdf`;

  // Aplanar todas las fotos del galeria
  const todasLasFotos: FotoProgreso[] = galeria?.fotos?.flatMap((grupo) => grupo.fotos) ?? [];

  // Verificar si hay datos para exportar
  const hayDatos = mediciones.length > 0 || objetivos.length > 0;

  if (!hayDatos) {
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
        <DocumentoProgreso
          resumen={resumen}
          mediciones={mediciones}
          objetivos={objetivos}
          fotos={todasLasFotos}
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
