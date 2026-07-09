import { TrendingDown, Users, Repeat } from 'lucide-react';

const STATS = [
  {
    icono: TrendingDown,
    valor: '32%',
    titulo: 'Churn anual típico',
    descripcion: 'en gimnasios sin servicios de salud integrados. La diferencia entre un socio que paga y uno que se queda.',
  },
  {
    icono: Users,
    valor: '4.2x',
    titulo: 'Costo de adquisición',
    descripcion: 'vs. retención. Conseguir un socio nuevo cuesta hasta 5 veces más que mantener uno actual.',
  },
  {
    icono: Repeat,
    valor: '+38%',
    titulo: 'Retención con nutrición',
    descripcion: 'Los socios con seguimiento profesional recurrente permanecen más tiempo y refieren más.',
  },
];

export function ProblemaSeccion() {
  return (
    <section
      id="problema"
      className="landing-section landing-mesh-cream landing-dot-cream relative py-24 lg:py-32"
    >
      <div className="relative mx-auto max-w-7xl px-6 lg:px-10">
        <div className="max-w-3xl">
          <span className="font-display text-sm font-semibold uppercase tracking-[0.2em] text-landing-lima-deep">
            El problema
          </span>
          <h2 className="mt-4 font-display text-4xl font-bold leading-tight tracking-tight text-landing-ink sm:text-5xl lg:text-[3.5rem]">
            Los gimnasios compiten por precio.
            <br />
            <span className="text-landing-lima-deep">La nutrición es retención.</span>
          </h2>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-landing-ink/70">
            Hoy la mayoría de los gimnasios ofrecen acceso a máquinas y clases grupales.
            Es un commodity. El diferencial real —el que retiene socios y genera ingresos
            recurrentes— es ofrecer bienestar integral: nutrición, seguimiento profesional,
            planes personalizados.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-landing-line bg-landing-line md:grid-cols-3">
          {STATS.map((stat) => (
            <div key={stat.titulo} className="bg-landing-cream p-8 lg:p-10">
              <stat.icono className="h-7 w-7 text-landing-lima-deep" strokeWidth={1.75} />
              <p className="mt-6 font-display text-5xl font-bold tracking-tight text-landing-ink lg:text-6xl">
                {stat.valor}
              </p>
              <h3 className="mt-3 font-display text-lg font-semibold text-landing-ink">
                {stat.titulo}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-landing-ink/60">
                {stat.descripcion}
              </p>
            </div>
          ))}
        </div>

        <p className="mt-10 max-w-2xl border-l-2 border-landing-lima pl-5 text-base italic leading-relaxed text-landing-ink/70">
          NutriFit Supervisor convierte ese diferencial en un proceso operativo: turnos,
          fichas clínicas, planes y seguimiento — todo en una plataforma B2B pensada
          para escalar por sede.
        </p>
      </div>
    </section>
  );
}
