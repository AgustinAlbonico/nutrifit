import { Fragment, useState } from 'react';
import { ControlesPaginacion } from '@/components/ui/ControlesPaginacion';

export interface FilaTablaEvolucionPaciente {
  id: number;
  fecha: string;
  peso: string;
  imc: string;
  cintura: string;
  pecho: string;
  deltaPeso: string;
  detalle: string;
}

interface PropiedadesTablaEvolucionPaciente {
  filas: FilaTablaEvolucionPaciente[];
}

export function TablaEvolucionPaciente({ filas }: PropiedadesTablaEvolucionPaciente) {
  const [filaExpandida, setFilaExpandida] = useState<number | null>(null);
  const [paginaActual, setPaginaActual] = useState(1);
  const [limitePorPagina, setLimitePorPagina] = useState(10);

  const totalPaginas = Math.max(1, Math.ceil(filas.length / limitePorPagina));
  const inicio = (paginaActual - 1) * limitePorPagina;
  const filasPaginadas = filas.slice(inicio, inicio + limitePorPagina);

  if (filas.length === 0) {
    return (
      <section className="rounded-[1.75rem] border bg-white p-5 shadow-sm">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">Tabla clinica</p>
        <div className="mt-4 flex h-48 items-center justify-center rounded-[1.5rem] border border-dashed bg-slate-50 text-sm text-slate-500">
          No hay mediciones para construir la evolucion tabular.
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-[1.75rem] border bg-white p-5 shadow-sm">
      <div className="mb-5 space-y-2">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">Tabla clinica</p>
        <h2 className="text-2xl font-bold tracking-tight text-slate-950">Evolucion por sesion</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500">
              <th className="py-3 pr-4 font-medium">Fecha</th>
              <th className="py-3 pr-4 font-medium">Peso</th>
              <th className="py-3 pr-4 font-medium">IMC</th>
              <th className="py-3 pr-4 font-medium">Cintura</th>
              <th className="py-3 pr-4 font-medium">Pecho</th>
              <th className="py-3 pr-4 font-medium">Delta peso</th>
              <th className="py-3 font-medium">Accion</th>
            </tr>
          </thead>
          <tbody>
            {filasPaginadas.map((fila) => (
              <Fragment key={fila.id}>
                <tr className="border-b border-slate-100 align-top">
                  <td className="py-4 pr-4 font-medium text-slate-900">{fila.fecha}</td>
                  <td className="py-4 pr-4 text-slate-700">{fila.peso}</td>
                  <td className="py-4 pr-4 text-slate-700">{fila.imc}</td>
                  <td className="py-4 pr-4 text-slate-700">{fila.cintura}</td>
                  <td className="py-4 pr-4 text-slate-700">{fila.pecho}</td>
                  <td className="py-4 pr-4 text-slate-700">{fila.deltaPeso}</td>
                  <td className="py-4">
                    <button
                      type="button"
                      className="rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
                      onClick={() =>
                        setFilaExpandida((previa) => (previa === fila.id ? null : fila.id))
                      }
                    >
                      Ver detalle
                    </button>
                  </td>
                </tr>
                {filaExpandida === fila.id && (
                  <tr className="border-b border-slate-100 bg-slate-50/80">
                    <td colSpan={7} className="px-4 py-4 text-sm text-slate-600">
                      {fila.detalle}
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
      {filas.length > limitePorPagina && (
        <div className="mt-4">
          <ControlesPaginacion
            pagina={paginaActual}
            totalPaginas={totalPaginas}
            total={filas.length}
            limite={limitePorPagina}
            onCambiarPagina={setPaginaActual}
            onCambiarLimite={(l) => {
              setLimitePorPagina(l);
              setPaginaActual(1);
            }}
          />
        </div>
      )}
    </section>
  );
}
