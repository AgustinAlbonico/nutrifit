import { useState } from 'react';

import type { MedicionHistorial } from './types';

interface PropiedadesComparadorMediciones {
  mediciones: MedicionHistorial[];
}

interface MetricaComparada {
  etiqueta: string;
  unidad: string;
  inicial: number | null;
  actual: number | null;
}

function formatearNumero(valor: number): string {
  return Number.isInteger(valor) ? String(valor) : valor.toFixed(1);
}

function formatearValor(valor: number | null, unidad: string): string {
  return valor === null ? '-' : `${formatearNumero(valor)} ${unidad}`;
}

function formatearDelta(inicial: number | null, actual: number | null, unidad: string): string {
  if (inicial === null || actual === null) {
    return '-';
  }

  const diferencia = Number((actual - inicial).toFixed(1));
  return `${diferencia > 0 ? '+' : ''}${formatearNumero(diferencia)} ${unidad}`;
}

function fechaMedicion(medicion: MedicionHistorial): string {
  return new Date(medicion.fecha).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function ComparadorMediciones({ mediciones }: PropiedadesComparadorMediciones) {
  const medicionesOrdenadas = [...mediciones].sort(
    (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime(),
  );

  const [idInicialSeleccionado, setIdInicialSeleccionado] = useState<string>(
    medicionesOrdenadas.length > 0 ? String(medicionesOrdenadas[0].idMedicion) : '',
  );
  const [idActualSeleccionado, setIdActualSeleccionado] = useState<string>(
    medicionesOrdenadas.length > 0
      ? String(medicionesOrdenadas[medicionesOrdenadas.length - 1].idMedicion)
      : '',
  );

  if (medicionesOrdenadas.length < 2) {
    return (
      <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
        <h2 className="text-lg font-semibold text-slate-950">Comparador de mediciones</h2>
        <p className="mt-2 text-sm text-slate-500">
          Necesitas al menos dos mediciones para comparar la evolucion.
        </p>
      </section>
    );
  }

  const medicionInicial =
    medicionesOrdenadas.find((m) => String(m.idMedicion) === idInicialSeleccionado) ??
    medicionesOrdenadas[0];
  const medicionActual =
    medicionesOrdenadas.find((m) => String(m.idMedicion) === idActualSeleccionado) ??
    medicionesOrdenadas[medicionesOrdenadas.length - 1];

  const metricas: MetricaComparada[] = [
    { etiqueta: 'Peso', unidad: 'kg', inicial: medicionInicial.peso, actual: medicionActual.peso },
    { etiqueta: 'IMC', unidad: '', inicial: medicionInicial.imc, actual: medicionActual.imc },
    {
      etiqueta: 'Cintura',
      unidad: 'cm',
      inicial: medicionInicial.perimetroCintura,
      actual: medicionActual.perimetroCintura,
    },
    {
      etiqueta: 'Cadera',
      unidad: 'cm',
      inicial: medicionInicial.perimetroCadera,
      actual: medicionActual.perimetroCadera,
    },
    {
      etiqueta: 'Grasa corporal',
      unidad: '%',
      inicial: medicionInicial.porcentajeGrasa,
      actual: medicionActual.porcentajeGrasa,
    },
    {
      etiqueta: 'Masa magra',
      unidad: 'kg',
      inicial: medicionInicial.masaMagra,
      actual: medicionActual.masaMagra,
    },
  ];

  return (
    <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div>
        <h2 className="text-xl font-semibold text-slate-950">Comparador de mediciones</h2>
        <p className="mt-1 text-sm text-slate-500">
          Medicion inicial {fechaMedicion(medicionInicial)} vs medicion actual {fechaMedicion(medicionActual)}.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="rounded-xl bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Medicion inicial</p>
          <select
            className="mt-2 w-full rounded-md border border-slate-200 bg-white p-2 text-sm text-slate-950 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
            value={idInicialSeleccionado}
            onChange={(evento) => setIdInicialSeleccionado(evento.target.value)}
          >
            {medicionesOrdenadas.map((medicion) => (
              <option key={medicion.idMedicion} value={String(medicion.idMedicion)}>
                {fechaMedicion(medicion)}
              </option>
            ))}
          </select>
        </label>
        <label className="rounded-xl bg-orange-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-orange-700">Medicion actual</p>
          <select
            className="mt-2 w-full rounded-md border border-orange-200 bg-white p-2 text-sm text-slate-950 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
            value={idActualSeleccionado}
            onChange={(evento) => setIdActualSeleccionado(evento.target.value)}
          >
            {medicionesOrdenadas.map((medicion) => (
              <option key={medicion.idMedicion} value={String(medicion.idMedicion)}>
                {fechaMedicion(medicion)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b text-left text-slate-500">
              <th className="py-3 pr-4 font-semibold">Metrica</th>
              <th className="py-3 pr-4 font-semibold">Inicial</th>
              <th className="py-3 pr-4 font-semibold">Actual</th>
              <th className="py-3 pr-4 font-semibold">Cambio</th>
            </tr>
          </thead>
          <tbody>
            {metricas.map((metrica) => (
              <tr key={metrica.etiqueta} className="border-b last:border-b-0">
                <td className="py-3 pr-4 font-medium text-slate-800">{metrica.etiqueta}</td>
                <td className="py-3 pr-4 text-slate-600">{formatearValor(metrica.inicial, metrica.unidad)}</td>
                <td className="py-3 pr-4 text-slate-600">{formatearValor(metrica.actual, metrica.unidad)}</td>
                <td className="py-3 pr-4 font-semibold text-slate-950">
                  {formatearDelta(metrica.inicial, metrica.actual, metrica.unidad)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
