import { AlertTriangle, Info } from 'lucide-react';

import type { AlertaClinicaProgreso, SeveridadAlertaClinica } from './types';

interface PropiedadesAlertasClinicasProgreso {
  alertas: AlertaClinicaProgreso[];
}

const ORDEN_SEVERIDAD: Record<SeveridadAlertaClinica, number> = {
  critica: 0,
  importante: 1,
  informativa: 2,
};

const ESTILO_SEVERIDAD: Record<SeveridadAlertaClinica, string> = {
  critica: 'border-red-200 bg-red-50 text-red-800',
  importante: 'border-amber-200 bg-amber-50 text-amber-800',
  informativa: 'border-blue-200 bg-blue-50 text-blue-800',
};

const ETIQUETA_SEVERIDAD: Record<SeveridadAlertaClinica, string> = {
  critica: 'Critica',
  importante: 'Importante',
  informativa: 'Informativa',
};

export function AlertasClinicasProgreso({ alertas }: PropiedadesAlertasClinicasProgreso) {
  if (alertas.length === 0) {
    return null;
  }

  const alertasOrdenadas = [...alertas].sort(
    (a, b) => ORDEN_SEVERIDAD[a.severidad] - ORDEN_SEVERIDAD[b.severidad],
  );

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-3">
        <div className="rounded-full bg-orange-100 p-2 text-orange-700">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-950">Alertas clinicas</h2>
          <p className="text-sm text-slate-500">Senales para revisar durante el seguimiento.</p>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {alertasOrdenadas.map((alerta) => (
          <article
            key={`${alerta.metrica}-${alerta.titulo}`}
            className={`rounded-xl border p-4 ${ESTILO_SEVERIDAD[alerta.severidad]}`}
          >
            <div className="mb-2 flex items-center justify-between gap-3">
              <h3 className="font-semibold">{alerta.titulo}</h3>
              <span className="rounded-full bg-white/70 px-2 py-1 text-xs font-semibold uppercase tracking-wide">
                {ETIQUETA_SEVERIDAD[alerta.severidad]}
              </span>
            </div>
            <p className="text-sm leading-6">{alerta.mensaje}</p>
            <p className="mt-3 flex items-center gap-2 text-xs font-medium opacity-80">
              <Info className="h-3.5 w-3.5" />
              Valor: {alerta.valor}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
