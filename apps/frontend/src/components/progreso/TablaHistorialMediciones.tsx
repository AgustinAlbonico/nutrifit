import { useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Download } from 'lucide-react';
import type { HistorialMediciones } from './types';

interface TablaHistorialMedicionesProps {
  historial: HistorialMediciones | undefined;
  isLoading: boolean;
}

export function TablaHistorialMediciones({ historial, isLoading }: TablaHistorialMedicionesProps) {
  const datosOrdenados = useMemo(() => {
    if (!historial?.mediciones) return [];
    return [...historial.mediciones].sort(
      (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
    );
  }, [historial]);

  const exportarCSV = () => {
    if (!historial?.mediciones) return;

    const headers = [
      'Fecha',
      'Peso (kg)',
      'IMC',
      'Cintura (cm)',
      'Cadera (cm)',
      'Brazo (cm)',
      'Muslo (cm)',
      '% Grasa',
      'FC (lpm)',
      'TA Sistólica',
      'TA Diastólica',
      'Profesional',
    ];

    const filas = historial.mediciones.map((m) => [
      format(parseISO(m.fecha), 'dd/MM/yyyy'),
      m.peso.toString(),
      m.imc.toFixed(1),
      m.perimetroCintura?.toString() ?? '',
      m.perimetroCadera?.toString() ?? '',
      m.perimetroBrazo?.toString() ?? '',
      m.perimetroMuslo?.toString() ?? '',
      m.porcentajeGrasa?.toString() ?? '',
      m.frecuenciaCardiaca?.toString() ?? '',
      m.tensionSistolica?.toString() ?? '',
      m.tensionDiastolica?.toString() ?? '',
      m.profesional ? `${m.profesional.nombre} ${m.profesional.apellido}` : '',
    ]);

    const csv = [headers.join(','), ...filas.map((f) => f.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `progreso_${historial.nombreSocio}_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  if (isLoading) {
    return (
      <div className="rounded-lg border bg-white p-4">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 rounded bg-gray-200" />
          ))}
        </div>
      </div>
    );
  }

  if (!historial || datosOrdenados.length === 0) {
    return (
      <div className="rounded-lg border bg-white p-4">
        <p className="text-center text-gray-500">No hay mediciones registradas</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-white p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Historial de Mediciones ({datosOrdenados.length} registros)
        </h3>
        <button
          onClick={exportarCSV}
          className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <Download className="h-4 w-4" />
          Exportar CSV
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-gray-50">
            <tr>
              <th className="px-3 py-3 font-medium text-gray-600">Fecha</th>
              <th className="px-3 py-3 font-medium text-gray-600">Peso</th>
              <th className="px-3 py-3 font-medium text-gray-600">IMC</th>
              <th className="px-3 py-3 font-medium text-gray-600">Cintura</th>
              <th className="px-3 py-3 font-medium text-gray-600">Cadera</th>
              <th className="px-3 py-3 font-medium text-gray-600">% Grasa</th>
              <th className="px-3 py-3 font-medium text-gray-600">FC</th>
              <th className="px-3 py-3 font-medium text-gray-600">TA</th>
              <th className="px-3 py-3 font-medium text-gray-600">Profesional</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {datosOrdenados.map((m) => (
              <tr key={m.idMedicion} className="hover:bg-gray-50">
                <td className="px-3 py-3">
                  {format(parseISO(m.fecha), 'dd MMM yyyy', { locale: es })}
                </td>
                <td className="px-3 py-3 font-medium">{m.peso} kg</td>
                <td className="px-3 py-3">{m.imc.toFixed(1)}</td>
                <td className="px-3 py-3">{m.perimetroCintura ? `${m.perimetroCintura} cm` : '-'}</td>
                <td className="px-3 py-3">{m.perimetroCadera ? `${m.perimetroCadera} cm` : '-'}</td>
                <td className="px-3 py-3">{m.porcentajeGrasa ? `${m.porcentajeGrasa}%` : '-'}</td>
                <td className="px-3 py-3">{m.frecuenciaCardiaca ? `${m.frecuenciaCardiaca} lpm` : '-'}</td>
                <td className="px-3 py-3">
                  {m.tensionSistolica && m.tensionDiastolica
                    ? `${m.tensionSistolica}/${m.tensionDiastolica}`
                    : '-'}
                </td>
                <td className="px-3 py-3 text-gray-500">
                  {m.profesional
                    ? `${m.profesional.nombre} ${m.profesional.apellido}`
                    : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
