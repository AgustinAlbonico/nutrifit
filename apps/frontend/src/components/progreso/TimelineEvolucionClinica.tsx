import { useState } from 'react';
import { ControlesPaginacion } from '@/components/ui/ControlesPaginacion';

export interface EventoTimelineEvolucion {
  id: string;
  fecha: string;
  titulo: string;
  descripcion: string;
}

interface PropiedadesTimelineEvolucionClinica {
  eventos: EventoTimelineEvolucion[];
}

export function TimelineEvolucionClinica({ eventos }: PropiedadesTimelineEvolucionClinica) {
  const [paginaActual, setPaginaActual] = useState(1);
  const [limitePorPagina, setLimitePorPagina] = useState(10);
  const [eventoSeleccionadoId, setEventoSeleccionadoId] = useState<string | null>(
    eventos[0]?.id ?? null,
  );

  const totalPaginas = Math.max(1, Math.ceil(eventos.length / limitePorPagina));
  const inicio = (paginaActual - 1) * limitePorPagina;
  const eventosPaginados = eventos.slice(inicio, inicio + limitePorPagina);

  if (eventos.length === 0) {
    return (
      <section className="rounded-[1.75rem] border bg-white p-5 shadow-sm">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">Timeline clinico</p>
        <div className="mt-4 flex h-48 items-center justify-center rounded-[1.5rem] border border-dashed bg-slate-50 text-sm text-slate-500">
          Todavia no hay eventos longitudinales para mostrar.
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-[1.75rem] border bg-white p-5 shadow-sm">
      <div className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">Timeline clinico</p>
        <h2 className="text-2xl font-bold tracking-tight text-slate-950">Historia del paciente</h2>
      </div>

      <div className="mt-6 space-y-4">
        {eventosPaginados.map((evento) => (
          <article
            key={evento.id}
            className="rounded-[1.5rem] border border-slate-200 bg-[linear-gradient(135deg,rgba(255,247,237,0.92),rgba(255,255,255,0.98))] p-4"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-orange-700">{evento.fecha}</p>
            <button
              type="button"
              className="mt-2 text-left text-lg font-bold tracking-tight text-slate-950 transition hover:text-orange-700"
              onClick={() => setEventoSeleccionadoId(evento.id)}
            >
              {evento.titulo}
            </button>
            {eventoSeleccionadoId === evento.id && (
              <p className="mt-2 text-sm text-slate-600">{evento.descripcion}</p>
            )}
          </article>
        ))}
      </div>
      {eventos.length > limitePorPagina && (
        <ControlesPaginacion
          pagina={paginaActual}
          totalPaginas={totalPaginas}
          total={eventos.length}
          limite={limitePorPagina}
          onCambiarPagina={setPaginaActual}
          onCambiarLimite={(l) => {
            setLimitePorPagina(l);
            setPaginaActual(1);
          }}
        />
      )}
    </section>
  );
}
