import { ArrowRight, Calendar, Sparkles, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function HeroSeccion() {
  return (
    <section
      id="top"
      className="landing-section landing-mesh-ink landing-dot-ink relative flex min-h-screen flex-col justify-center pt-24 pb-16"
    >
      <div className="landing-ribbon landing-ribbon-animated" style={{ top: '38%' }} aria-hidden />
      <div className="landing-ribbon landing-ribbon-animated" style={{ top: '62%', animationDuration: '12s' }} aria-hidden />

      <div className="relative mx-auto grid w-full max-w-7xl grid-cols-1 gap-12 px-6 lg:grid-cols-12 lg:gap-8 lg:px-10">
        <div className="flex flex-col justify-center lg:col-span-7">
          <div className="landing-reveal landing-delay-1 mb-6 flex flex-wrap items-center gap-4">
            <img
              src="/logo.png"
              alt="NutriFit Logo"
              className="h-12 w-12 object-contain filter drop-shadow-[0_0_15px_rgba(249,115,22,0.45)] transition-transform duration-300 hover:scale-110"
            />
            <Badge
              variant="outline"
              className="border-landing-naranja/40 bg-landing-naranja-soft text-landing-naranja backdrop-blur-sm py-1.5"
            >
              <Sparkles className="mr-1.5 h-3.5 w-3.5" />
              B2B SaaS para gimnasios y centros de bienestar
            </Badge>
          </div>

          <h1 className="landing-reveal landing-delay-2 font-display text-[2.75rem] font-bold leading-[1.05] tracking-tight text-landing-cream sm:text-6xl lg:text-[4.5rem]">
            Tu gimnasio deja de vender{' '}
            <span className="relative whitespace-nowrap text-landing-naranja">
              máquinas
              <svg
                className="absolute -bottom-2 left-0 w-full"
                viewBox="0 0 200 8"
                preserveAspectRatio="none"
                aria-hidden
              >
                <path
                  d="M2 5 Q 50 1, 100 4 T 198 3"
                  stroke="oklch(0.71 0.19 50)"
                  strokeWidth="2.5"
                  fill="none"
                  strokeLinecap="round"
                />
              </svg>
            </span>{' '}
            y empieza a vender <span className="italic">bienestar</span>.
          </h1>

          <p className="landing-reveal landing-delay-3 mt-8 max-w-xl text-lg leading-relaxed text-landing-cream/70 lg:text-xl">
            NutriFit Supervisor es la plataforma que integra turnos, fichas clínicas,
            planes alimentarios y seguimiento de progreso. Convertimos cada socio
            en un paciente recurrente.
          </p>

          <div className="landing-reveal landing-delay-4 mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
            <a href="#contacto">
              <Button
                size="lg"
                className="group w-full bg-landing-naranja text-landing-ink hover:bg-landing-naranja-bright sm:w-auto"
              >
                <Calendar className="mr-2 h-4 w-4" />
                Agendar demo
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </a>
            <a href="#funcionalidades">
              <Button
                size="lg"
                variant="outline"
                className="w-full border-landing-line-dark text-landing-cream hover:bg-landing-cream/5 hover:text-landing-cream sm:w-auto"
              >
                Ver funcionalidades
              </Button>
            </a>
          </div>

          <div className="landing-reveal landing-delay-5 mt-12 flex items-center gap-6 text-sm text-landing-cream/50">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-landing-naranja" />
              <span>+38% retención de socios</span>
            </div>
            <div className="h-4 w-px bg-landing-line-dark" />
            <span>Multi-sede · RBAC · RGPD</span>
          </div>
        </div>

        <div className="landing-reveal landing-delay-3 relative flex items-center justify-center lg:col-span-5">
          <div className="relative w-full max-w-md">
            <div className="absolute -inset-4 rounded-3xl bg-landing-naranja/10 blur-2xl" aria-hidden />
            <div className="relative rounded-2xl border border-landing-line-dark bg-landing-ink-soft/80 p-6 backdrop-blur-md landing-glow-naranja">
              <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-landing-naranja" />
                  <span className="text-xs font-medium uppercase tracking-wider text-landing-cream/50">
                    Próximos turnos
                  </span>
                </div>
                <span className="text-xs text-landing-cream/40">Hoy</span>
              </div>

              <div className="space-y-3">
                {[
                  { hora: '09:00', nombre: 'María G.', tipo: 'Nutrición', estado: 'Confirmado' },
                  { hora: '10:30', nombre: 'Carlos R.', tipo: 'Seguimiento', estado: 'En sala' },
                  { hora: '12:00', nombre: 'Ana L.', tipo: 'Plan alimentario', estado: 'Nuevo' },
                ].map((turno) => (
                  <div
                    key={turno.hora}
                    className="flex items-center gap-3 rounded-lg border border-landing-line-dark bg-landing-ink/60 p-3"
                  >
                    <div className="flex h-10 w-10 flex-col items-center justify-center rounded-md bg-landing-naranja-soft">
                      <span className="font-display text-xs font-bold text-landing-naranja">
                        {turno.hora.split(':')[0]}
                      </span>
                      <span className="text-[10px] text-landing-naranja/70">
                        {turno.hora.split(':')[1]}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-landing-cream">{turno.nombre}</p>
                      <p className="text-xs text-landing-cream/50">{turno.tipo}</p>
                    </div>
                    <span className="rounded-full bg-landing-naranja-soft px-2 py-0.5 text-[10px] font-medium text-landing-naranja">
                      {turno.estado}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-landing-line-dark pt-4">
                <span className="text-xs text-landing-cream/40">Ocupación de agenda</span>
                <span className="font-display text-sm font-bold text-landing-naranja">87%</span>
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-landing-ink">
                <div className="h-full w-[87%] rounded-full bg-gradient-to-r from-landing-naranja-deep to-landing-rose" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
