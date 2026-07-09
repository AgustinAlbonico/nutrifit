import {
  Check,
  Building,
  Wrench,
  Layers,
  Headphones,
  ArrowRight,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

type Complemento = {
  icono: LucideIcon;
  titulo: string;
  tipo: string;
  descripcion: string;
  items: string[];
};

const COMPLEMENTOS: Complemento[] = [
  {
    icono: Wrench,
    titulo: 'Pago inicial de implementación',
    tipo: 'One-time',
    descripcion: 'Configuración, carga de datos y capacitación inicial del equipo.',
    items: ['Setup completo por sede', 'Migración de datos', 'Capacitación inicial'],
  },
  {
    icono: Building,
    titulo: 'Licenciamiento por sede',
    tipo: 'Por sucursal',
    descripcion: 'Cada sede activa suma su suscripción. Escalás a tu ritmo.',
    items: ['Sedes ilimitadas', 'RBAC por sede', 'Reporting consolidado'],
  },
  {
    icono: Layers,
    titulo: 'Módulos adicionales',
    tipo: 'Add-on',
    descripcion: 'IA, nutrición avanzada, salud deportiva y analítica como capas extra.',
    items: ['Generación IA de planes', 'Analítica avanzada', 'Salud deportiva'],
  },
  {
    icono: Headphones,
    titulo: 'Servicios premium',
    tipo: 'On-demand',
    descripcion: 'Personalizaciones, soporte prioritario y capacitaciones adicionales.',
    items: ['Custom developments', 'Soporte premium SLA', 'Capacitaciones a medida'],
  },
];

const INCLUYE_PLAN_BASE = [
  'Gestión de socios y profesionales',
  'Turnos online con recordatorios',
  'Fichas clínicas versionadas (RGPD)',
  'Planes alimentarios manuales',
  'Seguimiento de progreso',
  'Perfiles por rol (RBAC)',
  'Notificaciones multi-canal',
  'Multi-sede nativo',
  'Soporte estándar',
];

export function SuscripcionSeccion() {
  return (
    <section
      id="suscripcion"
      className="landing-section landing-mesh-cream landing-dot-cream relative py-24 lg:py-32"
    >
      <div className="relative mx-auto max-w-7xl px-6 lg:px-10">
        <div className="mx-auto max-w-3xl text-center">
          <span className="font-display text-sm font-semibold uppercase tracking-[0.2em] text-landing-lima-deep">
            Modelo de suscripción
          </span>
          <h2 className="mt-4 font-display text-4xl font-bold leading-tight tracking-tight text-landing-ink sm:text-5xl lg:text-[3.5rem]">
            No vendemos software.
            <br />
            <span className="text-landing-lima-deep">Crecemos con tu gimnasio.</span>
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-landing-ink/70">
            NutriFit Supervisor es B2B SaaS. Pagás una suscripción mensual por sede activa
            y sumás módulos a medida que escalás. Sin lock-in agresivo, sin costos ocultos.
          </p>
        </div>

        {/* Plan base destacado */}
        <div className="mx-auto mt-16 max-w-5xl">
          <div className="relative overflow-hidden rounded-3xl border border-landing-ink bg-landing-ink text-landing-cream landing-glow-lima">
            <div className="landing-ribbon landing-ribbon-animated" style={{ top: '0' }} aria-hidden />

            <div className="grid grid-cols-1 gap-0 lg:grid-cols-5">
              <div className="p-8 lg:col-span-2 lg:p-10">
                <div className="inline-flex items-center gap-2 rounded-full bg-landing-lima-soft px-3 py-1 text-xs font-semibold uppercase tracking-wide text-landing-lima">
                  Plan base
                </div>
                <h3 className="mt-5 font-display text-3xl font-bold leading-tight">
                  Suscripción mensual
                  <br />
                  <span className="text-landing-lima">por sede activa</span>
                </h3>
                <p className="mt-4 text-sm leading-relaxed text-landing-cream/65">
                  Un precio plano por gimnasio operando. Sin sorpresas por número de socios
                  o profesionales. Si una sede cierra, deja de facturar.
                </p>

                <div className="mt-8 flex items-baseline gap-2">
                  <span className="font-display text-sm font-medium text-landing-cream/50">Desde</span>
                  <span className="font-display text-5xl font-bold tracking-tight text-landing-lima">
                    USD
                  </span>
                  <span className="font-display text-sm text-landing-cream/60">/mes por sede</span>
                </div>

                <a href="#contacto" className="mt-8 inline-block">
                  <Button
                    size="lg"
                    className="group bg-landing-lima text-landing-ink hover:bg-landing-lima-bright"
                  >
                    Hablar con ventas
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </a>
              </div>

              <div className="border-t border-landing-line-dark p-8 lg:col-span-3 lg:border-l lg:border-t-0 lg:p-10">
                <p className="font-display text-xs font-semibold uppercase tracking-wider text-landing-cream/50">
                  Todo lo que incluye
                </p>
                <ul className="mt-5 grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
                  {INCLUYE_PLAN_BASE.map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-sm text-landing-cream/80">
                      <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-landing-lima" strokeWidth={2.5} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Narrativa partnership */}
        <div className="mx-auto mt-16 max-w-4xl border-l-2 border-landing-lima-deep pl-6">
          <p className="font-display text-xl font-medium italic leading-relaxed text-landing-ink/80 lg:text-2xl">
            “No buscamos venderte una licencia y desaparecer. Buscamos ser el socio
            tecnológico que opera junto a tu gimnasio mientras crecés.”
          </p>
          <p className="mt-3 text-sm text-landing-ink/50">
            — Equipo NutriFit Supervisor
          </p>
        </div>

        {/* Grid de complementos */}
        <div className="mt-20">
          <div className="mb-10 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h3 className="font-display text-3xl font-bold tracking-tight text-landing-ink">
                Ingresos complementarios
              </h3>
              <p className="mt-2 text-base text-landing-ink/60">
                Cuatro líneas que se activan según tu etapa de crecimiento.
              </p>
            </div>
            <span className="text-sm text-landing-ink/50">Cotización por escenario</span>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {COMPLEMENTOS.map((comp) => (
              <article
                key={comp.titulo}
                className="landing-card-hover group flex flex-col rounded-2xl border border-landing-line bg-landing-cream p-7 hover:border-landing-lima-deep/40 hover:shadow-lg"
              >
                <div className="flex items-start justify-between">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-landing-lima-soft text-landing-lima-deep transition-colors group-hover:bg-landing-lima group-hover:text-landing-ink">
                    <comp.icono className="h-6 w-6" strokeWidth={1.75} />
                  </span>
                  <span className="rounded-full border border-landing-line px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-landing-ink/50">
                    {comp.tipo}
                  </span>
                </div>
                <h4 className="mt-5 font-display text-lg font-semibold text-landing-ink">
                  {comp.titulo}
                </h4>
                <p className="mt-2 text-sm leading-relaxed text-landing-ink/60">
                  {comp.descripcion}
                </p>
                <ul className="mt-4 space-y-1.5 border-t border-landing-line pt-4">
                  {comp.items.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-landing-ink/70">
                      <span className="h-1 w-1 rounded-full bg-landing-lima-deep" />
                      {item}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
