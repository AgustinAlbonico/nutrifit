import {
  CalendarClock,
  FileHeart,
  Salad,
  LineChart,
  Bell,
  Building,
  type LucideIcon,
} from 'lucide-react';

type Funcionalidad = {
  icono: LucideIcon;
  titulo: string;
  descripcion: string;
  destacado?: boolean;
};

const FUNCIONALIDADES: Funcionalidad[] = [
  {
    icono: CalendarClock,
    titulo: 'Turnos online',
    descripcion:
      'Agenda inteligente con bloques por profesional. El socio reserva desde su cuenta, recibe confirmación y recordatorios. Bloqueo automático si la ficha de salud está incompleta.',
    destacado: true,
  },
  {
    icono: FileHeart,
    titulo: 'Fichas clínicas',
    descripcion:
      'Historia clínica versionada con consentimiento RGPD. Altura, peso, IMC automático, nivel de actividad, objetivo personal. Auditable antes/después.',
  },
  {
    icono: Salad,
    titulo: 'Planes alimentarios',
    descripcion:
      'Editor visual de planes manuales o generación con IA. Distribución por comidas, frecuencias, cantidades. El socio los consulta desde su panel.',
  },
  {
    icono: LineChart,
    titulo: 'Seguimiento de progreso',
    descripcion:
      'Evolución de peso, IMC y medidas en el tiempo. Gráficos comparativos, hitos y adherence por socio.',
  },
  {
    icono: Bell,
    titulo: 'Notificaciones',
    descripcion:
      'Recordatorios de turno, alertas de plan vencido, novedades de la nutricionista. Multi-canal configurable.',
  },
  {
    icono: Building,
    titulo: 'Multi-sede',
    descripcion:
      'Cada sede opera independiente pero reporting consolidado. Socios pueden atenderse en cualquiera con su historial completo.',
  },
];

export function FuncionalidadesSeccion() {
  return (
    <section
      id="funcionalidades"
      className="landing-section landing-mesh-cream landing-dot-cream relative py-24 lg:py-32"
    >
      <div className="relative mx-auto max-w-7xl px-6 lg:px-10">
        <div className="flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-end">
          <div className="max-w-2xl">
            <span className="font-display text-sm font-semibold uppercase tracking-[0.2em] text-landing-lima-deep">
              Funcionalidades
            </span>
            <h2 className="mt-4 font-display text-4xl font-bold leading-tight tracking-tight text-landing-ink sm:text-5xl lg:text-[3.5rem]">
              El stack operativo
              <br />
              <span className="text-landing-lima-deep">de un gimnasio que vende salud.</span>
            </h2>
          </div>
          <p className="max-w-sm text-base leading-relaxed text-landing-ink/60">
            Todo lo que tu equipo necesita para operar servicios de nutrición a escala.
            Sin planillas, sin WhatsApp sueltos, sin excel.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {FUNCIONALIDADES.map((func) => (
            <article
              key={func.titulo}
              className={[
                'landing-card-hover group relative flex flex-col overflow-hidden rounded-2xl border p-7',
                func.destacado
                  ? 'border-landing-lima/40 bg-landing-ink text-landing-cream md:col-span-2 lg:col-span-1'
                  : 'border-landing-line bg-landing-cream hover:border-landing-lima-deep/30',
              ].join(' ')}
            >
              {func.destacado && (
                <div className="absolute right-5 top-5 rounded-full bg-landing-lima-soft px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-landing-lima">
                  Core
                </div>
              )}
              <span
                className={[
                  'flex h-12 w-12 items-center justify-center rounded-xl transition-colors',
                  func.destacado
                    ? 'bg-landing-lima text-landing-ink'
                    : 'bg-landing-lima-soft text-landing-lima-deep group-hover:bg-landing-lima group-hover:text-landing-ink',
                ].join(' ')}
              >
                <func.icono className="h-6 w-6" strokeWidth={1.75} />
              </span>
              <h3
                className={[
                  'mt-5 font-display text-xl font-semibold',
                  func.destacado ? 'text-landing-cream' : 'text-landing-ink',
                ].join(' ')}
              >
                {func.titulo}
              </h3>
              <p
                className={[
                  'mt-2 text-sm leading-relaxed',
                  func.destacado ? 'text-landing-cream/65' : 'text-landing-ink/60',
                ].join(' ')}
              >
                {func.descripcion}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
