import { Brain, Dna, Activity, BarChart3, type LucideIcon } from 'lucide-react';

type Modulo = {
  icono: LucideIcon;
  nombre: string;
  descripcion: string;
  casos: string[];
};

const MODULOS: Modulo[] = [
  {
    icono: Brain,
    nombre: 'IA aplicada',
    descripcion:
      'Generación automática de planes alimentarios basados en objetivo, biometría y preferencias. Aprendizaje del feedback del profesional.',
    casos: ['Plan inicial en segundos', 'Sugerencias de ajuste', 'Aprobación humana siempre'],
  },
  {
    icono: Dna,
    nombre: 'Nutrición avanzada',
    descripcion:
      'Cálculo de macros, distribución por comida, manejo de alergias e intolerancias, planes deportivos específicos.',
    casos: ['Macros automáticos', 'Restricciones múltiples', 'Dietas deportivas'],
  },
  {
    icono: Activity,
    nombre: 'Salud deportiva',
    descripcion:
      'Integración con rutinas de entrenamiento, sincronización de carga, métricas de rendimiento y prevención de lesiones.',
    casos: ['Sincroniza con rutinas', 'Métricas de carga', 'Prevención'],
  },
  {
    icono: BarChart3,
    nombre: 'Analítica avanzada',
    descripcion:
      'Dashboards ejecutivos: adherencia promedio, churn predictivo, occupancy por profesional, LTV por socio.',
    casos: ['KPIs ejecutivos', 'Churn predictivo', 'LTV por socio'],
  },
];

export function ModulosPremiumSeccion() {
  return (
    <section
      id="modulos"
      className="landing-section landing-mesh-ink landing-dot-ink relative py-24 lg:py-32"
    >
      <div className="landing-ribbon landing-ribbon-animated" style={{ top: '20%' }} aria-hidden />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-10">
        <div className="max-w-3xl">
          <span className="font-display text-sm font-semibold uppercase tracking-[0.2em] text-landing-naranja">
            Módulos premium
          </span>
          <h2 className="mt-4 font-display text-4xl font-bold leading-tight tracking-tight text-landing-cream sm:text-5xl lg:text-[3.5rem]">
            Cuando tu gimnasio
            <br />
            <span className="text-landing-naranja">quiera ir más lejos.</span>
          </h2>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-landing-cream/70">
            Capas opcionales que se activan sobre el plan base. Cada una se cotiza por
            escenario y se suman cuando el ROI lo justifica.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-landing-line-dark bg-landing-line-dark md:grid-cols-2">
          {MODULOS.map((modulo) => (
            <article key={modulo.nombre} className="bg-landing-ink-soft/40 p-8 lg:p-10">
              <div className="flex items-center gap-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-landing-naranja-soft text-landing-naranja">
                  <modulo.icono className="h-6 w-6" strokeWidth={1.75} />
                </span>
                <h3 className="font-display text-2xl font-bold text-landing-cream">
                  {modulo.nombre}
                </h3>
              </div>

              <p className="mt-5 text-sm leading-relaxed text-landing-cream/65">
                {modulo.descripcion}
              </p>

              <div className="mt-6 flex flex-wrap gap-2">
                {modulo.casos.map((caso) => (
                  <span
                    key={caso}
                    className="rounded-full border border-landing-line-dark bg-landing-ink/40 px-3 py-1 text-xs font-medium text-landing-cream/70"
                  >
                    {caso}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>

        <p className="mt-10 max-w-2xl text-sm leading-relaxed text-landing-cream/50">
          ¿No estás seguro cuál necesitás? En la implementación evaluamos tu operación
          y te recomendamos por donde empezar.
        </p>
      </div>
    </section>
  );
}
