import { Download } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { MedicionHistorial } from './types';

interface PropiedadesExportProgresoCSVButton {
  mediciones: MedicionHistorial[];
  socioId: number;
}

const COLUMNAS_CSV = [
  'fecha',
  'peso',
  'altura',
  'imc',
  'cintura',
  'cadera',
  'brazo',
  'muslo',
  'pecho',
  'grasa_corporal',
  'masa_magra',
  'frecuencia_cardiaca',
  'tension_sistolica',
  'tension_diastolica',
  'notas',
];

function valorCsv(valor: string | number | null): string {
  if (valor === null) {
    return '';
  }

  const texto = String(valor).replaceAll('"', '""');
  return texto.includes(',') || texto.includes('\n') ? `"${texto}"` : texto;
}

function crearContenidoCsv(mediciones: MedicionHistorial[]): string {
  const filas = mediciones.map((medicion) => [
    medicion.fecha,
    medicion.peso,
    medicion.altura,
    medicion.imc,
    medicion.perimetroCintura,
    medicion.perimetroCadera,
    medicion.perimetroBrazo,
    medicion.perimetroMuslo,
    medicion.perimetroPecho,
    medicion.porcentajeGrasa,
    medicion.masaMagra,
    medicion.frecuenciaCardiaca,
    medicion.tensionSistolica,
    medicion.tensionDiastolica,
    medicion.notasMedicion,
  ]);

  return [COLUMNAS_CSV, ...filas]
    .map((fila) => fila.map(valorCsv).join(','))
    .join('\n');
}

export function ExportProgresoCSVButton({ mediciones, socioId }: PropiedadesExportProgresoCSVButton) {
  if (mediciones.length === 0) {
    return (
      <Button variant="outline" disabled>
        <Download className="mr-2 h-4 w-4" />
        Sin datos CSV
      </Button>
    );
  }

  const manejarExportar = () => {
    const fechaActual = new Date().toISOString().split('T')[0];
    const contenido = crearContenidoCsv(mediciones);
    const blob = new Blob([contenido], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement('a');

    enlace.href = url;
    enlace.download = `progreso-${socioId}-${fechaActual}.csv`;
    enlace.click();
    enlace.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <Button variant="outline" onClick={manejarExportar}>
      <Download className="mr-2 h-4 w-4" />
      Exportar CSV
    </Button>
  );
}
